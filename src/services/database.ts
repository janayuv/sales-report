import { invoke } from '@tauri-apps/api/core';
import { Company, CreateCompany, UpdateCompany } from '@/types/company';

class DatabaseService {
  private dbPath = 'sqlite:sales_report.db';

  async initialize() {
    // Initialize database and create tables
    await this.createTables();
  }

  private async createTables() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_name TEXT NOT NULL,
        gst_no TEXT NOT NULL UNIQUE,
        state_code TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await invoke('plugin:sql|execute', {
      db: this.dbPath,
      query: createTableSQL,
      values: []
    });
  }

  async createCompany(companyData: CreateCompany): Promise<Company> {
    await this.initialize();
    
    const insertSQL = `
      INSERT INTO companies (company_name, gst_no, state_code) 
      VALUES ($1, $2, $3)
    `;
    
    const result = await invoke('plugin:sql|execute', {
      db: this.dbPath,
      query: insertSQL,
      values: [
        companyData.company_name.trim(),
        companyData.gst_no.trim(),
        companyData.state_code.trim()
      ]
    });
    
    const companyId = result.lastInsertId;
    
    // Fetch the created company
    const selectSQL = `
      SELECT id, company_name, gst_no, state_code, created_at, updated_at 
      FROM companies 
      WHERE id = $1
    `;
    
    const companies = await invoke('plugin:sql|select', {
      db: this.dbPath,
      query: selectSQL,
      values: [companyId]
    });
    
    return companies[0];
  }

  async getCompanies(): Promise<Company[]> {
    await this.initialize();
    
    const selectSQL = `
      SELECT id, company_name, gst_no, state_code, created_at, updated_at 
      FROM companies 
      ORDER BY created_at DESC
    `;
    
    return await invoke('plugin:sql|select', {
      db: this.dbPath,
      query: selectSQL,
      values: []
    });
  }

  async getCompanyById(id: number): Promise<Company | null> {
    await this.initialize();
    
    const selectSQL = `
      SELECT id, company_name, gst_no, state_code, created_at, updated_at 
      FROM companies 
      WHERE id = $1
    `;
    
    const companies = await invoke('plugin:sql|select', {
      db: this.dbPath,
      query: selectSQL,
      values: [id]
    });
    
    return companies[0] || null;
  }

  async updateCompany(id: number, companyData: UpdateCompany): Promise<Company> {
    await this.initialize();
    
    // Build dynamic update query
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (companyData.company_name !== undefined) {
      updateFields.push(`company_name = $${paramIndex}`);
      params.push(companyData.company_name.trim());
      paramIndex++;
    }

    if (companyData.gst_no !== undefined) {
      updateFields.push(`gst_no = $${paramIndex}`);
      params.push(companyData.gst_no.trim());
      paramIndex++;
    }

    if (companyData.state_code !== undefined) {
      updateFields.push(`state_code = $${paramIndex}`);
      params.push(companyData.state_code.trim());
      paramIndex++;
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const updateSQL = `
      UPDATE companies 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex}
    `;
    
    await invoke('plugin:sql|execute', {
      db: this.dbPath,
      query: updateSQL,
      values: params
    });
    
    // Fetch the updated company
    const updatedCompany = await this.getCompanyById(id);
    if (!updatedCompany) {
      throw new Error('Company not found after update');
    }
    
    return updatedCompany;
  }

  // Selected Company persistence methods
  async setSelectedCompany(companyId: number): Promise<void> {
    await this.initialize();
    
    // Create or update selected company in a simple key-value table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await invoke('plugin:sql|execute', {
      db: this.dbPath,
      query: createTableSQL,
      values: []
    });
    
    const upsertSQL = `
      INSERT INTO app_settings (key, value) 
      VALUES ('selected_company_id', $1)
      ON CONFLICT(key) DO UPDATE SET 
        value = $1,
        updated_at = CURRENT_TIMESTAMP
    `;
    
    await invoke('plugin:sql|execute', {
      db: this.dbPath,
      query: upsertSQL,
      values: [companyId.toString()]
    });
  }

  async getSelectedCompany(): Promise<Company | null> {
    await this.initialize();
    
    const selectSQL = `
      SELECT value FROM app_settings 
      WHERE key = 'selected_company_id'
    `;
    
    const result = await invoke('plugin:sql|select', {
      db: this.dbPath,
      query: selectSQL,
      values: []
    });
    
    if (result.length === 0) {
      return null;
    }
    
    const companyId = parseInt(result[0].value);
    return await this.getCompanyById(companyId);
  }

  async clearSelectedCompany(): Promise<void> {
    await this.initialize();
    
    const deleteSQL = 'DELETE FROM app_settings WHERE key = ?';
    await invoke('plugin:sql|execute', {
      db: this.dbPath,
      query: deleteSQL,
      values: ['selected_company_id']
    });
  }

  async searchCompanies(query: string): Promise<Company[]> {
    await this.initialize();
    
    const searchTerm = `%${query.trim()}%`;
    const selectSQL = `
      SELECT id, company_name, gst_no, state_code, created_at, updated_at 
      FROM companies 
      WHERE company_name LIKE $1 OR gst_no LIKE $1 OR state_code LIKE $1
      ORDER BY created_at DESC
    `;
    
    return await invoke('plugin:sql|select', {
      db: this.dbPath,
      query: selectSQL,
      values: [searchTerm]
    });
  }

  async checkGstExists(gstNo: string, excludeId?: number): Promise<boolean> {
    await this.initialize();
    
    let selectSQL = 'SELECT COUNT(*) as count FROM companies WHERE gst_no = $1';
    const params: any[] = [gstNo.trim()];
    
    if (excludeId !== undefined) {
      selectSQL += ' AND id != $2';
      params.push(excludeId);
    }
    
    const result = await invoke('plugin:sql|select', {
      db: this.dbPath,
      query: selectSQL,
      values: params
    });
    
    return result[0].count > 0;
  }
}

export const dbService = new DatabaseService();
