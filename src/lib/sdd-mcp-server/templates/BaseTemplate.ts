/**
 * BaseTemplate Class
 * Provides common template functionality for all 11 SDD tools
 * Handles template validation, AI filling, and database operations
 */

import { RobustDatabaseService } from '../database/RobustDatabaseService.js';

export interface TemplateData {
  id: string;
  name: string;
  version: string;
  description?: string;
  template_data: any;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FilledData {
  id?: number;
  feature_id: string;
  template_id?: string;
  content: any;
  ai_generated: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TemplateOperationResult {
  success: boolean;
  data?: any;
  errors?: string[];
  warnings?: string[];
}

export abstract class BaseTemplate {
  protected db: RobustDatabaseService;
  protected templateTableName: string;
  protected dataTableName: string;


  constructor(
    db: RobustDatabaseService,
    templateTableName: string,
    dataTableName: string
  ) {
    this.db = db;
    this.templateTableName = templateTableName;
    this.dataTableName = dataTableName;
  }

  // ========================================
  // TEMPLATE MANAGEMENT
  // ========================================

  /**
   * Get all active templates
   */
  async getActiveTemplates(): Promise<TemplateData[]> {
    const result = await this.db.query(`
      SELECT * FROM ${this.templateTableName} 
      WHERE is_active = 1 
      ORDER BY created_at DESC
    `);
    
    return result.map(row => this.mapRowToTemplateData(row));
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string): Promise<TemplateData | null> {
    const result = await this.db.query(`
      SELECT * FROM ${this.templateTableName} 
      WHERE id = ? AND is_active = 1
    `, [templateId]);
    
    if (result.length === 0) {
      return null;
    }
    
    return this.mapRowToTemplateData(result[0]);
  }

  /**
   * Update an existing template
   */
  async updateTemplate(templateId: string, updates: Partial<TemplateData>): Promise<TemplateOperationResult> {
    try {
      const existingTemplate = await this.getTemplate(templateId);
      if (!existingTemplate) {
        return {
          success: false,
          errors: [`Template ${templateId} not found`]
        };
      }

      const updatedTemplate = { ...existingTemplate, ...updates };
      const validation = await this.validateTemplateData(updatedTemplate);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
          warnings: validation.warnings
        };
      }

      const now = new Date().toISOString();
      await this.db.run(`
        UPDATE ${this.templateTableName} 
        SET name = ?, version = ?, description = ?, template_data = ?, is_active = ?, updated_at = ?
        WHERE id = ?
      `, [
        updatedTemplate.name,
        updatedTemplate.version,
        updatedTemplate.description || null,
        JSON.stringify(updatedTemplate.template_data),
        updatedTemplate.is_active ? 1 : 0,
        now,
        templateId
      ]);

      return {
        success: true,
        data: { ...updatedTemplate, updated_at: now },
        warnings: validation.warnings
      };
    } catch (error) {

      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Delete a template (soft delete by setting is_active = false)
   */
  async deleteTemplate(templateId: string): Promise<TemplateOperationResult> {
    try {
      const existingTemplate = await this.getTemplate(templateId);
      if (!existingTemplate) {
        return {
          success: false,
          errors: [`Template ${templateId} not found`]
        };
      }

      await this.db.run(`
        UPDATE ${this.templateTableName} 
        SET is_active = 0, updated_at = ?
        WHERE id = ?
      `, [new Date().toISOString(), templateId]);

      return {
        success: true,
        data: { id: templateId, is_active: false }
      };
    } catch (error) {

      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }


  /**
   * Get filled data for a feature
   */
  async getFilledData(featureId: string): Promise<FilledData | null> {
    const result = await this.db.query(`
      SELECT * FROM ${this.dataTableName} 
      WHERE feature_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `, [featureId]);
    
    if (result.length === 0) {
      return null;
    }
    
    return this.mapRowToFilledData(result[0]);
  }


  // ========================================
  // TEMPLATE VALIDATION
  // ========================================

  /**
   * Validate template data structure
   */
  async validateTemplateData(templateData: TemplateData): Promise<TemplateValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!templateData.id || templateData.id.trim() === '') {
      errors.push('Template ID is required');
    }

    if (!templateData.name || templateData.name.trim() === '') {
      errors.push('Template name is required');
    }

    if (!templateData.version || templateData.version.trim() === '') {
      errors.push('Template version is required');
    }

    if (!templateData.template_data) {
      errors.push('Template data is required');
    }

    // Template data structure validation
    if (templateData.template_data) {
      const templateValidation = await this.validateTemplateStructure(templateData.template_data);
      errors.push(...templateValidation.errors);
      warnings.push(...templateValidation.warnings);
    }

    // Version format validation
    if (templateData.version && !/^\d+\.\d+\.\d+$/.test(templateData.version)) {
      warnings.push('Version should follow semantic versioning (e.g., 1.0.0)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Abstract method to validate template structure
   * Each tool should implement its own validation logic
   */
  protected abstract validateTemplateStructure(_templateData: any): Promise<TemplateValidationResult>;

  // ========================================
  // MARKDOWN GENERATION
  // ========================================

  /**
   * Map database row to TemplateData
   */
  protected mapRowToTemplateData(row: any): TemplateData {
    return {
      id: row.id,
      name: row.name,
      version: row.version,
      description: row.description,
      template_data: typeof row.template_data === 'string' 
        ? JSON.parse(row.template_data) 
        : row.template_data,
      is_active: Boolean(row.is_active),
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  /**
   * Map database row to FilledData
   */
  protected mapRowToFilledData(row: any): FilledData {
    return {
      id: row.id,
      feature_id: row.feature_id,
      template_id: row.template_id,
      content: typeof row.content === 'string' 
        ? JSON.parse(row.content) 
        : row.content,
      ai_generated: Boolean(row.ai_generated),
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  /**
   * Generate unique ID
   */
  protected generateId(): string {
    return `${this.templateTableName.replace('_templates', '')}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if template has placeholders
   */
  protected hasPlaceholders(templateData: any): boolean {
    const templateString = JSON.stringify(templateData);
    return /\{\{.*?\}\}/.test(templateString);
  }

  /**
   * Extract placeholders from template
   */
  protected extractPlaceholders(templateData: any): string[] {
    const templateString = JSON.stringify(templateData);
    const matches = templateString.match(/\{\{([^}]+)\}\}/g);
    return matches ? matches.map(match => match.slice(2, -2)) : [];
  }

  /**
   * Replace placeholders in template
   */
  protected replacePlaceholders(
    templateData: any, 
    replacements: Record<string, any>
  ): any {
    const templateString = JSON.stringify(templateData);
    let result = templateString;
    
    for (const [placeholder, value] of Object.entries(replacements)) {
      const regex = new RegExp(`\\{\\{${placeholder}\\}\\}`, 'g');
      result = result.replace(regex, JSON.stringify(value));
    }
    
    return JSON.parse(result);
  }
}
