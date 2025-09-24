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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            greet,
            initialize_database,
            create_company,
            validate_company_update
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}