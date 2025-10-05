use serde::{Deserialize, Serialize};

// Company data model
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Company {
    pub id: Option<i64>,
    pub company_name: String,
    pub gst_no: String,
    pub state_code: String,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateCompany {
    pub company_name: String,
    pub gst_no: String,
    pub state_code: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateCompany {
    pub company_name: Option<String>,
    pub gst_no: Option<String>,
    pub state_code: Option<String>,
}

// Category data model
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Category {
    pub id: Option<i64>,
    pub name: String,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateCategory {
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateCategory {
    pub name: Option<String>,
}

// Customer data model
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Customer {
    pub id: Option<i64>,
    pub report_customer: String,
    pub tally_customer: String,
    pub gst_no: String,
    pub state_code: String,
    pub category_id: i64,
    pub category: Option<Category>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateCustomer {
    pub report_customer: String,
    pub tally_customer: String,
    pub gst_no: Option<String>,
    pub state_code: Option<String>,
    pub category_id: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateCustomer {
    pub report_customer: Option<String>,
    pub tally_customer: Option<String>,
    pub gst_no: Option<String>,
    pub state_code: Option<String>,
    pub category_id: Option<i64>,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn initialize_database() -> Result<(), String> {
    // This will be handled by the frontend using the SQL plugin
    Ok(())
}

#[tauri::command]
async fn create_company(company: CreateCompany) -> Result<Company, String> {
    // Validate input
    if company.company_name.trim().is_empty() {
        return Err("Company name is required".to_string());
    }
    if company.company_name.len() > 255 {
        return Err("Company name must be 255 characters or less".to_string());
    }
    if company.gst_no.trim().is_empty() {
        return Err("GST number is required".to_string());
    }
    if !is_valid_gst_format(&company.gst_no) {
        return Err("GST number must be 15 characters and follow GST format".to_string());
    }
    if company.state_code.trim().is_empty() {
        return Err("State code is required".to_string());
    }

    // Return the validated data - the actual database operation will be handled by the frontend
    Ok(Company {
        id: None,
        company_name: company.company_name.trim().to_string(),
        gst_no: company.gst_no.trim().to_string(),
        state_code: company.state_code.trim().to_string(),
        created_at: Some(chrono::Utc::now().to_rfc3339()),
        updated_at: Some(chrono::Utc::now().to_rfc3339()),
    })
}

#[tauri::command]
async fn validate_company_update(company: UpdateCompany) -> Result<UpdateCompany, String> {
    // Validate input
    if let Some(name) = &company.company_name {
        if name.trim().is_empty() {
            return Err("Company name cannot be empty".to_string());
        }
        if name.len() > 255 {
            return Err("Company name must be 255 characters or less".to_string());
        }
    }

    if let Some(gst_no) = &company.gst_no {
        if gst_no.trim().is_empty() {
            return Err("GST number cannot be empty".to_string());
        }
        if !is_valid_gst_format(gst_no) {
            return Err("GST number must be 15 characters and follow GST format".to_string());
        }
    }

    if let Some(state_code) = &company.state_code {
        if state_code.trim().is_empty() {
            return Err("State code cannot be empty".to_string());
        }
    }

    Ok(company)
}

// Helper function to validate GST format
fn is_valid_gst_format(gst_no: &str) -> bool {
    let trimmed = gst_no.trim();
    // Basic GST validation: 15 characters, first 2 digits for state code, next 10 for PAN, last 3 for entity type
    trimmed.len() == 15 && trimmed.chars().all(|c| c.is_ascii_alphanumeric())
}

// Category validation commands
#[tauri::command]
async fn validate_category_create(category: CreateCategory) -> Result<CreateCategory, String> {
    if category.name.trim().is_empty() {
        return Err("Category name is required".to_string());
    }
    if category.name.len() > 100 {
        return Err("Category name must be 100 characters or less".to_string());
    }
    Ok(category)
}

#[tauri::command]
async fn validate_category_update(category: UpdateCategory) -> Result<UpdateCategory, String> {
    if let Some(name) = &category.name {
        if name.trim().is_empty() {
            return Err("Category name cannot be empty".to_string());
        }
        if name.len() > 100 {
            return Err("Category name must be 100 characters or less".to_string());
        }
    }
    Ok(category)
}

// Customer validation commands
#[tauri::command]
async fn validate_customer_create(customer: CreateCustomer) -> Result<CreateCustomer, String> {
    if customer.report_customer.trim().is_empty() {
        return Err("Report customer name is required".to_string());
    }
    if customer.report_customer.len() > 255 {
        return Err("Report customer name must be 255 characters or less".to_string());
    }
    
    if customer.tally_customer.trim().is_empty() {
        return Err("Tally customer name is required".to_string());
    }
    if customer.tally_customer.len() > 255 {
        return Err("Tally customer name must be 255 characters or less".to_string());
    }
    
    if let Some(gst_no) = &customer.gst_no {
        if !gst_no.trim().is_empty() && !is_valid_gst_format(gst_no) {
            return Err("GST number must be 15 characters and follow GST format".to_string());
        }
    }
    
    // State code is optional - no validation needed
    
    if customer.category_id <= 0 {
        return Err("Category is required".to_string());
    }
    
    Ok(customer)
}

#[tauri::command]
async fn validate_customer_update(customer: UpdateCustomer) -> Result<UpdateCustomer, String> {
    if let Some(report_customer) = &customer.report_customer {
        if report_customer.trim().is_empty() {
            return Err("Report customer name cannot be empty".to_string());
        }
        if report_customer.len() > 255 {
            return Err("Report customer name must be 255 characters or less".to_string());
        }
    }
    
    if let Some(tally_customer) = &customer.tally_customer {
        if tally_customer.trim().is_empty() {
            return Err("Tally customer name cannot be empty".to_string());
        }
        if tally_customer.len() > 255 {
            return Err("Tally customer name must be 255 characters or less".to_string());
        }
    }
    
    if let Some(gst_no) = &customer.gst_no {
        if !gst_no.trim().is_empty() && !is_valid_gst_format(gst_no) {
            return Err("GST number must be 15 characters and follow GST format".to_string());
        }
    }
    
    // State code is optional - no validation needed
    
    if let Some(category_id) = customer.category_id {
        if category_id <= 0 {
            return Err("Category is required".to_string());
        }
    }
    
    Ok(customer)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            greet,
            initialize_database,
            create_company,
            validate_company_update,
            validate_category_create,
            validate_category_update,
            validate_customer_create,
            validate_customer_update
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}