import { Customer } from '@/types/customer';
import { ReportCustomer, CustomerMatch } from '@/types/import-report';
import { dbService } from './database';

/**
 * Customer Matching Service
 * 
 * Implements sophisticated customer matching logic with:
 * - Exact matching (name + GST/state)
 * - Fuzzy matching with confidence scores
 * - Name normalization
 * - Duplicate detection
 */
export class CustomerMatchingService {
  /**
   * Normalize customer name for matching
   */
  static normalizeCustomerName(name: string): string {
    if (!name) return '';
    
    let normalized = name.trim().toLowerCase();
    
    // Remove punctuation
    normalized = normalized.replace(/[^\w\s]/g, '');
    
    // Remove common business suffixes
    const suffixes = [
      'pvt ltd', 'private limited', 'ltd', 'limited', 'llp', 'llc',
      'inc', 'incorporated', 'corp', 'corporation', 'co', 'company',
      'pvt', 'private', 'ltd co', 'limited company'
    ];
    
    for (const suffix of suffixes) {
      const regex = new RegExp(`\\s+${suffix}\\s*$`, 'i');
      normalized = normalized.replace(regex, '');
    }
    
    // Collapse multiple spaces
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    return normalized;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate token similarity between two strings
   */
  static tokenSimilarity(str1: string, str2: string): number {
    const tokens1 = new Set(str1.toLowerCase().split(/\s+/));
    const tokens2 = new Set(str2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);
    
    return intersection.size / union.size;
  }

  /**
   * Find exact matches for a report customer
   */
  static findExactMatches(
    reportCustomerName: string,
    existingCustomers: Customer[]
  ): CustomerMatch[] {
    const normalizedReportName = this.normalizeCustomerName(reportCustomerName);
    const matches: CustomerMatch[] = [];

    for (const customer of existingCustomers) {
      const normalizedExistingName = this.normalizeCustomerName(customer.report_customer);
      
      // Exact name match
      if (normalizedReportName === normalizedExistingName) {
        matches.push({
          customerId: customer.id!,
          name: customer.report_customer,
          matchType: 'exact',
          confidence: 1.0
        });
      }
    }

    return matches;
  }

  /**
   * Find fuzzy matches for a report customer
   */
  static findFuzzyMatches(
    reportCustomerName: string,
    existingCustomers: Customer[],
    maxLevenshteinDistance: number = 2,
    minTokenSimilarity: number = 0.85
  ): CustomerMatch[] {
    const normalizedReportName = this.normalizeCustomerName(reportCustomerName);
    const matches: CustomerMatch[] = [];

    for (const customer of existingCustomers) {
      const normalizedExistingName = this.normalizeCustomerName(customer.report_customer);
      
      // Skip if already exact match
      if (normalizedReportName === normalizedExistingName) {
        continue;
      }

      // Calculate similarity metrics
      const levenshteinDist = this.levenshteinDistance(normalizedReportName, normalizedExistingName);
      const tokenSim = this.tokenSimilarity(normalizedReportName, normalizedExistingName);

      // Check if it qualifies as a fuzzy match
      if (levenshteinDist <= maxLevenshteinDistance || tokenSim >= minTokenSimilarity) {
        const confidence = Math.max(
          1 - (levenshteinDist / Math.max(normalizedReportName.length, normalizedExistingName.length)),
          tokenSim
        );

        matches.push({
          customerId: customer.id!,
          name: customer.report_customer,
          matchType: 'fuzzy',
          confidence: Math.round(confidence * 100) / 100
        });
      }
    }

    // Sort by confidence descending
    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Find all matches (exact + fuzzy) for a report customer
   */
  static findMatches(
    reportCustomerName: string,
    existingCustomers: Customer[]
  ): CustomerMatch[] {
    const exactMatches = this.findExactMatches(reportCustomerName, existingCustomers);
    const fuzzyMatches = this.findFuzzyMatches(reportCustomerName, existingCustomers);
    
    return [...exactMatches, ...fuzzyMatches];
  }

  /**
   * Analyze report customers and find matches
   */
  static async analyzeReportCustomers(
    reportData: any[],
    existingCustomers: Customer[],
    companyId: number
  ): Promise<ReportCustomer[]> {
    // Extract unique customer names from report
    const customerMap = new Map<string, { name: string; count: number }>();
    
    for (const row of reportData) {
      const customerName = row.cust_name?.trim();
      if (customerName) {
        const normalized = this.normalizeCustomerName(customerName);
        if (customerMap.has(normalized)) {
          customerMap.get(normalized)!.count++;
        } else {
          customerMap.set(normalized, { name: customerName, count: 1 });
        }
      }
    }

    // Create ReportCustomer objects
    const reportCustomers: ReportCustomer[] = [];
    
    for (const [normalizedName, { name, count }] of customerMap) {
      // First check for persistent mapping
      const persistentMappingId = await dbService.getPersistentCustomerMapping(companyId, name);
      
      if (persistentMappingId) {
        // Found persistent mapping - mark as verified
        const mappedCustomer = existingCustomers.find(c => c.id === persistentMappingId);
        if (mappedCustomer) {
          reportCustomers.push({
            reportCustomerId: `rc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name,
            normalizedName,
            sampleRowsCount: count,
            detectedMatches: [{
              customerId: mappedCustomer.id!,
              name: mappedCustomer.report_customer,
              matchType: 'exact',
              confidence: 1.0
            }],
            status: 'verified',
            mappedCustomerId: persistentMappingId
          });
          continue;
        }
      }

      // No persistent mapping found - do normal matching
      const matches = this.findMatches(name, existingCustomers);
      
      reportCustomers.push({
        reportCustomerId: `rc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        normalizedName,
        sampleRowsCount: count,
        detectedMatches: matches,
        status: matches.length > 0 ? 'unverified' : 'unverified'
      });
    }

    return reportCustomers;
  }

  /**
   * Check for potential duplicates before creating a new customer
   */
  static checkForDuplicates(
    customerData: {
      report_customer: string;
      gst_no?: string;
      state_code?: string;
    },
    existingCustomers: Customer[]
  ): {
    hasDuplicates: boolean;
    duplicates: Customer[];
    warnings: string[];
  } {
    const normalizedName = this.normalizeCustomerName(customerData.report_customer);
    const duplicates: Customer[] = [];
    const warnings: string[] = [];

    for (const customer of existingCustomers) {
      const normalizedExistingName = this.normalizeCustomerName(customer.report_customer);
      
      // Check for name + GST match
      if (customerData.gst_no && customer.gst_no && 
          normalizedName === normalizedExistingName && 
          customerData.gst_no === customer.gst_no) {
        duplicates.push(customer);
        warnings.push(`Exact match found: "${customer.report_customer}" with same GST number`);
      }
      
      // Check for name + state match (if no GST)
      else if (!customerData.gst_no && !customer.gst_no &&
               normalizedName === normalizedExistingName && 
               customerData.state_code === customer.state_code) {
        duplicates.push(customer);
        warnings.push(`Exact match found: "${customer.report_customer}" with same state code`);
      }
      
      // Check for fuzzy name match
      else if (normalizedName === normalizedExistingName) {
        duplicates.push(customer);
        warnings.push(`Name match found: "${customer.report_customer}"`);
      }
    }

    return {
      hasDuplicates: duplicates.length > 0,
      duplicates,
      warnings
    };
  }
}
