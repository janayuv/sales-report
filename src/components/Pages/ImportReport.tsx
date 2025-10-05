import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Upload, FileSpreadsheet, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ImportReportRow, ImportProgress, ReportCustomer } from '@/types/import-report'
import { ExcelImportService } from '@/services/excel-import'
import { CustomerMatchingService } from '@/services/customer-matching'
import { ImportPreview } from '@/components/ImportReport/ImportPreview'
import { Customer, Category } from '@/types/customer'
import { dbService } from '@/services/database'
import { useSelectedCompany } from '@/contexts/SelectedCompanyContext'
import * as XLSX from 'xlsx'

export default function ImportReport() {
  const { selectedCompany } = useSelectedCompany()
  const { toast } = useToast()

  // File and import state
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null)

  // Parsed data state
  const [parsedData, setParsedData] = useState<ImportReportRow[]>([])
  
  // New import flow state
  const [showImportPreview, setShowImportPreview] = useState(false)
  const [reportCustomers, setReportCustomers] = useState<ReportCustomer[]>([])
  const [importSessionId, setImportSessionId] = useState<string | null>(null)
  
  // Existing customers and categories
  const [existingCustomers, setExistingCustomers] = useState<Customer[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  // Result state
  const [result, setResult] = useState<{
    success: boolean
    message: string
  } | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load existing customers and categories when company changes
  useEffect(() => {
    if (selectedCompany) {
      loadCustomersAndCategories()
    }
  }, [selectedCompany])

  const loadCustomersAndCategories = async () => {
    if (!selectedCompany) return

    try {
      const [customers, cats] = await Promise.all([
        dbService.getCustomers(selectedCompany.id!),
        dbService.getCategories(selectedCompany.id!)
      ])
      setExistingCustomers(customers)
      setCategories(cats)
    } catch (error) {
      console.error('Failed to load customers and categories:', error)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          selectedFile.type === 'application/vnd.ms-excel' ||
          selectedFile.name.endsWith('.xlsx') ||
          selectedFile.name.endsWith('.xls')) {
        setFile(selectedFile)
        toast({
          title: "File Selected",
          description: `${selectedFile.name} is ready for upload`,
        })
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please select an Excel file (.xlsx or .xls)",
          variant: "destructive"
        })
      }
    }
  }

  const handleImport = async () => {
    if (!file || !selectedCompany) {
      toast({
        title: "No File Selected",
        description: "Please select an Excel file to upload",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)
    setImportProgress({
      totalRows: 0,
      processedRows: 0,
      currentStatus: 'Parsing Excel file...',
      errors: []
    })

    try {
      // Parse Excel file
      const parseResult = await ExcelImportService.parseExcelFile(file)

      if (!parseResult.validation.isValid) {
        setResult({
          success: false,
          message: `Header validation failed: ${parseResult.validation.errors.join(', ')}`
        })
        setIsProcessing(false)
        setImportProgress(null)
        return
      }

      setParsedData(parseResult.data)

      // Create import session
      const sessionId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      setImportSessionId(sessionId)
      
      await dbService.createImportSession(sessionId, selectedCompany.id!, file.name)

      // Analyze report customers
      const analyzedCustomers = await CustomerMatchingService.analyzeReportCustomers(
        parseResult.data,
        existingCustomers,
        selectedCompany.id!
      )

      setReportCustomers(analyzedCustomers)

      // Create customer mappings in database
      await dbService.createImportCustomerMappings(
        sessionId,
        analyzedCustomers.map(rc => ({
          reportCustomerId: rc.reportCustomerId,
          reportCustomerName: rc.name,
          status: rc.status
        }))
      )

      setShowImportPreview(true)
      setImportProgress(null)

    } catch (error) {
      console.error('Import error details:', {
        error: error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        fileName: file?.name,
        fileSize: file?.size,
        companyId: selectedCompany?.id,
        companyName: selectedCompany?.company_name,
        stack: error instanceof Error ? error.stack : undefined,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name
      })
      
      setResult({
        success: false,
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
      setIsProcessing(false)
      setImportProgress(null)
      
      // Show detailed error information
      toast({
        variant: 'destructive',
        title: 'Import Failed',
        description: `Error during Excel parsing: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    }
  }

  const handleVerificationComplete = async (verifiedCustomers: ReportCustomer[]) => {
    if (!selectedCompany || !importSessionId) return

    setIsProcessing(true)
    setShowImportPreview(false)

    try {
      // Convert verified customers to mappings for the existing import function
      const mappings: any[] = []
      
      // First, add mappings for explicitly verified customers
      for (const customer of verifiedCustomers) {
        if (customer.status !== 'verified') {
          throw new Error(`Customer "${customer.name}" is not verified`)
        }
        
        const customerId = customer.mappedCustomerId || customer.createdCustomerId
        if (!customerId) {
          throw new Error(`No customer ID found for verified customer "${customer.name}"`)
        }
        
        // Find the customer to get their category
        const existingCustomer = existingCustomers.find(c => c.id === customerId)
        const categoryId = existingCustomer?.category_id || (categories.length > 0 ? categories[0].id! : 1)
        
        mappings.push({
          reportCustomerName: customer.name,
          tallyCustomerId: customerId,
          categoryId: categoryId,
        })
      }

      // Then, check for any customers in the import data that might have persistent mappings
      // but weren't explicitly verified in this session
      const verifiedCustomerNames = new Set(verifiedCustomers.map(c => c.name.toLowerCase().trim()))
      
      for (const row of parsedData) {
        const customerName = row.cust_name.toLowerCase().trim()
        
        // Skip if already handled by verified customers
        if (verifiedCustomerNames.has(customerName)) {
          continue
        }
        
        // Check for persistent mapping
        const persistentMappingId = await dbService.getPersistentCustomerMapping(
          selectedCompany.id!,
          row.cust_name
        )
        
        if (persistentMappingId) {
          // Find the customer to get their category
          const existingCustomer = existingCustomers.find(c => c.id === persistentMappingId)
          const categoryId = existingCustomer?.category_id || (categories.length > 0 ? categories[0].id! : 1)
          
          mappings.push({
            reportCustomerName: row.cust_name,
            tallyCustomerId: persistentMappingId,
            categoryId: categoryId,
          })
          
        }
      }

      // Update session status
      await dbService.updateImportSessionStatus(importSessionId, 'importing')

      // Use the existing import functionality
      const importResult = await dbService.importReportData(
        parsedData,
        mappings,
        selectedCompany.id!
      )

      if (importResult.success) {
        await dbService.updateImportSessionStatus(importSessionId, 'completed')
        setResult({
          success: true,
          message: `Successfully imported ${importResult.importedRows} rows for ${selectedCompany.company_name}`,
        })
      } else {
        await dbService.updateImportSessionStatus(importSessionId, 'failed')
        setResult({
          success: false,
          message: `Import completed with errors: ${importResult.errors.join(', ')}`,
        })
      }
    } catch (error) {
      if (importSessionId) {
        await dbService.updateImportSessionStatus(importSessionId, 'failed')
      }
      setResult({
        success: false,
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    } finally {
      setIsProcessing(false)
      setImportProgress(null)
    }
  }

  const handleImportPreviewCancel = () => {
    setShowImportPreview(false)
    setImportSessionId(null)
    setReportCustomers([])
    setIsProcessing(false)
    setImportProgress(null)
  }

  const handleGenerateReport = async () => {
    if (!selectedCompany) return

    try {
      setIsProcessing(true)
      
      // Get imported report data
      const reportData = await dbService.getImportedReportData(selectedCompany.id!)
      
      if (reportData.length === 0) {
        toast({
          variant: 'destructive',
          title: 'No Data',
          description: 'No imported data found to generate report.',
        })
        return
      }

      // Generate Excel report
      generateExcelReport(reportData, selectedCompany.company_name)
      
      toast({
        title: 'Report Generated',
        description: `Report generated successfully for ${selectedCompany.company_name}. ${reportData.length} records exported.`,
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Report Generation Failed',
        description: `Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const generateExcelReport = (data: any[], companyName: string) => {
    // Create workbook
    const workbook = XLSX.utils.book_new()
    
    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data)
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Report')
    
    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `Sales_Report_${companyName.replace(/\s+/g, '_')}_${timestamp}.xlsx`
    
    // Download file
    XLSX.writeFile(workbook, filename)
  }

  const handleClearFile = () => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Show message when no company is selected
  if (!selectedCompany) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Company Selected</h3>
            <p className="text-muted-foreground">
              Please select a company from the Companies page to import reports.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Import & Reports</h1>
          <p className="text-muted-foreground">
            Import sales report data and manage customer mappings
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleGenerateReport}
            disabled={isProcessing}
            className="gap-2"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            Generate Report
          </Button>
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className={result.success ? 'text-green-800' : 'text-red-800'}>
            {result.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Import Progress */}
      {importProgress && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  {importProgress.currentStatus}
                </span>
              </div>
              {importProgress.totalRows > 0 && (
                <>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(importProgress.processedRows / importProgress.totalRows) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-blue-600">
                    {importProgress.processedRows} of {importProgress.totalRows} rows processed
                  </p>
                </>
              )}
              {importProgress.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-800">Errors:</p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {importProgress.errors.map((error, index) => (
                      <p key={index} className="text-xs text-red-600">{error}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Preview Dialog */}
      {showImportPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <ImportPreview
                reportCustomers={reportCustomers}
                existingCustomers={existingCustomers}
                categories={categories}
                companyId={selectedCompany?.id || 0}
                onVerificationComplete={handleVerificationComplete}
                onCancel={handleImportPreviewCancel}
              />
            </div>
          </div>
        </div>
      )}

      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Excel Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload" className="text-sm font-medium">
                Select Excel File
              </Label>
              <div className="mt-2">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  className="cursor-pointer"
                  disabled={isProcessing}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Supported formats: .xlsx, .xls
              </p>
            </div>

            {file && (
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                <FileSpreadsheet className="h-8 w-8 text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFile}
                  disabled={isProcessing}
                >
                  Clear
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleImport}
                disabled={!file || isProcessing}
                className="flex items-center gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {isProcessing ? 'Processing...' : 'Import Report'}
              </Button>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Import Process:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Upload your Excel file with sales report data</li>
                <li>• System will validate headers and analyze customer data</li>
                <li>• Verify customer mappings or create new customers</li>
                <li>• Import data will be processed and stored</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

    </div>
  )
}