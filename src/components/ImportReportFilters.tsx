import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Filter, X } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface ImportReportFiltersProps {
  filters: {
    customerName: string
    invoiceNo: string
    dateRange: { start: string; end: string } | null
    minAmount: number | null
    maxAmount: number | null
  }
  onFilterChange: (key: keyof ImportReportFiltersProps['filters'], value: any) => void
  onClearFilters: () => void
}

export function ImportReportFilters({ 
  filters, 
  onFilterChange, 
  onClearFilters 
}: ImportReportFiltersProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false)
  const [dateRange, setDateRange] = React.useState<{ from?: Date; to?: Date }>({
    from: filters.dateRange?.start ? new Date(filters.dateRange.start) : undefined,
    to: filters.dateRange?.end ? new Date(filters.dateRange.end) : undefined,
  })

  const handleDateRangeChange = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range) {
      setDateRange({ from: undefined, to: undefined })
      onFilterChange('dateRange', null)
      return
    }
    
    setDateRange(range)
    if (range.from && range.to) {
      onFilterChange('dateRange', {
        start: range.from.toISOString().split('T')[0],
        end: range.to.toISOString().split('T')[0]
      })
    } else {
      onFilterChange('dateRange', null)
    }
  }

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== null && value !== undefined
  )

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="text-muted-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Customer Name Filter */}
          <div className="space-y-2">
            <Label htmlFor="customer-filter">Customer Name</Label>
            <Input
              id="customer-filter"
              placeholder="Filter by customer..."
              value={filters.customerName}
              onChange={(e) => onFilterChange('customerName', e.target.value)}
            />
          </div>

          {/* Invoice Number Filter */}
          <div className="space-y-2">
            <Label htmlFor="invoice-filter">Invoice Number</Label>
            <Input
              id="invoice-filter"
              placeholder="Filter by invoice..."
              value={filters.invoiceNo}
              onChange={(e) => onFilterChange('invoiceNo', e.target.value)}
            />
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
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
                  onSelect={handleDateRangeChange}
                  numberOfMonths={2}
                  required={false}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Amount Range Filter */}
          <div className="space-y-2">
            <Label>Amount Range</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Min"
                type="number"
                value={filters.minAmount || ''}
                onChange={(e) => onFilterChange('minAmount', e.target.value ? parseFloat(e.target.value) : null)}
                className="flex-1"
              />
              <Input
                placeholder="Max"
                type="number"
                value={filters.maxAmount || ''}
                onChange={(e) => onFilterChange('maxAmount', e.target.value ? parseFloat(e.target.value) : null)}
                className="flex-1"
              />
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {filters.customerName && (
              <Badge variant="secondary" className="text-xs">
                Customer: {filters.customerName}
              </Badge>
            )}
            {filters.invoiceNo && (
              <Badge variant="secondary" className="text-xs">
                Invoice: {filters.invoiceNo}
              </Badge>
            )}
            {filters.dateRange && (
              <Badge variant="secondary" className="text-xs">
                Date: {filters.dateRange.start} to {filters.dateRange.end}
              </Badge>
            )}
            {filters.minAmount !== null && (
              <Badge variant="secondary" className="text-xs">
                Min Amount: ₹{filters.minAmount.toLocaleString()}
              </Badge>
            )}
            {filters.maxAmount !== null && (
              <Badge variant="secondary" className="text-xs">
                Max Amount: ₹{filters.maxAmount.toLocaleString()}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

