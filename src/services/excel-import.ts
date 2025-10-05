import * as XLSX from 'xlsx';
import {
  ImportReportRow,
  ImportValidationResult,
  REQUIRED_HEADERS,
} from '@/types/import-report';
import { Customer } from '@/types/customer';

/**
 * Excel Import Service
 *
 * This service handles Excel file parsing with strict header validation.
 * It ensures data integrity by validating headers and checking customer existence.
 */
export class ExcelImportService {
  /**
   * HEADER VALIDATION LOGIC:
   *
   * 1. Reads the first row of the Excel file as headers
   * 2. Compares each header against the REQUIRED_HEADERS array
   * 3. Checks for exact matches (case-sensitive) to prevent data misalignment
   * 4. Validates that all required headers are present and in correct order
   * 5. Stops import immediately if any header mismatch is detected
   *
   * This prevents data corruption by ensuring column mapping is always correct.
   */
  static validateHeaders(headers: string[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check if we have the exact number of headers
    if (headers.length !== REQUIRED_HEADERS.length) {
      errors.push(
        `Expected ${REQUIRED_HEADERS.length} headers, but found ${headers.length}`
      );
    }

    // Check each header for exact match
    REQUIRED_HEADERS.forEach((requiredHeader, index) => {
      const actualHeader = headers[index];
      if (actualHeader !== requiredHeader) {
        errors.push(
          `Header mismatch at position ${index + 1}: Expected "${requiredHeader}", but found "${actualHeader || 'undefined'}"`
        );
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * CUSTOMER EXISTENCE CHECK LOGIC:
   *
   * 1. Extracts unique customer names from the report data
   * 2. Performs case-insensitive comparison with existing customers
   * 3. Uses the report_customer field for matching (not tally_customer)
   * 4. Returns list of customers that don't exist in our system
   * 5. This ensures we don't create duplicate customers or lose data
   */
  static findMissingCustomers(
    reportData: ImportReportRow[],
    existingCustomers: Customer[]
  ): string[] {
    // Extract unique customer names from report (case-insensitive)
    const reportCustomers = new Set(
      reportData.map(row => row.cust_name.toLowerCase().trim())
    );

    // Get existing customer names (case-insensitive)
    const existingCustomerNames = new Set(
      existingCustomers.map(customer =>
        customer.report_customer.toLowerCase().trim()
      )
    );

    // Find customers that don't exist in our system
    const missingCustomers: string[] = [];
    reportCustomers.forEach(reportCustomer => {
      if (!existingCustomerNames.has(reportCustomer)) {
        // Find the original case version from the report
        const originalName = reportData.find(
          row => row.cust_name.toLowerCase().trim() === reportCustomer
        )?.cust_name;
        if (originalName && !missingCustomers.includes(originalName)) {
          missingCustomers.push(originalName);
        }
      }
    });

    return missingCustomers;
  }

  /**
   * Parse Excel file and validate structure
   */
  static parseExcelFile(file: File): Promise<{
    headers: string[];
    data: ImportReportRow[];
    validation: ImportValidationResult;
  }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = e => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });

          // Get the first worksheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // Convert to JSON with header row
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
            raw: false,
          }) as any[][];

          if (jsonData.length < 2) {
            reject(
              new Error(
                'Excel file must have at least a header row and one data row'
              )
            );
            return;
          }

          // Extract headers (first row)
          const headers = jsonData[0] as string[];

          // Validate headers
          const headerValidation = this.validateHeaders(headers);

          if (!headerValidation.isValid) {
            resolve({
              headers,
              data: [],
              validation: {
                isValid: false,
                errors: headerValidation.errors,
                missingCustomers: [],
                customerMappings: [],
              },
            });
            return;
          }

          // Parse data rows
          const dataRows = jsonData.slice(1);
          const parsedData: ImportReportRow[] = dataRows.map((row) => {
            const rowData: any = {};
            headers.forEach((header, colIndex) => {
              const value = row[colIndex];

              // Convert numeric fields
              const numericFields = [
                'io_qty',
                'rate_pre_unit',
                'Amortisation_cost',
                'supp_mat_cost',
                'ASSESSABLE_VALUE',
                'Supplier MAt Value',
                'Amort_Value',
                'ED_Value',
                'ADDL_DUTY',
                'EDU_CESS',
                'SH_EDT_CESS',
                'Total',
                'VAT_CST',
                'invoice_Total',
                'Grand_total',
                'Total Basic Value',
                'Total ED Value',
                'Total_VAT',
                'Total_Inv_Value',
                'ST_VAT',
                'CGST_RATE',
                'CGST_AMT',
                'SGST_RATE',
                'SGST_AMT',
                'IGST_RATE',
                'IGST_AMT',
                'TCS_amt',
                'CGST_TOTAL',
                'SGST_TOTAL',
                'IGST_TOTAL',
                'Total_Amorization',
                'Total_TCS',
              ];

              if (numericFields.includes(header)) {
                rowData[header] = parseFloat(value) || 0;
              } else {
                rowData[header] = String(value || '');
              }
            });

            return rowData as ImportReportRow;
          });

          resolve({
            headers,
            data: parsedData,
            validation: {
              isValid: true,
              errors: [],
              missingCustomers: [],
              customerMappings: [],
            },
          });
        } catch (error) {
          console.error('Excel parsing error details:', {
            error,
            fileName: reader.result ? 'File loaded' : 'File failed to load',
            errorStack: error instanceof Error ? error.stack : undefined
          })
          
          const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error'
          reject(
            new Error(
              `Failed to parse Excel file: ${errorMessage}`
            )
          );
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Validate import data against existing customers
   */
  static validateImportData(
    reportData: ImportReportRow[],
    existingCustomers: Customer[]
  ): ImportValidationResult {
    const missingCustomers = this.findMissingCustomers(
      reportData,
      existingCustomers
    );

    return {
      isValid: missingCustomers.length === 0,
      errors:
        missingCustomers.length > 0
          ? [
              `Found ${missingCustomers.length} customers that don't exist in the system`,
            ]
          : [],
      missingCustomers,
      customerMappings: [],
    };
  }
}
