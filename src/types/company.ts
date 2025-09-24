export interface Company {
  id?: number;
  company_name: string;
  gst_no: string;
  state_code: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCompany {
  company_name: string;
  gst_no: string;
  state_code: string;
}

export interface UpdateCompany {
  company_name?: string;
  gst_no?: string;
  state_code?: string;
}

export interface CompanyFormData {
  company_name: string;
  gst_no: string;
  state_code: string;
}

export interface CompanyFormErrors {
  company_name?: string;
  gst_no?: string;
  state_code?: string;
}
