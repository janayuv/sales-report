import { useState, useMemo } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table'
import { ImportReportRow } from '@/types/import-report'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ChevronDown, 
  Download, 
  Trash2, 
  Eye, 
  Search, 
  Filter, 
  Calendar as CalendarIcon,
  Settings2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { format } from 'date-fns'

interface EnhancedImportReportDataTableProps {
  data: ImportReportRow[]
  isLoading?: boolean
  onExport?: (rows: ImportReportRow[]) => void
  onDelete?: (rows: ImportReportRow[]) => void
  onView?: (row: ImportReportRow) => void
}

// Generate comprehensive test data
const generateTestData = (): ImportReportRow[] => {
  const customers = [
    'Alpha Manufacturing Ltd',
    'Beta Industries Inc', 
    'Gamma Electronics Pvt Ltd',
    'Delta Construction Co',
    'Epsilon Automotive Ltd',
    'Zeta Steel Works',
    'Eta Chemical Corp',
    'Theta Textiles Ltd',
    'Iota Pharmaceuticals',
    'Kappa Food Products'
  ]
  
  const products = [
    'Premium Steel Rods',
    'Aluminum Alloy Sheets', 
    'Copper Wire Harness',
    'Iron Reinforcement Bars',
    'Zinc Coated Steel Plates',
    'Stainless Steel Tubes',
    'Carbon Steel Beams',
    'Galvanized Sheets',
    'Brass Components',
    'Bronze Fittings'
  ]
  
  const categories = [
    'Steel & Metal',
    'Electronics',
    'Construction',
    'Automotive',
    'Chemical',
    'Textiles',
    'Pharmaceuticals',
    'Food & Beverage'
  ]
  
  const tariffCodes = ['12345678', '87654321', '11223344', '55667788', '99887766', '11112222', '33334444', '55556666']
  
  const data: ImportReportRow[] = []
  
  for (let i = 1; i <= 50; i++) {
    const customer = customers[i % customers.length]
    const product = products[i % products.length]
    const category = categories[i % categories.length]
    const tariffCode = tariffCodes[i % tariffCodes.length]
    const qty = Math.floor(Math.random() * 200) + 10
    const rate = Math.floor(Math.random() * 500) + 100
    const grandTotal = qty * rate
    const date = new Date(2024, 0, Math.floor(Math.random() * 28) + 1)
    
    data.push({
      invoice_no: `INV-${i.toString().padStart(3, '0')}`,
      cust_cde: `CUST${i.toString().padStart(3, '0')}`,
      cust_name: customer,
      IO_DATE: date.toISOString().split('T')[0],
      Invno: `INV-${i.toString().padStart(3, '0')}`,
      prod_cde: `PROD${i.toString().padStart(3, '0')}`,
      prod_cust_no: `PC${i.toString().padStart(3, '0')}`,
      prod_name_ko: product,
      tariff_code: tariffCode,
      io_qty: qty,
      rate_pre_unit: rate,
      Amortisation_cost: rate * 0.1,
      supp_mat_cost: rate * 0.2,
      ASSESSABLE_VALUE: grandTotal * 0.8,
      'Supplier MAt Value': grandTotal * 0.6,
      Amort_Value: grandTotal * 0.2,
      ED_Value: grandTotal * 0.1,
      ADDL_DUTY: grandTotal * 0.05,
      EDU_CESS: grandTotal * 0.01,
      SH_EDT_CESS: grandTotal * 0.005,
      Total: grandTotal * 1.1,
      VAT_CST: grandTotal * 0.1,
      invoice_Total: grandTotal * 1.2,
      Grand_total: grandTotal * 1.2,
      'Total Basic Value': grandTotal * 0.8,
      'Total ED Value': grandTotal * 0.1,
      Total_VAT: grandTotal * 0.1,
      Total_Inv_Value: grandTotal * 1.2,
      ST_VAT: 0.00,
      CGST_RATE: 9.00,
      CGST_AMT: grandTotal * 0.09,
      SGST_RATE: 9.00,
      SGST_AMT: grandTotal * 0.09,
      IGST_RATE: 0.00,
      IGST_AMT: 0.00,
      TCS_amt: grandTotal * 0.01,
      CGST_TOTAL: grandTotal * 0.09,
      SGST_TOTAL: grandTotal * 0.09,
      IGST_TOTAL: 0.00,
      Total_Amorization: grandTotal * 0.2,
      Total_TCS: grandTotal * 0.01,
      // Add category for filtering
      category: category,
    } as ImportReportRow & { category: string })
  }
  
  return data
}

