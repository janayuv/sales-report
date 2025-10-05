import * as XLSX from 'xlsx';
import { Customer, CreateCustomerFromExcel } from '@/types/customer';

/**
 * Customer Excel Service
 *
 * Handles Excel template generation and customer import functionality
 * for the customer module.
 */
export class CustomerExcelService {
  /**
   * Generate Excel template for customer import
   * Creates a template with proper headers and sample data
   */
  static generateTemplate(): void {
    // Define the template headers
    const headers = [
      'report_customer',
      'tally_customer',
      'gst_no',
      'state_code',
      'category_name',
    ];

    // Sample data for guidance
    const sampleData = [
      {
        report_customer: 'ABC Company Ltd',
        tally_customer: 'ABC Company Ltd',
        gst_no: '07AABCU9603R1ZX',
        state_code: '07',
        category_name: 'Regular',
      },
      {
        report_customer: 'XYZ Industries',
        tally_customer: 'XYZ Industries Pvt Ltd',
        gst_no: '29ABCDE1234F1Z5',
        state_code: '29',
        category_name: 'Raw material',
      },
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Create worksheet with headers and sample data
    const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });

    // Set column widths for better readability
    const columnWidths = [
      { wch: 25 }, // report_customer
      { wch: 30 }, // tally_customer
      { wch: 15 }, // gst_no
      { wch: 10 }, // state_code
      { wch: 15 }, // category_name
    ];
    worksheet['!cols'] = columnWidths;

    // Add the worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customer Template');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `customer_template_${timestamp}.xlsx`;

    // Download the file
    XLSX.writeFile(workbook, filename);
  }

  /**
   * Parse Excel file for customer import
   * Validates headers and extracts customer data
   */
  static parseCustomerExcel(file: File): Promise<{
    headers: string[];
    data: CreateCustomerFromExcel[];
    validation: { isValid: boolean; errors: string[] };
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

          // Convert to JSON
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
          const requiredHeaders = [
            'report_customer',
            'tally_customer',
            'gst_no',
            'state_code',
            'category_name',
          ];
          const validation = this.validateHeaders(headers, requiredHeaders);

          if (!validation.isValid) {
            resolve({
              headers,
              data: [],
              validation,
            });
            return;
          }

          // Parse data rows
          const dataRows = jsonData.slice(1);
          const parsedData: CreateCustomerFromExcel[] = dataRows.map((row) => {
            const rowData: any = {};
            headers.forEach((header, colIndex) => {
              const value = row[colIndex];
              rowData[header] = String(value || '').trim();
            });

            return rowData as CreateCustomerFromExcel;
          });

          resolve({
            headers,
            data: parsedData,
            validation: { isValid: true, errors: [] },
          });
        } catch (error) {
          reject(
            new Error(
              `Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`
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
   * Validate Excel headers against required headers
   */
  private static validateHeaders(
    headers: string[],
    requiredHeaders: string[]
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check if we have the exact number of headers
    if (headers.length !== requiredHeaders.length) {
      errors.push(
        `Expected ${requiredHeaders.length} headers, but found ${headers.length}`
      );
    }

    // Check each header for exact match
    requiredHeaders.forEach((requiredHeader, index) => {
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
   * Export existing customers to Excel
   */
  static exportCustomers(customers: Customer[]): void {
    // Prepare data for export
    const exportData = customers.map(customer => ({
      report_customer: customer.report_customer,
      tally_customer: customer.tally_customer,
      gst_no: customer.gst_no,
      state_code: customer.state_code,
      category_name: customer.category?.name || 'N/A',
      created_at: customer.created_at,
    }));

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const columnWidths = [
      { wch: 25 }, // report_customer
      { wch: 30 }, // tally_customer
      { wch: 15 }, // gst_no
      { wch: 10 }, // state_code
      { wch: 15 }, // category_name
      { wch: 20 }, // created_at
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `customers_export_${timestamp}.xlsx`;

    // Download the file
    XLSX.writeFile(workbook, filename);
  }
}
