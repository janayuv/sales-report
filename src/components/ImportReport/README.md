# Import Report Table Module

A comprehensive data table module built with Shadcn/ui components for displaying and managing imported sales report data. This module provides advanced filtering, sorting, pagination, and bulk operations for ImportReportRow data.

## Features

### 🎯 Core Features
- **Advanced Data Table**: Built with TanStack Table for performance and flexibility
- **Smart Filtering**: Multiple filter options including text, date range, and amount range
- **Summary Statistics**: Real-time calculations of totals, averages, and customer counts
- **Bulk Operations**: Select and operate on multiple rows at once
- **Export Functionality**: Export selected or all data
- **Responsive Design**: Works seamlessly across all device sizes

### 🔧 Technical Features
- **TypeScript Support**: Fully typed with comprehensive interfaces
- **Custom Hooks**: Reusable state management with `useImportReportTable`
- **Modular Architecture**: Individual components can be used separately
- **Performance Optimized**: Efficient filtering and sorting with memoization
- **Accessibility**: Built with accessibility best practices

## Components

### ImportReportTableModule
The main component that combines all functionality into a complete table solution.

```tsx
import { ImportReportTableModule } from '@/components/ImportReportTableModule'

<ImportReportTableModule
  data={importReportData}
  isLoading={loading}
  onExport={handleExport}
  onDelete={handleDelete}
  onView={handleView}
  onRefresh={handleRefresh}
  showFilters={true}
  showSummary={true}
/>
```

### ImportReportDataTable
The core data table component with sorting, pagination, and row selection.

```tsx
import { ImportReportDataTable } from '@/components/ImportReportDataTable'

<ImportReportDataTable
  data={data}
  onView={handleView}
  onExport={handleExport}
  onDelete={handleDelete}
  isLoading={false}
/>
```

### ImportReportFilters
Advanced filtering component with multiple filter types.

```tsx
import { ImportReportFilters } from '@/components/ImportReportFilters'

<ImportReportFilters
  filters={filters}
  onFilterChange={setFilter}
  onClearFilters={clearFilters}
/>
```

### ImportReportSummary
Summary statistics cards showing key metrics.

```tsx
import { ImportReportSummary } from '@/components/ImportReportSummary'

<ImportReportSummary
  totalRows={100}
  totalAmount={50000}
  averageAmount={500}
  uniqueCustomers={['Customer A', 'Customer B']}
  dateRange={{ start: '2024-01-01', end: '2024-01-31' }}
  selectedRowsCount={5}
/>
```

## Custom Hook

### useImportReportTable
A powerful custom hook for managing table state and operations.

```tsx
import { useImportReportTable } from '@/hooks/useImportReportTable'

const {
  state,
  actions,
  filteredData,
  computed
} = useImportReportTable({
  initialData: data,
  onExport: handleExport,
  onDelete: handleDelete,
  onView: handleView
})

// State includes: data, isLoading, error, selectedRows, filters, sorting
// Actions include: setData, setLoading, selectRow, setFilter, exportSelected, etc.
// Computed includes: totalAmount, averageAmount, uniqueCustomers, dateRange, etc.
```

## Data Structure

The module works with `ImportReportRow` data structure:

```tsx
interface ImportReportRow {
  invoice_no: string
  cust_cde: string
  cust_name: string
  IO_DATE: string
  Invno: string
  prod_cde: string
  prod_cust_no: string
  prod_name_ko: string
  tariff_code: string
  io_qty: number
  rate_pre_unit: number
  Amortisation_cost: number
  supp_mat_cost: number
  ASSESSABLE_VALUE: number
  'Supplier MAt Value': number
  Amort_Value: number
  ED_Value: number
  ADDL_DUTY: number
  EDU_CESS: number
  SH_EDT_CESS: number
  Total: number
  VAT_CST: number
  invoice_Total: number
  Grand_total: number
  'Total Basic Value': number
  'Total ED Value': number
  Total_VAT: number
  Total_Inv_Value: number
  ST_VAT: number
  CGST_RATE: number
  CGST_AMT: number
  SGST_RATE: number
  SGST_AMT: number
  IGST_RATE: number
  IGST_AMT: number
  TCS_amt: number
  CGST_TOTAL: number
  SGST_TOTAL: number
  IGST_TOTAL: number
  Total_Amorization: number
  Total_TCS: number
}
```

## Filtering Options

### Text Filters
- **Customer Name**: Filter by customer name (case-insensitive)
- **Invoice Number**: Filter by invoice number (case-insensitive)

### Date Range Filter
- **Date Picker**: Select start and end dates for filtering
- **Calendar Component**: Built-in calendar for easy date selection

### Amount Range Filter
- **Minimum Amount**: Filter records above a certain amount
- **Maximum Amount**: Filter records below a certain amount

### Active Filters Display
- Visual badges showing currently active filters
- Easy filter removal with clear all option

## Column Features

