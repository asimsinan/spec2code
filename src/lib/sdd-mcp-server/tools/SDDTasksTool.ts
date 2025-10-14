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
      description: 'Generate task breakdown from the most recent feature specification. Creates Markdown file with all 73 tasks (70 + 3 design tasks). Automatically detects platform and uses latest feature from database. No parameters needed.',
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
- Total Tasks: 73 tasks (70 implementation + 3 design tasks)
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
- **Total Tasks**: 73 (70 implementation + 3 design)
- **Status**: [template_data.metadata.status]

🚨 CRITICAL: Phase headers MUST be EXACTLY this format (no emojis, no task counts):
## Phase 1: Foundations
## Phase 2: Core Implementation
## Phase 3: UI Development
## Phase 4: Testing & Deployment
### 🎨 Design Tasks
### DESIGN-001: Design System Foundation Setup
- **Description**: [template_data.designTasks.designTask001.description]
**TDD Phase**: [template_data.designTasks.designTask001.tddPhase]
**Sub Phase**: [template_data.designTasks.designTask001.subPhase]
- **Dependencies**: [template_data.designTasks.designTask001.dependencies]
- **Requirements**: [template_data.designTasks.designTask001.requirements]
**Acceptance Criteria**: [template_data.designTasks.designTask001.acceptanceCriteria]
**Estimated Duration**: [template_data.designTasks.designTask001.estimatedDuration]
**Estimated LOC**: [template_data.designTasks.designTask001.estimatedLOC]
**Constitutional Compliance**: [template_data.designTasks.designTask001.constitutionalCompliance]
**Parallelizable**: [template_data.designTasks.designTask001.parallelizable]
**Verification**: [template_data.designTasks.designTask001.verification]

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

[Repeat this pattern for ALL 73 tasks using the template data above - tasks are in arrays, not objects]

