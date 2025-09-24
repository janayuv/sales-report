use serde::{Deserialize, Serialize};
use tauri_plugin_sql::{Migration, MigrationKind};

// Company data model
#[derive(Debug, Serialize, Deserialize)]
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

// Database migrations
pub fn get_migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "create_companies_table",
            sql: "CREATE TABLE companies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company_name TEXT NOT NULL,
                gst_no TEXT NOT NULL UNIQUE,
                state_code TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );",
            kind: MigrationKind::Up,
        },
    ]
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn create_company(
    app_handle: tauri::AppHandle,
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

    let db = tauri_plugin_sql::Builder::default()
        .add_migrations("sqlite:sales_report.db", get_migrations())
        .build(app_handle)
        .map_err(|e| format!("Database error: {}", e))?;

    let result = db
        .execute(
            "sqlite:sales_report.db",
            "INSERT INTO companies (company_name, gst_no, state_code) VALUES (?1, ?2, ?3)",
            &[
                company.company_name.trim(),
                company.gst_no.trim(),
                company.state_code.trim(),
            ],
        )
        .await
        .map_err(|e| format!("Failed to create company: {}", e))?;

    let company_id = result.last_insert_rowid;
    
    // Fetch the created company
    let companies: Vec<Company> = db
        .select(
            "sqlite:sales_report.db",
            "SELECT id, company_name, gst_no, state_code, created_at, updated_at FROM companies WHERE id = ?1",
            &[company_id.to_string()],
        )
        .await
        .map_err(|e| format!("Failed to fetch created company: {}", e))?;

    companies.into_iter().next().ok_or_else(|| "Company not found after creation".to_string())
}

#[tauri::command]
async fn get_companies(app_handle: tauri::AppHandle) -> Result<Vec<Company>, String> {
    let db = tauri_plugin_sql::Builder::default()
        .add_migrations("sqlite:sales_report.db", get_migrations())
        .build(app_handle)
        .map_err(|e| format!("Database error: {}", e))?;

    let companies: Vec<Company> = db
        .select(
            "sqlite:sales_report.db",
            "SELECT id, company_name, gst_no, state_code, created_at, updated_at FROM companies ORDER BY created_at DESC",
            &[],
        )
        .await
        .map_err(|e| format!("Failed to fetch companies: {}", e))?;

    Ok(companies)
}

#[tauri::command]
async fn get_company_by_id(
    app_handle: tauri::AppHandle,
    id: i64,
) -> Result<Company, String> {
    let db = tauri_plugin_sql::Builder::default()
        .add_migrations("sqlite:sales_report.db", get_migrations())
        .build(app_handle)
        .map_err(|e| format!("Database error: {}", e))?;

    let companies: Vec<Company> = db
        .select(
            "sqlite:sales_report.db",
            "SELECT id, company_name, gst_no, state_code, created_at, updated_at FROM companies WHERE id = ?1",
            &[id.to_string()],
        )
        .await
        .map_err(|e| format!("Failed to fetch company: {}", e))?;

    companies.into_iter().next().ok_or_else(|| "Company not found".to_string())
}

#[tauri::command]
async fn update_company(
    app_handle: tauri::AppHandle,
    id: i64,
    company: UpdateCompany,
) -> Result<Company, String> {
    let db = tauri_plugin_sql::Builder::default()
        .add_migrations("sqlite:sales_report.db", get_migrations())
        .build(app_handle)
        .map_err(|e| format!("Database error: {}", e))?;

    // Build dynamic update query
    let mut update_fields = Vec::new();
    let mut params: Vec<String> = Vec::new();

    if let Some(name) = &company.company_name {
        if name.trim().is_empty() {
            return Err("Company name cannot be empty".to_string());
        }
        if name.len() > 255 {
            return Err("Company name must be 255 characters or less".to_string());
        }
        update_fields.push("company_name = ?");
        params.push(name.trim().to_string());
    }

    if let Some(gst_no) = &company.gst_no {
        if gst_no.trim().is_empty() {
            return Err("GST number cannot be empty".to_string());
        }
        if !is_valid_gst_format(gst_no) {
            return Err("GST number must be 15 characters and follow GST format".to_string());
        }
        update_fields.push("gst_no = ?");
        params.push(gst_no.trim().to_string());
    }

    if let Some(state_code) = &company.state_code {
        if state_code.trim().is_empty() {
            return Err("State code cannot be empty".to_string());
        }
        update_fields.push("state_code = ?");
        params.push(state_code.trim().to_string());
    }

    if update_fields.is_empty() {
        return Err("No fields to update".to_string());
    }

    update_fields.push("updated_at = CURRENT_TIMESTAMP");
    params.push(id.to_string());

    let query = format!(
        "UPDATE companies SET {} WHERE id = ?",
        update_fields.join(", ")
    );

    db.execute("sqlite:sales_report.db", &query, &params)
        .await
        .map_err(|e| format!("Failed to update company: {}", e))?;

    // Fetch the updated company
    get_company_by_id(app_handle, id).await
}

#[tauri::command]
async fn delete_company(app_handle: tauri::AppHandle, id: i64) -> Result<(), String> {
    let db = tauri_plugin_sql::Builder::default()
        .add_migrations("sqlite:sales_report.db", get_migrations())
        .build(app_handle)
        .map_err(|e| format!("Database error: {}", e))?;

    db.execute(
        "sqlite:sales_report.db",
        "DELETE FROM companies WHERE id = ?1",
        &[id.to_string()],
    )
    .await
    .map_err(|e| format!("Failed to delete company: {}", e))?;

    Ok(())
}

#[tauri::command]
async fn search_companies(
    app_handle: tauri::AppHandle,
    query: String,
) -> Result<Vec<Company>, String> {
    let db = tauri_plugin_sql::Builder::default()
        .add_migrations("sqlite:sales_report.db", get_migrations())
        .build(app_handle)
        .map_err(|e| format!("Database error: {}", e))?;

    let search_term = format!("%{}%", query.trim());
    let companies: Vec<Company> = db
        .select(
            "sqlite:sales_report.db",
            "SELECT id, company_name, gst_no, state_code, created_at, updated_at FROM companies WHERE company_name LIKE ?1 OR gst_no LIKE ?1 ORDER BY created_at DESC",
            &[search_term],
        )
        .await
        .map_err(|e| format!("Failed to search companies: {}", e))?;

    Ok(companies)
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
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:sales_report.db", get_migrations())
                .build(),
        )
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
