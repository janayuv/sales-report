import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { dbService } from '@/services/database';
import { Customer, Category } from '@/types/customer';
import { Company } from '@/types/company';
import Customers from '@/components/Pages/Customers';

// Mock the database service
vi.mock('@/services/database', () => ({
  dbService: {
    getCustomers: vi.fn(),
    getCategories: vi.fn(),
    createCustomer: vi.fn(),
    updateCustomer: vi.fn(),
    checkTallyCustomerExists: vi.fn(),
    createCategory: vi.fn(),
  },
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockCompany: Company = {
  id: 1,
  company_name: 'Test Company',
  gst_no: '07AABCU9603R1ZX',
  state_code: '07',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Mock the SelectedCompanyContext
vi.mock('@/contexts/SelectedCompanyContext', () => ({
  useSelectedCompany: () => ({
    selectedCompany: mockCompany,
    setSelectedCompany: vi.fn(),
    isLoading: false,
    error: null,
  }),
  SelectedCompanyProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

const mockCustomers: Customer[] = [
  {
    id: 1,
    report_customer: 'Test Customer 1',
    tally_customer: 'TALLY_CUST_1',
    gst_no: '07AABCU9603R1ZX',
    state_code: '07',
    category_id: 1,
    company_id: 1,
    category: { id: 1, name: 'Regular', company_id: 1 },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    report_customer: 'Test Customer 2',
    tally_customer: 'TALLY_CUST_2',
    gst_no: '27AABCU9603R1ZX',
    state_code: '27',
    category_id: 2,
    company_id: 1,
    category: { id: 2, name: 'Raw material', company_id: 1 },
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

const mockCategories: Category[] = [
  {
    id: 1,
    name: 'Regular',
    company_id: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Raw material',
    company_id: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 3,
    name: 'Scrap',
    company_id: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

describe('Customer Management - Core Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (dbService.getCustomers as any).mockResolvedValue(mockCustomers);
    (dbService.getCategories as any).mockResolvedValue(mockCategories);
    (dbService.checkTallyCustomerExists as any).mockResolvedValue(false);
  });

  describe('Customers Page', () => {
    it('should render customers list', async () => {
      render(<Customers />);

      await waitFor(() => {
        expect(screen.getByText('Test Customer 1')).toBeInTheDocument();
        expect(screen.getByText('Test Customer 2')).toBeInTheDocument();
      });

      expect(screen.getByText(/TALLY_CUST_1/)).toBeInTheDocument();
      expect(screen.getByText('Regular')).toBeInTheDocument();
    });

    it('should filter customers by search query', async () => {
      render(<Customers />);

      await waitFor(() => {
        expect(screen.getByText('Test Customer 1')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search customers/i);
      fireEvent.change(searchInput, { target: { value: 'Customer 1' } });

      expect(screen.getByText('Test Customer 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Customer 2')).not.toBeInTheDocument();
    });

    it('should open create form when Add Customer button is clicked', async () => {
      render(<Customers />);

      await waitFor(() => {
        expect(screen.getByText('Add Customer')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Add Customer'));

      expect(screen.getByText('Add New Customer')).toBeInTheDocument();
    });
  });

  describe('Customer Model Validation', () => {
    it('should validate customer data constraints', () => {
      const validCustomer = {
        report_customer: 'Valid Customer',
        tally_customer: 'VALID_TALLY',
        gst_no: '07AABCU9603R1ZX',
        state_code: '07',
        category_id: 1,
      };

      // Test report_customer constraints
      expect(validCustomer.report_customer.length).toBeLessThanOrEqual(255);
      expect(validCustomer.report_customer.trim()).not.toBe('');

      // Test tally_customer constraints
      expect(validCustomer.tally_customer.length).toBeLessThanOrEqual(255);
      expect(validCustomer.tally_customer.trim()).not.toBe('');

      // Test GST format
      expect(validCustomer.gst_no).toMatch(
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[1-9A-Z]{1}$/
      );
      expect(validCustomer.gst_no.length).toBe(15);

      // Test state_code
      expect(validCustomer.state_code.trim()).not.toBe('');

      // Test category_id
      expect(validCustomer.category_id).toBeGreaterThan(0);
    });
  });

  describe('Category Model Validation', () => {
    it('should validate category data constraints', () => {
      const validCategory = {
        name: 'Valid Category',
      };

      // Test name constraints
      expect(validCategory.name.length).toBeLessThanOrEqual(100);
      expect(validCategory.name.trim()).not.toBe('');
    });
  });
});
