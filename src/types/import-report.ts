// Import Report Types and Interfaces
// This module handles Excel import with strict header validation and customer mapping

export interface ImportReportRow {
  invoice_no: string;
  cust_cde: string;
  cust_name: string;
  IO_DATE: string;
  Invno: string;
  prod_cde: string;
  prod_cust_no: string;
  prod_name_ko: string;
  tariff_code: string;
  io_qty: number;
  rate_pre_unit: number;
  Amortisation_cost: number;
  supp_mat_cost: number;
  ASSESSABLE_VALUE: number;
  'Supplier MAt Value': number;
  Amort_Value: number;
  ED_Value: number;
  ADDL_DUTY: number;
  EDU_CESS: number;
  SH_EDT_CESS: number;
  Total: number;
  VAT_CST: number;
  invoice_Total: number;
  Grand_total: number;
  'Total Basic Value': number;
  'Total ED Value': number;
  Total_VAT: number;
  Total_Inv_Value: number;
  ST_VAT: number;
  CGST_RATE: number;
  CGST_AMT: number;
  SGST_RATE: number;
  SGST_AMT: number;
  IGST_RATE: number;
  IGST_AMT: number;
  TCS_amt: number;
  CGST_TOTAL: number;
  SGST_TOTAL: number;
  IGST_TOTAL: number;
  Total_Amorization: number;
  Total_TCS: number;
}

export interface CustomerMapping {
  reportCustomerName: string;
  tallyCustomerId: number;
  categoryId: number;
}

export interface ImportValidationResult {
  isValid: boolean;
  errors: string[];
  missingCustomers: string[];
  customerMappings: CustomerMapping[];
}

export interface ImportProgress {
  totalRows: number;
  processedRows: number;
  currentStatus: string;
  errors: string[];
}

// New types for enhanced import flow
export interface ReportCustomer {
  reportCustomerId: string;
  name: string;
  normalizedName: string;
  sampleRowsCount: number;
  detectedMatches: CustomerMatch[];
  status: 'unverified' | 'verified' | 'error';
  errorMessage?: string;
  mappedCustomerId?: number;
  createdCustomerId?: number;
}

export interface CustomerMatch {
  customerId: number;
  name: string;
  matchType: 'exact' | 'fuzzy';
  confidence: number;
}

export interface ImportSession {
  id: string;
  companyId: number;
  fileName: string;
  status: 'pending' | 'verified' | 'importing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface ImportCustomerMapping {
  id: number;
  importSessionId: string;
  reportCustomerId: string;
  reportCustomerName: string;
  mappedCustomerId?: number;
  createdCustomerId?: number;
  status: 'unverified' | 'verified' | 'error';
  createdAt: string;
  updatedAt: string;
}

// Fixed header row that must match exactly
export const REQUIRED_HEADERS = [
  'invoice_no',
  'cust_cde',
  'cust_name',
  'IO_DATE',
  'Invno',
  'prod_cde',
  'prod_cust_no',
  'prod_name_ko',
  'tariff_code',
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
] as const;

export type RequiredHeader = (typeof REQUIRED_HEADERS)[number];
