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


  /**
   * List all non-internal tables
   */
  get_all_tables(): string[] {
    this.ensureInitialized();
    const stmt = this.db!.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);
    const tables = stmt.all() as { name: string }[];
    return tables.map(t => t.name);
  }

  // --------------------------
  // Feature management
  // --------------------------
  async create_feature(feature: FeatureData): Promise<void> {
    this.ensureInitialized();
    
    // Convert FeatureData to JSON content
    const content = {
      name: feature.name,
      status: 'not_started',
      completionPercentage: 0,
      currentPhase: feature.currentPhase || 'Specification',
      constitutionalCompliant: feature.constitutionalCompliant || false,
      cliRequired: feature.cliRequired || false,
      cliDetected: feature.cliDetected || false,
      cliConfidence: feature.cliConfidence || 0.0,
      cliComplexity: feature.cliComplexity || 'simple',
      libraryRequired: feature.libraryRequired || false,
      libraryDetected: feature.libraryDetected || false,
      libraryConfidence: feature.libraryConfidence || 0.0,
      libraryComplexity: feature.libraryComplexity || 'simple',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const stmt = this.db!.prepare(`
      INSERT OR REPLACE INTO features 
      (id, content, template_id, ai_generated, metadata, schema_version, validated_at, content_size, content_hash)
      VALUES (?, json(?), ?, ?, json(?), ?, ?, ?, ?)
    `);
    
    const contentString = JSON.stringify(content);
    const contentHash = this.generateContentHash(contentString);
    const metadata = {
      schema_version: '1.0',
      created_by: 'sdd-mcp-server'
    };
    
    stmt.run(
      feature.id,
      contentString,
      null, // template_id
      1, // ai_generated
      JSON.stringify(metadata),
      '1.0', // schema_version
      new Date().toISOString(), // validated_at
      contentString.length, // content_size
      contentHash // content_hash
    );
  }

  async get_feature(featureId: string): Promise<FeatureData | null> {
    this.ensureInitialized();
    const stmt = this.db!.prepare(`
      SELECT id, content FROM features WHERE id = ?
    `);
    const result = stmt.get(featureId) as any;
    if (!result) return null;
    
    try {
      const content = JSON.parse(result.content);
      return {
        id: result.id,
        name: content.name,
        currentPhase: content.currentPhase,
        constitutionalCompliant: content.constitutionalCompliant,
        // CLI detection fields
        cliRequired: content.cliRequired,
        cliDetected: content.cliDetected,
        cliConfidence: content.cliConfidence,
        cliComplexity: content.cliComplexity,
        // Library detection fields
        libraryRequired: content.libraryRequired,
        libraryDetected: content.libraryDetected,
        libraryConfidence: content.libraryConfidence,
        libraryComplexity: content.libraryComplexity
      };
    } catch (error) {
      console.error(`DatabaseService: Error parsing feature content for ${featureId}:`, error);
      return null;
    }
  }

  /**
   * Get CLI data for a feature
   */
  async get_feature_cli_data(featureId: string): Promise<any> {
    this.ensureInitialized();
    const stmt = this.db!.prepare(`
      SELECT cli_required, cli_detected, cli_confidence, cli_complexity 
      FROM features WHERE id = ?
    `);
    return stmt.get(featureId) as any;
  }

  async get_feature_library_data(featureId: string): Promise<any> {
    this.ensureInitialized();
    const stmt = this.db!.prepare(`
      SELECT library_required, library_detected, library_confidence, library_complexity 
      FROM features WHERE id = ?
    `);
    return stmt.get(featureId) as any;
  }

  async delete_feature(featureId: string): Promise<void> {
    this.ensureInitialized();
    const stmt = this.db!.prepare('DELETE FROM features WHERE id = ?');
    stmt.run(featureId);
  }

  async update_feature_phase(featureId: string, phase: string): Promise<void> {
    this.ensureInitialized();
    const stmt = this.db!.prepare(`
      UPDATE features 
      SET current_phase = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(phase, new Date().toISOString(), featureId);
  }

  // --------------------------
  // Document management
  // --------------------------
  // Analysis methods removed - analysis tables deleted



  // --------------------------
  // Analysis template methods removed - analysis tables deleted







  async get_all_task_records(featureId: string): Promise<{ content: string }[]> {
    this.ensureInitialized();
    const stmt = this.db!.prepare('SELECT content FROM tasks WHERE feature_id = ? ORDER BY created_at DESC');
    const results = stmt.all(featureId) as { content: string }[];
    return results || [];
  }



  async save_status(featureId: string, content: any, templateId?: string): Promise<void> {
    this.ensureInitialized();
    const stmt = this.db!.prepare(`
      INSERT OR REPLACE INTO status (feature_id, template_id, content)
      VALUES (?, ?, ?)
    `);
    stmt.run(featureId, templateId || null, JSON.stringify(content));
  }

  async get_status(featureId: string): Promise<any | null> {
    this.ensureInitialized();
    const stmt = this.db!.prepare('SELECT content FROM status WHERE feature_id = ?');
    const result = stmt.get(featureId) as { content: string } | null;
    if (!result) return null;
    try {
      return JSON.parse(result.content);
    } catch (e) {
      console.error(`DatabaseService: Error parsing status content for feature ${featureId}:`, e);
      console.error(`Content preview: ${result.content?.substring?.(0, 100)}...`);
      return null;
    }
  }














  // Verification methods removed - verifications table deleted


  // --------------------------
  // Analytics and reporting
  // --------------------------
  async get_all_features(): Promise<FeatureData[]> {
    this.ensureInitialized();
    const stmt = this.db!.prepare('SELECT id, content FROM features ORDER BY updated_at DESC');
    const results = stmt.all() as any[];
    return results.map(r => {
      try {
        const content = JSON.parse(r.content);
        return {
          id: r.id,
          name: content.name
        };
      } catch (error) {
        console.error(`DatabaseService: Error parsing feature content for ${r.id}:`, error);
        return {
          id: r.id,
          name: 'Unknown Feature'
        };
      }
    });
  }

  async get_features_by_status(status: string): Promise<FeatureData[]> {
    this.ensureInitialized();
    const stmt = this.db!.prepare('SELECT * FROM features WHERE status = ? ORDER BY updated_at DESC');
    const results = stmt.all(status) as any[];
    return results.map(r => ({
      id: r.id,
      name: r.name,
      status: r.status,
      completionPercentage: r.completion_percentage,
      currentPhase: r.current_phase,
      constitutionalCompliant: Boolean(r.constitutional_compliant),
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
  }

  async get_completion_stats(): Promise<any> {
    this.ensureInitialized();

    const totalStmt = this.db!.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        AVG(completion_percentage) as avgCompletion
      FROM features
    `);

    const statusStmt = this.db!.prepare(`
      SELECT status, COUNT(*) as count 
      FROM features 
      GROUP BY status
    `);

    const phaseStmt = this.db!.prepare(`
      SELECT current_phase, COUNT(*) as count 
      FROM features 
      GROUP BY current_phase
    `);

    const totalResult = totalStmt.get() as { total: number; completed: number; avgCompletion: number };
    const statusResults = statusStmt.all() as { status: string; count: number }[];
    const phaseResults = phaseStmt.all() as { current_phase: string; count: number }[];

    const featuresByStatus: Record<string, number> = {};
    statusResults.forEach(row => {
      featuresByStatus[row.status] = row.count;
    });

    const featuresByPhase: Record<string, number> = {};
    phaseResults.forEach(row => {
      featuresByPhase[row.current_phase] = row.count;
    });

    return {
      totalFeatures: totalResult.total,
      completedFeatures: totalResult.completed,
      averageCompletion: totalResult.avgCompletion || 0,
      featuresByStatus,
      featuresByPhase
    };
  }

  /**
   * Get comprehensive feature analysis for status reporting
   */
  async get_feature_analysis(featureId: string): Promise<any> {
    this.ensureInitialized();
    const query = `
      SELECT 
        f.*,
        s.content as spec_content,
        p.content as plan_content,
        t.content as tasks_content,
        st.content as status_content
      FROM features f
      LEFT JOIN specifications s ON f.id = s.feature_id
      LEFT JOIN plans p ON f.id = p.feature_id
      LEFT JOIN tasks t ON f.id = t.feature_id
      LEFT JOIN status st ON f.id = st.feature_id
      WHERE f.id = ?
    `;
    const stmt = this.db!.prepare(query);
    const result = stmt.get(featureId) as any;
    if (!result) return null;

    const safeParse = (s: string | null) => {
      if (!s) return null;
      try {
        return JSON.parse(s);
      } catch (e) {
        console.error(`DatabaseService: JSON parse error in get_feature_analysis for feature ${featureId}:`, e);
        console.error(`Content preview: ${s.substring(0, 100)}...`);
        return null;
      }
    };

    return {
      featureName: result.name,
      featureId: result.id,
      specExists: !!result.spec_content,
      planExists: !!result.plan_content,
      tasksExist: !!result.tasks_content,
      currentPhase: result.current_phase,
      completionPercentage: result.completion_percentage,
      constitutionalCompliant: Boolean(result.constitutional_compliant),
      specContent: safeParse(result.spec_content),
      planContent: safeParse(result.plan_content),
      tasksContent: safeParse(result.tasks_content),
      statusContent: safeParse(result.status_content)
    };
  }

  /**
   * Optimize database performance
   */
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

    insertStmt.run(
      templateId,
      templateName,
      version,
      description,
      JSON.stringify(templateData),
      isActive ? 1 : 0
    );
  }

  /**
   * Get most recent feature with incomplete tasks (for auto-detection)
   */
  async get_most_recent_feature_with_incomplete_tasks(): Promise<string | null> {
    this.ensureInitialized();
    try {
      const stmt = this.db!.prepare(`
        SELECT feature_id FROM tasks 
        WHERE content LIKE '%"completed": false%'
        ORDER BY created_at DESC 
        LIMIT 1
      `);
      const result = stmt.get() as { feature_id: string } | undefined;
      return result?.feature_id || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get most recent feature with any tasks (fallback for auto-detection)
   */
  async get_most_recent_feature_with_tasks(): Promise<string | null> {
    this.ensureInitialized();
    try {
      const stmt = this.db!.prepare(`
        SELECT feature_id FROM tasks 
        ORDER BY created_at DESC 
        LIMIT 1
      `);
      const result = stmt.get() as { feature_id: string } | undefined;
      return result?.feature_id || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get feature with most tasks (alternative for auto-detection)
   */
  async get_feature_with_most_tasks(): Promise<string | null> {
    this.ensureInitialized();
    try {
      const stmt = this.db!.prepare(`
        SELECT feature_id, COUNT(*) as task_count 
        FROM tasks 
        GROUP BY feature_id 
        ORDER BY task_count DESC 
        LIMIT 1
      `);
      const result = stmt.get() as { feature_id: string } | undefined;
      return result?.feature_id || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get features by phase number (context-aware auto-detection)
   */
  async get_features_by_phase(phaseNumber: number): Promise<string[]> {
    this.ensureInitialized();
    try {
      const stmt = this.db!.prepare(`
        SELECT DISTINCT feature_id FROM tasks 
        WHERE content LIKE ?
        ORDER BY created_at DESC
      `);
      const results = stmt.all(`%"phaseNumber": ${phaseNumber}%`) as { feature_id: string }[];
      return results.map(r => r.feature_id);
    } catch (error) {
      return [];
    }
  }

  /**
   * Get task template by ID
   */
  async get_task_template(templateId: string): Promise<any | null> {
    this.ensureInitialized();
    try {
      const stmt = this.db!.prepare('SELECT template_data FROM task_templates WHERE id = ? AND is_active = 1');
      const result = stmt.get(templateId) as { template_data: string } | undefined;

      if (!result || !result.template_data) {
        return null;
      }

      return JSON.parse(result.template_data);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get plan template by ID
   */
  async get_plan_template(templateId: string): Promise<any | null> {
    this.ensureInitialized();
    try {
      const stmt = this.db!.prepare('SELECT template_data FROM plan_templates WHERE id = ? AND is_active = 1');
      const result = stmt.get(templateId) as { template_data: string } | undefined;

      if (!result || !result.template_data) {
        return null;
      }

      return JSON.parse(result.template_data);
    } catch (error) {
      return null;
    }
  }


  /**
   * Get status template by ID
   */
  async get_status_template(templateId: string): Promise<any | null> {
    this.ensureInitialized();
    try {
      const stmt = this.db!.prepare('SELECT template_data FROM status_templates WHERE id = ? AND is_active = 1');
      const result = stmt.get(templateId) as { template_data: string } | undefined;

      if (!result || !result.template_data) {
        return null;
      }

      return JSON.parse(result.template_data);
    } catch (error) {
      return null;
    }
  }


  /**
   * Get specification template by ID
   */
  async get_spec_template(templateId: string): Promise<any | null> {
    this.ensureInitialized();
    try {
      const stmt = this.db!.prepare('SELECT template_data FROM spec_templates WHERE id = ? AND is_active = 1');
      const result = stmt.get(templateId) as { template_data: string } | undefined;

      if (!result || !result.template_data) {
        return null;
      }

      return JSON.parse(result.template_data);
    } catch (error) {
      return null;
    }
  }


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