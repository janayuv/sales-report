import { invoke } from '@tauri-apps/api/core';
import { Company, CreateCompany, UpdateCompany } from '@/types/company';
import {
  Customer,
  CreateCustomer,
  CreateCustomerFromExcel,
  UpdateCustomer,
  Category,
  CreateCategory,
  UpdateCategory,
} from '@/types/customer';
import { ImportReportRow, CustomerMapping } from '@/types/import-report';

class DatabaseService {
  private dbPath = 'sqlite:sales_report.db';
  private migrationCompleted = false;
  private initializationPromise: Promise<void> | null = null;

  async initialize() {
    // If initialization is already in progress, wait for it
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // If already initialized, return immediately
    if (this.migrationCompleted) {
      return;
    }

    // Start initialization
    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization() {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        // Initialize database and create tables
        await this.createTables();
        this.migrationCompleted = true;
        console.log('Database initialization completed successfully');
        return;
      } catch (error) {
        retryCount++;
        console.error(`Database initialization attempt ${retryCount} failed:`, error);
        
        if (retryCount >= maxRetries) {
          console.error('Database initialization failed after all retries:', {
            error,
            retryCount: maxRetries,
            dbPath: this.dbPath,
            errorStack: error instanceof Error ? error.stack : undefined
          });
          throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Wait before retrying (exponential backoff)
        const waitTime = Math.pow(2, retryCount) * 100; // 200ms, 400ms, 800ms
        console.log(`Retrying database initialization in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  private async createTables() {
    // Enable foreign key constraints
    await invoke('plugin:sql|execute', {
      db: this.dbPath,
      query: 'PRAGMA foreign_keys = ON',
      values: [],
    });

    // Create companies table
    const createCompaniesTableSQL = `
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
      query: createCompaniesTableSQL,
      values: [],
    });

    // Create categories table with company_id
    const createCategoriesTableSQL = `
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        company_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies (id),
        UNIQUE(name, company_id)
      )
    `;

    await invoke('plugin:sql|execute', {
      db: this.dbPath,
      query: createCategoriesTableSQL,
      values: [],
    });

    // Create customers table with company_id
    const createCustomersTableSQL = `
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_customer TEXT NOT NULL,
        tally_customer TEXT NOT NULL,
        gst_no TEXT NOT NULL,
        state_code TEXT NOT NULL,
        category_id INTEGER NOT NULL,
        company_id INTEGER NOT NULL,
        normalized_name TEXT NOT NULL,
        created_from_import_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories (id),
        FOREIGN KEY (company_id) REFERENCES companies (id),
        UNIQUE(tally_customer, company_id),
        UNIQUE(normalized_name, gst_no, company_id)
      )
    `;

    await invoke('plugin:sql|execute', {
      db: this.dbPath,
      query: createCustomersTableSQL,
      values: [],
    });

    // Create import sessions table
    const createImportSessionsTableSQL = `
      CREATE TABLE IF NOT EXISTS import_sessions (
        id TEXT PRIMARY KEY,
        company_id INTEGER NOT NULL,
        file_name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies (id)
      )
    `;

    await invoke('plugin:sql|execute', {
      db: this.dbPath,
      query: createImportSessionsTableSQL,
      values: [],
    });

    // Create import customer mappings table
    const createImportCustomerMappingsTableSQL = `
      CREATE TABLE IF NOT EXISTS import_customer_mappings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        import_session_id TEXT NOT NULL,
        report_customer_id TEXT NOT NULL,
        report_customer_name TEXT NOT NULL,
        mapped_customer_id INTEGER,
        created_customer_id INTEGER,
        status TEXT NOT NULL DEFAULT 'unverified',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (import_session_id) REFERENCES import_sessions (id),
        FOREIGN KEY (mapped_customer_id) REFERENCES customers (id),
        FOREIGN KEY (created_customer_id) REFERENCES customers (id),
        UNIQUE(import_session_id, report_customer_id)
      )
    `;

    await invoke('plugin:sql|execute', {
      db: this.dbPath,
      query: createImportCustomerMappingsTableSQL,
      values: [],
    });

    // Create persistent customer mappings table (remembers mappings across imports)
    const createPersistentCustomerMappingsTableSQL = `
      CREATE TABLE IF NOT EXISTS persistent_customer_mappings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        report_customer_name TEXT NOT NULL,
        normalized_report_customer_name TEXT NOT NULL,
        mapped_customer_id INTEGER NOT NULL,
        mapping_type TEXT NOT NULL DEFAULT 'user_mapped',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies (id),
        FOREIGN KEY (mapped_customer_id) REFERENCES customers (id),
        UNIQUE(company_id, normalized_report_customer_name)
      )
    `;

    await invoke('plugin:sql|execute', {
      db: this.dbPath,
      query: createPersistentCustomerMappingsTableSQL,
      values: [],
    });

    // Handle schema migrations for existing data
    await this.migrateExistingData();
  }

  private async migrateExistingData() {
    if (this.migrationCompleted) return;

    console.log('Checking if migration is needed...');

    // Check if we need to migrate existing data
    try {
      // Check if customers table exists and has normalized_name column
      const checkCustomersTableSQL = `
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='customers'
      `;
      const customersTableResult = await invoke('plugin:sql|select', {
        db: this.dbPath,
        query: checkCustomersTableSQL,
        values: [],
      });

      console.log('Customers table exists:', (customersTableResult as any[]).length > 0);

      if ((customersTableResult as any[]).length > 0) {
        // Check if customers table has normalized_name column
        const checkCustomersColumnSQL = `
          SELECT COUNT(*) as count 
          FROM pragma_table_info('customers') 
          WHERE name = 'normalized_name'
        `;
        const customersColumnResult = await invoke('plugin:sql|select', {
          db: this.dbPath,
          query: checkCustomersColumnSQL,
          values: [],
        });

        const hasNormalizedNameColumn = (customersColumnResult as any[])[0].count > 0;
        console.log('Customers table has normalized_name column:', hasNormalizedNameColumn);

        if (!hasNormalizedNameColumn) {
          // Need to migrate existing data
          console.log('Starting migration for customers table...');
          await this.performMigration();
        } else {
          console.log('Customers table migration not needed - schema is up to date');
        }
      } else {
        console.log('No customers table found - fresh install');
      }
      
      this.migrationCompleted = true;
    } catch (error) {
      console.error('Migration check failed:', error);
      this.migrationCompleted = true;
    }
  }

  private async performMigration() {
    console.log('Performing database migration...');

    try {
      // Get all existing companies
      const companiesResult = await invoke('plugin:sql|select', {
        db: this.dbPath,
        query: 'SELECT id FROM companies',
        values: [],
      });
      const companies = companiesResult as any[];

      if (companies.length === 0) {
        console.log('No companies found, skipping migration');
        return;
      }

      // Try to add missing columns to existing customers table
      try {
        console.log('Adding normalized_name column to customers table...');
        await invoke('plugin:sql|execute', {
          db: this.dbPath,
          query: 'ALTER TABLE customers ADD COLUMN normalized_name TEXT',
          values: [],
        });
      } catch (error) {
        console.log('normalized_name column might already exist:', error);
      }

      try {
        console.log('Adding created_from_import_id column to customers table...');
        await invoke('plugin:sql|execute', {
          db: this.dbPath,
          query: 'ALTER TABLE customers ADD COLUMN created_from_import_id TEXT',
          values: [],
        });
      } catch (error) {
        console.log('created_from_import_id column might already exist:', error);
      }

      // Update existing customers with normalized names
      console.log('Updating existing customers with normalized names...');
      const existingCustomers = await invoke('plugin:sql|select', {
        db: this.dbPath,
        query: 'SELECT id, report_customer FROM customers WHERE normalized_name IS NULL OR normalized_name = ""',
        values: [],
      }) as any[];

      for (const customer of existingCustomers) {
        const normalizedName = this.normalizeCustomerName(customer.report_customer);
        await invoke('plugin:sql|execute', {
          db: this.dbPath,
          query: 'UPDATE customers SET normalized_name = $1 WHERE id = $2',
          values: [normalizedName, customer.id],
        });
      }

      console.log(`Updated ${existingCustomers.length} customers with normalized names`);

      // Create default categories for all companies
      for (const company of companies) {
        await this.seedInitialCategoriesForCompany(company.id);
      }

      console.log('Migration completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  private async seedInitialCategoriesForCompany(companyId: number) {
    const initialCategories = ['Raw material', 'Scrap', 'Regular'];

    for (const categoryName of initialCategories) {
      const checkSQL =
        'SELECT COUNT(*) as count FROM categories WHERE name = $1 AND company_id = $2';
      const result = await invoke('plugin:sql|select', {
        db: this.dbPath,
        query: checkSQL,
        values: [categoryName, companyId],
      });

      if ((result as any[])[0].count === 0) {
        const insertSQL =
          'INSERT INTO categories (name, company_id) VALUES ($1, $2)';
        await invoke('plugin:sql|execute', {
          db: this.dbPath,
          query: insertSQL,
          values: [categoryName, companyId],
        });
      }
    }
  }

  /**
   * Normalize customer name for matching
   * - Trim whitespace
   * - Convert to lowercase
   * - Remove punctuation
   * - Remove common business suffixes
   */
  // Debug method to reset migration flag (for testing)
  resetMigrationFlag() {
    this.migrationCompleted = false;
    this.initializationPromise = null;
    console.log('Migration flag reset - next initialization will trigger migration check');
  }

  // Method to handle database lock errors with retry logic
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    operationName: string = 'database operation'
  ): Promise<T> {
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        return await operation();
      } catch (error) {
        retryCount++;
        
        // Check if it's a database lock error
        if (error instanceof Error && error.message.includes('database is locked')) {
          if (retryCount >= maxRetries) {
            console.error(`${operationName} failed after ${maxRetries} retries due to database lock`);
            throw error;
          }
          
          // Wait before retrying (exponential backoff)
          const waitTime = Math.pow(2, retryCount) * 50; // 100ms, 200ms, 400ms
          console.log(`${operationName} failed due to database lock, retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        // For non-lock errors, throw immediately
        throw error;
      }
    }
    
    throw new Error(`${operationName} failed after ${maxRetries} retries`);
  }

  // Database health check method
  async healthCheck(): Promise<boolean> {
    try {
      await this.executeWithRetry(async () => {
        await invoke('plugin:sql|select', {
          db: this.dbPath,
          query: 'SELECT 1 as test',
          values: [],
        });
      }, 2, 'healthCheck');
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  // Method to force database unlock (emergency use)
  async forceUnlock(): Promise<void> {
    try {
      console.log('Attempting to force database unlock...');
      this.migrationCompleted = false;
      this.initializationPromise = null;
      
      // Try a simple operation to test if database is accessible
      await this.executeWithRetry(async () => {
        await invoke('plugin:sql|select', {
          db: this.dbPath,
          query: 'SELECT 1 as test',
          values: [],
        });
      }, 1, 'forceUnlock');
      
      console.log('Database unlock successful');
    } catch (error) {
      console.error('Failed to unlock database:', error);
      throw error;
    }
  }

  // Persistent Customer Mapping methods
  async savePersistentCustomerMapping(
    companyId: number,
    reportCustomerName: string,
    mappedCustomerId: number,
    mappingType: 'user_mapped' | 'auto_created' = 'user_mapped'
  ): Promise<void> {
    await this.initialize();

    const normalizedName = this.normalizeCustomerName(reportCustomerName);
    
    const insertSQL = `
      INSERT OR REPLACE INTO persistent_customer_mappings 
      (company_id, report_customer_name, normalized_report_customer_name, mapped_customer_id, mapping_type, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
    `;

    await invoke('plugin:sql|execute', {
      db: this.dbPath,
      query: insertSQL,
      values: [companyId, reportCustomerName, normalizedName, mappedCustomerId, mappingType],
    });

    console.log(`Saved persistent mapping: "${reportCustomerName}" -> Customer ID ${mappedCustomerId}`);
  }

  async getPersistentCustomerMapping(
    companyId: number,
    reportCustomerName: string
  ): Promise<number | null> {
    await this.initialize();

    const normalizedName = this.normalizeCustomerName(reportCustomerName);
    
    const selectSQL = `
      SELECT mapped_customer_id FROM persistent_customer_mappings 
      WHERE company_id = $1 AND normalized_report_customer_name = $2
    `;

    const result = await invoke('plugin:sql|select', {
      db: this.dbPath,
      query: selectSQL,
      values: [companyId, normalizedName],
    });

    if ((result as any[]).length > 0) {
      const customerId = (result as any[])[0].mapped_customer_id;
      console.log(`Found persistent mapping: "${reportCustomerName}" -> Customer ID ${customerId}`);
      return customerId;
    }

    return null;
  }

  async getAllPersistentCustomerMappings(companyId: number): Promise<Array<{
    id: number;
    reportCustomerName: string;
    normalizedReportCustomerName: string;
    mappedCustomerId: number;
    mappingType: string;
    createdAt: string;
    updatedAt: string;
  }>> {
    await this.initialize();

    const selectSQL = `
      SELECT id, report_customer_name, normalized_report_customer_name, 
             mapped_customer_id, mapping_type, created_at, updated_at
      FROM persistent_customer_mappings 
      WHERE company_id = $1
      ORDER BY updated_at DESC
    `;

    const result = await invoke('plugin:sql|select', {
      db: this.dbPath,
      query: selectSQL,
      values: [companyId],
    });

    return result as any[];
  }

  async deletePersistentCustomerMapping(
    companyId: number,
    reportCustomerName: string
  ): Promise<void> {
    await this.initialize();

    const normalizedName = this.normalizeCustomerName(reportCustomerName);
    
    const deleteSQL = `
      DELETE FROM persistent_customer_mappings 
      WHERE company_id = $1 AND normalized_report_customer_name = $2
    `;

    await invoke('plugin:sql|execute', {
      db: this.dbPath,
      query: deleteSQL,
      values: [companyId, normalizedName],
    });

    console.log(`Deleted persistent mapping for: "${reportCustomerName}"`);
  }

  // Report Generation methods
  async getImportedReportData(companyId: number): Promise<any[]> {
    await this.initialize();

    return this.executeWithRetry(async () => {
      const selectSQL = `
        SELECT ir.*, c.tally_customer, cat.name as category_name
        FROM import_reports ir
        LEFT JOIN customers c ON ir.tally_customer_id = c.id
        LEFT JOIN categories cat ON ir.category_id = cat.id
        WHERE ir.company_id = $1
        ORDER BY ir.created_at DESC
      `;

      const result = await invoke('plugin:sql|select', {
        db: this.dbPath,
        query: selectSQL,
        values: [companyId],
      });

      return result as any[];
    }, 3, 'getImportedReportData');
  }

  private normalizeCustomerName(name: string): string {
    if (!name) return '';
    
    let normalized = name.trim().toLowerCase();
    
    // Remove punctuation
    normalized = normalized.replace(/[^\w\s]/g, '');
    
    // Remove common business suffixes
    const suffixes = [
      'pvt ltd', 'private limited', 'ltd', 'limited', 'llp', 'llc',
      'inc', 'incorporated', 'corp', 'corporation', 'co', 'company',
      'pvt', 'private', 'ltd co', 'limited company'
    ];
    
    for (const suffix of suffixes) {
      const regex = new RegExp(`\\s+${suffix}\\s*$`, 'i');
      normalized = normalized.replace(regex, '');
    }
    
    // Collapse multiple spaces
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    return normalized;
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
        companyData.state_code.trim(),
      ],
    });

    const companyId = (result as any).lastInsertId;

    // Seed initial categories for this company
    await this.seedInitialCategoriesForCompany(companyId);

    // Fetch the created company
    const selectSQL = `
      SELECT id, company_name, gst_no, state_code, created_at, updated_at 
      FROM companies 
      WHERE id = $1
    `;

    const companies = await invoke('plugin:sql|select', {
      db: this.dbPath,
      query: selectSQL,
      values: [companyId],
    });

    return (companies as Company[])[0];
  }

  async getCompanies(): Promise<Company[]> {
    await this.initialize();

    return this.executeWithRetry(async () => {
      const selectSQL = `
        SELECT id, company_name, gst_no, state_code, created_at, updated_at 
        FROM companies 
        ORDER BY created_at DESC
      `;

      const result = await invoke('plugin:sql|select', {
        db: this.dbPath,
        query: selectSQL,
        values: [],
      });

      return (result as Company[]) || [];
    }, 3, 'getCompanies');
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
      values: [id],
    });

    return (companies as Company[])[0] || null;
  }

  async updateCompany(
    id: number,
    companyData: UpdateCompany
  ): Promise<Company> {
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
      values: params,
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
      values: [],
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
      values: [companyId.toString()],
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
      values: [],
    });

    if ((result as any[]).length === 0) {
      return null;
    }

    const companyId = parseInt((result as any[])[0].value);
    return await this.getCompanyById(companyId);
  }

  async clearSelectedCompany(): Promise<void> {
    await this.initialize();

    const deleteSQL = 'DELETE FROM app_settings WHERE key = ?';
    await invoke('plugin:sql|execute', {
      db: this.dbPath,
      query: deleteSQL,
      values: ['selected_company_id'],
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
      values: [searchTerm],
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
      values: params,
    });

    return (result as any[])[0].count > 0;
  }

  // Category methods
  async createCategory(categoryData: CreateCategory): Promise<Category> {
    await this.initialize();

    const insertSQL =
      'INSERT INTO categories (name, company_id) VALUES ($1, $2)';

    const result = await invoke('plugin:sql|execute', {
      db: this.dbPath,
      query: insertSQL,
      values: [categoryData.name.trim(), categoryData.company_id],
    });

    const categoryId = (result as any).lastInsertId;

    const selectSQL =
      'SELECT id, name, company_id, created_at, updated_at FROM categories WHERE id = $1';
    const categories = await invoke('plugin:sql|select', {
      db: this.dbPath,
      query: selectSQL,
      values: [categoryId],
    });

    return (categories as Category[])[0];
  }

  async getCategories(companyId: number): Promise<Category[]> {
    await this.initialize();

    const selectSQL =
      'SELECT id, name, company_id, created_at, updated_at FROM categories WHERE company_id = $1 ORDER BY name ASC';

    return await invoke('plugin:sql|select', {
      db: this.dbPath,
      query: selectSQL,
      values: [companyId],
    });
  }

  async getCategoryById(
    id: number,
    companyId: number
  ): Promise<Category | null> {
    await this.initialize();

    const selectSQL =
      'SELECT id, name, company_id, created_at, updated_at FROM categories WHERE id = $1 AND company_id = $2';
    const categories = await invoke('plugin:sql|select', {
      db: this.dbPath,
      query: selectSQL,
      values: [id, companyId],
    });

    return (categories as Category[])[0] || null;
  }

  async updateCategory(
    id: number,
    categoryData: UpdateCategory,
    companyId: number
  ): Promise<Category> {
    await this.initialize();

    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (categoryData.name !== undefined) {
      updateFields.push(`name = $${paramIndex}`);
      params.push(categoryData.name.trim());
      paramIndex++;
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id, companyId);

    const updateSQL = `UPDATE categories SET ${updateFields.join(', ')} WHERE id = $${paramIndex} AND company_id = $${paramIndex + 1}`;

    await invoke('plugin:sql|execute', {
      db: this.dbPath,
      query: updateSQL,
      values: params,
    });

    const updatedCategory = await this.getCategoryById(id, companyId);
    if (!updatedCategory) {
      throw new Error('Category not found after update');
    }

    return updatedCategory;
  }

  async checkCategoryNameExists(
    name: string,
    companyId: number,
    excludeId?: number
  ): Promise<boolean> {
    await this.initialize();

    let selectSQL =
      'SELECT COUNT(*) as count FROM categories WHERE name = $1 AND company_id = $2';
    const params: any[] = [name.trim(), companyId];

    if (excludeId !== undefined) {
      selectSQL += ' AND id != $3';
      params.push(excludeId);
    }

    const result = await invoke('plugin:sql|select', {
      db: this.dbPath,
      query: selectSQL,
      values: params,
    });

    return (result as any[])[0].count > 0;
  }

  // Customer methods
  async createCustomer(customerData: CreateCustomer, importId?: string): Promise<Customer> {
    try {
      await this.initialize();

      const normalizedName = this.normalizeCustomerName(customerData.report_customer);
      const insertSQL = `
        INSERT INTO customers (report_customer, tally_customer, gst_no, state_code, category_id, company_id, normalized_name, created_from_import_id) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;

      console.log('Creating customer:', customerData.report_customer, 'for company:', customerData.company_id);

      const result = await invoke('plugin:sql|execute', {
        db: this.dbPath,
        query: insertSQL,
        values: [
          customerData.report_customer.trim(),
          customerData.tally_customer.trim(),
          customerData.gst_no?.trim() || '',
          customerData.state_code?.trim() || '',
          customerData.category_id,
          customerData.company_id,
          normalizedName,
          importId || null,
        ],
      });

      console.log('Insert result:', result);

      // The Tauri SQL plugin returns [rowsAffected, lastInsertId]
      let customerId = (result as any[])[1] || (result as any).lastInsertId || (result as any).last_insert_rowid || (result as any).insertId;
      
      // If still undefined, try to get the ID by querying the last inserted row
      if (!customerId) {
        console.log('lastInsertId is undefined, querying for last inserted customer');
        const lastCustomerQuery = `
          SELECT id FROM customers 
          WHERE company_id = $1 AND report_customer = $2 AND tally_customer = $3
          ORDER BY id DESC LIMIT 1
        `;
        const lastCustomer = await invoke('plugin:sql|select', {
          db: this.dbPath,
          query: lastCustomerQuery,
          values: [
            customerData.company_id,
            customerData.report_customer.trim(),
            customerData.tally_customer.trim()
          ],
        });
        
        if ((lastCustomer as any[]).length > 0) {
          customerId = (lastCustomer as any[])[0].id;
        }
      }

      console.log('Created customer with ID:', customerId);

      if (!customerId) {
        throw new Error('Failed to get customer ID after creation');
      }

      const customer = await this.getCustomerById(
        customerId,
        customerData.company_id
      );
      if (!customer) {
        throw new Error('Customer not found after creation');
      }

      return customer;
    } catch (error) {
      console.error('Error in createCustomer:', error);
      
      // Handle specific database errors
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        if (error.message.includes('normalized_name, gst_no, company_id')) {
          throw new Error(`Customer with this name and GST number already exists for this company`);
        } else if (error.message.includes('tally_customer, company_id')) {
          throw new Error(`Tally customer name must be unique for this company`);
        }
      }
      
      throw new Error(`Failed to create customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCustomers(companyId: number): Promise<Customer[]> {
    try {
      await this.initialize();

      // First check if customers table exists and has the right schema
      const checkTableSQL = `
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='customers'
      `;
      const tableResult = await invoke('plugin:sql|select', {
        db: this.dbPath,
        query: checkTableSQL,
        values: [],
      });

      if ((tableResult as any[]).length === 0) {
        console.log('Customers table does not exist, returning empty array');
        return [];
      }

      // Check if the table has the normalized_name column
      const checkColumnSQL = `
        SELECT COUNT(*) as count 
        FROM pragma_table_info('customers') 
        WHERE name = 'normalized_name'
      `;
      const columnResult = await invoke('plugin:sql|select', {
        db: this.dbPath,
        query: checkColumnSQL,
        values: [],
      });

      if ((columnResult as any[])[0].count === 0) {
        console.log('Customers table missing normalized_name column, triggering migration');
        // Force migration by resetting the flag
        this.migrationCompleted = false;
        await this.migrateExistingData();
        // Re-check after migration
        const recheckResult = await invoke('plugin:sql|select', {
          db: this.dbPath,
          query: checkColumnSQL,
          values: [],
        });
        if ((recheckResult as any[])[0].count === 0) {
          console.error('Migration failed - normalized_name column still missing');
          throw new Error('Database migration failed');
        }
      }

      const customers = await this.executeWithRetry(async () => {
        const selectSQL = `
          SELECT c.id, c.report_customer, c.tally_customer, c.gst_no, c.state_code, c.category_id, c.company_id,
                 c.normalized_name, c.created_from_import_id, c.created_at, c.updated_at,
                 cat.id as cat_id, cat.name as cat_name, cat.company_id as cat_company_id, cat.created_at as cat_created_at, cat.updated_at as cat_updated_at
          FROM customers c
          LEFT JOIN categories cat ON c.category_id = cat.id AND cat.company_id = c.company_id
          WHERE c.company_id = $1
          ORDER BY c.created_at DESC
        `;

        return await invoke('plugin:sql|select', {
          db: this.dbPath,
          query: selectSQL,
          values: [companyId],
        });
      }, 3, 'getCustomers');

      console.log(`Found ${(customers as any[]).length} customers for company ${companyId}`);

      return (customers as any[]).map(row => ({
        id: row.id,
        report_customer: row.report_customer,
        tally_customer: row.tally_customer,
        gst_no: row.gst_no,
        state_code: row.state_code,
        category_id: row.category_id,
        company_id: row.company_id,
        normalized_name: row.normalized_name,
        created_from_import_id: row.created_from_import_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        category: row.cat_id
          ? {
              id: row.cat_id,
              name: row.cat_name,
              company_id: row.cat_company_id,
              created_at: row.cat_created_at,
              updated_at: row.cat_updated_at,
            }
          : undefined,
      }));
    } catch (error) {
      console.error('Error in getCustomers:', error);
      throw new Error(`Failed to load customers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCustomerById(
    id: number,
    companyId: number
  ): Promise<Customer | null> {
    await this.initialize();

    const selectSQL = `
      SELECT c.id, c.report_customer, c.tally_customer, c.gst_no, c.state_code, c.category_id, c.company_id,
             c.created_at, c.updated_at,
             cat.id as cat_id, cat.name as cat_name, cat.company_id as cat_company_id, cat.created_at as cat_created_at, cat.updated_at as cat_updated_at
      FROM customers c
      LEFT JOIN categories cat ON c.category_id = cat.id AND cat.company_id = c.company_id
      WHERE c.id = $1 AND c.company_id = $2
    `;

    const customers = await invoke('plugin:sql|select', {
      db: this.dbPath,
      query: selectSQL,
      values: [id, companyId],
    });

    if ((customers as any[]).length === 0) {
      return null;
    }

    const row = (customers as any[])[0];
    return {
      id: row.id,
      report_customer: row.report_customer,
      tally_customer: row.tally_customer,
      gst_no: row.gst_no,
      state_code: row.state_code,
      category_id: row.category_id,
      company_id: row.company_id,
      normalized_name: row.normalized_name,
      created_from_import_id: row.created_from_import_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      category: row.cat_id
        ? {
            id: row.cat_id,
            name: row.cat_name,
            company_id: row.cat_company_id,
            created_at: row.cat_created_at,
            updated_at: row.cat_updated_at,
          }
        : undefined,
    };
  }

  async updateCustomer(
    id: number,
    customerData: UpdateCustomer,
    companyId: number
  ): Promise<Customer> {
    await this.initialize();

    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (customerData.report_customer !== undefined) {
      updateFields.push(`report_customer = $${paramIndex}`);
      params.push(customerData.report_customer.trim());
      paramIndex++;
    }

    if (customerData.tally_customer !== undefined) {
      updateFields.push(`tally_customer = $${paramIndex}`);
      params.push(customerData.tally_customer.trim());
      paramIndex++;
    }

    if (customerData.gst_no !== undefined) {
      updateFields.push(`gst_no = $${paramIndex}`);
      params.push(customerData.gst_no?.trim() || '');
      paramIndex++;
    }

    if (customerData.state_code !== undefined) {
      updateFields.push(`state_code = $${paramIndex}`);
      params.push(customerData.state_code?.trim() || '');
      paramIndex++;
    }

    if (customerData.category_id !== undefined) {
      updateFields.push(`category_id = $${paramIndex}`);
      params.push(customerData.category_id);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id, companyId);

    const updateSQL = `UPDATE customers SET ${updateFields.join(', ')} WHERE id = $${paramIndex} AND company_id = $${paramIndex + 1}`;

    await invoke('plugin:sql|execute', {
      db: this.dbPath,
      query: updateSQL,
      values: params,
    });

    const updatedCustomer = await this.getCustomerById(id, companyId);
    if (!updatedCustomer) {
      throw new Error('Customer not found after update');
    }

    return updatedCustomer;
  }

  async checkTallyCustomerExists(
    tallyCustomer: string,
    companyId: number,
    excludeId?: number
  ): Promise<boolean> {
    await this.initialize();

    let selectSQL =
      'SELECT COUNT(*) as count FROM customers WHERE tally_customer = $1 AND company_id = $2';
    const params: any[] = [tallyCustomer.trim(), companyId];

    if (excludeId !== undefined) {
      selectSQL += ' AND id != $3';
      params.push(excludeId);
    }

    const result = await invoke('plugin:sql|select', {
      db: this.dbPath,
      query: selectSQL,
      values: params,
    });

    return (result as any[])[0].count > 0;
  }

  async searchCustomers(query: string, companyId: number): Promise<Customer[]> {
    await this.initialize();

    const searchTerm = `%${query.trim()}%`;
    const selectSQL = `
      SELECT c.id, c.report_customer, c.tally_customer, c.gst_no, c.state_code, c.category_id, c.company_id,
             c.created_at, c.updated_at,
             cat.id as cat_id, cat.name as cat_name, cat.company_id as cat_company_id, cat.created_at as cat_created_at, cat.updated_at as cat_updated_at
      FROM customers c
      LEFT JOIN categories cat ON c.category_id = cat.id AND cat.company_id = c.company_id
      WHERE c.company_id = $2 AND (c.report_customer LIKE $1 OR c.tally_customer LIKE $1 OR c.gst_no LIKE $1 OR c.state_code LIKE $1 OR cat.name LIKE $1)
      ORDER BY c.created_at DESC
    `;

    const customers = await invoke('plugin:sql|select', {
      db: this.dbPath,
      query: selectSQL,
      values: [searchTerm, companyId],
    });

    return (customers as any[]).map(row => ({
      id: row.id,
      report_customer: row.report_customer,
      tally_customer: row.tally_customer,
      gst_no: row.gst_no,
      state_code: row.state_code,
      category_id: row.category_id,
      company_id: row.company_id,
      normalized_name: row.normalized_name,
      created_from_import_id: row.created_from_import_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      category: row.cat_id
        ? {
            id: row.cat_id,
            name: row.cat_name,
            company_id: row.cat_company_id,
            created_at: row.cat_created_at,
            updated_at: row.cat_updated_at,
          }
        : undefined,
    }));
  }

  // Import Report methods
  async importReportData(
    reportData: ImportReportRow[],
    customerMappings: CustomerMapping[],
    companyId: number
  ): Promise<{ success: boolean; importedRows: number; errors: string[] }> {
    await this.initialize();

    const errors: string[] = [];
    let importedRows = 0;

    try {
      // Create import batch table for this import session
      const createImportTableSQL = `
        CREATE TABLE IF NOT EXISTS import_reports (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          company_id INTEGER NOT NULL,
          invoice_no TEXT NOT NULL,
          cust_cde TEXT NOT NULL,
          cust_name TEXT NOT NULL,
          IO_DATE TEXT,
          Invno TEXT,
          prod_cde TEXT,
          prod_cust_no TEXT,
          prod_name_ko TEXT,
          tariff_code TEXT,
          io_qty REAL,
          rate_pre_unit REAL,
          Amortisation_cost REAL,
          supp_mat_cost REAL,
          ASSESSABLE_VALUE REAL,
          supplier_mat_value REAL,
          Amort_Value REAL,
          ED_Value REAL,
          ADDL_DUTY REAL,
          EDU_CESS REAL,
          SH_EDT_CESS REAL,
          Total REAL,
          VAT_CST REAL,
          invoice_Total REAL,
          Grand_total REAL,
          total_basic_value REAL,
          total_ed_value REAL,
          Total_VAT REAL,
          Total_Inv_Value REAL,
          ST_VAT REAL,
          CGST_RATE REAL,
          CGST_AMT REAL,
          SGST_RATE REAL,
          SGST_AMT REAL,
          IGST_RATE REAL,
          IGST_AMT REAL,
          TCS_amt REAL,
          CGST_TOTAL REAL,
          SGST_TOTAL REAL,
          IGST_TOTAL REAL,
          Total_Amorization REAL,
          Total_TCS REAL,
          tally_customer_id INTEGER,
          category_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (company_id) REFERENCES companies (id),
          FOREIGN KEY (tally_customer_id) REFERENCES customers (id),
          FOREIGN KEY (category_id) REFERENCES categories (id)
        )
      `;

      await invoke('plugin:sql|execute', {
        db: this.dbPath,
        query: createImportTableSQL,
        values: [],
      });

      // Process each row
      for (const row of reportData) {
        try {
          // Find the customer mapping for this row
          const mapping = customerMappings.find(
            m =>
              m.reportCustomerName.toLowerCase().trim() ===
              row.cust_name.toLowerCase().trim()
          );

          if (!mapping) {
            errors.push(`No mapping found for customer: ${row.cust_name}`);
            continue;
          }

          if (!mapping.tallyCustomerId || mapping.tallyCustomerId === 0) {
            errors.push(`Invalid customer ID for customer: ${row.cust_name}`);
            continue;
          }

          if (!mapping.categoryId || mapping.categoryId === 0) {
            errors.push(`Invalid category ID for customer: ${row.cust_name}`);
            continue;
          }

          // Insert the report data
          const insertSQL = `
            INSERT INTO import_reports (
              company_id, invoice_no, cust_cde, cust_name, IO_DATE, Invno,
              prod_cde, prod_cust_no, prod_name_ko, tariff_code, io_qty,
              rate_pre_unit, Amortisation_cost, supp_mat_cost, ASSESSABLE_VALUE,
              supplier_mat_value, Amort_Value, ED_Value, ADDL_DUTY, EDU_CESS,
              SH_EDT_CESS, Total, VAT_CST, invoice_Total, Grand_total,
              total_basic_value, total_ed_value, Total_VAT, Total_Inv_Value,
              ST_VAT, CGST_RATE, CGST_AMT, SGST_RATE, SGST_AMT, IGST_RATE,
              IGST_AMT, TCS_amt, CGST_TOTAL, SGST_TOTAL, IGST_TOTAL,
              Total_Amorization, Total_TCS, tally_customer_id, category_id
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
              $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
              $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41,
              $42, $43, $44
            )
          `;

          await invoke('plugin:sql|execute', {
            db: this.dbPath,
            query: insertSQL,
            values: [
              companyId,
              row.invoice_no,
              row.cust_cde,
              row.cust_name,
              row.IO_DATE,
              row.Invno,
              row.prod_cde,
              row.prod_cust_no,
              row.prod_name_ko,
              row.tariff_code,
              row.io_qty,
              row.rate_pre_unit,
              row.Amortisation_cost,
              row.supp_mat_cost,
              row.ASSESSABLE_VALUE,
              row['Supplier MAt Value'],
              row.Amort_Value,
              row.ED_Value,
              row.ADDL_DUTY,
              row.EDU_CESS,
              row.SH_EDT_CESS,
              row.Total,
              row.VAT_CST,
              row.invoice_Total,
              row.Grand_total,
              row['Total Basic Value'],
              row['Total ED Value'],
              row.Total_VAT,
              row.Total_Inv_Value,
              row.ST_VAT,
              row.CGST_RATE,
              row.CGST_AMT,
              row.SGST_RATE,
              row.SGST_AMT,
              row.IGST_RATE,
              row.IGST_AMT,
              row.TCS_amt,
              row.CGST_TOTAL,
              row.SGST_TOTAL,
              row.IGST_TOTAL,
              row.Total_Amorization,
              row.Total_TCS,
              mapping.tallyCustomerId,
              mapping.categoryId,
            ],
          });

          console.log(`Successfully imported row for customer ${row.cust_name}, invoice ${row.invoice_no}`);

          importedRows++;
        } catch (rowError) {
          console.error(`Error importing row for customer ${row.cust_name}:`, rowError);
          const errorMessage = rowError instanceof Error ? rowError.message : 'Unknown error';
          errors.push(
            `Failed to import row for customer ${row.cust_name}: ${errorMessage}`
          );
        }
      }

      return {
        success: errors.length === 0,
        importedRows,
        errors,
      };
    } catch (error) {
      console.error('Import report data failed:', {
        error,
        companyId,
        rowCount: reportData.length,
        mappingCount: customerMappings.length,
        errorStack: error instanceof Error ? error.stack : undefined
      })
      
      return {
        success: false,
        importedRows: 0,
        errors: [
          `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      };
    }
  }

  async getImportReports(companyId: number): Promise<any[]> {
    await this.initialize();

    const selectSQL = `
      SELECT ir.*, c.tally_customer, cat.name as category_name
      FROM import_reports ir
      LEFT JOIN customers c ON ir.tally_customer_id = c.id
      LEFT JOIN categories cat ON ir.category_id = cat.id
      WHERE ir.company_id = $1
      ORDER BY ir.created_at DESC
    `;

    return await invoke('plugin:sql|select', {
      db: this.dbPath,
      query: selectSQL,
      values: [companyId],
    });
  }

  // Import Session methods
  async createImportSession(
    sessionId: string,
    companyId: number,
    fileName: string
  ): Promise<void> {
    await this.initialize();

    // First verify that the company exists
    const companyCheckSQL = `SELECT id, company_name FROM companies WHERE id = $1`;
    const companyResult = await invoke('plugin:sql|select', {
      db: this.dbPath,
      query: companyCheckSQL,
      values: [companyId],
    }) as any[];

    if (companyResult.length === 0) {
      throw new Error(`Company with ID ${companyId} does not exist in companies table`);
    }

    console.log('Creating import session for company:', companyResult[0].company_name, '(ID:', companyId, ')');
    
    // Check if we need to ensure foreign key constraints are enabled
    const fkCheckResult = await invoke('plugin:sql|select', {
      db: this.dbPath,
      query: 'PRAGMA foreign_keys',
      values: [],
    }) as any[];
    
    console.log('Foreign key constraints status:', fkCheckResult);

    const insertSQL = `
      INSERT INTO import_sessions (id, company_id, file_name, status) 
      VALUES ($1, $2, $3, 'pending')
    `;

    await invoke('plugin:sql|execute', {
      db: this.dbPath,
      query: insertSQL,
      values: [sessionId, companyId, fileName],
    });
  }

  async updateImportSessionStatus(
    sessionId: string,
    status: 'pending' | 'verified' | 'importing' | 'completed' | 'failed'
  ): Promise<void> {
    await this.initialize();

    const updateSQL = `
      UPDATE import_sessions 
      SET status = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
    `;

    await invoke('plugin:sql|execute', {
      db: this.dbPath,
      query: updateSQL,
      values: [status, sessionId],
    });
  }

  async createImportCustomerMappings(
    sessionId: string,
    reportCustomers: Array<{
      reportCustomerId: string;
      reportCustomerName: string;
    }>
  ): Promise<void> {
    await this.initialize();

    for (const rc of reportCustomers) {
      const insertSQL = `
        INSERT INTO import_customer_mappings (import_session_id, report_customer_id, report_customer_name, status) 
        VALUES ($1, $2, $3, 'unverified')
      `;

      await invoke('plugin:sql|execute', {
        db: this.dbPath,
        query: insertSQL,
        values: [sessionId, rc.reportCustomerId, rc.reportCustomerName],
      });
    }
  }

  async updateCustomerMapping(
    sessionId: string,
    reportCustomerId: string,
    mappedCustomerId?: number,
    createdCustomerId?: number,
    status: 'verified' | 'error' = 'verified'
  ): Promise<void> {
    await this.initialize();

    const updateSQL = `
      UPDATE import_customer_mappings 
      SET mapped_customer_id = $1, created_customer_id = $2, status = $3, updated_at = CURRENT_TIMESTAMP 
      WHERE import_session_id = $4 AND report_customer_id = $5
    `;

    await invoke('plugin:sql|execute', {
      db: this.dbPath,
      query: updateSQL,
      values: [mappedCustomerId, createdCustomerId, status, sessionId, reportCustomerId],
    });
  }

  async getImportCustomerMappings(sessionId: string): Promise<any[]> {
    await this.initialize();

    const selectSQL = `
      SELECT * FROM import_customer_mappings 
      WHERE import_session_id = $1 
      ORDER BY created_at ASC
    `;

    return await invoke('plugin:sql|select', {
      db: this.dbPath,
      query: selectSQL,
      values: [sessionId],
    });
  }

  async isImportSessionVerified(sessionId: string): Promise<boolean> {
    await this.initialize();

    const selectSQL = `
      SELECT COUNT(*) as unverified_count 
      FROM import_customer_mappings 
      WHERE import_session_id = $1 AND status = 'unverified'
    `;

    const result = await invoke('plugin:sql|select', {
      db: this.dbPath,
      query: selectSQL,
      values: [sessionId],
    });

    return (result as any[])[0].unverified_count === 0;
  }

  async importCustomers(
    customersData: CreateCustomerFromExcel[],
    companyId: number
  ): Promise<{ success: boolean; importedCount: number; errors: string[] }> {
    await this.initialize();

    const errors: string[] = [];
    let importedCount = 0;

    try {
      // Get existing categories for validation
      const categories = await this.getCategories(companyId);
      const categoryMap = new Map(
        categories.map(cat => [cat.name.toLowerCase(), cat.id])
      );

      for (const customerData of customersData) {
        try {
          // Validate required fields
          if (!customerData.report_customer?.trim()) {
            errors.push(`Missing report_customer for row ${importedCount + 1}`);
            continue;
          }

          if (!customerData.tally_customer?.trim()) {
            errors.push(`Missing tally_customer for row ${importedCount + 1}`);
            continue;
          }

          // Find category by name
          const categoryName = customerData.category_name?.trim();
          if (!categoryName) {
            errors.push(
              `Missing category_name for customer: ${customerData.report_customer}`
            );
            continue;
          }

          const categoryId = categoryMap.get(categoryName.toLowerCase());
          if (!categoryId) {
            errors.push(
              `Category "${categoryName}" not found for customer: ${customerData.report_customer}`
            );
            continue;
          }

          // Check if customer already exists
          const existingCustomer = await this.checkTallyCustomerExists(
            customerData.tally_customer,
            companyId
          );

          if (existingCustomer) {
            errors.push(
              `Customer "${customerData.tally_customer}" already exists`
            );
            continue;
          }

          // Create customer
          const customerToCreate: CreateCustomer = {
            report_customer: customerData.report_customer.trim(),
            tally_customer: customerData.tally_customer.trim(),
            gst_no: customerData.gst_no?.trim() || '',
            state_code: customerData.state_code?.trim() || '',
            category_id: categoryId,
            company_id: companyId,
          };

          await this.createCustomer(customerToCreate);
          importedCount++;
        } catch (rowError) {
          errors.push(
            `Failed to import customer "${customerData.report_customer}": ${rowError instanceof Error ? rowError.message : 'Unknown error'}`
          );
        }
      }

      return {
        success: errors.length === 0,
        importedCount,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        importedCount: 0,
        errors: [
          `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      };
    }
  }
}

export const dbService = new DatabaseService();
