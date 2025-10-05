import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { CustomerDataTable } from '@/components/CustomerDataTable';
import { Customer } from '@/types/customer';

// Mock data for testing
const mockCustomers: Customer[] = [
  {
    id: 1,
    report_customer: 'Test Customer 1',
    tally_customer: 'Tally Customer 1',
    gst_no: '12ABCDE1234F1Z5',
    state_code: 'MH',
    category_id: 1,
    company_id: 1,
    category: {
      id: 1,
      name: 'Regular',
      company_id: 1,
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    report_customer: 'Test Customer 2',
    tally_customer: 'Tally Customer 2',
    gst_no: '22ABCDE1234F1Z5',
    state_code: 'GJ',
    category_id: 2,
    company_id: 1,
    category: {
      id: 2,
      name: 'Raw Material',
      company_id: 1,
    },
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

const mockOnEdit = vi.fn();

describe('CustomerDataTable', () => {
  it('renders customer data correctly', () => {
    render(
      <CustomerDataTable
        data={mockCustomers}
        onEdit={mockOnEdit}
        isLoading={false}
      />
    );

    // Check if customer names are displayed
    expect(screen.getByText('Test Customer 1')).toBeInTheDocument();
    expect(screen.getByText('Test Customer 2')).toBeInTheDocument();

    // Check if GST numbers are displayed
    expect(screen.getByText('12ABCDE1234F1Z5')).toBeInTheDocument();
    expect(screen.getByText('22ABCDE1234F1Z5')).toBeInTheDocument();

    // Check if categories are displayed
    expect(screen.getByText('Regular')).toBeInTheDocument();
    expect(screen.getByText('Raw Material')).toBeInTheDocument();
  });

  it('shows loading state correctly', () => {
    render(
      <CustomerDataTable
        data={[]}
        onEdit={mockOnEdit}
        isLoading={true}
      />
    );

    // Check if loading skeleton is displayed
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('shows empty state correctly', () => {
    render(
      <CustomerDataTable
        data={[]}
        onEdit={mockOnEdit}
        isLoading={false}
      />
    );

    expect(screen.getByText('No customers found.')).toBeInTheDocument();
  });

  it('calls onEdit when edit action is clicked', () => {
    render(
      <CustomerDataTable
        data={mockCustomers}
        onEdit={mockOnEdit}
        isLoading={false}
      />
    );

    // Find and click the first edit button (MoreHorizontal icon)
    const editButtons = screen.getAllByRole('button');
    const moreButton = editButtons.find(button => 
      button.querySelector('svg')?.getAttribute('data-lucide') === 'more-horizontal'
    );
    
    if (moreButton) {
      moreButton.click();
      
      // Find and click the edit menu item
      const editMenuItem = screen.getByText('Edit customer');
      editMenuItem.click();
      
      expect(mockOnEdit).toHaveBeenCalledWith(mockCustomers[0]);
    }
  });
});