### Sortable Columns
- Invoice Number
- Customer Name
- Date
- Quantity
- Rate per Unit
- Grand Total

### Formatted Display
- **Currency**: Indian Rupee formatting with proper locale
- **Dates**: Localized date formatting
- **Numbers**: Proper number formatting with thousands separators
- **Badges**: Tariff codes displayed as badges

### Actions Column
- **View Details**: View individual record details
- **Export Row**: Export single row data
- **Delete Row**: Remove individual record
- **Copy Invoice No**: Copy invoice number to clipboard

## Bulk Operations

### Row Selection
- **Select All**: Select all visible rows
- **Individual Selection**: Select/deselect individual rows
- **Selection Counter**: Shows selected row count

### Bulk Actions
- **Export Selected**: Export all selected rows
- **Delete Selected**: Remove all selected rows
- **Clear Selection**: Deselect all rows

## Summary Statistics

### Key Metrics
- **Total Records**: Count of all filtered records
- **Total Amount**: Sum of all Grand_total values
- **Average Amount**: Average transaction amount
- **Unique Customers**: Count of distinct customers
- **Date Range**: Earliest and latest transaction dates

### Visual Indicators
- **Color Coding**: Green for amounts, blue for selections
- **Icons**: Meaningful icons for each metric
- **Trend Indicators**: Visual cues for data trends

## Dependencies

### Required Packages
```json
{
  "@tanstack/react-table": "^8.x",
  "react-day-picker": "^8.x",
  "@radix-ui/react-popover": "^1.x",
  "class-variance-authority": "^0.x",
  "date-fns": "^2.x",
  "lucide-react": "^0.x"
}
```

### UI Components Used
- Button, Card, Input, Label, Badge
- Table, DropdownMenu, Checkbox
- Calendar, Popover, Alert
- Toast (for notifications)

## Styling

The module uses Tailwind CSS classes and follows Shadcn/ui design patterns:

- **Consistent Spacing**: Uses Tailwind spacing scale
- **Color Scheme**: Follows theme colors (primary, secondary, muted, etc.)
- **Typography**: Consistent font weights and sizes
- **Responsive**: Mobile-first responsive design
- **Dark Mode**: Supports dark/light theme switching

## Performance Considerations

### Optimization Features
- **Memoized Calculations**: Expensive computations are memoized
- **Efficient Filtering**: Optimized filter functions
- **Virtual Scrolling**: Handles large datasets efficiently
- **Debounced Search**: Prevents excessive API calls during typing

### Memory Management
- **Cleanup**: Proper cleanup of event listeners
- **State Management**: Efficient state updates
- **Re-render Optimization**: Minimal unnecessary re-renders

## Accessibility

### ARIA Support
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Proper focus handling
- **Color Contrast**: Meets WCAG guidelines

### User Experience
- **Loading States**: Clear loading indicators
- **Error Handling**: User-friendly error messages
- **Empty States**: Helpful empty state messages
- **Tooltips**: Contextual help and information

## Examples

### Basic Implementation
```tsx
function MyComponent() {
  const [data, setData] = useState<ImportReportRow[]>([])
  const [loading, setLoading] = useState(false)

  const handleExport = (rows: ImportReportRow[]) => {
    // Export logic here
    console.log('Exporting:', rows)
  }

  return (
    <ImportReportTableModule
      data={data}
      isLoading={loading}
      onExport={handleExport}
    />
  )
}
```

### Advanced Usage with Custom Hook
```tsx
function AdvancedComponent() {
  const {
    state,
    actions,
    filteredData,
    computed
  } = useImportReportTable({
    initialData: myData,
    onExport: handleExport,
    onDelete: handleDelete
  })

  return (
    <div>
      <ImportReportSummary {...computed} />
      <ImportReportFilters
        filters={state.filters}
        onFilterChange={actions.setFilter}
        onClearFilters={actions.clearFilters}
      />
      <ImportReportDataTable
        data={filteredData}
        onExport={actions.exportSelected}
        onDelete={actions.deleteSelected}
      />
    </div>
  )
}
```

## Troubleshooting

### Common Issues

1. **Missing Dependencies**: Ensure all required packages are installed
2. **Type Errors**: Make sure TypeScript types are properly imported
3. **Styling Issues**: Verify Tailwind CSS is properly configured
4. **Performance**: For large datasets, consider implementing virtualization

### Debug Tips

1. **Console Logging**: Use browser dev tools to inspect state changes
2. **React DevTools**: Use React DevTools to inspect component state
3. **Network Tab**: Check for any failed API calls or data loading issues

## Contributing

When contributing to this module:

1. **Follow TypeScript**: Maintain strict typing
2. **Test Components**: Add tests for new functionality
3. **Document Changes**: Update this README for new features
4. **Follow Patterns**: Maintain consistency with existing code patterns
5. **Accessibility**: Ensure new features are accessible

## License

This module is part of the sales-report application and follows the same license terms.