export function EnhancedImportReportDataTable({
  data: propData,
  isLoading = false,
  onExport,
  onDelete,
  onView,
}: EnhancedImportReportDataTableProps) {
  const [data] = useState<ImportReportRow[]>(propData.length > 0 ? propData : generateTestData())
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Get unique categories from data
  const categories = useMemo(() => {
    const cats = new Set(data.map(row => (row as any).category))
    return Array.from(cats).sort()
  }, [data])

  const columns: ColumnDef<ImportReportRow>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'invoice_no',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 lg:px-3"
        >
          Invoice No
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('invoice_no')}</div>
      ),
    },
    {
      accessorKey: 'cust_name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 lg:px-3"
        >
          Customer
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate">{row.getValue('cust_name')}</div>
      ),
    },
    {
      accessorKey: 'IO_DATE',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 lg:px-3"
        >
          Date
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue('IO_DATE'))
        return <div>{format(date, 'dd/MM/yyyy')}</div>
      },
    },
    {
      accessorKey: 'prod_name_ko',
      header: 'Product',
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate">{row.getValue('prod_name_ko')}</div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => {
        const category = (row.original as any).category
        return (
          <Badge variant="secondary" className="text-xs">
            {category}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'io_qty',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 lg:px-3"
        >
          Qty
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-right">{row.getValue('io_qty')}</div>
      ),
    },
    {
      accessorKey: 'rate_pre_unit',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 lg:px-3"
        >
          Rate
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('rate_pre_unit'))
        return <div className="text-right">₹{amount.toLocaleString('en-IN')}</div>
      },
    },
    {
      accessorKey: 'Grand_total',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 lg:px-3"
        >
          Total
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('Grand_total'))
        return <div className="text-right font-medium">₹{amount.toLocaleString('en-IN')}</div>
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const rowData = row.original
        return (
          <div className="flex items-center gap-2">
            {onView && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(rowData)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {onExport && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onExport([rowData])}
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete([rowData])}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  })

  // Apply custom filters
  const filteredData = useMemo(() => {
    let filtered = data

    // Apply global search
    if (globalFilter) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(globalFilter.toLowerCase())
        )
      )
    }

    // Apply date range filter
    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter(row => {
        const rowDate = new Date(row.IO_DATE)
        if (dateRange.from && rowDate < dateRange.from) return false
        if (dateRange.to && rowDate > dateRange.to) return false
        return true
      })
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(row => (row as any).category === categoryFilter)
    }

    return filtered
  }, [data, globalFilter, dateRange, categoryFilter])

  const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original)

  const handleExportSelected = () => {
    if (onExport && selectedRows.length > 0) {
      onExport(selectedRows)
    }
  }

  const handleExportAll = () => {
    if (onExport) {
      onExport(filteredData)
    }
  }

  const handleDeleteSelected = () => {
    if (onDelete && selectedRows.length > 0) {
      onDelete(selectedRows)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Global Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search across all columns..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Date Range Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'dd/MM/yyyy')} -{' '}
                        {format(dateRange.to, 'dd/MM/yyyy')}
                      </>
                    ) : (
                      format(dateRange.from, 'dd/MM/yyyy')
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined}
                  onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Column Visibility */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  <Settings2 className="mr-2 h-4 w-4" />
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {selectedRows.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportSelected}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Selected ({selectedRows.length})
                </Button>
                {onDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteSelected}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Selected ({selectedRows.length})
                  </Button>
                )}
              </>
            )}
            {onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportAll}
              >
                <Download className="mr-2 h-4 w-4" />
                Export All ({filteredData.length})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing {table.getFilteredRowModel().rows.length} of {data.length} entries
          {selectedRows.length > 0 && (
            <span className="ml-2">
              ({selectedRows.length} selected)
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <div className="flex items-center gap-1">
            <p className="text-sm font-medium">Page</p>
            <strong>
              {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </strong>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
