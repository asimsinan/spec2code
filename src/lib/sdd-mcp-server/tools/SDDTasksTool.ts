/**
 * SDD Tasks Tool - Template-based approach with TDD ordering
 * - Uses pre-installed tasks template from database
 * - Returns template with Cursor AI instructions for filling
 * - Cursor AI fills template and saves using sdd_db_filler
 * - Generates beautiful Mermaid diagrams for task flow visualization
 * - Enforces TDD ordering: Contract → Integration → E2E → Unit → Implementation → UI-API Integration
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs';
import * as path from 'path';
import { RobustDatabaseService } from '../database/RobustDatabaseService.js';
import { JsonRepairUtility } from '../utils/JsonRepairUtility.js';

export class SDDTasksTool {
  private basePath: string;
  private db: RobustDatabaseService;

  constructor(basePath: string = process.cwd(), db?: RobustDatabaseService) {
    this.basePath = path.resolve(basePath);
    this.db = db || new RobustDatabaseService(path.join(this.basePath, 'sdd.db'));
  }

  /**
   * Initialize database if needed (create schema and install templates)
   */
  private async initializeDatabaseIfNeeded(): Promise<void> {
    try {
      // Touch the database to ensure schema is created
      await this.db.get_all_features();
      
      // Install templates if needed
      await this.ensureTemplatesInstalled();
    } catch (error) {
      console.error('SDDTasksTool: Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Ensure all required templates are installed in the database
   */
  private async ensureTemplatesInstalled(): Promise<void> {
    try {
      // Check if we need to install templates
      const needsTemplates = await this.checkIfTemplatesNeeded();
      
      if (needsTemplates) {  
        await this.installTemplates();
      }
    } catch (error) {
      console.error('SDDTasksTool: Error checking/installing templates:', error);
    }
  }

  /**
   * Check if templates need to be installed
   */
  private async checkIfTemplatesNeeded(): Promise<boolean> {
    try {
      // Check if tasks template exists
      const tasksTemplate = await this.db.get_task_template('sdd-tasks-perfect-v1');
      return !tasksTemplate;
    } catch (error) {
      // If we can't check, assume we need templates
      return true;
    }
  }

  /**
   * Install templates from JSON files
   */
  private async installTemplates(): Promise<void> {
    try {
      // Install spec template
      await this.installTemplate('spec.json', 'spec_templates', 'sdd-spec-perfect-v1');
      
      // Install plan template
      await this.installTemplate('plan.json', 'plan_templates', 'sdd-plan-perfect-v1');
      
      // Install status template
      await this.installTemplate('status.json', 'status_templates', 'sdd-status-perfect-v1');
      
      // Install tasks template
      await this.installTemplate('tasks.json', 'task_templates', 'sdd-tasks-perfect-v1');
      
      
      // Install implement template
    } catch (error) {
      console.error('SDDTasksTool: Error installing templates:', error);
    }
  }

  /**
   * Install a single template from JSON file
   */
  private async installTemplate(
    fileName: string, 
    tableName: string, 
    _templateId: string
  ): Promise<void> {
    try {
      // Look for template file in various locations
      const templatePaths = [
        path.join(this.basePath, 'src', 'templates', fileName),
        path.join(this.basePath, fileName),
        path.join(this.basePath, 'dist', 'lib', 'sdd-mcp-server', 'templates', fileName),
        path.join('/usr/local/lib/sdd-mcp', 'templates', fileName),
        path.join(process.cwd(), 'src', 'templates', fileName)
      ];

      let templatePath = null;
      for (const templatePathCandidate of templatePaths) {
        if (fs.existsSync(templatePathCandidate)) {
          templatePath = templatePathCandidate;
          break;
        }
      }

      if (!templatePath) {
        // Template file not found - returning silently
        return;
      }

      // Read and parse template
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      const templateData = JSON.parse(templateContent);

      // Insert template into database
      this.db.install_template(
        tableName,
        templateData.id,
        templateData.name,
        templateData.version,
        templateData.description,
        templateData.template_data,
        templateData.is_active
      );
    } catch (error) {
      console.error(`SDDTasksTool: Error installing template ${fileName}:`, error);
    }
  }

  getToolDefinition(): Tool {
    return {
      name: 'sdd_tasks',
      description: 'Generate comprehensive task breakdown with TDD ordering, constitutional gates validation, and platform-aware task planning. This tool creates TASK PLANNING DOCUMENTS only (tasks.md) - does NOT create todo list or implementation tasks. This is a standalone tool - do not call other tools after completion.',
      inputSchema: {
        type: 'object',
        properties: {
          featureId: {
            type: 'string',
            description: 'Feature ID to generate tasks for (optional: uses most recent feature if not provided)',
            pattern: '^[a-zA-Z0-9-_]+$'
          },
          platform: {
            type: 'string',
            description: 'Target platform for task planning (mobile, web, desktop, backend, ai)',
            enum: ['mobile', 'web', 'desktop', 'backend', 'ai'],
            default: 'web'
          },
          includeDiagrams: {
            type: 'boolean',
            description: 'Include Mermaid diagrams in task planning',
            default: true
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
      const validatedInput = this.validateInput(input);

      // Resolve feature ID
      const featureId = await this.resolveFeatureId(validatedInput.featureId);
      const feature = await this.db.get_feature(featureId);
      if (!feature) {
        return this.error(`Feature '${featureId}' not found in database.`);
      }

      const platform = validatedInput.platform || 'web';
      const includeDiagrams = validatedInput.includeDiagrams !== false;

      // Check if plan exists (prerequisite)
      const planData = await this.db.get_plan_robust(featureId);
      if (!planData) {
        return this.error(`Plan not found for feature: ${featureId}. Please create a plan first using /plan command.`);
      }

      // Get specification for context (raw data from database)
      const specData = await this.db.get_specification_robust(featureId);
      if (!specData) {
        return this.error(`Specification not found for feature: ${featureId}. Please create a specification first using /specify command.`);
      }

      // Get plan estimates for inheritance (raw data from database)
      const planEstimates = this.extractPlanEstimates(planData);
      
      // Analyze edge cases from specification for task generation
      const edgeCaseAnalysis = this.analyzeEdgeCases(specData);

      // 🚀 CLI REQUIREMENT CHECK: Check if CLI is required
      const cliRequirement = await this.checkCLIRequirement(featureId);

      // Prepare tasks template with Cursor AI instructions
      let templateWithInstructions: any;
      try {
        const fillResult = await this.fillTasksTemplate({
          featureId: featureId,
          featureName: feature.name,
          platform: platform,
          includeDiagrams: includeDiagrams,
          specData: specData,
          planData: planData,
          planEstimates: planEstimates,
          cliRequirement: cliRequirement,
          edgeCaseAnalysis: edgeCaseAnalysis
        });

        if (!fillResult.success) {
          throw new Error(`Failed to prepare tasks template: ${fillResult.error}`);
        }

        templateWithInstructions = fillResult.data;
      } catch (error) {
        console.error('SDDTasksTool: Error preparing template:', error);
        throw error;
      }

      const successMessage = `
🚨 IMPORTANT: DO NOT call any other tools (sdd_implement, sdd_status, etc.) after this. Only complete the tasks creation task.
🚨 SCOPE: This tool creates TASK PLANNING DOCUMENTS only. Do NOT create todo lists, implementation tasks, or code. Only create the tasks.md file.

Template data ready for Cursor AI processing

1. FEATURE DETAILS:
   1.2. Feature Name: ${feature.name}
   1.2. Platform: ${platform.toUpperCase()}
   1.3. Include Diagrams: ${includeDiagrams ? 'Yes' : 'No'}

2. ENHANCED TASKS TEMPLATE PROVIDED:
   The tasks template has been prepared with complete SDD compliance:
   2.1. TDD ordering enforcement (Contract → Integration → E2E → Unit → Implementation → UI-API Integration)
   2.2. All applicable constitutional gates with validation
   2.3. Platform-specific task planning
   2.4. API-First task planning (if applicable)
   2.5. Task dependencies and parallelization markers [P]
   2.6. Beautiful Mermaid diagrams for task flow visualization
   2.7. Definition of Done criteria
   2.8. Traceability to FR-XXX requirements

3. DATABASE STATUS:
   3.1. Feature: ${featureId} (${feature.name})
   3.2. Specification: Available (JSON data from database)
   3.3. Plan: Available (JSON data from database)
   3.4. Plan Estimates: ${planEstimates ? 'Available (JSON data)' : 'Not available'}
   3.5. Phase Data: Available (8 phases with detailed information)
   3.6. Tasks: Ready for generation

4. CURSOR AI TASKS:
   4.1. Process the template data provided below to generate comprehensive task breakdown
   4.2. Replace placeholders ({{...}}) with generated content based on instructions
   4.3. 🚨 IMPORTANT: DO NOT create todo list or implementation tasks. This is task planning phase only - create the tasks document only.
   4.4. IMPORTANT: The specData and planData are JSON objects from database - parse and use the structured data
   4.5. Follow the specific instructions provided for each section including:
      4.5.1. TDD ordering enforcement (Contract → Integration → E2E → Unit → Implementation → UI-API Integration)
      4.5.2. Constitutional gates validation (all applicable gates for task planning)
      4.5.3. Platform-specific task planning for ${platform} platform
      4.5.4. API-First task planning (if applicable for ${platform})
      4.5.5. Task dependencies and parallelization analysis
      4.5.6. Time estimation based on plan estimates (extract from JSON data)
      4.5.7. Beautiful Mermaid diagram generation for:
         4.5.7.1. Task Flow Diagram
         4.5.7.2. TDD Order Diagram
         4.5.7.3. Task Dependencies Diagram
      4.5.8. **MANDATORY UI/INTERFACE STYLING TASKS**: Include styling framework setup and UI component styling tasks
      4.5.9. **MANDATORY UI-API INTEGRATION TASKS**: Include frontend-backend connection and API integration tasks
   4.6. MANDATORY FILE CREATION: Create the final tasks.md file with filled content in specs/tasks.md
       4.6.1. The file MUST be created in the correct location: specs/tasks.md
       4.6.2. IMPORTANT: You must create the markdown file manually from the filled JSON template data using proper markdown formatting
       4.6.3. Use the markdown conversion guide below to format the content properly

5. TEMPLATE DATA FOR AI PROCESSING:
${JSON.stringify(templateWithInstructions, null, 2)}

6. MARKDOWN CONVERSION GUIDE:
   To create the tasks.md file from the JSON template data above, follow this ENHANCED structure for maximum visibility:
   
   # 📋 [template_data.title]
   
   ## 📊 Task Summary
   ---
   
   **Total Phases:** [Count] phases covering complete development lifecycle.
   
   **Total Tasks:** [Count] tasks with clear dependencies and parallelization opportunities.
   
   **Core Phases:** Phase 1-5 covering core implementation ([TASK-001] to [TASK-013]).
   
   **Integration Phases:** Phase 6 covering comprehensive UI-API integration ([TASK-014] to [TASK-018]).
   
   **Platform Phases:** Phase 7 covering platform-specific implementation ([TASK-019] to [TASK-021]).
   
   **API Phases:** Phase 8 covering API-first integration ([TASK-022] to [TASK-025]).
   
   ---
   
   **Note:** All tasks numbered sequentially to ensure AI attention and complete implementation coverage. Tasks marked with [P] can be parallelized for faster development.
   
   ## ⏱️ Time Estimation
   ---
   **Human Development:** [X] days total ([X] days development + [X] days testing).
   **AI-Assisted Development:** [X] hours total ([X]% time savings).
   **Team Composition:** [X] developers ([Backend], [Frontend], [Full-Stack], [DevOps]).
   
   ## 🎯 Project Overview
   [template_data.projectOverview.content]
   
   ## 📝 Task Breakdown
   
   ### 🔬 Phase 1: Contract Testing
   **Duration:** [X] hours | **Tasks:** [TASK-001] to [TASK-003] | **Focus:** API contracts and failing tests
   
   [Convert template_data.taskBreakdown.phase1 to markdown sections with enhanced formatting]
   
   ---
   
   ### 🔗 Phase 2: Integration Testing  
   **Duration:** [X] hours | **Tasks:** [TASK-004] to [TASK-006] | **Focus:** Real dependency integration
   
   [Convert template_data.taskBreakdown.phase2 to markdown sections with enhanced formatting]
   
   ---
   
   ### 🎭 Phase 3: End-to-End Testing
   **Duration:** [X] hours | **Tasks:** [TASK-007] to [TASK-009] | **Focus:** Complete user workflows
   
   [Convert template_data.taskBreakdown.phase3 to markdown sections with enhanced formatting]
   
   ---
   
   ### 🧪 Phase 4: Unit Testing
   **Duration:** [X] hours | **Tasks:** [TASK-010] to [TASK-012] | **Focus:** Individual component testing
   
   [Convert template_data.taskBreakdown.phase4 to markdown sections with enhanced formatting]
   
   ---
   
   ### 🚀 Phase 5: Implementation
   **Duration:** [X] hours | **Tasks:** [TASK-013] to [TASK-015] | **Focus:** Core functionality development
   
   [Convert template_data.taskBreakdown.phase5 to markdown sections with enhanced formatting]
   
   ---
   
   ### 🎨 Phase 6: UI-API Integration
   **Duration:** [X] hours | **Tasks:** [TASK-016] to [TASK-018] | **Focus:** Frontend-backend connection
   
   [Convert template_data.taskBreakdown.phase6 to markdown sections with enhanced formatting]
   
   ---
   
   ### 📚 Phase 7: Documentation & Deployment
   **Duration:** [X] hours | **Tasks:** [TASK-019] to [TASK-021] | **Focus:** Documentation and deployment
   
   [Convert template_data.taskBreakdown.phase7 to markdown sections with enhanced formatting]
   
   ---
   
   ### 🌐 Phase 8: Platform-Specific Tasks
   **Duration:** [X] hours | **Tasks:** [TASK-022] to [TASK-025] | **Focus:** Platform optimization
   
   [Convert template_data.taskBreakdown.phase8 to markdown sections with enhanced formatting]
   
   ## 🔗 Task Dependencies
   [Convert template_data.taskDependencies to markdown sections with enhanced formatting]
   
   ## ✅ Definition of Done
   [Convert template_data.definitionOfDone to markdown sections with enhanced formatting]
   
   ## 🚪 Constitutional Gates
   [Convert template_data.constitutionalGates to markdown sections with proper formatting]
   
   **ENHANCED EXAMPLE FORMAT:**
   
   ### 🧪 Test-First Gate
   **Description:** No implementation before tests; sequence is Contract → Integration → E2E → Unit → Implementation
   
   **Check:** ✅ PASSED - All tasks follow strict TDD order with tests created before implementation
   
   **Platforms:** mobile, web, desktop, backend, ai
   
   ---
   
   ### 🔗 Integration-First Testing Gate
   **Description:** Prefer real dependencies (DBs/services).
   
   **Check:** ✅ PASSED - Integration tests use real Supabase instance with minimal mocking
   
   **Platforms:** mobile, web, desktop, backend, ai
   
   ---
   
   ### 🎯 Simplicity Gate
   **Description:** ≤ 5 projects for initial scope; otherwise, force simplification
   
   **Check:** ✅ PASSED - Project scope limited to 3 core components with clear boundaries
   
   **Platforms:** mobile, web, desktop, backend, ai
   
   ---
   
   ### 📚 Library-First Gate
   **Description:** Every feature starts as a standalone library (desktop/backend) or modular component (web/mobile/embedded). UI/app layers are thin veneers over core functionality
   
   **Check:** ✅ PASSED - Core functionality implemented as reusable library with thin UI layer
   
   **Platforms:** web, desktop, backend, ai
   
   ---
   
   ### 💻 CLI Interface Gate
   **Description:** Each developer/system tool library exposes a CLI with --json mode using stdin/stdout; errors go to stderr
   
   **Check:** ✅ PASSED - CLI interface implemented with --json mode and proper error handling
   
   **Platforms:** desktop, backend, ai
   
   ---
   
   ### 🚫 Anti-Abstraction Gate
   **Description:** One domain model (avoid DTO/Repository/Unit-of-Work unless truly necessary)
   
   **Check:** ✅ PASSED - Single domain model used throughout with minimal abstraction layers
   
   **Platforms:** mobile, web, desktop, backend, ai
   
   ---
   
   ### 🔍 Traceability Gate
   **Description:** Every line of code must trace back to a numbered requirement (FR-XXX) in the spec
   
   **Check:** ✅ PASSED - All implementation tasks mapped to specific requirements (FR-001, FR-002, etc.)
   
   **Platforms:** mobile, web, desktop, backend, ai
   
   ## 🛡️ Quality Gates (Enforcement Rules)
   [Convert template_data.qualityGates to markdown sections with proper formatting]
   
   **ENHANCED EXAMPLE FORMAT:**
   
   ### 🔍 Code Quality Gate
   **Description:** All code must pass linting, formatting, and security checks
   
   **Check:** ✅ PASSED - Code passes ESLint, Prettier, and security audit
   
   **Platforms:** mobile, web, desktop, backend, ai
   
   ---
   
   ### ⚡ Performance Gate
   **Description:** Application must meet performance benchmarks
   
   **Check:** ✅ PASSED - Load times under 2 seconds, memory usage optimized
   
   **Platforms:** mobile, web, desktop, backend, ai
   
   ## SDD Principles
   [Convert template_data.sddPrinciples to markdown list]
   
   ### 🎨 CRITICAL FORMATTING RULES FOR MAXIMUM VISIBILITY:
   
   **📋 Document Structure:**
   - Always use blank lines between sections for readability
   - Use emojis in headers for visual distinction (📋, 📊, ⏱️, 🎯, etc.)
   - Add horizontal rules (---) between major sections
   - Use consistent emoji patterns throughout the document
   
   **🚪 Gate Formatting:**
   - For Constitutional Gates and Quality Gates, format each gate as:
     ### 🎯 [Gate Title]
     **Description:** [Gate description]
     
     **Check:** [Gate check status with checkmark]
     
     **Platforms:** [Platform list]
     
     ---
   - Ensure "Check:" always appears on a new line after "Description:"
   - Ensure "Platforms:" always appears on a new line after "Check:"
   - Add horizontal rules (---) between different gates for visual separation
   
   **📝 Task Formatting:**
   - Use proper numbering (TASK-001, TASK-002, etc.)
   - Include [P] markers for parallelizable tasks
   - Add duration and focus information for each phase
   - Use consistent emoji patterns for phase headers
   
   **🎨 Visual Enhancements:**
   - Use **bold** for labels and key information
   - Add emojis to section headers for quick visual scanning
   - Use horizontal rules (---) to separate major sections
   - Ensure consistent spacing and formatting throughout
   - Use bullet points and numbered lists for better readability

7. Use sdd_db_filler tool to save the filled tasks to database with this exact data structure:
    7.1. Data structure:
     {
       "operation": "upsert",
       "table": "tasks",
       "data": {
         "feature_id": "${featureId}",
         "template_id": "sdd-tasks-perfect-v1",
          "content": YOUR_FILLED_TEMPLATE_DATA_AS_JSON_OBJECT,
         "ai_generated": true
       }
      }
    7.2. CRITICAL: Replace 'YOUR_FILLED_TEMPLATE_DATA_AS_JSON_OBJECT' with the actual filled template data from the template above
    7.3. The content should be the JSON object you created by filling the template, NOT the template with instructions
    7.4. Example: If your filled template is { "taskPhases": [...], "constitutionalGates": [...] }, then content should be that object
    7.5. Do NOT save empty objects like {"template_data":{}} - this will break the Implement Tool
    7.6. The content must contain actual task data with taskPhases, constitutionalGates, etc.
    7.7. VALIDATION: Before saving, verify that your content contains:
        - taskPhases with actual task data (not empty arrays)
        - constitutionalGates with validation results
        - taskDependencies with dependency information
        - definitionOfDone with criteria
    7.8. The content should be thousands of characters, not 20-24 characters
    7.9. If you save empty data, the Implement Tool will fail with "No phase-specific tasks available"
`;

      const outputData = {
        success: true,
        nextStep: successMessage
      };
      return outputData;
    } catch (error) {
      console.error('[sdd_tasks] ERROR:', error);
      return this.error(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }

  // -----------------------
  // Template Management
  // -----------------------

  private async fillTasksTemplate(options: {
    featureId: string;
    featureName: string;
    platform: string;
    includeDiagrams: boolean;
    specData: any;
    planData: any;
    planEstimates?: any;
    cliRequirement?: any;
    edgeCaseAnalysis?: any;
  }): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      // Get the perfect template from database
      const template = await this.db.get_task_template('sdd-tasks-perfect-v1');

      if (!template) {
        return {
          success: false,
          error: 'Perfect SDD tasks template not found in database'
        };
      }

      // Fill the template with user input and Cursor AI instructions
      const filledTemplate = this.fillTemplateWithUserInput(template, options);
      
      // 🚀 CLI REQUIREMENT INTEGRATION: Add CLI-specific tasks
      const cliReq = options.cliRequirement;
      if (cliReq?.cliRequired) {
        filledTemplate.cliTasks = this.generateCLITasks(cliReq.cliComplexity);
        filledTemplate.cliRequirements = {
          required: true,
          detected: cliReq.cliDetected,
          confidence: cliReq.cliConfidence,
          complexity: cliReq.cliComplexity
        };
      } else {
        filledTemplate.cliRequirements = {
          required: false,
          detected: cliReq?.cliDetected || false,
          confidence: cliReq?.cliConfidence || 0.0,
          complexity: 'simple'
        };
      }

      return {
        success: true,
        data: filledTemplate
      };
    } catch (error) {
      console.error('Error filling tasks template:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private fillTemplateWithUserInput(template: any, options: any): any {
    const filledTemplate = JSON.parse(JSON.stringify(template)); // Deep copy

    // Fill basic placeholders with actual values
    filledTemplate.title = filledTemplate.title.replace('{{FEATURE_NAME}}', options.featureName);

    filledTemplate.metadata.generated = new Date().toISOString().split('T')[0];
    filledTemplate.metadata.platform = options.platform;
    filledTemplate.metadata.generatedFrom = `specs/plan.md`;

    // Add Cursor AI instructions for content generation
    filledTemplate._cursor_ai_instructions = {
      featureId: options.featureId,
      featureName: options.featureName,
      platform: options.platform,
      includeDiagrams: options.includeDiagrams,
      specData: options.specData,
      planData: options.planData,
      planEstimates: options.planEstimates,
      instructions: {
        executiveSummary: `Create task planning summary for: ${options.featureName}. Include total tasks, phases, parallelization opportunities, and key dependencies.`,
        constitutionalGatesValidation: `Validate constitutional gates for task planning: ${options.featureName} on ${options.platform} platform. Check all applicable gates and report violations.`,
        tddTaskOrdering: `Enforce TDD ordering for: ${options.featureName}. Ensure tasks follow Contract → Integration → E2E → Unit → Implementation → UI-API Integration sequence.`,
        taskPhases: `Generate task phases for: ${options.featureName} on ${options.platform} platform. Include all 8 phases: Phase 1 (Contract Testing), Phase 2 (Integration Testing), Phase 3 (End-to-End Testing), Phase 4 (Unit Testing), Phase 5 (Implementation), Phase 6 (UI-API Integration), Phase 7 (Documentation & Deployment), Phase 8 (Platform-Specific Tasks).`,
        platformSpecificTasks: `Create platform-specific tasks for: ${options.featureName} on ${options.platform} platform. Include platform-specific requirements and considerations.`,
        apiFirstTasks: `Generate API-First tasks for: ${options.featureName} on ${options.platform} platform. Include API design, contracts, testing, and documentation tasks.`,
        taskDependencies: `Analyze task dependencies for: ${options.featureName}. Identify parallelizable tasks [P] and critical path.`,
        definitionOfDone: `Define completion criteria for: ${options.featureName}. Include code review, testing, documentation, and constitutional compliance.`,
        mermaidDiagrams: `Generate beautiful Mermaid diagrams for: ${options.featureName}. Include task flow, TDD order, dependencies, platform tasks, and constitutional gates validation.`,
        timeEstimation: `Include comprehensive time estimation for each task based on plan estimates. Show both human development time and AI-assisted development time. Use plan estimates as baseline and refine based on task complexity.`,
        edgeCaseAnalysis: `Analyze edge cases from specification for: ${options.featureName}. Extract edge cases, categorize by complexity (high/medium/low), and create specific tasks for handling them. Include edge case tasks in the appropriate TDD phases (usually Unit Testing phase).`,
        dataSourceInstructions: `IMPORTANT: The specData and planData are provided as JSON objects from the database. Parse and use the structured data to extract requirements, estimates, and other information needed for task generation. Access data like specData.template_data.userScenarios, planData.template_data.timelineEstimates, etc.`,
        planEstimatesInstructions: `The planEstimates contains structured JSON data with time estimation information. Extract time estimates from the JSON structure (look for timelineEstimates.human and timelineEstimates.ai) and use them as baseline for task time estimates.`
      },
      placeholders: {
        '{{TASK_PLANNING_SUMMARY}}': 'Replace with generated task planning summary',
        '{{OVERALL_COMPLIANCE}}': 'Replace with overall constitutional compliance status',
        '{{CONSTITUTIONAL_VIOLATIONS}}': 'Replace with constitutional violations list',
        '{{TEST_FIRST_GATE_STATUS}}': 'Replace with test-first gate status (PASS/FAIL)',
        '{{TEST_FIRST_GATE_CHECK}}': 'Replace with test-first gate validation details',
        '{{TEST_FIRST_GATE_VIOLATIONS}}': 'Replace with test-first gate violations',
        '{{INTEGRATION_FIRST_TESTING_GATE_STATUS}}': 'Replace with integration-first testing gate status (PASS/FAIL)',
        '{{INTEGRATION_FIRST_TESTING_GATE_CHECK}}': 'Replace with integration-first testing gate validation details',
        '{{INTEGRATION_FIRST_TESTING_GATE_VIOLATIONS}}': 'Replace with integration-first testing gate violations',
        '{{SIMPLICITY_GATE_STATUS}}': 'Replace with simplicity gate status (PASS/FAIL)',
        '{{SIMPLICITY_GATE_CHECK}}': 'Replace with simplicity gate validation details',
        '{{SIMPLICITY_GATE_VIOLATIONS}}': 'Replace with simplicity gate violations',
        '{{LIBRARY_FIRST_GATE_STATUS}}': 'Replace with library-first gate status (PASS/FAIL)',
        '{{LIBRARY_FIRST_GATE_CHECK}}': 'Replace with library-first gate validation details',
        '{{LIBRARY_FIRST_GATE_VIOLATIONS}}': 'Replace with library-first gate violations',
        '{{CLI_INTERFACE_GATE_STATUS}}': 'Replace with CLI interface gate status (PASS/FAIL)',
        '{{CLI_INTERFACE_GATE_CHECK}}': 'Replace with CLI interface gate validation details',
        '{{CLI_INTERFACE_GATE_VIOLATIONS}}': 'Replace with CLI interface gate violations',
        '{{ANTI_ABSTRACTION_GATE_STATUS}}': 'Replace with anti-abstraction gate status (PASS/FAIL)',
        '{{ANTI_ABSTRACTION_GATE_CHECK}}': 'Replace with anti-abstraction gate validation details',
        '{{ANTI_ABSTRACTION_GATE_VIOLATIONS}}': 'Replace with anti-abstraction gate violations',
        '{{TRACEABILITY_GATE_STATUS}}': 'Replace with traceability gate status (PASS/FAIL)',
        '{{TRACEABILITY_GATE_CHECK}}': 'Replace with traceability gate validation details',
        '{{TRACEABILITY_GATE_VIOLATIONS}}': 'Replace with traceability gate violations',
        '{{TDD_ORDER_ENFORCEMENT}}': 'Replace with TDD order enforcement details',
        '{{TDD_ORDER_VIOLATIONS}}': 'Replace with TDD order violations',
        '{{API_CONTRACTS_TASK_DESCRIPTION}}': 'Replace with API contracts task description',
        '{{API_CONTRACTS_ACCEPTANCE_CRITERIA}}': 'Replace with API contracts acceptance criteria',
        '{{API_CONTRACTS_ESTIMATED_LOC}}': 'Replace with API contracts estimated LOC',
        '{{API_CONTRACTS_CONSTITUTIONAL_COMPLIANCE}}': 'Replace with API contracts constitutional compliance',
        '{{CONTRACT_TESTS_TASK_DESCRIPTION}}': 'Replace with contract tests task description',
        '{{CONTRACT_TESTS_ACCEPTANCE_CRITERIA}}': 'Replace with contract tests acceptance criteria',
        '{{CONTRACT_TESTS_ESTIMATED_LOC}}': 'Replace with contract tests estimated LOC',
        '{{CONTRACT_TESTS_CONSTITUTIONAL_COMPLIANCE}}': 'Replace with contract tests constitutional compliance',
        '{{INTEGRATION_TESTS_TASK_DESCRIPTION}}': 'Replace with integration tests task description',
        '{{INTEGRATION_TESTS_ACCEPTANCE_CRITERIA}}': 'Replace with integration tests acceptance criteria',
        '{{INTEGRATION_TESTS_ESTIMATED_LOC}}': 'Replace with integration tests estimated LOC',
        '{{INTEGRATION_TESTS_CONSTITUTIONAL_COMPLIANCE}}': 'Replace with integration tests constitutional compliance',
        '{{DATA_MODELS_TASK_DESCRIPTION}}': 'Replace with data models task description',
        '{{DATA_MODELS_ACCEPTANCE_CRITERIA}}': 'Replace with data models acceptance criteria',
        '{{DATA_MODELS_ESTIMATED_LOC}}': 'Replace with data models estimated LOC',
        '{{DATA_MODELS_CONSTITUTIONAL_COMPLIANCE}}': 'Replace with data models constitutional compliance',
        '{{MODEL_TESTS_TASK_DESCRIPTION}}': 'Replace with model tests task description',
        '{{MODEL_TESTS_ACCEPTANCE_CRITERIA}}': 'Replace with model tests acceptance criteria',
        '{{MODEL_TESTS_ESTIMATED_LOC}}': 'Replace with model tests estimated LOC',
        '{{MODEL_TESTS_CONSTITUTIONAL_COMPLIANCE}}': 'Replace with model tests constitutional compliance',
        '{{CORE_LIBRARY_TASK_DESCRIPTION}}': 'Replace with core library task description',
        '{{CORE_LIBRARY_ACCEPTANCE_CRITERIA}}': 'Replace with core library acceptance criteria',
        '{{CORE_LIBRARY_ESTIMATED_LOC}}': 'Replace with core library estimated LOC',
        '{{CORE_LIBRARY_CONSTITUTIONAL_COMPLIANCE}}': 'Replace with core library constitutional compliance',
        '{{CLI_INTERFACE_TASK_DESCRIPTION}}': 'Replace with CLI interface task description',
        '{{CLI_INTERFACE_ACCEPTANCE_CRITERIA}}': 'Replace with CLI interface acceptance criteria',
        '{{CLI_INTERFACE_ESTIMATED_LOC}}': 'Replace with CLI interface estimated LOC',
        '{{CLI_INTERFACE_CONSTITUTIONAL_COMPLIANCE}}': 'Replace with CLI interface constitutional compliance',
        '{{LIBRARY_INTEGRATION_TESTS_TASK_DESCRIPTION}}': 'Replace with library integration tests task description',
        '{{LIBRARY_INTEGRATION_TESTS_ACCEPTANCE_CRITERIA}}': 'Replace with library integration tests acceptance criteria',
        '{{LIBRARY_INTEGRATION_TESTS_ESTIMATED_LOC}}': 'Replace with library integration tests estimated LOC',
        '{{LIBRARY_INTEGRATION_TESTS_CONSTITUTIONAL_COMPLIANCE}}': 'Replace with library integration tests constitutional compliance',
        '{{APPLICATION_LAYER_TASK_DESCRIPTION}}': 'Replace with application layer task description',
        '{{APPLICATION_LAYER_ACCEPTANCE_CRITERIA}}': 'Replace with application layer acceptance criteria',
        '{{APPLICATION_LAYER_ESTIMATED_LOC}}': 'Replace with application layer estimated LOC',
        '{{APPLICATION_LAYER_CONSTITUTIONAL_COMPLIANCE}}': 'Replace with application layer constitutional compliance',
        '{{E2E_VALIDATION_TASK_DESCRIPTION}}': 'Replace with E2E validation task description',
        '{{E2E_VALIDATION_ACCEPTANCE_CRITERIA}}': 'Replace with E2E validation acceptance criteria',
        '{{E2E_VALIDATION_ESTIMATED_LOC}}': 'Replace with E2E validation estimated LOC',
        '{{E2E_VALIDATION_CONSTITUTIONAL_COMPLIANCE}}': 'Replace with E2E validation constitutional compliance',
        '{{MOBILE_PLATFORM_TASKS}}': 'Replace with mobile platform tasks',
        '{{WEB_PLATFORM_TASKS}}': 'Replace with web platform tasks',
        '{{DESKTOP_PLATFORM_TASKS}}': 'Replace with desktop platform tasks',
        '{{BACKEND_PLATFORM_TASKS}}': 'Replace with backend platform tasks',
        '{{AI_PLATFORM_TASKS}}': 'Replace with AI platform tasks',
        '{{API_DESIGN_TASKS}}': 'Replace with API design tasks',
        '{{API_CONTRACT_TASKS}}': 'Replace with API contract tasks',
        '{{API_TESTING_TASKS}}': 'Replace with API testing tasks',
        '{{API_DOCUMENTATION_TASKS}}': 'Replace with API documentation tasks',
        '{{PARALLELIZABLE_TASKS}}': 'Replace with parallelizable tasks list',
        '{{SEQUENTIAL_TASKS}}': 'Replace with sequential tasks list',
        '{{CRITICAL_PATH}}': 'Replace with critical path analysis',
        '{{DEPENDENCY_GRAPH}}': 'Replace with dependency graph',
        '{{QUALITY_GATES}}': 'Replace with quality gates',
        '{{REVIEW_CHECKLIST}}': 'Replace with review checklist',
        '{{MERMAID_TASK_FLOW_DIAGRAM}}': 'Replace with Mermaid task flow diagram',
        '{{MERMAID_TDD_ORDER_DIAGRAM}}': 'Replace with Mermaid TDD order diagram',
        '{{MERMAID_DEPENDENCY_DIAGRAM}}': 'Replace with Mermaid dependency diagram',
        '{{MERMAID_PLATFORM_TASKS_DIAGRAM}}': 'Replace with Mermaid platform tasks diagram',
        '{{MERMAID_CONSTITUTIONAL_GATES_DIAGRAM}}': 'Replace with Mermaid constitutional gates diagram',
        '{{HAS_EDGE_CASES}}': options.edgeCaseAnalysis?.hasEdgeCases ? 'Yes' : 'No',
        '{{EDGE_CASE_COUNT}}': options.edgeCaseAnalysis?.edgeCaseCount?.toString() || '0',
        '{{EDGE_CASE_COMPLEXITY}}': options.edgeCaseAnalysis?.complexity || 'low',
        '{{EDGE_CASES_LIST}}': options.edgeCaseAnalysis?.edgeCases || 'None',
        '{{EDGE_CASE_TASKS}}': options.edgeCaseAnalysis?.edgeCaseTasks?.map((task: any) => `- ${task.title}: ${task.description}`).join('\n') || 'None'
      }
    };

    return filledTemplate;
  }

  // -----------------------
  // Helpers
  // -----------------------

  private validateInput(input: any): any {
    const { featureId, platform, includeDiagrams } = input;
    
    if (featureId && typeof featureId !== 'string') {
      throw new Error('featureId must be a string');
    }
    
    if (platform && !['mobile', 'web', 'desktop', 'backend', 'ai'].includes(platform)) {
      throw new Error('platform must be one of: mobile, web, desktop, backend, ai');
    }
    
    if (includeDiagrams !== undefined && typeof includeDiagrams !== 'boolean') {
      throw new Error('includeDiagrams must be a boolean');
    }
    
    return { featureId, platform, includeDiagrams };
  }

  private async resolveFeatureId(inputFeatureId?: string): Promise<string> {
    if (inputFeatureId && typeof inputFeatureId === 'string' && inputFeatureId.trim()) {
      // Validate that the feature exists in database
      const feature = await this.db.get_feature(inputFeatureId.trim());
      if (!feature) {
        throw new Error(`Feature '${inputFeatureId.trim()}' not found in database.`);
      }
      return inputFeatureId.trim();
    }

    // If no featureId provided, use most recent feature
    const allFeatures = await this.db.get_all_features();
    if (!allFeatures.length) {
      throw new Error('No features found. Please provide featureId or create a feature first using /specify command.');
    }
    
    const mostRecentFeature = allFeatures[0];
    return mostRecentFeature.id;
  }


  /**
   * Extract plan estimates from plan data for task inheritance
   * Works with JSON data from database with robust repair
   */
  private extractPlanEstimates(planData: any): any {
    try {
      if (!planData || !planData.content) {
        return null;
      }

      // Use shared utility to safely extract and repair JSON content
      const content = JsonRepairUtility.extractDbJsonContent(planData, 'SDDTasksTool');
      
      if (!content) {
        console.warn('[SDDTasksTool] Failed to extract plan content from database');
        return {
          hasEstimates: false,
          source: 'extraction_failed'
        };
      }
      
      // Look for time estimates in the filled template data
      const timeEstimates = content._cursor_ai_instructions?.timeEstimates || {};
      const timelineEstimates = content.timelineEstimates || {};
      
      return {
        jsonData: content,
        timelineEstimates: timelineEstimates,
        timeEstimates: timeEstimates,
        hasEstimates: !!(timeEstimates.human || timeEstimates.ai || timelineEstimates.human || timelineEstimates.ai),
        source: 'json_data_repaired'
      };
    } catch (error) {
      console.error('[SDDTasksTool] Error extracting plan estimates:', error);
      return null;
    }
  }

  /**
   * Analyze edge cases from specification for task generation
   */
  private analyzeEdgeCases(specData: any): any {
    try {
      // Use shared utility to safely extract and repair JSON content
      const content = JsonRepairUtility.extractDbJsonContent(specData, 'SDDTasksTool') || {};
      
      // Extract edge cases from structured JSON data
      if (content.template_data) {
        // JSON data - extract edge cases from structured data
        const templateData = content.template_data;
        const userScenarios = templateData.userScenarios || {};
        const edgeCases = userScenarios.edgeCases || {};
        
        const edgeCasesContent = edgeCases.content || '';
        const edgeCaseLines = edgeCasesContent.split('\n')
          .map(line => line.trim())
          .filter(line => line && (line.startsWith('-') || line.startsWith('*') || line.startsWith('•') || /^\d+\./.test(line)));
        
        return {
          edgeCases: edgeCasesContent,
          hasEdgeCases: !!(edgeCasesContent),
          edgeCaseCount: edgeCaseLines.length,
          source: 'json_data_repaired'
        };
      } else {
        // No specification data available
        return {
          hasEdgeCases: false,
          edgeCaseCount: 0,
          edgeCases: [],
          edgeCasesContent: '',
          source: 'no_data'
        };
      }
    } catch (error) {
      console.error('Error analyzing edge cases:', error);
      return {
        hasEdgeCases: false,
        edgeCaseCount: 0,
        edgeCases: [],
        edgeCaseTasks: []
      };
    }
  }




  /**
   * Estimate LOC from task description
   */
  private estimateLOCFromDescription(description: string): number {
    // Simple heuristic: ~5-10 LOC per word in description
    const words = description.split(/\s+/).length;
    const complexity = description.includes('complex') ? 1.5 : 1;
    return Math.floor(words * 7 * complexity);
  }


  /**
   * 🚀 GENERATE CLI TASKS: Generate CLI-specific tasks based on complexity
   */
  private generateCLITasks(complexity: string): any[] {
    const baseTasks = [
      {
        id: 'CLI-001',
        title: 'CLI Foundation Setup',
        description: 'Set up CLI structure and entry point',
        phase: 1,
        priority: 'high',
        estimatedMinutes: 30,
        dependencies: [],
        acceptanceCriteria: [
          'CLI entry point created',
          'Basic command parsing implemented',
          'Help system functional'
        ]
      },
      {
        id: 'CLI-002',
        title: 'Core CLI Commands',
        description: 'Implement main CLI commands',
        phase: 2,
        priority: 'high',
        estimatedMinutes: 45,
        dependencies: ['CLI-001'],
        acceptanceCriteria: [
          'Main commands implemented',
          'Command validation working',
          'Error handling in place'
        ]
      },
      {
        id: 'CLI-003',
        title: 'CLI Integration',
        description: 'Integrate CLI with core functionality',
        phase: 3,
        priority: 'medium',
        estimatedMinutes: 60,
        dependencies: ['CLI-002'],
        acceptanceCriteria: [
          'CLI connected to business logic',
          'Output formatting implemented',
          'JSON mode available'
        ]
      }
    ];

    if (complexity === 'complex') {
      baseTasks.push({
        id: 'CLI-004',
        title: 'Advanced CLI Features',
        description: 'Implement advanced CLI features',
        phase: 4,
        priority: 'medium',
        estimatedMinutes: 90,
        dependencies: ['CLI-003'],
        acceptanceCriteria: [
          'Subcommands implemented',
          'Command chaining working',
          'Advanced options available'
        ]
      });
    }

    return baseTasks;
  }
  private async checkCLIRequirement(featureId: string): Promise<{
    cliRequired: boolean;
    cliDetected: boolean;
    cliConfidence: number;
    cliComplexity: string;
  }> {
    try {
      const feature = await this.db.get_feature(featureId);
      if (!feature) {
        return {
          cliRequired: false,
          cliDetected: false,
          cliConfidence: 0.0,
          cliComplexity: 'simple'
        };
      }

      // Extract CLI data from feature object (already parsed from JSON content)
      return {
        cliRequired: feature.cliRequired || false,
        cliDetected: feature.cliDetected || false,
        cliConfidence: feature.cliConfidence || 0.0,
        cliComplexity: feature.cliComplexity || 'simple'
      };
    } catch (error) {
      console.error('Error checking CLI requirement:', error);
      return {
        cliRequired: false,
        cliDetected: false,
        cliConfidence: 0.0,
        cliComplexity: 'simple'
      };
    }
  }


  private error(message: string) {
    return { success: false, error: 'TASKS_FAILED', message };
  }
}
