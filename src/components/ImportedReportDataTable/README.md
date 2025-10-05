# Imported Report DataTable Module

A comprehensive data table module for viewing and managing imported report data, built with shadcn/ui components and TanStack Table.

## Features

- **Advanced Data Table**: Sortable, filterable, and paginated data table
- **Row Selection**: Multi-row selection with bulk actions
- **Export Functionality**: Export selected or all data to CSV
- **Real-time Filtering**: Filter by customer name, invoice number, and other fields
- **Column Management**: Show/hide columns as needed
- **Responsive Design**: Works on desktop and mobile devices
- **Error Handling**: Comprehensive error boundaries and loading states

## Components

### ImportedReportDataTable

The main data table component that displays imported report data.

**Props:**
- `data`: Array of `ImportedReportData` objects
- `isLoading`: Boolean indicating loading state
- `onExport`: Optional callback for export functionality
- `onDelete`: Optional callback for delete functionality

### useImportedReportData

A custom hook that manages the imported report data state and provides utility functions.

**Returns:**
- `data`: Array of imported report data
- `isLoading`: Loading state
- `error`: Error message if any
- `refetch`: Function to refresh data
- `exportData`: Function to export data to CSV
- `deleteData`: Function to delete selected records

### ImportedReportsPage

A complete page component that combines the data table with summary statistics and controls.

## Usage

### Basic Usage

```tsx
import { ImportedReportDataTable } from '@/components/ImportedReportDataTable'

function MyComponent() {
  const data = [
    // ... your imported report data
  ]

  return (
    <ImportedReportDataTable
      data={data}
      isLoading={false}
      onExport={(rows) => console.log('Export:', rows)}
      onDelete={(rows) => console.log('Delete:', rows)}
    />
  )
}
```

### Using the Hook

```tsx
import { useImportedReportData } from '@/components/ImportedReportDataTable'

function MyComponent() {
  const { data, isLoading, error, refetch, exportData, deleteData } = useImportedReportData()

  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      <button onClick={refetch}>Refresh</button>
      <button onClick={() => exportData()}>Export All</button>
    </div>
  )
}
```

### Complete Page

```tsx
import { ImportedReportsPage } from '@/components/ImportedReportDataTable'

// Add to your router
{
  path: '/imported-reports',
  element: <ImportedReportsPage />,
}
```

## Data Structure

The module expects data in the `ImportedReportData` format:

```typescript
interface ImportedReportData extends ImportReportRow {
  id: string
  tally_customer?: string
  category_name?: string
  created_at: string
  updated_at: string
}
```

## Features in Detail

### Sorting
- Click column headers to sort ascending/descending
- Multiple column sorting support
- Visual indicators for sort direction

### Filtering
- Global search across all columns
- Column-specific filters
- Real-time filtering as you type

### Pagination
- Configurable page size
- Navigation controls
- Page information display

### Export
- Export selected rows or all data
- CSV format with proper escaping
- Automatic filename generation

### Row Actions
- Individual row actions menu
- Copy invoice number
- View details (placeholder)
- Delete individual rows

## Styling

The component uses Tailwind CSS classes and follows the shadcn/ui design system. It's fully responsive and supports both light and dark themes.

## Dependencies

- `@tanstack/react-table`: Table functionality
- `@radix-ui/react-*`: UI primitives
- `lucide-react`: Icons
- `clsx`: Conditional class names

## Integration

The module integrates with:
- Selected company context for data filtering
- Database service for data fetching
- Toast notifications for user feedback
- Error boundaries for error handling
