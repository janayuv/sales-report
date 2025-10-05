export interface Category {
  id?: number;
  name: string;
  company_id: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCategory {
  name: string;
  company_id: number;
}

export interface UpdateCategory {
  name?: string;
}

export interface Customer {
  id?: number;
  report_customer: string;
  tally_customer: string;
  gst_no: string;
  state_code: string;
  category_id: number;
  company_id: number;
  normalized_name?: string;
  created_from_import_id?: string;
  category?: Category;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCustomer {
  report_customer: string;
  tally_customer: string;
  gst_no?: string;
  state_code?: string;
  category_id: number;
  company_id: number;
}

// Extended interface for Excel import
export interface CreateCustomerFromExcel
  extends Omit<CreateCustomer, 'category_id'> {
  category_name: string;
}

export interface UpdateCustomer {
  report_customer?: string;
  tally_customer?: string;
  gst_no?: string;
  state_code?: string;
  category_id?: number;
}

export interface CustomerFormData {
  report_customer: string;
  tally_customer: string;
  gst_no: string;
  state_code: string;
  category_id: number | null;
}

export interface CustomerFormErrors {
  report_customer?: string;
  tally_customer?: string;
  gst_no?: string;
  state_code?: string;
  category_id?: string;
}

export interface CategoryFormData {
  name: string;
}

export interface CategoryFormErrors {
  name?: string;
}
