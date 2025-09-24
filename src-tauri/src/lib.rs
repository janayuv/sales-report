use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::State;

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

// In-memory storage for companies
pub struct CompanyStorage {
    companies: Mutex<HashMap<i64, Company>>,
    next_id: Mutex<i64>,
}

impl CompanyStorage {
    pub fn new() -> Self {
        Self {
            companies: Mutex::new(HashMap::new()),
            next_id: Mutex::new(1),
        }
    }
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn create_company(
    storage: State<CompanyStorage>,
    company: CreateCompany,
) -> Result<Company, String> {
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

    let mut companies = storage.companies.lock().unwrap();
    let mut next_id = storage.next_id.lock().unwrap();

    // Check for duplicate GST
    for existing_company in companies.values() {
        if existing_company.gst_no == company.gst_no.trim() {
            return Err("GST number already in use".to_string());
        }
    }

    let id = *next_id;
    *next_id += 1;

    let new_company = Company {
        id: Some(id),
        company_name: company.company_name.trim().to_string(),
        gst_no: company.gst_no.trim().to_string(),
        state_code: company.state_code.trim().to_string(),
        created_at: Some(chrono::Utc::now().to_rfc3339()),
        updated_at: Some(chrono::Utc::now().to_rfc3339()),
    };

    companies.insert(id, new_company.clone());
    Ok(new_company)
}

#[tauri::command]
fn get_companies(storage: State<CompanyStorage>) -> Result<Vec<Company>, String> {
    let companies = storage.companies.lock().unwrap();
    let mut company_list: Vec<Company> = companies.values().cloned().collect();
    company_list.sort_by(|a, b| {
        b.created_at.as_ref().unwrap_or(&String::new())
            .cmp(a.created_at.as_ref().unwrap_or(&String::new()))
    });
    Ok(company_list)
}

#[tauri::command]
fn get_company_by_id(
    storage: State<CompanyStorage>,
    id: i64,
) -> Result<Company, String> {
    let companies = storage.companies.lock().unwrap();
    companies.get(&id).cloned().ok_or_else(|| "Company not found".to_string())
}

#[tauri::command]
fn update_company(
    storage: State<CompanyStorage>,
    id: i64,
    company: UpdateCompany,
) -> Result<Company, String> {
    let mut companies = storage.companies.lock().unwrap();
    
    let mut existing_company = companies.get(&id).cloned()
        .ok_or_else(|| "Company not found".to_string())?;

    // Validate and update fields
    if let Some(name) = &company.company_name {
        if name.trim().is_empty() {
            return Err("Company name cannot be empty".to_string());
        }
        if name.len() > 255 {
            return Err("Company name must be 255 characters or less".to_string());
        }
        existing_company.company_name = name.trim().to_string();
    }

    if let Some(gst_no) = &company.gst_no {
        if gst_no.trim().is_empty() {
            return Err("GST number cannot be empty".to_string());
        }
        if !is_valid_gst_format(gst_no) {
            return Err("GST number must be 15 characters and follow GST format".to_string());
        }
        
        // Check for duplicate GST (excluding current company)
        for (existing_id, existing) in companies.iter() {
            if *existing_id != id && existing.gst_no == gst_no.trim() {
                return Err("GST number already in use".to_string());
            }
        }
        
        existing_company.gst_no = gst_no.trim().to_string();
    }

    if let Some(state_code) = &company.state_code {
        if state_code.trim().is_empty() {
            return Err("State code cannot be empty".to_string());
        }
        existing_company.state_code = state_code.trim().to_string();
    }

    existing_company.updated_at = Some(chrono::Utc::now().to_rfc3339());
    companies.insert(id, existing_company.clone());
    Ok(existing_company)
}

#[tauri::command]
fn delete_company(storage: State<CompanyStorage>, id: i64) -> Result<(), String> {
    let mut companies = storage.companies.lock().unwrap();
    companies.remove(&id).ok_or_else(|| "Company not found".to_string())?;
    Ok(())
}

#[tauri::command]
fn search_companies(
    storage: State<CompanyStorage>,
    query: String,
) -> Result<Vec<Company>, String> {
    let companies = storage.companies.lock().unwrap();
    let search_term = query.trim().to_lowercase();
    
    let filtered: Vec<Company> = companies
        .values()
        .filter(|company| {
            company.company_name.to_lowercase().contains(&search_term) ||
            company.gst_no.to_lowercase().contains(&search_term) ||
            company.state_code.to_lowercase().contains(&search_term)
        })
        .cloned()
        .collect();
    
    Ok(filtered)
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
        .manage(CompanyStorage::new())
        .invoke_handler(tauri::generate_handler![
            greet,
            create_company,
            get_companies,
            get_company_by_id,
            update_company,
            delete_company,
            search_companies
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}