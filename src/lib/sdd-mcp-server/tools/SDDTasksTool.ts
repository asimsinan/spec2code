/**
 * SDD Tasks Tool - Generates comprehensive task breakdown from feature plan
 * 
 * This tool creates a detailed task breakdown with:
 * - 79 atomic tasks across 4 phases
 * - TDD order: Contract → Integration → E2E → Unit → Implementation → UI-API Integration
 * - Explicit verification requirements for each task
 * - Constitutional gate compliance tracking
 * - Duration estimation and project planning capabilities
 * - Identifies parallel execution opportunities
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

import * as path from 'path';
import { RobustDatabaseService } from '../database/RobustDatabaseService.js';
import { JsonRepairUtility } from '../utils/JsonRepairUtility.js';


export class SDDTasksTool {
  private db: RobustDatabaseService;
  private basePath: string;
  private templateCache: Map<string, any> = new Map();
  private platformCache: Map<string, string> = new Map();

  constructor(basePath: string = process.cwd()) {
    this.basePath = path.resolve(basePath);
    // Use the database file in the project root
    const dbPath = path.join(this.basePath, 'sdd.db');
    this.db = new RobustDatabaseService(dbPath);
  }

  getToolDefinition(): Tool {
    return {
      name: 'sdd_tasks',
      description: 'Generate task breakdown from the most recent feature specification. Creates Markdown with all 72 tasks across four phases. Automatically detects platform and uses latest feature from database. No parameters needed.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    };
  }

  async execute(input: any): Promise<any> {       
    try {
      // Always get the most recent feature
      let featureId: string;
      try {
        featureId = await this.resolveFeatureId(null); // null means get most recent
      } catch (error) {
        return this.error(error instanceof Error ? error.message : 'Failed to get most recent feature');
      }
      
      const feature = await this.db.get_feature_robust(featureId);
      if (!feature) {
        return this.error(`Feature '${featureId}' not found in database.`);
      }


      // Check if specification exists (prerequisite)
      const specData = await this.db.get_specification_robust(featureId);
      if (!specData) {
        return this.error(`Specification not found for feature: ${featureId}. Please create a specification first using /spec command.`);
      }

      // Repair and parse the specification data
      const repairedSpecData = JsonRepairUtility.extractDbJsonContent(specData, 'SDDTasksTool');

      // Prepare tasks template
      let templateWithInstructions: any;
      try {
        const fillResult = await this.fillTasksTemplate(
          await this.prepareTasksTemplate(),
          repairedSpecData
        );
        templateWithInstructions = fillResult;
      } catch (error) {
        console.error('SDDTasksTool: Error preparing template:', error);
        return this.error('Failed to prepare tasks template. Please run sdd_specify first to install templates.');
      }

      // Create hybrid success message: detailed template + condensed structure guide
      const successMessage = `📋 TASK: Create tasks.md file in specs/tasks.md directory using the detailed template data provided below.

📊 PROJECT DETAILS:
- Feature: ${templateWithInstructions.metadata?.generatedFrom || 'Latest feature'}
- Platform: ${templateWithInstructions.metadata?.platform || 'web'}
- Total Tasks: ${templateWithInstructions.metadata?.totalTasks || 79} tasks
- Phases: 4 phases with atomic task structure

🎯 TASK GENERATION FOCUS:
This tool generates task breakdown from specification requirements (not implementation plan). Tasks are requirements-based and follow TDD order: Contract → Integration → E2E → Unit → Implementation.

📋 DETAILED TEMPLATE DATA FOR AI PROCESSING:
${JSON.stringify(templateWithInstructions, null, 2)}

📝 DETAILED MARKDOWN STRUCTURE GUIDE:
Create tasks.md with this comprehensive structure:

# 📋 SDD Tasks Breakdown

## 📊 Metadata
- **Generated**: [template_data.metadata.generated]
- **Platform**: [template_data.metadata.platform]
- **Total Tasks**: [template_data.metadata.totalTasks]
- **Status**: [template_data.metadata.status]

🚨 CRITICAL: Use phase titles EXACTLY as provided in template_data.taskPhases[*].title (do not alter wording).

### 📋 Implementation Tasks
### TASK-001: [template_data.taskPhases.phase1.tasks[0].title]
- **Description**: [template_data.taskPhases.phase1.tasks[0].description]
**TDD Phase**: [template_data.taskPhases.phase1.tasks[0].tddPhase]
**Sub Phase**: [template_data.taskPhases.phase1.tasks[0].subPhase]
- **Dependencies**: [template_data.taskPhases.phase1.tasks[0].dependencies]
- **Requirements**: [template_data.taskPhases.phase1.tasks[0].requirements]
**Acceptance Criteria**: [template_data.taskPhases.phase1.tasks[0].acceptanceCriteria]
**Estimated Duration**: [template_data.taskPhases.phase1.tasks[0].estimatedDuration]
**Estimated LOC**: [template_data.taskPhases.phase1.tasks[0].estimatedLOC]
**Constitutional Compliance**: [template_data.taskPhases.phase1.tasks[0].constitutionalCompliance]
**Parallelizable**: [template_data.taskPhases.phase1.tasks[0].parallelizable]
**Verification**: [template_data.taskPhases.phase1.tasks[0].verification]

[Repeat this pattern for ALL ${templateWithInstructions.metadata?.totalTasks || 79} tasks using the template data above - tasks are in arrays, not objects]

## [template_data.taskPhases.phase2.title]
### 📋 Implementation Tasks
[Use template_data.taskPhases.phase2.tasks[0] to tasks[20] array elements with correct format: ### TASK-XXX: title, then **Property**: value format]

## [template_data.taskPhases.phase3.title]
### 📋 Implementation Tasks
[Use template_data.taskPhases.phase3.tasks[0] to tasks[15] array elements with correct format: ### TASK-XXX: title, then **Property**: value format]

## [template_data.taskPhases.phase4.title]
### 📋 Implementation Tasks
[Use template_data.taskPhases.phase4.tasks[0] to tasks[15] array elements with correct format: ### TASK-XXX: title, then **Property**: value format]

🚨 CRITICAL ACTION REQUIRED: YOU MUST CREATE THE tasks.md FILE NOW
1. Create file: specs/tasks.md
2. Fill template with actual task content using the detailed structure above
3. Use ALL template data properties for each task (description, acceptance criteria, verification, etc.)
4. 🚨 PHASE HEADERS MUST BE EXACTLY: "## Phase 1: Foundations" (NO emojis, NO task counts)
5. Ensure implement tool gets detailed task information for proper execution
6. After creating tasks.md, run sdd_implement phase=1 to start implementation

🚨 IMMEDIATE ACTION REQUIRED 🚨
DO NOT JUST ACKNOWLEDGE - CREATE THE FILE NOW!`;

        const outputData = {
          success: true,
          nextStep: successMessage,
          taskCount: templateWithInstructions.metadata?.totalTasks || 79
        };
        return outputData;
    } catch (error) {
      console.error('[sdd_tasks] ERROR:', error);
      return this.error(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }

  /**
   * Resolve feature ID - get most recent if null
   */
  private async resolveFeatureId(inputFeatureId?: string): Promise<string> {
    if (inputFeatureId) {
      return inputFeatureId;
    }

    // Get most recent feature with spec, plan, and tasks
    const features = await this.db.get_all_features_robust();
    if (features.length === 0) {
      throw new Error('No features found in database. Please create a feature first using /spec command.');
    }

    // Find most recent feature that has spec, plan, and tasks
    for (const feature of features) {
      try {
        const spec = await this.db.get_specification_robust(feature.id);
        const plan = await this.db.get_plan_robust(feature.id);
        const tasks = await this.db.get_tasks_robust(feature.id);
        
        if (spec && plan && tasks) {
          return feature.id;
        }
    } catch (error) {
        // Continue to next feature
        continue;
      }
    }

    // If no feature has all three, return the most recent one
    return features[0].id;
  }

  /**
   * Prepare tasks template from database with caching
   */
  private async prepareTasksTemplate(): Promise<any> {
    const cacheKey = 'sdd-tasks-atomic-v6';
    
    // Check cache first
    if (this.templateCache.has(cacheKey)) {
      return this.templateCache.get(cacheKey);
    }

    // Get the latest 79-task template from database
    const templateData = await this.db.get_task_template_robust('sdd-tasks-atomic-v6');
    
    if (!templateData) {
      throw new Error('Tasks template not found in database. Please run sdd_specify first to install templates.');
    }

    // Extract and parse the template content
    const templateContent = JsonRepairUtility.extractDbJsonContent(templateData, 'SDDTasksTool');
    
    if (!templateContent) {
      throw new Error('Failed to parse tasks template from database.');
    }

    // Cache the result
    this.templateCache.set(cacheKey, templateContent);


    return templateContent;
  }

  /**
   * Fill tasks template with actual data
   */
  private async fillTasksTemplate(template: any, specData: any): Promise<any> {
    try {
      const platform = this.detectPlatformFromSpec(specData);
      
      // Fill template with actual data
      const filledTemplate = {
        ...template,
        metadata: {
          ...template.metadata,
          generated: new Date().toISOString().split('T')[0],
          status: 'Draft',
          phaseProfile: '4-phase-atomic-verified-with-design',
          totalTasks: template.metadata?.totalTasks || 72,
          phase1Tasks: template.taskPhases?.phase1?.taskCount || 25,
          phase2Tasks: template.taskPhases?.phase2?.taskCount || 20,
          phase3Tasks: template.taskPhases?.phase3?.taskCount || 15,
          phase4Tasks: template.taskPhases?.phase4?.taskCount || 12,
          platform: platform,
          generatedFrom: `database (${specData.metadata?.name || 'unknown'})`,
          designTasksIncluded: !!template.designTasks,
          designTasksCount: Array.isArray(template.designTasks) ? template.designTasks.length : Object.keys(template.designTasks || {}).length
        },
        // Preserve template-provided design tasks verbatim
        designTasks: template.designTasks
      };

      return filledTemplate;
    } catch (error) {
      console.error('Error filling tasks template:', error);
      return template;
    }
  }

  

  /**
   * Detect platform from specification data with caching and optimization
   */
  private detectPlatformFromSpec(specData: any): string {
    try {
      // Create cache key from spec metadata
      const cacheKey = specData.metadata?.name || JSON.stringify(specData).slice(0, 100);
      
      // Check cache first
      if (this.platformCache.has(cacheKey)) {
        return this.platformCache.get(cacheKey)!;
      }

      // Optimized platform detection - avoid expensive JSON.stringify
      const description = specData.functionalRequirements?.description?.toLowerCase() || '';
      const userStories = JSON.stringify(specData.comprehensiveUserStories || {}).toLowerCase();
      const combinedText = `${description} ${userStories}`;

      let platform = 'web'; // Default platform
      
      // Use Set for O(1) lookups instead of multiple includes()
      const webKeywords = new Set(['web', 'frontend', 'react', 'vue', 'angular', 'nextjs']);
      const mobileKeywords = new Set(['mobile', 'ios', 'android', 'react native', 'flutter']);
      const desktopKeywords = new Set(['desktop', 'electron', 'tauri']);
      const backendKeywords = new Set(['backend', 'api', 'server', 'express', 'fastapi']);
      const aiKeywords = new Set(['ai', 'ml', 'machine learning', 'llm']);

      if (this.containsAnyKeyword(combinedText, mobileKeywords)) {
        platform = 'mobile';
      } else if (this.containsAnyKeyword(combinedText, desktopKeywords)) {
        platform = 'desktop';
      } else if (this.containsAnyKeyword(combinedText, backendKeywords)) {
        platform = 'backend';
      } else if (this.containsAnyKeyword(combinedText, aiKeywords)) {
        platform = 'ai';
      } else if (this.containsAnyKeyword(combinedText, webKeywords)) {
        platform = 'web';
      }

      // Cache the result
      this.platformCache.set(cacheKey, platform);
      
      return platform;
    } catch (error) {
      console.error('[SDDTasksTool] Error in platform detection:', error);
      return 'web'; // Default platform in case of error
    }
  }

  /**
   * Optimized keyword detection using Set for O(1) lookups
   */
  private containsAnyKeyword(text: string, keywords: Set<string>): boolean {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Success response helper
   */
  private success(message: string, data?: any): any {
    return {
      success: true,
      nextStep: message,
      ...data
    };
  }

  /**
   * Error response helper
   */
  private error(message: string): any {
        return {
      success: false,
      error: message
    };
  }
}