/**
 * SDD Status Tool - Template-based approach with Mermaid diagrams
 * - Uses pre-installed status template from database
 * - Returns template with Cursor AI instructions for filling
 * - Cursor AI fills template and saves using sdd_db_filler
 * - Generates beautiful Mermaid diagrams for status visualization
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs';
import * as path from 'path';
import { RobustDatabaseService } from '../database/RobustDatabaseService.js';
import { JsonRepairUtility } from '../utils/JsonRepairUtility.js';

type AnalysisKind = 'conflicts' | 'dependencies' | 'merge' | 'overview' | 'comprehensive';

export class SDDStatusTool {
  private basePath: string;
  private db: RobustDatabaseService;

  constructor(basePath: string = process.cwd(), db?: RobustDatabaseService) {
    this.basePath = path.resolve(basePath);
    this.db = db || new RobustDatabaseService(path.join(this.basePath, 'sdd.db'));
  }

  /**
   * Initialize database if needed (create schema only)
   */
  private async initializeDatabaseIfNeeded(): Promise<void> {
    try {
      // Touch the database to ensure schema is created
      await this.db.get_all_features_robust();
    } catch (error) {
      console.error('SDDStatusTool: Database initialization failed:', error);
      throw error;
    }
  }


  getToolDefinition(): Tool {
    return {
      name: 'sdd_status',
      description: 'Status reporting tool - Get status report for a feature. Only call when user specifically requests status. Do NOT call before sdd_implement.',
      inputSchema: {
        type: 'object',
        properties: {
          featureId: {
            type: 'string',
            description: 'Feature ID to get status for (optional: uses most recent feature if not provided)',
            pattern: '^[a-zA-Z0-9-_]+$'
          },
          platform: {
            type: 'string',
            description: 'Target platform for status reporting (mobile, web, desktop, backend, ai)',
            enum: ['mobile', 'web', 'desktop', 'backend', 'ai'],
            default: 'web'
          },
          includeDiagrams: {
            type: 'boolean',
            description: 'Include Mermaid diagrams in status report',
            default: true
          },
          includeAnalysis: {
            type: 'boolean',
            description: 'Include technical analysis in status report',
            default: false
          },
          analysisType: {
            type: 'string',
            enum: ['conflicts', 'dependencies', 'merge', 'overview', 'comprehensive'],
            description: 'Type of analysis to perform when includeAnalysis is true',
            default: 'comprehensive'
          }
        },
        required: []
      }
    };
  }

  async execute(input: any): Promise<any> {
    try {
      // Initialize database if needed
      await this.initializeDatabaseIfNeeded();

      // Validate input
      const validation = this.validateInput(input);
      if (!validation.valid) {
        return this.error(validation.error!);
      }
      const validatedInput = validation.data;

      // Resolve feature ID
      const featureId = await this.resolveFeatureId(validatedInput.featureId);
      const feature = await this.db.get_feature_robust(featureId);
      if (!feature) {
        return this.error(`Feature '${featureId}' not found in database.`);
      }
      const platform = validatedInput.platform || 'web';
      
      
      // Stage changes
      // Git operations removed - no longer needed
      
      // Build success message with optional analysis
      let successMessage = `
Please create a comprehensive status report in specs/status.md file with beautiful mermaid diagrams including:

1. FEATURE DETAILS:
   1.1. Feature Name: ${feature.name}
   1.2. Platform: ${platform.toUpperCase()}`;

      // Get data from database instead of filesystem with JSON repair
      const spec = await this.db.get_specification_robust(featureId);
      const tasks = await this.db.get_tasks_robust(featureId);
      const plan = await this.db.get_plan_robust(featureId);
      const status = await this.db.get_status_robust(featureId);

      // Use shared utility to safely extract and repair JSON content
      const repairedSpec = JsonRepairUtility.extractDbJsonContent(spec, 'SDDStatusTool');
      const repairedTasks = JsonRepairUtility.extractDbJsonContent(tasks, 'SDDStatusTool');
      const repairedPlan = JsonRepairUtility.extractDbJsonContent(plan, 'SDDStatusTool');

      successMessage += `

2. CURSOR AI TASKS:
   2.1. Use the following database content as context (DO NOT read files from filesystem):
      2.1.1. SPECIFICATION: ${repairedSpec ? JSON.stringify(repairedSpec, null, 2) : 'No specification found'}
      2.1.2. TASKS: ${repairedTasks?.markdownContent || 'No tasks found'}
      2.1.3. PLAN: ${repairedPlan ? JSON.stringify(repairedPlan, null, 2) : 'No plan found'}
      2.1.4. CURRENT STATUS: ${status?.content || 'No status found'}
   2.2. Follow the specific instructions provided for each section including:
      2.2.1. Executive summary
      2.2.2. Constitutional gates status
      2.2.3. Implementation progress
      2.2.4. Platform-specific status
      2.2.5. API-First status
      2.2.6. **UI/INTERFACE STYLING STATUS**: Check styling framework setup and UI component styling
      2.2.7. **UI-API INTEGRATION STATUS**: Check frontend-backend connection and API integration
      2.2.8. Quality metrics
      2.2.9. Risk assessment
      2.2.10. Next steps`;

      successMessage += `

   2.3. Create the final status.md file with filled content in specs/status.md
      2.3.1. The file MUST be created in the correct location: specs/status.md
      2.3.2. IMPORTANT: You must create the markdown file manually with proper markdown formatting
      2.3.3. Use the markdown conversion guide below to format the content properly

   2.4. MARKDOWN CONVERSION GUIDE:
   To create the status.md file, follow this structure:
   
   # 📊 Status Report: [Feature Name]
   
   ## 📈 Executive Summary
   [Provide high-level overview of current status]
   
   ## 🚪 Constitutional Gates Status
   ### [Gate Name]
   **Status:** ✅ PASSED / ❌ FAILED / ⏳ IN PROGRESS
   **Description:** [Gate description]
   **Details:** [Specific details about gate status]
   
   ## 🎯 Implementation Progress
   ### Phase 1: [Phase Name]
   **Status:** ✅ COMPLETED / ⏳ IN PROGRESS / ❌ BLOCKED
   **Progress:** [X]% complete
   **Tasks:** [List of completed/pending tasks]
   
   ## 🌐 Platform-Specific Status
   **Platform:** [Platform name]
   **Status:** [Platform-specific status]
   
   ## 🔗 API-First Status
   **API Design:** ✅ COMPLETED / ⏳ IN PROGRESS
   **API Implementation:** ✅ COMPLETED / ⏳ IN PROGRESS
   **API Testing:** ✅ COMPLETED / ⏳ IN PROGRESS
   
   ## 🎨 UI/Interface Styling Status
   **Styling Framework:** [Framework name and status]
   **UI Components:** [Component status]
   
   ## 🔌 UI-API Integration Status
   **Frontend-Backend Connection:** ✅ WORKING / ❌ BROKEN
   **API Integration:** [Integration status]
   
   ## 📊 Quality Metrics
   **Test Coverage:** [X]%
   **Code Quality:** [Quality metrics]
   **Performance:** [Performance metrics]
   
   ## ⚠️ Risk Assessment
   **High Risks:** [List high risks]
   **Medium Risks:** [List medium risks]
   **Mitigation:** [Risk mitigation strategies]
   
   ## 🎯 Next Steps
   [List immediate next steps and priorities]
   
   ### CRITICAL FORMATTING RULES:
   - Always use blank lines between sections
   - Use emojis for visual clarity
   - Use **bold** for labels and status indicators
   - Use ✅ ❌ ⏳ for status indicators
   - Add blank lines between different sections for readability

   2.5. Call sdd_db_filler tool to save the filled status to database with this exact data structure:
      2.5.1. Data structure:
        {
          "operation": "upsert",
          "table": "status",
          "data": {
            "feature_id": "${featureId}",
            "template_id": "sdd-status-perfect-v1",
            "content": YOUR_FILLED_STATUS_CONTENT_AS_JSON_OBJECT
          }
        }
      2.5.2. CRITICAL: Replace 'YOUR_FILLED_STATUS_CONTENT_AS_JSON_OBJECT' with the actual filled status content from the template above
      2.5.3. The content should be the JSON object you created by filling the template, NOT the template with instructions`;

      const outputData = {
        success: true,
        nextStep: successMessage
      };
      return outputData;
    } catch (error) {
      console.error('[sdd_status] ERROR:', error);
      return this.error(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }

 
  private validateInput(input: any): { valid: boolean; error?: string; data?: any } {
    const { featureId, platform, includeDiagrams, includeAnalysis, analysisType, compareWith } = input;
    
    if (featureId && typeof featureId !== 'string') {
      return { valid: false, error: 'featureId must be a string' };
    }
    
    if (platform && !['mobile', 'web', 'desktop', 'backend', 'ai'].includes(platform)) {
      return { valid: false, error: 'platform must be one of: mobile, web, desktop, backend, ai' };
    }
    
    if (includeDiagrams !== undefined && typeof includeDiagrams !== 'boolean') {
      return { valid: false, error: 'includeDiagrams must be a boolean' };
    }
    
    if (includeAnalysis !== undefined && typeof includeAnalysis !== 'boolean') {
      return { valid: false, error: 'includeAnalysis must be a boolean' };
    }
    
    if (analysisType && !['conflicts', 'dependencies', 'merge', 'overview', 'comprehensive'].includes(analysisType)) {
      return { valid: false, error: 'analysisType must be one of: conflicts, dependencies, merge, overview, comprehensive' };
    }
    
    if (compareWith && typeof compareWith !== 'string') {
      return { valid: false, error: 'compareWith must be a string' };
    }
    
    return { valid: true, data: { featureId, platform, includeDiagrams, includeAnalysis, analysisType, compareWith } };
  }

  private async resolveFeatureId(inputFeatureId?: string): Promise<string> {
    if (inputFeatureId && typeof inputFeatureId === 'string' && inputFeatureId.trim()) {
      // Validate that the feature exists in database
      const feature = await this.db.get_feature_robust(inputFeatureId.trim());
      if (!feature) {
        throw new Error(`Feature '${inputFeatureId.trim()}' not found in database.`);
      }
      return inputFeatureId.trim();
    }
    
    // If no featureId provided, find most recent feature that has all required components
    const allFeatures = await this.db.get_all_features_robust();
    if (!allFeatures.length) {
      throw new Error('No features found. Please provide featureId or create a feature first using /specify command.');
    }

    // Find a feature that has specification, plan, and tasks (like implement tool)
    for (const feature of allFeatures) {
      try {
        const hasSpec = await this.db.get_specification_robust(feature.id);
        const hasPlan = await this.db.get_plan_robust(feature.id);
        const hasTasks = await this.db.get_tasks_robust(feature.id);
        
        if (hasSpec && hasPlan && hasTasks) {
          return feature.id;
        }
      } catch (error) {
        console.log(`[SDDStatusTool] Error checking feature ${feature.id}:`, error.message);
        continue;
      }
    }

    // If no complete feature found, return the most recent one
    const mostRecentFeature = allFeatures[0];
    return mostRecentFeature.id;
  }



  private normalizeAnalysisType(value: any): AnalysisKind {
    const allowed: AnalysisKind[] = ['conflicts', 'dependencies', 'merge', 'overview', 'comprehensive'];
    return (typeof value === 'string' && allowed.includes(value as AnalysisKind))
      ? (value as AnalysisKind)
      : 'comprehensive';
  }



  /**
   * Determine platform from specification and plan data
   */
  private determinePlatform(specData: any, planData: any): string {
    // Try to determine platform from various sources
    // Note: specData and planData contain raw markdown content, not JSON

    // Try to extract platform from markdown content
    if (planData) {
      const planContent = JSON.stringify(planData, null, 2).toLowerCase();
      if (planContent.includes('platform: mobile') || planContent.includes('mobile platform')) {
        return 'mobile';
      }
      if (planContent.includes('platform: desktop') || planContent.includes('desktop platform')) {
        return 'desktop';
      }
      if (planContent.includes('platform: backend') || planContent.includes('backend platform')) {
        return 'backend';
      }
      if (planContent.includes('platform: ai') || planContent.includes('ai platform')) {
        return 'ai';
      }
    }

    if (specData) {
      const specContent = JSON.stringify(specData, null, 2).toLowerCase();
      if (specContent.includes('platform: mobile') || specContent.includes('mobile platform')) {
        return 'mobile';
      }
      if (specContent.includes('platform: desktop') || specContent.includes('desktop platform')) {
        return 'desktop';
      }
      if (specContent.includes('platform: backend') || specContent.includes('backend platform')) {
        return 'backend';
      }
      if (specContent.includes('platform: ai') || specContent.includes('ai platform')) {
        return 'ai';
      }
    }

    // Default to web if not specified
    return 'web';
  }

  private error(message: string) {
    return { success: false, error: 'STATUS_FAILED', message };
  }
}
