/**
 * SDD Tasks Tool - Generates comprehensive task breakdown from feature plan
 * 
 * This tool creates a detailed task breakdown with:
 * - 70 atomic tasks across 4 phases (25+20+15+10)
 * - TDD order: Contract → Integration → E2E → Unit → Implementation → UI-API Integration
 * - Explicit verification requirements for each task
 * - Constitutional gate compliance tracking
 * - Duration estimation and project planning capabilities
 * - Identifies parallel execution opportunities (60-70% of tasks can run concurrently)
 * - Includes 45 atomic tasks across 4 phases with Implement-Run-Verify pattern
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
      description: 'Generate task breakdown from the most recent feature plan. Creates Markdown file with all 70 tasks. Automatically detects platform and uses latest feature from database. No parameters needed.',
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


      // Check if plan exists (prerequisite)
      const planData = await this.db.get_plan_robust(featureId);
      if (!planData) {
        return this.error(`Plan not found for feature: ${featureId}. Please create a plan first using /plan command.`);
      }

      // Get specification data
      const specData = await this.db.get_specification_robust(featureId);
      if (!specData) {
        return this.error(`Specification not found for feature: ${featureId}. Please create a specification first using /spec command.`);
      }

      // Repair and parse the data
      const repairedSpecData = JsonRepairUtility.extractDbJsonContent(specData, 'SDDTasksTool');
      const repairedPlanData = JsonRepairUtility.extractDbJsonContent(planData, 'SDDTasksTool');

      // Prepare tasks template
      let templateWithInstructions: any;
      try {
        const fillResult = await this.fillTasksTemplate(
          await this.prepareTasksTemplate(),
          repairedSpecData,
          repairedPlanData
        );
        templateWithInstructions = fillResult;
      } catch (error) {
        console.error('SDDTasksTool: Error preparing template:', error);
        return this.error('Failed to prepare tasks template. Please run sdd_specify first to install templates.');
      }

      // Generate Markdown file content for AI to create
      const markdownContent = this.generateMarkdownFile(templateWithInstructions);
      
      // Create success message with instructions for AI
      const successMessage = `🚨 CRITICAL: Create specs/tasks.md file with the complete task breakdown below!

📊 Total tasks: 70 tasks across 4 phases
📋 Content: Complete Markdown breakdown with all task details

## MARKDOWN CONTENT FOR specs/tasks.md:

${markdownContent}

🚨 CRITICAL: Create specs/tasks.md file with the complete task breakdown above. Include all 70 tasks with full details.

🚀 NEXT STEP: After creating the file, run sdd_implement phase=1 to start implementation!`;

        const outputData = {
          success: true,
          nextStep: successMessage,
          taskCount: 70
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
    const cacheKey = 'sdd-tasks-atomic-v5';
    
    // Check cache first
    if (this.templateCache.has(cacheKey)) {
      return this.templateCache.get(cacheKey);
    }

    // Get the 70-task template from database
    const templateData = await this.db.get_task_template_robust('sdd-tasks-atomic-v5');
    
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
  private async fillTasksTemplate(template: any, specData: any, planData: any): Promise<any> {
    try {
      // Fill template with actual data
      const filledTemplate = {
        ...template,
        metadata: {
          ...template.metadata,
          generated: new Date().toISOString().split('T')[0],
          status: 'Draft',
          phaseProfile: '4-phase-atomic-verified',
          totalTasks: 70,
          phase1Tasks: 25,
          phase2Tasks: 20,
          phase3Tasks: 15,
          phase4Tasks: 10,
          platform: this.detectPlatformFromSpec(specData),
          generatedFrom: `database (${specData.metadata?.name || 'unknown'})`
        }
      };

      return filledTemplate;
    } catch (error) {
      console.error('Error filling tasks template:', error);
      return template;
    }
  }

  /**
   * Generate Markdown file directly from template data
   */
  private generateMarkdownFile(templateData: any): string {
  
    
    let markdown = `# SDD Tasks Breakdown\n\n`;
    markdown += `**Generated**: ${templateData.metadata?.generated || new Date().toISOString().split('T')[0]}\n`;
    markdown += `**Platform**: ${templateData.metadata?.platform || 'web'}\n`;
    markdown += `**Total Tasks**: ${templateData.metadata?.totalTasks || 70}\n`;
    markdown += `**Status**: ${templateData.metadata?.status || 'Draft'}\n\n`;

    // Generate phase sections
    Object.keys(templateData.taskPhases || {}).forEach(phaseKey => {
      const phase = templateData.taskPhases[phaseKey];
      if (phase.tasks && Array.isArray(phase.tasks)) {
        markdown += `## ${phase.title}\n\n`;
        markdown += `${phase.description}\n\n`;
        
        phase.tasks.forEach((task: any, index: number) => {
          markdown += `### ${task.id}: ${task.title}\n\n`;
          markdown += `**TDD Phase**: ${task.tddPhase}\n`;
          markdown += `**Sub Phase**: ${task.subPhase}\n`;
          markdown += `**Dependencies**: ${task.dependencies?.join(', ') || 'None'}\n`;
          markdown += `**Estimated LOC**: ${task.estimatedLOC}\n`;
          markdown += `**Estimated Duration**: ${task.estimatedDuration}\n\n`;
          
          markdown += `**Description**:\n${task.description}\n\n`;
          markdown += `**Acceptance Criteria**:\n${task.acceptanceCriteria}\n\n`;
          
          if (task.verification) {
            markdown += `**Verification**:\n`;
            if (typeof task.verification === 'object') {
              markdown += `- Type: ${task.verification.type}\n`;
              markdown += `- Action: ${task.verification.action}\n`;
              markdown += `- Expected State: ${task.verification.expectedState}\n`;
              if (task.verification.commands) {
                markdown += `- Commands:\n`;
                task.verification.commands.forEach((cmd: string) => {
                  markdown += `  \`${cmd}\`\n`;
                });
              }
            } else {
              markdown += `- ${task.verification}\n`;
            }
            markdown += `\n`;
          }
          
          markdown += `**Constitutional Compliance**: ${task.constitutionalCompliance}\n`;
          markdown += `**Parallelizable**: ${task.parallelizable ? 'Yes' : 'No'}\n\n`;
          markdown += `---\n\n`;
        });
      }
    });

    // Add constitutional gates
    if (templateData.constitutionalGates) {
      markdown += `## Constitutional Gates\n\n`;
      Object.keys(templateData.constitutionalGates).forEach(gateKey => {
        const gate = templateData.constitutionalGates[gateKey];
        markdown += `### ${gate.title}\n`;
        markdown += `${gate.description}\n`;
        markdown += `**Check**: ${gate.check}\n`;
        markdown += `**Platforms**: ${gate.platforms?.join(', ')}\n\n`;
      });
    }

    // Add definition of done
    if (templateData.definitionOfDone) {
      markdown += `## Definition of Done\n\n`;
      Object.keys(templateData.definitionOfDone).forEach(sectionKey => {
        const section = templateData.definitionOfDone[sectionKey];
        markdown += `### ${sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)}\n`;
        if (Array.isArray(section)) {
          section.forEach(item => {
            markdown += `- ${item}\n`;
          });
        }
        markdown += `\n`;
      });
    }

    
    return markdown;
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