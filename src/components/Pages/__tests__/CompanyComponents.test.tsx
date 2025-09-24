import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CompanyForm } from '../components/Pages/CompanyForm'
import { DeleteConfirmDialog } from '../components/Pages/DeleteConfirmDialog'
import { Company } from '../types/company'

// Mock the Tauri invoke function
const mockInvoke = vi.fn()
global.__TAURI__.invoke = mockInvoke

describe('CompanyForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders create form correctly', () => {
    render(
      <CompanyForm
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('Add New Company')).toBeInTheDocument()
    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/gst number/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/state code/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument()
  })

  it('renders edit form correctly', () => {
    const company: Company = {
      id: 1,
      company_name: 'Test Company',
      gst_no: '07AABCU9603R1ZX',
      state_code: '07',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }

    render(
      <CompanyForm
        company={company}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('Edit Company')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Company')).toBeInTheDocument()
    expect(screen.getByDisplayValue('07AABCU9603R1ZX')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    
    render(
      <CompanyForm
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    )

    const submitButton = screen.getByRole('button', { name: /create/i })
    await user.click(submitButton)

    expect(screen.getByText('Company name is required')).toBeInTheDocument()
    expect(screen.getByText('GST number is required')).toBeInTheDocument()
    expect(screen.getByText('State code is required')).toBeInTheDocument()
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('validates GST format', async () => {
    const user = userEvent.setup()
    
    render(
      <CompanyForm
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    )

    const companyNameInput = screen.getByLabelText(/company name/i)
    const gstInput = screen.getByLabelText(/gst number/i)
    const stateSelect = screen.getByLabelText(/state code/i)
    const submitButton = screen.getByRole('button', { name: /create/i })

    await user.type(companyNameInput, 'Test Company')
    await user.type(gstInput, 'invalid-gst')
    await user.selectOptions(stateSelect, '07')
    await user.click(submitButton)

    expect(screen.getByText('GST number must be 15 characters and follow GST format')).toBeInTheDocument()
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    mockOnSubmit.mockResolvedValue(undefined)
    
    render(
      <CompanyForm
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    )

    const companyNameInput = screen.getByLabelText(/company name/i)
    const gstInput = screen.getByLabelText(/gst number/i)
    const stateSelect = screen.getByLabelText(/state code/i)
    const submitButton = screen.getByRole('button', { name: /create/i })

    await user.type(companyNameInput, 'Test Company')
    await user.type(gstInput, '07AABCU9603R1ZX')
    await user.selectOptions(stateSelect, '07')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        company_name: 'Test Company',
        gst_no: '07AABCU9603R1ZX',
        state_code: '07'
      })
    })
  })

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <CompanyForm
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    )

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalled()
  })
})

describe('DeleteConfirmDialog', () => {
  const mockOnConfirm = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly', () => {
    const company: Company = {
      id: 1,
      company_name: 'Test Company',
      gst_no: '07AABCU9603R1ZX',
      state_code: '07',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }

    render(
      <DeleteConfirmDialog
        company={company}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText('Delete Company')).toBeInTheDocument()
    expect(screen.getByText(/are you sure you want to delete test company/i)).toBeInTheDocument()
    expect(screen.getByText('Test Company')).toBeInTheDocument()
    expect(screen.getByText('07AABCU9603R1ZX')).toBeInTheDocument()
    expect(screen.getByText('07')).toBeInTheDocument()
  })

  it('calls onConfirm when delete button is clicked', async () => {
    const user = userEvent.setup()
    const company: Company = {
      id: 1,
      company_name: 'Test Company',
      gst_no: '07AABCU9603R1ZX',
      state_code: '07'
    }

    render(
      <DeleteConfirmDialog
        company={company}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    const deleteButton = screen.getByRole('button', { name: /delete company/i })
    await user.click(deleteButton)

    expect(mockOnConfirm).toHaveBeenCalled()
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const company: Company = {
      id: 1,
      company_name: 'Test Company',
      gst_no: '07AABCU9603R1ZX',
      state_code: '07'
    }

    render(
      <DeleteConfirmDialog
        company={company}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalled()
  })
})
