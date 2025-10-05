"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, Download, Eye, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ImportReportRow } from "@/types/import-report"

// Extended interface for imported report data with additional metadata
export interface ImportedReportData extends ImportReportRow {
  id: string
  tally_customer?: string
  category_name?: string
  created_at: string
  updated_at: string
}

export const columns: ColumnDef<ImportedReportData>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
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
    accessorKey: "cust_name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Customer Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const customerName = row.getValue("cust_name") as string
      const tallyCustomer = row.original.tally_customer
      
      return (
        <div className="space-y-1">
          <div className="font-medium">{customerName}</div>
          {tallyCustomer && (
            <Badge variant="secondary" className="text-xs">
              {tallyCustomer}
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "Invno",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Invoice No
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("Invno")}</div>
    ),
  },
  {
    accessorKey: "IO_DATE",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = row.getValue("IO_DATE") as string
      return <div>{new Date(date).toLocaleDateString()}</div>
    },
  },
  {
    accessorKey: "prod_cust_no",
    header: "Product Customer No",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("prod_cust_no")}</div>
    ),
  },
  {
    accessorKey: "prod_name_ko",
    header: "Product Name",
    cell: ({ row }) => (
      <div className="max-w-[200px] truncate" title={row.getValue("prod_name_ko")}>
        {row.getValue("prod_name_ko")}
      </div>
    ),
  },
  {
    accessorKey: "tariff_code",
    header: "Tariff Code",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("tariff_code")}</div>
    ),
  },
  {
    accessorKey: "category_name",
    header: "Category",
    cell: ({ row }) => {
      const category = row.getValue("category_name") as string
      return category ? (
        <Badge variant="outline">{category}</Badge>
      ) : (
        <Badge variant="secondary">Uncategorized</Badge>
      )
    },
  },
  {
    accessorKey: "io_qty",
    header: () => <div className="text-right">Quantity</div>,
    cell: ({ row }) => {
      const qty = parseFloat(row.getValue("io_qty"))
      return <div className="text-right font-medium">{qty.toLocaleString()}</div>
    },
  },
  {
    accessorKey: "rate_pre_unit",
    header: () => <div className="text-right">Rate/Unit</div>,
    cell: ({ row }) => {
      const rate = parseFloat(row.getValue("rate_pre_unit"))
      return (
        <div className="text-right font-medium">
          ₹{rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
      )
    },
  },
  {
    accessorKey: "ASSESSABLE_VALUE",
    header: () => <div className="text-right">Assessable Value</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("ASSESSABLE_VALUE"))
      return (
        <div className="text-right font-medium">
          ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
      )
    },
  },
  {
    accessorKey: "CGST_RATE",
    header: () => <div className="text-right">CGST Rate</div>,
    cell: ({ row }) => {
      const rate = parseFloat(row.getValue("CGST_RATE"))
      return (
        <div className="text-right font-medium">
          {rate.toFixed(2)}%
        </div>
      )
    },
  },
  {
    accessorKey: "CGST_AMT",
    header: () => <div className="text-right">CGST Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("CGST_AMT"))
      return (
        <div className="text-right font-medium">
          ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
      )
    },
  },
  {
    accessorKey: "SGST_RATE",
    header: () => <div className="text-right">SGST Rate</div>,
    cell: ({ row }) => {
      const rate = parseFloat(row.getValue("SGST_RATE"))
      return (
        <div className="text-right font-medium">
          {rate.toFixed(2)}%
        </div>
      )
    },
  },
  {
    accessorKey: "SGST_AMT",
    header: () => <div className="text-right">SGST Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("SGST_AMT"))
      return (
        <div className="text-right font-medium">
          ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
      )
    },
  },
  {
    accessorKey: "IGST_RATE",
    header: () => <div className="text-right">IGST Rate</div>,
    cell: ({ row }) => {
      const rate = parseFloat(row.getValue("IGST_RATE"))
      return (
        <div className="text-right font-medium">
          {rate.toFixed(2)}%
        </div>
      )
    },
  },
  {
    accessorKey: "IGST_AMT",
    header: () => <div className="text-right">IGST Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("IGST_AMT"))
      return (
        <div className="text-right font-medium">
          ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
      )
    },
  },
  {
    accessorKey: "Total_Inv_Value",
    header: () => <div className="text-right">Total Invoice Value</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("Total_Inv_Value"))
      return (
        <div className="text-right font-medium">
          ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
      )
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const report = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(report.Invno)}
            >
              Copy Invoice No
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="mr-2 h-4 w-4" />
              Export Row
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

interface ImportedReportDataTableProps {
  data: ImportedReportData[]
  isLoading?: boolean
  onExport?: (selectedRows: ImportedReportData[]) => void
  onDelete?: (selectedRows: ImportedReportData[]) => void
}

export function ImportedReportDataTable({
  data,
  isLoading = false,
  onExport,
  onDelete,
}: ImportedReportDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

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
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original)

  const handleExport = () => {
    if (onExport) {
      onExport(selectedRows.length > 0 ? selectedRows : data)
    }
  }

  const handleDelete = () => {
    if (onDelete && selectedRows.length > 0) {
      onDelete(selectedRows)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Import Reports</CardTitle>
          <CardDescription>Loading imported report data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Reports</CardTitle>
        <CardDescription>
          View and manage imported report data. Total: {data.length} records
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Filter by customer name..."
                value={(table.getColumn("cust_name")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("cust_name")?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
              />
              <Input
                placeholder="Filter by invoice no..."
                value={(table.getColumn("Invno")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("Invno")?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              {selectedRows.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    disabled={!onExport}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export ({selectedRows.length})
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={!onDelete}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete ({selectedRows.length})
                  </Button>
                </>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
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
          </div>
          
          <div className="overflow-hidden rounded-md border">
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
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
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
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No imported reports found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-muted-foreground text-sm">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-sm text-muted-foreground">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
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
      </CardContent>
    </Card>
  )
}
