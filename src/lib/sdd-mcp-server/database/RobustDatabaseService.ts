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
          type: 'object', // Changed back to object to match actual template structure
          properties: {
            phase1: { type: 'object' },
            phase2: { type: 'object' },
            phase3: { type: 'object' },
            phase4: { type: 'object' },
            phase5: { type: 'object' },
            phase6: { type: 'object' },
            phase7: { type: 'object' },
            phase8: { type: 'object' }
          }
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
  }

  /**
   * Validate JSON data against schema
   */
  private validateJSON(data: any, schema: JSONSchema): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic type validation
    if (schema.type === 'object' && typeof data !== 'object') {
      errors.push(`Expected object, got ${typeof data}`);
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
          if (fieldSchema.type === 'object' && typeof data[field] !== 'object') {
            errors.push(`Field '${field}' should be object, got ${typeof data[field]}`);
          } else if (fieldSchema.type === 'string' && typeof data[field] !== 'string') {
            errors.push(`Field '${field}' should be string, got ${typeof data[field]}`);
          } else if (fieldSchema.type === 'array' && !Array.isArray(data[field])) {
            errors.push(`Field '${field}' should be array, got ${typeof data[field]}`);
          }
        }
      }
      // Allow additional fields not in schema (flexible validation)
      // This means we don't validate fields that aren't in the schema
    }

    return { valid: errors.length === 0, errors };
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

    // Store with SQLite's native JSON functions and template ID
    const stmt = this.db!.prepare(`
      INSERT OR REPLACE INTO ${table} 
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
      
      // Debug logging removed for production
      
      // Verify content integrity
      const currentHash = this.generateContentHash(result.data);
      if (currentHash !== result.content_hash) {
        console.error('Content integrity check failed for', table, id);
        return null;
      }
      
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
    await this.storeStructuredData('tasks', 'feature_id', featureId, content, 'tasks');
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
}
