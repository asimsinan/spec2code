/**
 * Robust Database Service with JSON-SQLite best practices
 * Uses SQLite's native JSON1 extension for reliable JSON handling
 */

import Database from 'better-sqlite3';
import { DatabaseService } from './DatabaseService.js';

export interface JSONSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  [key: string]: any;
}

export interface StorageMetadata {
  schema_version: string;
  validated_at: string;
  content_size: number;
  content_hash: string;
}

export class RobustDatabaseService extends DatabaseService {
  private schemas: Map<string, JSONSchema> = new Map();

  constructor(dbPath: string) {
    super(dbPath);
    this.initializeSchemas();
  }

  /**
   * Initialize JSON schemas for validation
   */
  private initializeSchemas(): void {
    // Specification schema - more flexible to match actual data structure
    this.schemas.set('specification', {
      type: 'object',
      required: [], // No required fields - be flexible
      properties: {
        title: { type: 'string' },
        metadata: { type: 'object' },
        userScenarios: { type: 'object' },
        requirements: { type: 'object' },
        apiSpecification: { type: 'object' },
        platformGates: { type: 'object' },
        constitutionalGates: { type: 'object' },
        template_data: { type: 'object' } // Support template_data wrapper
      }
    });

    // Tasks schema - more flexible to match actual data structure
    this.schemas.set('tasks', {
      type: 'object',
      required: [], // No required fields - be flexible
      properties: {
        title: { type: 'string' },
        metadata: { type: 'object' },
        taskPhases: { 
          type: 'object',
          properties: {
            phase1: { type: 'object' },
            phase2: { type: 'object' },
            phase3: { type: 'object' },
            phase4: { type: 'object' }
          },
          additionalProperties: false // Reject extra phases
        },
        constitutionalGates: { type: 'object' },
        qualityGates: { type: 'object' },
        definitionOfDone: { type: 'object' },
        template_data: { type: 'object' } // Support template_data wrapper
      }
    });

    // Plan schema - more flexible to match actual data structure
    this.schemas.set('plan', {
      type: 'object',
      required: [], // No required fields - be flexible
      properties: {
        title: { type: 'string' },
        metadata: { type: 'object' },
        summary: { type: 'object' },
        technicalContext: { type: 'object' },
        implementationPhases: { type: 'object' },
        timeEstimation: { type: 'object' },
        projectStructure: { 
          oneOf: [
            { type: 'string' },
            { type: 'object' }
          ]
        }, // Can be string or object (matches template structure)
        estimates: { type: 'object' },
        template_data: { type: 'object' } // Support template_data wrapper
      }
    });

    // Feature schema - for feature metadata
    this.schemas.set('feature', {
      type: 'object',
      required: ['name'], // Only name is required
      properties: {
        name: { type: 'string' },
        status: { type: 'string' },
        completionPercentage: { type: 'number' },
        currentPhase: { type: 'string' },
        constitutionalCompliant: { type: 'boolean' },
        cliRequired: { type: 'boolean' },
        cliDetected: { type: 'boolean' },
        cliConfidence: { type: 'number' },
        cliComplexity: { type: 'string' },
        libraryRequired: { type: 'boolean' },
        libraryDetected: { type: 'boolean' },
        libraryConfidence: { type: 'number' },
        libraryComplexity: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' }
      }
    });

    // Status schema - for status data
    this.schemas.set('status', {
      type: 'object',
      required: [], // No required fields - be flexible
      properties: {
        title: { type: 'string' },
        metadata: { type: 'object' },
        status: { type: 'object' },
        template_data: { type: 'object' } // Support template_data wrapper
      }
    });
  }

  /**
   * Validate JSON data against schema
   */
  private validateJSON(data: any, schema: JSONSchema): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 🚨 CRITICAL FIX: Pre-validate and fix common data structure issues
    this.preValidateAndFixData(data, schema);

    // Handle null/undefined data
    if (data === null || data === undefined) {
      if (schema.type === 'null') {
        return { valid: true, errors: [] };
      } else {
        errors.push(`Expected ${schema.type}, got ${data === null ? 'null' : 'undefined'}`);
        return { valid: false, errors };
      }
    }

    // Basic type validation
    if (schema.type === 'object' && (typeof data !== 'object' || Array.isArray(data))) {
      errors.push(`Expected object, got ${Array.isArray(data) ? 'array' : typeof data}`);
      return { valid: false, errors };
    }

    if (schema.type === 'array' && !Array.isArray(data)) {
      errors.push(`Expected array, got ${typeof data}`);
      return { valid: false, errors };
    }

