/**
 * DatabaseService for SDD MCP Server
 * SQLite-based data persistence layer
 */

import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

// Import only the types we actually use here
import type { FeatureData, DatabaseStats } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DatabaseService {
  protected db: Database.Database | null = null;
  private dbPath: string;
  private initialized = false;

  constructor(dbPath: string = './sdd.db') {
    this.dbPath = dbPath;
    // lazy init
  }

  protected ensureInitialized(): void {
    if (this.initialized) return;

    // Try to use pre-filled database first
    if (this.tryUsePrefilledDatabase()) {
      this.initialized = true;
      return;
    }

    // Fallback to creating fresh database
    this.db = new Database(this.dbPath);
    this.initializeTables();
    // IMPORTANT: optimize() must NOT call ensureInitialized(), to avoid recursion
    this.optimize();
    this.initialized = true;
  }

  /**
   * Try to use pre-filled database if it exists and target database doesn't exist
   */
  private tryUsePrefilledDatabase(): boolean {
    try {
      // Only use pre-filled database if target database doesn't exist
      if (fs.existsSync(this.dbPath)) {
        return false;
      }

      // Look for pre-filled database in various locations
      let prefilledDbPath = path.join(__dirname, 'sdd.db');

      if (!fs.existsSync(prefilledDbPath)) {
        prefilledDbPath = path.join(process.cwd(), 'dist', 'lib', 'sdd-mcp-server', 'database', 'sdd.db');
      }

      if (!fs.existsSync(prefilledDbPath)) {
        prefilledDbPath = path.join('/usr/local/lib/sdd-mcp', 'database', 'sdd.db');
      }

      if (!fs.existsSync(prefilledDbPath)) {
        return false;
      }

      // Copy pre-filled database to target location
      fs.copyFileSync(prefilledDbPath, this.dbPath);

      // Initialize the copied database
      this.db = new Database(this.dbPath);
      this.optimize();

      // Using pre-filled database with templates
      return true;
    } catch (error) {
      console.error('DatabaseService: Failed to use pre-filled database:', error);
      return false;
    }
  }

  /**
   * Initialize database tables using schema.sql (v2 preferred)
   */
  private initializeTables(): void {
    try {
      let schemaPath = path.join(__dirname, 'schema-v2.sql');

      if (!fs.existsSync(schemaPath)) {
        schemaPath = path.join(__dirname, 'schema.sql');
      }
      if (!fs.existsSync(schemaPath)) {
        schemaPath = path.join(process.cwd(), 'dist', 'schema-v2.sql');
      }
      if (!fs.existsSync(schemaPath)) {
        schemaPath = path.join('/usr/local/lib/sdd-mcp', 'schema-v2.sql');
      }

      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        this.db!.exec(schema);
      } else {
        this.createTablesManually();
      }
    } catch {
      this.createTablesManually();
    }
  }

  /**
   * Fallback schema kept in sync with active tools
   * NOTE: analysis.feature_id is UNIQUE to support UPSERTs.
   */
  private createTablesManually(): void {
    const schema = `
      -- Features table (main entity)
      CREATE TABLE IF NOT EXISTS features (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'not_started',
        completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
        current_phase TEXT DEFAULT 'Not Started',
        constitutional_compliant BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Specifications table
      CREATE TABLE IF NOT EXISTS specifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feature_id TEXT NOT NULL,
        content JSON NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE
      );

      -- Plans table
      CREATE TABLE IF NOT EXISTS plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feature_id TEXT NOT NULL,
        content JSON NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE
      );

      -- Tasks table
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feature_id TEXT NOT NULL,
        content JSON NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE
      );

      -- Status table
      CREATE TABLE IF NOT EXISTS status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feature_id TEXT NOT NULL,
        content JSON NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE
      );

      -- Implementations table
      CREATE TABLE IF NOT EXISTS implementations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feature_id TEXT NOT NULL,
        content JSON NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE
      );

      -- Removed unused tables: verifications, analysis, clarifications, dashboards, optimizations

      -- Helpful indexes
      CREATE INDEX IF NOT EXISTS idx_features_status ON features(status);
      CREATE INDEX IF NOT EXISTS idx_features_phase ON features(current_phase);

      CREATE INDEX IF NOT EXISTS idx_specifications_feature_id ON specifications(feature_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_feature_id ON tasks(feature_id);
      -- Removed indexes for deleted tables: plans, status, implementations, verifications, analysis, clarifications, dashboards, optimizations
    `;
    this.db!.exec(schema);
  }


  get_all_tables(): string[] {
    this.ensureInitialized();
    const stmt = this.db!.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);
    const tables = stmt.all() as { name: string }[];
    return tables.map(t => t.name);
  }


  optimize(): void {
    // DO NOT call ensureInitialized() here — it causes recursion.
    if (!this.db) return;

    try {
      // Enable WAL mode for better concurrency
      this.db.pragma('journal_mode = WAL');

      // Set cache size to ~10MB
      this.db.pragma('cache_size = -10000');

      // Enable foreign keys
      this.db.pragma('foreign_keys = ON');

      // Good durability/perf tradeoff
      this.db.pragma('synchronous = NORMAL');

      // Update stats for the query planner
      this.db.exec('ANALYZE');
    } catch (err) {
      console.error('DatabaseService.optimize error:', err);
    }
  }

  /**
   * Get database statistics for monitoring
   */
  getStats(): DatabaseStats {
    this.ensureInitialized();
    const features = this.db!.prepare('SELECT COUNT(*) as count FROM features').get() as { count: number };
    const specifications = this.db!.prepare('SELECT COUNT(*) as count FROM specifications').get() as { count: number };
    const plans = this.db!.prepare('SELECT COUNT(*) as count FROM plans').get() as { count: number };
    const tasks = this.db!.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number };

    const totalRecords =
      features.count +
      specifications.count +
      plans.count +
      tasks.count;

    return {
      features: features.count,
      specifications: specifications.count,
      plans: plans.count,
      tasks: tasks.count,
      totalRecords
    };
  }



  /**
   * Generate a simple content hash for integrity checking
   */
  protected generateContentHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) this.db.close();
  }

  /**
   * Get database path
   */
  get_db_path(): string {
    return this.dbPath;
  }

  /**
   * Execute a raw SQL query and return results (for testing and templates)
   */
  async query(sql: string, params: any[] = []): Promise<any[]> {
    this.ensureInitialized();
    try {
      const stmt = this.db!.prepare(sql);
      return stmt.all(params);
    } catch (error) {
      console.error('DatabaseService: Query error:', error);
      return [];
    }
  }

  /**
   * Install a template into the database
   */
  install_template(
    tableName: string,
    templateId: string,
    templateName: string,
    version: string,
    description: string,
    templateData: any,
    isActive: boolean = true
  ): void {
    this.ensureInitialized();

    const insertStmt = this.db!.prepare(`
      INSERT OR REPLACE INTO ${tableName} (id, name, version, description, template_data, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    // Handle templateData - if it's already a string, use it; otherwise stringify
    const templateDataString = typeof templateData === 'string' ? templateData : JSON.stringify(templateData);

    insertStmt.run(
      templateId,
      templateName,
      version,
      description,
      templateDataString,
      isActive ? 1 : 0
    );
  }

  // Old method removed - use RobustDatabaseService.get_most_recent_feature_with_incomplete_tasks_robust() instead

  // Old method removed - use RobustDatabaseService.get_most_recent_feature_with_tasks_robust() instead

  // Old method removed - use RobustDatabaseService.get_feature_with_most_tasks_robust() instead

  // Old method removed - use RobustDatabaseService.get_features_by_phase_robust() instead

  /**
   * Get task template by ID
   */
  // Old method removed - use RobustDatabaseService.get_task_template_robust() instead

  /**
   * Get plan template by ID
   */
  // Old method removed - use RobustDatabaseService.get_plan_template_robust() instead


  /**
   * Get status template by ID
   */
  // Old method removed - use RobustDatabaseService.get_status_template_robust() instead


  /**
   * Get specification template by ID
   */
  // Old method removed - use RobustDatabaseService.get_spec_template_robust() instead


  /**
   * Check if template exists in database
   */
  async template_exists(tableName: string, templateId: string): Promise<boolean> {
    this.ensureInitialized();
    try {
      const stmt = this.db!.prepare(`SELECT COUNT(*) as count FROM ${tableName} WHERE id = ? AND is_active = 1`);
      const result = stmt.get(templateId) as { count: number } | undefined;
      return (result?.count || 0) > 0;
    } catch (error) {
      return false;
    }
  }


  /**
   * Generic run method for templates (used by BaseTemplate)
   */
  async run(sql: string, params: any[] = []): Promise<any> {
    this.ensureInitialized();
    try {
      const stmt = this.db!.prepare(sql);
      return stmt.run(params);
    } catch (error) {
      console.error('DatabaseService: Run error:', error);
      throw error;
    }
  }
}