## Phase 2: Core Implementation
### 🎨 Design Tasks
### DESIGN-002: Modern UI Components Implementation
[Use template_data.designTasks.designTask002.* properties with correct format: ### DESIGN-002: title, then **Property**: value format]

### 📋 Implementation Tasks
[Use template_data.taskPhases.phase2.tasks[0] to tasks[20] array elements with correct format: ### TASK-XXX: title, then **Property**: value format]

## Phase 3: UI Development
### 🎨 Design Tasks
### DESIGN-003: Visual Enhancement and Polish
[Use template_data.designTasks.designTask003.* properties with correct format: ### DESIGN-003: title, then **Property**: value format]

### 📋 Implementation Tasks
[Use template_data.taskPhases.phase3.tasks[0] to tasks[15] array elements with correct format: ### TASK-XXX: title, then **Property**: value format]

## Phase 4: Testing & Deployment
### 📋 Implementation Tasks
[Use template_data.taskPhases.phase4.tasks[0] to tasks[9] array elements with correct format: ### TASK-XXX: title, then **Property**: value format]

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
          taskCount: 73
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
  private async fillTasksTemplate(template: any, specData: any): Promise<any> {
    try {
      const platform = this.detectPlatformFromSpec(specData);
      
      // Generate design tasks
      const designTasks = this.generateDesignTasks(platform, specData);
      
      // Fill template with actual data
      const filledTemplate = {
        ...template,
        metadata: {
          ...template.metadata,
          generated: new Date().toISOString().split('T')[0],
          status: 'Draft',
          phaseProfile: '4-phase-atomic-verified-with-design',
          totalTasks: 73, // 70 + 3 design tasks
          phase1Tasks: 26, // 25 + 1 design task
          phase2Tasks: 21, // 20 + 1 design task
          phase3Tasks: 16, // 15 + 1 design task
          phase4Tasks: 10,
          platform: platform,
          generatedFrom: `database (${specData.metadata?.name || 'unknown'})`,
          designTasksIncluded: true,
          designTasksCount: designTasks.length
        },
        // Add design tasks to the template
        designTasks: designTasks
      };

      return filledTemplate;
    } catch (error) {
      console.error('Error filling tasks template:', error);
      return template;
    }
  }

  /**
   * Generate design-specific tasks based on platform and requirements
   */
  private generateDesignTasks(platform: string, specData: any): any[] {
    const designTasks = [];
    
    // Design System Tasks (Phase 1)
    designTasks.push({
      id: 'DESIGN-001',
      title: 'Design System Foundation Setup',
      description: 'Set up comprehensive design system with modern UI patterns, color schemes, typography, and component library',
      phase: 1,
      tddPhase: 'Design System',
      subPhase: 'Foundation',
      requirements: [
        'Modern color palette with proper contrast ratios',
        'Professional typography hierarchy',
        'Design tokens for spacing, colors, and effects',
        'Component library architecture',
        'Visual design guidelines'
      ],
      acceptanceCriteria: [
        'Design system documented and implemented',
        'Color palette meets WCAG accessibility standards',
        'Typography hierarchy established',
        'Component library structure created',
        'Design tokens system implemented'
      ],
      estimatedDuration: '2-4 hours',
      estimatedLOC: 200,
      constitutionalCompliance: 'Design System Gate',
      parallelizable: true
    });

    // Advanced UI Components (Phase 2)
    designTasks.push({
      id: 'DESIGN-002',
      title: 'Modern UI Components Implementation',
      description: 'Implement sophisticated UI components with modern design patterns, animations, and interactions',
      phase: 2,
      tddPhase: 'UI Components',
      subPhase: 'Modern Design',
      requirements: [
        'Card-based layouts with shadows and gradients',
        'Interactive elements with hover states',
        'Modern button designs with animations',
        'Sophisticated form styling',
        'Professional navigation patterns'
      ],
      acceptanceCriteria: [
        'All components follow modern design patterns',
        'Interactive elements have proper hover states',
        'Animations and transitions implemented',
        'Responsive design across all breakpoints',
        'Visual hierarchy clearly established'
      ],
      estimatedDuration: '3-6 hours',
      estimatedLOC: 400,
      constitutionalCompliance: 'Modern UI Gate',
      parallelizable: true
    });

    // Visual Enhancement Tasks (Phase 3)
    designTasks.push({
      id: 'DESIGN-003',
      title: 'Visual Enhancement and Polish',
      description: 'Apply visual enhancements, micro-interactions, and design polish to create sophisticated user experience',
      phase: 3,
      tddPhase: 'Visual Polish',
      subPhase: 'Enhancement',
      requirements: [
        'Micro-interactions and animations',
        'Visual depth with shadows and layering',
        'Smooth transitions between states',
        'Loading states and feedback',
        'Error state styling'
      ],
      acceptanceCriteria: [
        'Micro-interactions enhance user experience',
        'Visual depth creates engaging interface',
        'Smooth transitions implemented',
        'Loading and error states styled',
        'Overall design feels polished and professional'
      ],
      estimatedDuration: '2-3 hours',
      estimatedLOC: 300,
      constitutionalCompliance: 'Visual Polish Gate',
      parallelizable: true
    });

    return designTasks;
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
        
        // Add design tasks for this phase if they exist
        const phaseDesignTasks = templateData.designTasks?.filter((task: any) => task.phase === parseInt(phaseKey.replace('phase', ''))) || [];
        if (phaseDesignTasks.length > 0) {
          markdown += `### 🎨 Design Tasks\n\n`;
          phaseDesignTasks.forEach((task: any) => {
            markdown += `#### ${task.id}: ${task.title}\n\n`;
            markdown += `- **Description**: ${task.description}\n`;
            markdown += `- **TDD Phase**: ${task.tddPhase}\n`;
            markdown += `- **Sub Phase**: ${task.subPhase}\n`;
            markdown += `- **Dependencies**: None\n`;
            markdown += `- **Requirements**: ${task.requirements?.join(', ') || 'Design system implementation'}\n`;
            markdown += `- **Acceptance Criteria**: ${task.acceptanceCriteria?.join(', ') || 'Design requirements met'}\n`;
            markdown += `- **Estimated Duration**: ${task.estimatedDuration}\n`;
            markdown += `- **Estimated LOC**: ${task.estimatedLOC}\n`;
            markdown += `- **Constitutional Compliance**: ${task.constitutionalCompliance}\n`;
            markdown += `- **Parallelizable**: ${task.parallelizable ? 'Yes' : 'No'}\n`;
            markdown += `- **Verification**: Design implementation verified and tested\n\n`;
          });
        }
        
        markdown += `### 📋 Implementation Tasks\n\n`;
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