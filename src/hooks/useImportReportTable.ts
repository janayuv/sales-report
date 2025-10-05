import { useState, useMemo, useCallback } from 'react'
import { ImportReportRow } from '@/types/import-report'

export interface ImportReportTableState {
  selectedRows: ImportReportRow[]
  filters: {
    customerName: string
    invoiceNo: string
    dateRange: { start: string; end: string } | null
    minAmount: number | null
    maxAmount: number | null
  }
  sortBy: string | null
  sortDirection: 'asc' | 'desc'
}

export interface ImportReportTableActions {
  selectRow: (row: ImportReportRow) => void
  selectAllRows: () => void
  clearSelection: () => void
  setFilter: (key: keyof ImportReportTableState['filters'], value: any) => void
  clearFilters: () => void
  setSorting: (column: string, direction: 'asc' | 'desc') => void
  exportSelected: () => void
  deleteSelected: () => void
}

export interface UseImportReportTableOptions {
  initialData?: ImportReportRow[]
  onExport?: (rows: ImportReportRow[]) => void
  onDelete?: (rows: ImportReportRow[]) => void
  onView?: (row: ImportReportRow) => void
}

export function useImportReportTable({
  initialData = [],
  onExport,
  onDelete,
}: UseImportReportTableOptions = {}) {
  const [state, setState] = useState<ImportReportTableState>({
    selectedRows: [],
    filters: {
      customerName: '',
      invoiceNo: '',
      dateRange: null,
      minAmount: null,
      maxAmount: null,
    },
    sortBy: null,
    sortDirection: 'asc',
  })

  // Computed filtered and sorted data
  const filteredData = useMemo(() => {
    let filtered = [...initialData]

    // Apply filters
    if (state.filters.customerName) {
      filtered = filtered.filter(row =>
        row.cust_name.toLowerCase().includes(state.filters.customerName.toLowerCase())
      )
    }

    if (state.filters.invoiceNo) {
      filtered = filtered.filter(row =>
        row.invoice_no.toLowerCase().includes(state.filters.invoiceNo.toLowerCase())
      )
    }

    if (state.filters.dateRange) {
      const { start, end } = state.filters.dateRange
      filtered = filtered.filter(row => {
        const rowDate = new Date(row.IO_DATE)
        const startDate = new Date(start)
        const endDate = new Date(end)
        return rowDate >= startDate && rowDate <= endDate
      })
    }

    if (state.filters.minAmount !== null) {
      filtered = filtered.filter(row => row.Grand_total >= state.filters.minAmount!)
    }

    if (state.filters.maxAmount !== null) {
      filtered = filtered.filter(row => row.Grand_total <= state.filters.maxAmount!)
    }

    // Apply sorting
    if (state.sortBy) {
      filtered.sort((a, b) => {
        const aValue = (a as any)[state.sortBy!]
        const bValue = (b as any)[state.sortBy!]
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return state.sortDirection === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue)
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return state.sortDirection === 'asc' 
            ? aValue - bValue
            : bValue - aValue
        }
        
        return 0
      })
    }

    return filtered
  }, [initialData, state.filters, state.sortBy, state.sortDirection])

  // Actions
  const actions: ImportReportTableActions = {
    selectRow: useCallback((row: ImportReportRow) => {
      setState(prev => ({
        ...prev,
        selectedRows: prev.selectedRows.includes(row)
          ? prev.selectedRows.filter(r => r !== row)
          : [...prev.selectedRows, row]
      }))
    }, []),

    selectAllRows: useCallback(() => {
      setState(prev => ({
        ...prev,
        selectedRows: filteredData
      }))
    }, [filteredData]),

    clearSelection: useCallback(() => {
      setState(prev => ({ ...prev, selectedRows: [] }))
    }, []),

    setFilter: useCallback((key: keyof ImportReportTableState['filters'], value: any) => {
      setState(prev => ({
        ...prev,
        filters: { ...prev.filters, [key]: value }
      }))
    }, []),

    clearFilters: useCallback(() => {
      setState(prev => ({
        ...prev,
        filters: {
          customerName: '',
          invoiceNo: '',
          dateRange: null,
          minAmount: null,
          maxAmount: null,
        }
      }))
    }, []),

    setSorting: useCallback((column: string, direction: 'asc' | 'desc') => {
      setState(prev => ({
        ...prev,
        sortBy: column,
        sortDirection: direction
      }))
    }, []),

    exportSelected: useCallback(() => {
      if (onExport && state.selectedRows.length > 0) {
        onExport(state.selectedRows)
      }
    }, [onExport, state.selectedRows]),

    deleteSelected: useCallback(() => {
      if (onDelete && state.selectedRows.length > 0) {
        onDelete(state.selectedRows)
      }
    }, [onDelete, state.selectedRows]),
  }

  // Computed values
  const totalAmount = useMemo(() => {
    return filteredData.reduce((sum, row) => sum + (row.Grand_total || 0), 0)
  }, [filteredData])

  const averageAmount = useMemo(() => {
    return filteredData.length > 0 ? totalAmount / filteredData.length : 0
  }, [filteredData.length, totalAmount])

  const uniqueCustomers = useMemo(() => {
    const customers = new Set(filteredData.map(row => row.cust_name))
    return Array.from(customers)
  }, [filteredData])

  const dateRange = useMemo(() => {
    if (filteredData.length === 0) return null
    
    const dates = filteredData
      .map(row => new Date(row.IO_DATE))
      .filter(date => !isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime())
    
    if (dates.length === 0) return null
    
    return {
      start: dates[0].toISOString().split('T')[0],
      end: dates[dates.length - 1].toISOString().split('T')[0]
    }
  }, [filteredData])

  return {
    state,
    actions,
    filteredData,
    computed: {
      totalAmount,
      averageAmount,
      uniqueCustomers,
      dateRange,
      totalRows: filteredData.length,
      selectedRowsCount: state.selectedRows.length,
    }
  }
}