    if (schema.type === 'string' && typeof data !== 'string') {
      errors.push(`Expected string, got ${typeof data}`);
      return { valid: false, errors };
    }

    if (schema.type === 'number' && typeof data !== 'number') {
      errors.push(`Expected number, got ${typeof data}`);
      return { valid: false, errors };
    }

    if (schema.type === 'boolean' && typeof data !== 'boolean') {
      errors.push(`Expected boolean, got ${typeof data}`);
      return { valid: false, errors };
    }

    // Required fields validation
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in data)) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    // Properties validation (only validate fields that are present and in schema)
    if (schema.properties) {
      for (const [field, fieldSchema] of Object.entries(schema.properties)) {
        if (field in data) {
          // Recursive validation for nested objects
          if (fieldSchema.type === 'object' && typeof data[field] === 'object' && !Array.isArray(data[field])) {
            const nestedValidation = this.validateJSON(data[field], fieldSchema);
            if (!nestedValidation.valid) {
              errors.push(`Field '${field}' validation failed: ${nestedValidation.errors.join(', ')}`);
            }
          } else {
            // Basic type validation for non-object fields
            if (fieldSchema.type === 'object' && typeof data[field] !== 'object') {
              errors.push(`Field '${field}' should be object, got ${typeof data[field]}`);
            } else if (fieldSchema.type === 'string' && typeof data[field] !== 'string') {
              errors.push(`Field '${field}' should be string, got ${typeof data[field]}`);
            } else if (fieldSchema.type === 'array' && !Array.isArray(data[field])) {
              errors.push(`Field '${field}' should be array, got ${typeof data[field]}`);
            } else if (fieldSchema.type === 'number' && typeof data[field] !== 'number') {
              errors.push(`Field '${field}' should be number, got ${typeof data[field]}`);
            } else if (fieldSchema.type === 'boolean' && typeof data[field] !== 'boolean') {
              errors.push(`Field '${field}' should be boolean, got ${typeof data[field]}`);
            }
          }
          
          // Check additionalProperties for nested objects
          if (fieldSchema.type === 'object' && typeof data[field] === 'object' && 
              fieldSchema.additionalProperties === false && fieldSchema.properties) {
            const extraFields = Object.keys(data[field]).filter(key => !(key in fieldSchema.properties));
            if (extraFields.length > 0) {
              errors.push(`Field '${field}' contains unexpected properties: ${extraFields.join(', ')}`);
            }
          }
        }
      }
      // Allow additional fields not in schema (flexible validation)
      // This means we don't validate fields that aren't in the schema
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Pre-validate and fix common data structure issues before schema validation
   */
  private preValidateAndFixData(data: any, schema: JSONSchema): void {
    if (!data || typeof data !== 'object') return;

    // Fix summary field if it's a string instead of object
    if (data.summary && typeof data.summary === 'string') {
      console.warn('RobustDatabaseService: Converting summary string to object structure');
      data.summary = {
        title: 'Summary',
        content: data.summary,
        instruction: 'Extract from feature spec: primary requirement + technical approach. Focus on business value and user outcomes.'
      };
    }

    // Ensure summary has required structure if it exists
    if (data.summary && typeof data.summary === 'object') {
      if (!data.summary.title) {
        data.summary.title = 'Summary';
      }
      if (!data.summary.content) {
        data.summary.content = 'Implementation plan extracted from specification. Focus on business value and user outcomes.';
      }
      if (!data.summary.instruction) {
        data.summary.instruction = 'Extract from feature spec: primary requirement + technical approach. Focus on business value and user outcomes.';
      }
    }
  }

  /**
   * Store structured JSON data with validation
   */
  async storeStructuredData<T>(
    table: string,
    idField: string,
    id: string,
    data: T,
    schemaKey: string
  ): Promise<void> {
    this.ensureInitialized();
    
    const schema = this.schemas.get(schemaKey);
    if (!schema) {
      throw new Error(`Unknown schema: ${schemaKey}`);
    }

    // Validate data
    const validation = this.validateJSON(data, schema);
    if (!validation.valid) {
      console.error(`Schema validation failed for ${table}:${id}:`, validation.errors);
      throw new Error(`Schema validation failed: ${validation.errors.join(', ')}`);
    }

    // Prepare JSON string
    const jsonString = JSON.stringify(data);
    const contentHash = this.generateContentHash(jsonString);
    const metadata: StorageMetadata = {
      schema_version: '1.0',
      validated_at: new Date().toISOString(),
      content_size: jsonString.length,
      content_hash: contentHash
    };

    // Store with SQLite's native JSON functions
    // Include all original columns to avoid overwriting with NULLs
    const stmt = this.db!.prepare(`
      INSERT OR REPLACE INTO ${table} 
      (${idField}, template_id, content, metadata, schema_version, validated_at, content_size, content_hash, ai_generated)
      VALUES (?, ?, json(?), json(?), ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      null, // template_id - will be set by the calling method
      jsonString,
      JSON.stringify(metadata),
      '1.0',
      new Date().toISOString(),
      jsonString.length,
      contentHash,
      1 // ai_generated (SQLite uses 1 for true)
    );
  }

  /**
   * Store structured JSON data with template ID
   */
  async storeStructuredDataWithTemplate<T>(
    table: string,
    idField: string,
    id: string,
    data: T,
    schemaKey: string,
    templateId?: string
  ): Promise<void> {
    this.ensureInitialized();
    
    const schema = this.schemas.get(schemaKey);
    if (!schema) {
      throw new Error(`Unknown schema: ${schemaKey}`);
    }

    // Validate data
    const validation = this.validateJSON(data, schema);
    if (!validation.valid) {
      console.error(`Schema validation failed for ${table}:${id}:`, validation.errors);
      throw new Error(`Schema validation failed: ${validation.errors.join(', ')}`);
    }

    // Prepare JSON string
    const jsonString = JSON.stringify(data);
    const contentHash = this.generateContentHash(jsonString);
    const metadata: StorageMetadata = {
      schema_version: '1.0',
      validated_at: new Date().toISOString(),
      content_size: jsonString.length,
      content_hash: contentHash
    };

    // First delete existing records for this feature_id to prevent duplicates
    const deleteStmt = this.db!.prepare(`DELETE FROM ${table} WHERE ${idField} = ?`);
    deleteStmt.run(id);
    
    // Store with SQLite's native JSON functions and template ID
    const stmt = this.db!.prepare(`
      INSERT INTO ${table} 
      (${idField}, template_id, content, metadata, schema_version, validated_at, content_size, content_hash, ai_generated)
      VALUES (?, ?, json(?), json(?), ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      templateId || null,
      jsonString,
      JSON.stringify(metadata),
      '1.0',
      new Date().toISOString(),
      jsonString.length,
      contentHash,
      1 // ai_generated (SQLite uses 1 for true)
    );
  }

  /**
   * Retrieve structured JSON data with validation
   */
  async getStructuredData<T>(
    table: string,
    idField: string,
    id: string,
    schemaKey: string
  ): Promise<T | null> {
    this.ensureInitialized();
    
    const schema = this.schemas.get(schemaKey);
    if (!schema) {
      throw new Error(`Unknown schema: ${schemaKey}`);
    }

    // Use SQLite's native JSON functions
    const stmt = this.db!.prepare(`
      SELECT 
        json_extract(content, '$') as data,
        json_extract(metadata, '$') as metadata_json,
        schema_version,
        validated_at,
        content_hash
      FROM ${table}
      WHERE ${idField} = ? 
        AND json_valid(content) = 1
        AND schema_version = ?
      ORDER BY validated_at DESC
    `);
    
    const result = stmt.get(id, '1.0') as { 
      data: string; 
      metadata_json: string;
      schema_version: string; 
      validated_at: string;
      content_hash: string;
    } | undefined;
    
    if (!result) return null;
    
    try {
      const parsed = JSON.parse(result.data);
      const metadata = JSON.parse(result.metadata_json) as StorageMetadata;
      
   
      // Re-validate on retrieval
      const validation = this.validateJSON(parsed, schema);
      if (!validation.valid) {
        console.error('Data corruption detected:', validation.errors);
        return null;
      }
      
      return parsed as T;
    } catch (error) {
      console.error('Failed to parse retrieved JSON:', error);
      return null;
    }
  }

  /**
   * Robust specification storage
   */
  async save_specification_robust(featureId: string, content: any, templateId?: string): Promise<void> {
    await this.storeStructuredData('specifications', 'feature_id', featureId, content, 'specification');
  }

  /**
   * Robust specification retrieval
   */
  async get_specification_robust(featureId: string): Promise<any | null> {
    return await this.getStructuredData('specifications', 'feature_id', featureId, 'specification');
  }

  /**
   * Robust tasks storage
   */
  async save_tasks_robust(featureId: string, content: any, templateId?: string): Promise<void> {
    // Store with template ID (like other robust methods)
    await this.storeStructuredDataWithTemplate('tasks', 'feature_id', featureId, content, 'tasks', templateId);
  }

  /**
   * Robust tasks retrieval
   */
  async get_tasks_robust(featureId: string): Promise<any | null> {
    return await this.getStructuredData('tasks', 'feature_id', featureId, 'tasks');
  }

  /**
   * Robust plan storage
   */
  async save_plan_robust(featureId: string, content: any, templateId?: string): Promise<void> {
    // Store with template ID
    await this.storeStructuredDataWithTemplate('plans', 'feature_id', featureId, content, 'plan', templateId);
  }

  /**
   * Robust plan retrieval
   */
  async get_plan_robust(featureId: string): Promise<any | null> {
    return await this.getStructuredData('plans', 'feature_id', featureId, 'plan');
  }

  /**
   * Robust feature storage
   */
  async save_feature_robust(featureId: string, content: any, templateId?: string): Promise<void> {
    await this.storeStructuredDataWithTemplate('features', 'id', featureId, content, 'feature', templateId);
  }

  /**
   * Robust feature retrieval
   */
  async get_feature_robust(featureId: string): Promise<any | null> {
    return await this.getStructuredData('features', 'id', featureId, 'feature');
  }

  /**
   * Get all features with robust JSON handling
   */
  async get_all_features_robust(): Promise<any[]> {
    this.ensureInitialized();
    const stmt = this.db!.prepare(`
      SELECT 
        id,
        json_extract(content, '$.name') as name,
        json_extract(content, '$.status') as status,
        json_extract(content, '$.currentPhase') as currentPhase,
        json_extract(content, '$.constitutionalCompliant') as constitutionalCompliant,
        validated_at,
        content_size
      FROM features 
      WHERE json_valid(content) = 1
      ORDER BY validated_at DESC
    `);
    return stmt.all() as any[];
  }

  /**
   * Robust status storage
   */
  async save_status_robust(featureId: string, content: any, templateId?: string): Promise<void> {
    await this.storeStructuredDataWithTemplate('status', 'feature_id', featureId, content, 'status', templateId);
  }

  /**
   * Robust status retrieval
   */
  async get_status_robust(featureId: string): Promise<any | null> {
    return await this.getStructuredData('status', 'feature_id', featureId, 'status');
  }

  /**
   * Robust template retrieval methods
   */
  async get_task_template_robust(templateId: string): Promise<any | null> {
    this.ensureInitialized();
    const stmt = this.db!.prepare(`
      SELECT 
        id,
        name,
        version,
        description,
        template_data,
        is_active,
        created_at,
        updated_at
      FROM task_templates 
      WHERE id = ?
    `);
    const result = stmt.get(templateId) as any;
    if (result && result.template_data) {
      // Parse the template_data if it's a string
      result.template_data = typeof result.template_data === 'string' 
        ? JSON.parse(result.template_data) 
        : result.template_data;
    }
    return result || null;
  }

  async get_plan_template_robust(templateId: string): Promise<any | null> {
    this.ensureInitialized();
    const stmt = this.db!.prepare(`
      SELECT 
        id,
        name,
        version,
        description,
        template_data,
        is_active,
        created_at,
        updated_at
      FROM plan_templates 
      WHERE id = ?
    `);
    const result = stmt.get(templateId) as any;
    if (result && result.template_data) {
      // Parse the template_data if it's a string
      result.template_data = typeof result.template_data === 'string' 
        ? JSON.parse(result.template_data) 
        : result.template_data;
    }
    return result || null;
  }

  async get_status_template_robust(templateId: string): Promise<any | null> {
    this.ensureInitialized();
    const stmt = this.db!.prepare(`
      SELECT 
        id,
        name,
        version,
        description,
        template_data,
        is_active,
        created_at,
        updated_at
      FROM status_templates 
      WHERE id = ? 
    `);
    const result = stmt.get(templateId) as any;
    if (result && result.template_data) {
      // Parse the template_data if it's a string
      result.template_data = typeof result.template_data === 'string' 
        ? JSON.parse(result.template_data) 
        : result.template_data;
    }
    return result || null;
  }

  async get_spec_template_robust(templateId: string): Promise<any | null> {
    this.ensureInitialized();
    const stmt = this.db!.prepare(`
      SELECT 
        id,
        name,
        version,
        description,
        template_data,
        is_active,
        created_at,
        updated_at
      FROM spec_templates 
      WHERE id = ?
    `);
    const result = stmt.get(templateId) as any;
    if (result && result.template_data) {
      // Parse the template_data if it's a string
      result.template_data = typeof result.template_data === 'string' 
        ? JSON.parse(result.template_data) 
        : result.template_data;
    }
    return result || null;
  }

  /**
   * Robust feature management methods
   */
  async create_feature_robust(featureId: string, content: any): Promise<void> {
    await this.save_feature_robust(featureId, content);
  }

  async delete_feature_robust(featureId: string): Promise<void> {
    this.ensureInitialized();
    const stmt = this.db!.prepare('DELETE FROM features WHERE id = ?');
    stmt.run(featureId);
  }

  async update_feature_phase_robust(featureId: string, phase: string): Promise<void> {
    this.ensureInitialized();
    const stmt = this.db!.prepare(`
      UPDATE features 
      SET content = json_set(content, '$.currentPhase', ?),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(phase, featureId);
  }

  /**
   * Robust analytics methods
   */
  async get_all_task_records_robust(featureId: string): Promise<{ content: string }[]> {
    this.ensureInitialized();
    const stmt = this.db!.prepare(`
      SELECT content 
      FROM tasks 
      WHERE feature_id = ? 
        AND json_valid(content) = 1
      ORDER BY created_at DESC
    `);
    const results = stmt.all(featureId) as { content: string }[];
    return results || [];
  }

  async get_features_by_status_robust(status: string): Promise<any[]> {
    this.ensureInitialized();
    const stmt = this.db!.prepare(`
      SELECT 
        id,
        json_extract(content, '$.name') as name,
        json_extract(content, '$.status') as status,
        json_extract(content, '$.currentPhase') as currentPhase,
        json_extract(content, '$.constitutionalCompliant') as constitutionalCompliant,
        validated_at,
        content_size
      FROM features 
      WHERE json_extract(content, '$.status') = ? 
        AND json_valid(content) = 1
      ORDER BY validated_at DESC
    `);
    return stmt.all(status) as any[];
  }

  async get_completion_stats_robust(): Promise<any> {
    this.ensureInitialized();
    const stmt = this.db!.prepare(`
      SELECT 
        COUNT(*) as total_features,
        COUNT(CASE WHEN json_extract(content, '$.status') = 'completed' THEN 1 END) as completed_features,
        COUNT(CASE WHEN json_extract(content, '$.status') = 'in_progress' THEN 1 END) as in_progress_features,
        COUNT(CASE WHEN json_extract(content, '$.status') = 'not_started' THEN 1 END) as not_started_features,
        AVG(json_extract(content, '$.completionPercentage')) as avg_completion_percentage
      FROM features 
      WHERE json_valid(content) = 1
    `);
    return stmt.get() as any;
  }

  /**
   * Robust feature analysis methods
   */
  async get_most_recent_feature_with_incomplete_tasks_robust(): Promise<string | null> {
    this.ensureInitialized();
    const stmt = this.db!.prepare(`
      SELECT f.id
      FROM features f
      LEFT JOIN tasks t ON f.id = t.feature_id
      WHERE json_valid(f.content) = 1
        AND (t.id IS NULL OR json_extract(t.content, '$.status') != 'completed')
      ORDER BY f.validated_at DESC
      LIMIT 1
    `);
    const result = stmt.get() as { id: string } | undefined;
    return result?.id || null;
  }

  async get_most_recent_feature_with_tasks_robust(): Promise<string | null> {
    this.ensureInitialized();
    const stmt = this.db!.prepare(`
      SELECT f.id
      FROM features f
      INNER JOIN tasks t ON f.id = t.feature_id
      WHERE json_valid(f.content) = 1
        AND json_valid(t.content) = 1
      ORDER BY f.validated_at DESC
      LIMIT 1
    `);
    const result = stmt.get() as { id: string } | undefined;
    return result?.id || null;
  }

  async get_feature_with_most_tasks_robust(): Promise<string | null> {
    this.ensureInitialized();
    const stmt = this.db!.prepare(`
      SELECT f.id, COUNT(t.id) as task_count
      FROM features f
      LEFT JOIN tasks t ON f.id = t.feature_id
      WHERE json_valid(f.content) = 1
      GROUP BY f.id
      ORDER BY task_count DESC, f.validated_at DESC
      LIMIT 1
    `);
    const result = stmt.get() as { id: string } | undefined;
    return result?.id || null;
  }

  async get_features_by_phase_robust(phaseNumber: number): Promise<string[]> {
    this.ensureInitialized();
    const stmt = this.db!.prepare(`
      SELECT id
      FROM features 
      WHERE json_extract(content, '$.currentPhase') LIKE ?
        AND json_valid(content) = 1
      ORDER BY validated_at DESC
    `);
    const results = stmt.all(`Phase ${phaseNumber}%`) as { id: string }[];
    return results.map(r => r.id);
  }
}
