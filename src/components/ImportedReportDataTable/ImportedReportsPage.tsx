import { ImportedReportDataTable } from './ImportedReportDataTable'
import { useImportedReportData } from './useImportedReportData'
import { ImportedReportData } from './ImportedReportDataTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, Download, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ImportedReportsPage() {
  const { data, isLoading, error, refetch, exportData, deleteData } = useImportedReportData()
  const { toast } = useToast()

  const handleExport = (selectedRows?: ImportedReportData[]) => {
    try {
      exportData(selectedRows)
      toast({
        title: "Export Successful",
        description: `Exported ${selectedRows?.length || data.length} records to CSV`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
      })
    }
  }

  const handleDelete = async (selectedRows: ImportedReportData[]) => {
    if (selectedRows.length === 0) return

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedRows.length} record(s)? This action cannot be undone.`
    )

    if (!confirmed) return

    try {
      await deleteData(selectedRows)
      toast({
        title: "Delete Successful",
        description: `Deleted ${selectedRows.length} record(s) successfully`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Failed to delete records. Please try again.",
      })
    }
  }

  const handleRefresh = async () => {
    try {
      await refetch()
      toast({
        title: "Data Refreshed",
        description: "Imported report data has been refreshed",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Refresh Failed",
        description: "Failed to refresh data. Please try again.",
      })
    }
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Error Loading Data
            </CardTitle>
            <CardDescription>
              There was an error loading the imported report data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4">
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Imported Reports</h1>
          <p className="text-muted-foreground">
            View and manage imported report data
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => handleExport()}
            disabled={data.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export All
          </Button>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <ImportedReportDataTable
        data={data}
        isLoading={isLoading}
        onExport={handleExport}
        onDelete={handleDelete}
      />

      {data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Overview of imported report data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{data.length}</div>
                <div className="text-sm text-muted-foreground">Total Records</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {new Set(data.map(row => row.cust_name)).size}
                </div>
                <div className="text-sm text-muted-foreground">Unique Customers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  ₹{data.reduce((sum, row) => sum + row.Grand_total, 0).toLocaleString('en-IN')}
                </div>
                <div className="text-sm text-muted-foreground">Total Value</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {new Set(data.map(row => row.category_name).filter(Boolean)).size}
                </div>
                <div className="text-sm text-muted-foreground">Categories</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
