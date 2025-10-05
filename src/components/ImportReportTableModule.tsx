import { ImportReportDataTable } from './ImportReportDataTable'
import { ImportReportFilters } from './ImportReportFilters'
import { ImportReportSummary } from './ImportReportSummary'
import { useImportReportTable } from '@/hooks/useImportReportTable'
import { ImportReportRow } from '@/types/import-report'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, RefreshCw, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ImportReportTableModuleProps {
  data: ImportReportRow[]
  isLoading?: boolean
  error?: string | null
  onExport?: (rows: ImportReportRow[]) => void
  onDelete?: (rows: ImportReportRow[]) => void
  onView?: (row: ImportReportRow) => void
  onRefresh?: () => void
  showFilters?: boolean
  showSummary?: boolean
  className?: string
}

export function ImportReportTableModule({
  data,
  isLoading = false,
  error = null,
  onExport,
  onDelete,
  onView,
  onRefresh,
  showFilters = true,
  showSummary = true,
  className = ''
}: ImportReportTableModuleProps) {
  const {
    state,
    actions,
    filteredData,
    computed
  } = useImportReportTable({
    initialData: data,
    onExport,
    onDelete,
    onView
  })

  const handleExportAll = () => {
    if (onExport) {
      onExport(filteredData)
    }
  }

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh()
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Imported Reports</h2>
          <p className="text-muted-foreground">
            View and manage your imported sales report data
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportAll}
              disabled={filteredData.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export All ({filteredData.length})
            </Button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      {showSummary && (
        <ImportReportSummary
          totalRows={computed.totalRows}
          totalAmount={computed.totalAmount}
          averageAmount={computed.averageAmount}
          uniqueCustomers={computed.uniqueCustomers}
          dateRange={computed.dateRange}
          selectedRowsCount={computed.selectedRowsCount}
        />
      )}

      {/* Filters */}
      {showFilters && (
        <ImportReportFilters
          filters={state.filters}
          onFilterChange={actions.setFilter}
          onClearFilters={actions.clearFilters}
        />
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Report Data</span>
            <div className="text-sm text-muted-foreground">
              {computed.totalRows} records
              {computed.selectedRowsCount > 0 && (
                <span className="ml-2 text-blue-600">
                  • {computed.selectedRowsCount} selected
                </span>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ImportReportDataTable
            data={filteredData}
            isLoading={isLoading}
            onView={onView}
            onExport={onExport}
            onDelete={onDelete}
          />
        </CardContent>
      </Card>
    </div>
  )
}

// Export individual components for custom usage
export {
  ImportReportDataTable,
  ImportReportFilters,
  ImportReportSummary,
  useImportReportTable
}

