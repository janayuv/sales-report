import { useState, useEffect, useCallback } from 'react'
import { ImportedReportData } from './ImportedReportDataTable'
import { useSelectedCompany } from '@/contexts/SelectedCompanyContext'
import { dbService } from '@/services/database'

export interface UseImportedReportDataReturn {
  data: ImportedReportData[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  exportData: (selectedRows?: ImportedReportData[]) => void
  deleteData: (selectedRows: ImportedReportData[]) => Promise<void>
}

export function useImportedReportData(): UseImportedReportDataReturn {
  const { selectedCompany } = useSelectedCompany()
  const [data, setData] = useState<ImportedReportData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!selectedCompany) {
      setData([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const reportData = await dbService.getImportedReportData(selectedCompany.id!)
      
      // Transform the data to match our interface
      const transformedData: ImportedReportData[] = reportData.map((row: any) => ({
        id: row.id || `${row.invoice_no}-${row.cust_cde}`,
        invoice_no: row.invoice_no,
        cust_cde: row.cust_cde,
        cust_name: row.cust_name,
        IO_DATE: row.IO_DATE,
        Invno: row.Invno,
        prod_cde: row.prod_cde,
        prod_cust_no: row.prod_cust_no,
        prod_name_ko: row.prod_name_ko,
        tariff_code: row.tariff_code,
        io_qty: row.io_qty,
        rate_pre_unit: row.rate_pre_unit,
        Amortisation_cost: row.Amortisation_cost,
        supp_mat_cost: row.supp_mat_cost,
        ASSESSABLE_VALUE: row.ASSESSABLE_VALUE,
        'Supplier MAt Value': row['Supplier MAt Value'],
        Amort_Value: row.Amort_Value,
        ED_Value: row.ED_Value,
        ADDL_DUTY: row.ADDL_DUTY,
        EDU_CESS: row.EDU_CESS,
        SH_EDT_CESS: row.SH_EDT_CESS,
        Total: row.Total,
        VAT_CST: row.VAT_CST,
        invoice_Total: row.invoice_Total,
        Grand_total: row.Grand_total,
        'Total Basic Value': row['Total Basic Value'],
        'Total ED Value': row['Total ED Value'],
        Total_VAT: row.Total_VAT,
        Total_Inv_Value: row.Total_Inv_Value,
        ST_VAT: row.ST_VAT,
        CGST_RATE: row.CGST_RATE,
        CGST_AMT: row.CGST_AMT,
        SGST_RATE: row.SGST_RATE,
        SGST_AMT: row.SGST_AMT,
        IGST_RATE: row.IGST_RATE,
        IGST_AMT: row.IGST_AMT,
        TCS_amt: row.TCS_amt,
        CGST_TOTAL: row.CGST_TOTAL,
        SGST_TOTAL: row.SGST_TOTAL,
        IGST_TOTAL: row.IGST_TOTAL,
        Total_Amorization: row.Total_Amorization,
        Total_TCS: row.Total_TCS,
        tally_customer: row.tally_customer,
        category_name: row.category_name,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }))

      setData(transformedData)
    } catch (err) {
      console.error('Failed to fetch imported report data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setIsLoading(false)
    }
  }, [selectedCompany])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const exportData = useCallback((selectedRows?: ImportedReportData[]) => {
    const dataToExport = selectedRows || data
    
    if (dataToExport.length === 0) {
      console.warn('No data to export')
      return
    }

    // Create CSV content
    const headers = [
      'Invoice No',
      'Customer Code',
      'Customer Name',
      'Date',
      'Product Code',
      'Product Name',
      'Quantity',
      'Rate/Unit',
      'Grand Total',
      'Category'
    ]

    const csvContent = [
      headers.join(','),
      ...dataToExport.map(row => [
        `"${row.Invno}"`,
        `"${row.cust_cde}"`,
        `"${row.cust_name}"`,
        `"${row.IO_DATE}"`,
        `"${row.prod_cde}"`,
        `"${row.prod_name_ko}"`,
        row.io_qty,
        row.rate_pre_unit,
        row.Grand_total,
        `"${row.category_name || 'Uncategorized'}"`
      ].join(','))
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `imported-reports-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [data])

  const deleteData = useCallback(async (selectedRows: ImportedReportData[]) => {
    if (!selectedCompany || selectedRows.length === 0) return

    try {
      // Note: This would need to be implemented in the database service
      // For now, we'll just refetch the data
      console.log('Deleting rows:', selectedRows.map(row => row.id))
      
      // TODO: Implement actual deletion in database service
      // await dbService.deleteImportedReportRows(selectedRows.map(row => row.id))
      
      // Refetch data after deletion
      await fetchData()
    } catch (err) {
      console.error('Failed to delete imported report data:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete data')
    }
  }, [selectedCompany, fetchData])

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    exportData,
    deleteData,
  }
}
