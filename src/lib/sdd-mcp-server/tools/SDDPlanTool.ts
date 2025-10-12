/**
 * SDD Plan Tool - Template-based approach
 * - Uses pre-installed plan template from database
 * - Returns template with Cursor AI instructions for filling
 * - Cursor AI fills template and saves using sdd_db_filler
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import * as path from 'path';
import { RobustDatabaseService } from '../database/RobustDatabaseService.js';
import { JsonRepairUtility } from '../utils/JsonRepairUtility.js';
import { EdgeCaseAnalyzer } from '../utils/EdgeCaseAnalyzer.js';

export class SDDPlanTool {
  private basePath: string;
  private db: RobustDatabaseService;
  private edgeCaseAnalyzer: EdgeCaseAnalyzer;

  constructor(basePath: string = process.cwd(), db?: RobustDatabaseService) {
    this.basePath = path.resolve(basePath);
    this.db = db || new RobustDatabaseService(path.join(this.basePath, 'sdd.db'));
    this.edgeCaseAnalyzer = EdgeCaseAnalyzer.getInstance();
  }




  getToolDefinition(): Tool {
    return {
      name: 'sdd_plan',
      description: 'Generate implementation plan from the most recent feature specification. Automatically detects platform and uses latest feature from database. No parameters needed.',
      inputSchema: {
        type: 'object',
        properties: {
          finalize: {
            type: 'boolean',
            description: 'Internal parameter - set to true when finalizing plan to save to database'
          },
          planData: {
            type: 'object',
            description: 'The filled plan data to save to database (used with finalize=true)'
          }
        },
        required: []
      }
    };
  }

  async execute(input: any): Promise<any> {
    try {
      // Check if this is a finalize call
      const { finalize, ...otherInput } = input;

      if (finalize) {

        return await this.handleFinalize(otherInput);
      }



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

      // Get specification data with JSON repair
      const specData = await this.db.get_specification_robust(featureId);
      if (!specData) {
        return this.error(`Specification not found for feature: ${featureId}. Please create a specification first.`);
      }

      // Use shared utility to safely extract and repair JSON content
      const repairedSpecData = JsonRepairUtility.extractDbJsonContent(specData, 'SDDPlanTool');
      if (!repairedSpecData) {
        return this.error(`Failed to process specification data for feature: ${featureId}.`);
      }

      // Detect platform from specification data
      const platform = this.detectPlatformFromSpec(repairedSpecData) || 'web';
      console.error('Detected platform:', platform);


      // Generate AI team analysis and time estimation first
      const teamAnalysis = await this.generateTeamAnalysis(null, repairedSpecData);
      const timeEstimate = await this.generateTimeEstimate(null, repairedSpecData);
      const aiTimeEstimate = await this.generateAITimeEstimate(null, repairedSpecData);

      // Analyze edge cases for complexity and planning
      const edgeCaseAnalysis = this.analyzeEdgeCases(repairedSpecData);

      // Store plan estimates in database for tasks to inherit
      await this.storePlanEstimates(featureId, timeEstimate, aiTimeEstimate, teamAnalysis);

      // Prepare plan template with Cursor AI instructions and estimates
      let templateWithInstructions: any;
      try {
        const fillResult = await this.fillPlanTemplate({
          featureId: featureId,
          featureName: feature.name,
          platform: platform,
          specData: repairedSpecData,
          timeEstimate: timeEstimate,
          aiTimeEstimate: aiTimeEstimate,
          teamAnalysis: teamAnalysis,
          edgeCaseAnalysis: edgeCaseAnalysis
        });

        if (!fillResult.success) {
          throw new Error(`Failed to prepare plan template: ${fillResult.error}`);
        }

        templateWithInstructions = fillResult.data;

      } catch (error) {
        console.error('SDDPlanTool: Error preparing template:', error);
        throw error;
      }

      // Report success
      const successMessage = `
📋 TASK: Create plan.md file in specs/plan.md directory using the specification and template data provided below.
📊 PROJECT DETAILS:
- Feature: ${feature.name}
- Platform: ${platform.toUpperCase()}
- Duration: ${timeEstimate.totalDuration} (Human) / ${aiTimeEstimate.totalDuration} (AI-assisted)
- Team: ${teamAnalysis.teamSize} developers
 

8. SPECIFICATION DATA: The complete specification from the database is provided below. Use this data to understand the project requirements.
8.1. SPECIFICATION DATA:
---BEGINNING OF SPECIFICATION DATA---
${JSON.stringify(repairedSpecData, null, 2)}
---END OF SPECIFICATION DATA---
8.2. SIMPLICITY GATE ANALYSIS:
   Before creating the plan, analyze the specification above for architectural complexity:
   8.2.1. ANALYSIS INSTRUCTIONS:
   "Analyze the COMPLETE specification from section 8.1 above to determine the number of distinct projects/components.
   A 'project' is a major architectural component that could be developed separately, such as:
   8.2.1.1. Separate applications (web app, mobile app, desktop app)
   8.2.1.2. Independent services (API service, payment service, notification service)
   8.2.1.3. Distinct platforms (iOS app, Android app, web app)
   8.2.1.4. Major system components (admin dashboard, user interface, backend API)
   
   NOT individual features, pages, or entities within the same application.
   
   Focus your analysis on:
   - Technology stack diversity and complexity
   - System boundaries and integration points
   - Platform targets and deployment requirements
   - Service architecture and component separation
   
   Based on this complete analysis, how many distinct projects/components does this specification describe?
   Return only a number between 1-10. If unclear, default to 1.
   
   If the count is > 10, this violates the Simplicity Gate and should be documented in Complexity Tracking."
   
   8.2.2. Use this AI analysis to:
      8.2.2.1. Determine if the specification violates the Simplicity Gate (≤5 projects)
      8.2.2.2. Document any violations in the Complexity Tracking section
      8.2.2.3. Adjust the implementation plan accordingly

9. TEMPLATE DATA FOR AI PROCESSING:
---BEGINNING OF TEMPLATE DATA---
${JSON.stringify(templateWithInstructions, null, 2)}
---END OF TEMPLATE DATA---
10. MARKDOWN CONVERSION GUIDE:
   To create the plan.md file from the template JSON above, follow this ENHANCED structure for maximum readability:
   
   # 📋 [template_data.title]
   
   ## 📊 Metadata
   - **Created:** [template_data.metadata.created]
   - **Status:** [template_data.metadata.status]
   - **Platform:** [template_data.metadata.platform]
   - **Spec Path:** [template_data.metadata.specPath]
   
   ---
   
   ## 📝 Summary
   [template_data.summary.content]
   
   ---
   
   ## 🔧 Technical Context
   - **Language Version:** [template_data.technicalContext.languageVersion]
   - **Primary Dependencies:** [template_data.technicalContext.primaryDependencies]
   - **Technology Stack:** [template_data.technicalContext.technologyStack]
   - **Frontend Stack:** [template_data.technicalContext.frontendStack]
   - **Backend Stack:** [template_data.technicalContext.backendStack]
   - **Styling Approach:** [template_data.technicalContext.stylingApproach]
   - **Chart Libraries:** [template_data.technicalContext.chartLibraries]
   - **State Management:** [template_data.technicalContext.stateManagement]
   - **Storage:** [template_data.technicalContext.storage]
   - **Testing:** [template_data.technicalContext.testing]
   - **Target Platform:** [template_data.technicalContext.targetPlatform]
   - **Performance Goals:** [template_data.technicalContext.performanceGoals]
   
   ---
   
   ## 🔍 Edge Case Analysis
   [template_data.edgeCaseAnalysis.content]
   
   ---
   
   ## ✅ Constitution Check
   [Convert template_data.constitutionCheck to markdown sections with proper formatting]
   
   ---
   
   ## 🏗️ Project Structure
   [template_data.projectStructure.content]
   
   ---
   
   ## 🚀 Implementation Phases
   
   ### 🔬 Phase 1: Contracts & Tests
   [template_data.implementationPhases.phase1.content]
   
   ---
   
   ### 🔗 Phase 2: Library Implementation
   [template_data.implementationPhases.phase2.content]
   
   ---
   
   ### 🧪 Phase 3: Integration & Validation
   [template_data.implementationPhases.phase3.content]
   
   ---
   
   ## 🗄️ Database Strategy
   [Convert template_data.databaseStrategy to markdown sections with proper formatting]
   
   ---
   
   ## 🌐 API-First Planning
   [Convert template_data.apiFirstPlanning to markdown sections with proper formatting]
   
   ---
   
   ## 📱 Platform-Specific Planning
   [Convert template_data.platformSpecificPlanning to markdown sections with proper formatting]
   
   ---
   
   ## 🚪 Constitutional Gates
   [Convert template_data.constitutionalGates to markdown sections with proper formatting]
   
   ---
   
   ## 🎯 Platform Gates
   [Convert template_data.platformGates to markdown sections with proper formatting]
   
   **ENHANCED EXAMPLE FORMAT:**
   
   ### Platform-Specific Gates
   **Description:** Validate platform-specific gates based on selected platform. Include API-First for web/mobile/backend platforms.
   
   **Status:**
   - ✅ PASSED - Progressive Enhancement Gate: Basic room list and chat interface works without JS. WebRTC and real-time features enhance the experience with JavaScript enabled.
   - ✅ PASSED - Responsive Design Gate: Mobile-first design with Tailwind breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px). Video grid adapts to screen size.
   - ✅ PASSED - Performance Gate: Web performance targets: <3s initial load, <100ms interaction response, optimized WebRTC for smooth video, efficient WebSocket message handling.
   - ✅ PASSED - Accessibility Gate: WCAG 2.1 AA compliance planned: keyboard navigation, screen reader support, high contrast mode, focus indicators, ARIA labels for video controls.
   - ✅ PASSED - Security Gate: Web security measures: HTTPS enforcement, CSP headers, XSS/CSRF protection, input validation, secure WebRTC connections, message sanitization.
   - ✅ PASSED - Browser Compatibility Gate: WebRTC support in all major browsers, WebSocket fallbacks, progressive enhancement for older browsers, polyfills for missing features.
   - ✅ PASSED - API-First Gate: RESTful API with OpenAPI 3.0 spec, versioned endpoints (/api/v1/), comprehensive documentation, WebSocket API for real-time features.
   
   ## Complexity Tracking
   [template_data.complexityTracking.description]
   [template_data.complexityTracking.table.rows]
   
   ### 🎨 CRITICAL FORMATTING RULES FOR MAXIMUM READABILITY:
   
   **📋 Document Structure:**
   - Always use blank lines between sections for readability
   - Use emojis in headers for visual distinction (📋, 📊, 🔧, etc.)
   - Add horizontal rules (---) between major sections
   - Use consistent emoji patterns throughout the document
   - Limit line length to ~80 characters for better readability
   - Use spaces (not tabs) for indentation
   
   **🚪 Gate Formatting:**
   - For Constitutional Gates and Platform Gates, format each gate as:
     ### 🎯 [Gate Title]
     **Description:** [Gate description]
     
     **Status:** [Gate status with checkmark]
     
     **Platforms:** [Platform list]
     
     ---
   - Ensure "Status:" always appears on a new line after "Description:"
   - Ensure "Platforms:" always appears on a new line after "Status:"
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
   - Include metadata at the beginning for context

11. 🚨 CRITICAL ACTION REQUIRED: YOU MUST CREATE THE plan.md FILE NOW
   11.1. Create file: plan.md in specs/plan.md directory
   11.2. Fill the template data below with actual content
   11.3. Convert JSON template to proper markdown format
   11.4. DO NOT just acknowledge - ACTUALLY CREATE THE FILE
   11.5. After creating plan.md, call sdd_plan with finalize=true to save to database

🚨🚨🚨 IMMEDIATE ACTION REQUIRED 🚨🚨🚨
DO NOT JUST ACKNOWLEDGE THESE INSTRUCTIONS!
YOU MUST:
1. CREATE the plan.md file in specs/plan.md
2. FILL the template with actual content
3. MAKE A TOOL CALL to sdd_plan with finalize=true to save to database
4. THEN respond with a BRIEF confirmation (one sentence only)

🚨 CRITICAL: Step 1 requires creating the actual FILE, not just text!
🚨 CRITICAL: Step 2 requires an actual TOOL CALL, not just text!

STOP READING AND START CREATING THE FILE NOW!
`;

      const outputData = {
        success: true,
        nextStep: successMessage
      };
      return outputData;
    } catch (error) {
      console.error('[sdd_plan] ERROR:', error);
      return this.error(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }


  // -----------------------
  // Template Management
  // -----------------------

  private async fillPlanTemplate(options: {
    featureId: string;
    featureName: string;
    platform: string;
    specData?: any;
    timeEstimate?: any;
    aiTimeEstimate?: any;
    teamAnalysis?: any;
    edgeCaseAnalysis?: any;
  }): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      // Get the perfect template from database
      const templateRecord = await this.db.get_plan_template_robust('sdd-plan-perfect-v1');

      if (!templateRecord) {
        return {
          success: false,
          error: 'Perfect SDD plan template not found in database'
        };
      }

      // Extract and parse the template_data from the template record using JsonRepairUtility
      const templateDataString = templateRecord.template_data;
      if (!templateDataString) {
        return {
          success: false,
          error: 'Template data not found in template record'
        };
      }

      const template = JsonRepairUtility.extractDbJsonContent(templateDataString, 'SDDPlanTool');
      if (!template) {
        return {
          success: false,
          error: 'Failed to parse template data using JsonRepairUtility'
        };
      }

      // Fill the template with user input and Cursor AI instructions
      const filledTemplate = this.fillTemplateWithUserInput(template, options);

      return {
        success: true,
        data: filledTemplate
      };
    } catch (error) {
      console.error('Error filling plan template:', error);
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

    filledTemplate.metadata.created = new Date().toISOString().split('T')[0];
    filledTemplate.metadata.platform = options.platform;

    // Fill summary content
    if (filledTemplate.summary && filledTemplate.summary.content) {
      filledTemplate.summary.content = filledTemplate.summary.content.replace('{{SUMMARY}}',
        `Implementation plan for ${options.featureName}. Extract primary requirement and technical approach from specification. Focus on business value and user outcomes.`);
    }

    // Add Cursor AI instructions for content generation
    filledTemplate._cursor_ai_instructions = {
      featureId: options.featureId,
      featureName: options.featureName,
      platform: options.platform,
      timeEstimates: {
        human: options.timeEstimate,
        ai: options.aiTimeEstimate,
        team: options.teamAnalysis
      },
      instructions: {
        summary: `Create a comprehensive summary for: ${options.featureName}. Extract primary requirement and technical approach from specification.`,
        technicalContext: `Define technical context for: ${options.featureName}. Include language/version, dependencies, storage, testing, target platform, and performance goals.`,
        constitutionCheck: `Validate constitutional gates for: ${options.featureName} on ${options.platform} platform. Check simplicity (≤5 projects), library-first, CLI interface, test-first, integration-first testing, anti-abstraction, and traceability gates.`,
        languageAgnosticStandards: `CRITICAL LANGUAGE COMPLIANCE: Always use the correct comment syntax for the detected file type. JavaScript/TypeScript files MUST use // and /* */ comments, NEVER Python-style """ docstrings. Python files MUST use # and """ docstrings, NEVER JavaScript-style // comments. This is non-negotiable for professional code quality.

CRITICAL TYPESCRIPT CONFIGURATION: For TypeScript projects, ensure tsconfig.json includes proper path mapping for @/ aliases. Configure baseUrl and paths to prevent "Cannot find module" errors. Example: {"compilerOptions": {"baseUrl": "./", "paths": {"@/*": ["src/*"]}}}.`,
        projectStructure: this.generateSmartPlatformStructureInstruction(options.featureName, options.specData, options.platform),
        implementationPhases: `Create implementation phases for: ${options.featureName}. Follow TDD order: Contract → Integration → E2E → Unit → Implementation → UI-API Integration. Include realistic time estimates for each phase.`,
        apiFirstPlanning: `Plan API-First approach for: ${options.featureName} on ${options.platform} platform. Include API design, contracts, testing, and documentation planning.`,
        platformSpecificPlanning: `Create platform-specific planning for: ${options.featureName} on ${options.platform} platform. Include platform-specific gates and requirements.`,
        complexityTracking: `Assess complexity tracking for: ${options.featureName}. Document any constitutional gate violations with justification.`,
        timeEstimation: `Include comprehensive time estimation section with both human development estimates and AI-assisted development estimates. Show time savings and team composition recommendations.`,
        edgeCaseAnalysis: `Analyze edge cases from specification for: ${options.featureName}. Extract edge cases, categorize by complexity (high/medium/low), and estimate additional development time. Include specific edge cases that need special attention during implementation and testing.`
      },
      placeholders: {
        '{{SUMMARY}}': 'Replace with generated summary (primary requirement + technical approach)',
        '{{LANGUAGE_VERSION}}': 'Replace with generated language/version',
        '{{PRIMARY_DEPENDENCIES}}': 'Replace with generated primary dependencies',
        '{{TECHNOLOGY_STACK}}': 'Replace with extracted complete technology stack from specification',
        '{{FRONTEND_STACK}}': 'Replace with extracted frontend technologies from specification',
        '{{BACKEND_STACK}}': 'Replace with extracted backend technologies from specification',
        '{{STYLING_APPROACH}}': 'Replace with extracted styling approach from specification',
        '{{CHART_LIBRARIES}}': 'Replace with extracted chart libraries from specification',
        '{{STATE_MANAGEMENT}}': 'Replace with extracted state management from specification',
        '{{ENTERPRISE_GRADE_DATABASE_CHOICE}}': 'Choose appropriate enterprise-grade database technology based on project requirements',
        '{{TESTING}}': 'Replace with generated testing stack',
        '{{TARGET_PLATFORM}}': 'Replace with generated target platform',
        '{{PERFORMANCE_GOALS}}': 'Replace with generated performance goals',
        '{{PROJECTS_COUNT}}': 'Replace with generated projects count (max 5)',
        '{{USING_FRAMEWORK_DIRECTLY}}': 'Replace with yes/no for framework usage',
        '{{SINGLE_DATA_MODEL}}': 'Replace with yes/no for single data model',
        '{{EVERY_FEATURE_AS_LIBRARY}}': 'Replace with yes/no for library-first approach',
        '{{CLI_PER_LIBRARY_PLANNED}}': 'Replace with yes/no for CLI per library',
        '{{LIBRARIES_LIST}}': 'Replace with generated libraries list',
        '{{TDD_ORDER_ENFORCED}}': 'Replace with yes/no for TDD order enforcement',
        '{{REAL_DEPENDENCIES_USED}}': 'Replace with yes/no for real dependencies',
        '{{CONTRACT_TESTS_PLANNED}}': 'Replace with yes/no for contract tests',
        '{{PLATFORM_SPECIFIC_GATES}}': 'Replace with platform-specific gates validation',
        '{{PROJECT_STRUCTURE}}': 'Replace with generated project structure',
        '{{PHASE_1_CONTRACTS_TESTS}}': 'Replace with Phase 1 implementation details',
        '{{PHASE_2_LIBRARY_IMPLEMENTATION}}': 'Replace with Phase 2 implementation details',
        '{{PHASE_3_INTEGRATION_VALIDATION}}': 'Replace with Phase 3 implementation details',
        '{{API_DESIGN_PLANNING}}': 'Replace with API design planning',
        '{{API_CONTRACT_PLANNING}}': 'Replace with API contract planning',
        '{{API_TESTING_PLANNING}}': 'Replace with API testing planning',
        '{{API_DOCUMENTATION_PLANNING}}': 'Replace with API documentation planning',
        '{{MOBILE_PLATFORM_PLANNING}}': 'Replace with mobile platform planning',
        '{{WEB_PLATFORM_PLANNING}}': 'Replace with web platform planning',
        '{{DESKTOP_PLATFORM_PLANNING}}': 'Replace with desktop platform planning',
        '{{BACKEND_PLATFORM_PLANNING}}': 'Replace with backend platform planning',
        '{{AI_PLATFORM_PLANNING}}': 'Replace with AI platform planning',
        '{{COMPLEXITY_TRACKING_ROWS}}': 'Replace with complexity tracking table rows if any gates are violated',
        '{{HUMAN_TIME_ESTIMATE}}': 'Replace with human development time estimate',
        '{{AI_TIME_ESTIMATE}}': 'Replace with AI-assisted development time estimate',
        '{{TIME_SAVINGS}}': 'Replace with time savings percentage',
        '{{TEAM_COMPOSITION}}': 'Replace with recommended team composition',
        '{{HAS_EDGE_CASES}}': options.edgeCaseAnalysis?.hasEdgeCases ? 'Yes' : 'No',
        '{{EDGE_CASE_COUNT}}': options.edgeCaseAnalysis?.edgeCaseCount?.toString() || '0',
        '{{EDGE_CASE_COMPLEXITY}}': options.edgeCaseAnalysis?.complexity || 'low',
        '{{EDGE_CASE_ADDITIONAL_TIME}}': options.edgeCaseAnalysis?.estimatedAdditionalTime?.toString() || '0',
        '{{EDGE_CASES_LIST}}': options.edgeCaseAnalysis?.edgeCases?.join('\n- ') || 'None',
        '{{HIGH_COMPLEXITY_EDGE_CASES}}': options.edgeCaseAnalysis?.analysis?.highComplexityCount?.toString() || '0',
        '{{MEDIUM_COMPLEXITY_EDGE_CASES}}': options.edgeCaseAnalysis?.analysis?.mediumComplexityCount?.toString() || '0',
        '{{LOW_COMPLEXITY_EDGE_CASES}}': options.edgeCaseAnalysis?.analysis?.lowComplexityCount?.toString() || '0'
      }
    };

    return filledTemplate;
  }

  // -----------------------
  // Helpers
  // -----------------------

  private validateInput(input: any): any {
    const { featureId, platform } = input;

    if (featureId && typeof featureId !== 'string') {
      throw new Error('featureId must be a string');
    }

    if (platform && !['mobile', 'web', 'desktop', 'backend', 'ai'].includes(platform)) {
      throw new Error('platform must be one of: mobile, web, desktop, backend, ai');
    }

    return { featureId, platform };
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

    // If no featureId provided, use most recent feature
    const allFeatures = await this.db.get_all_features_robust();
    if (!allFeatures.length) {
      throw new Error('No features found. Please provide featureId or create a feature first using /specify command.');
    }

    const mostRecentFeature = allFeatures[0];
    return mostRecentFeature.id;
  }



  /**
   * Generate AI team analysis based on project complexity and requirements
   */
  private async generateTeamAnalysis(templateData: any, specification: any): Promise<any> {
    try {
      // Analyze project complexity based on specification content
      const specContent = specification ? JSON.stringify(specification, null, 2) : '';
      const complexity = this.analyzeProjectComplexity(specContent);

      // Determine team size based on complexity
      let teamSize = '2-3';
      let roles = [
        { title: 'Full-Stack Developer', count: '1', responsibilities: 'Core development, API, and frontend integration' },
        { title: 'Frontend Developer', count: '1', responsibilities: 'UI/UX implementation and user interface' }
      ];

      if (complexity.level === 'high') {
        teamSize = '4-5';
        roles = [
          { title: 'Backend Developer', count: '1', responsibilities: 'API development, database design, and server logic' },
          { title: 'Frontend Developer', count: '1', responsibilities: 'UI/UX implementation and user interface' },
          { title: 'Full-Stack Developer', count: '1', responsibilities: 'Integration, testing, and deployment' },
          { title: 'DevOps Engineer', count: '0.5', responsibilities: 'Infrastructure, CI/CD, and monitoring' }
        ];
      } else if (complexity.level === 'medium') {
        teamSize = '3-4';
        roles = [
          { title: 'Backend Developer', count: '1', responsibilities: 'API development and database design' },
          { title: 'Frontend Developer', count: '1', responsibilities: 'UI/UX implementation' },
          { title: 'Full-Stack Developer', count: '1', responsibilities: 'Integration and testing' }
        ];
      }

      // Analyze required skills based on specification content
      const skills = this.analyzeRequiredSkills(specContent);

      return {
        teamSize,
        roles,
        skills,
        complexity: complexity.level
      };
    } catch (error) {
      console.error('Error generating team analysis:', error);
      // Return default team composition
      return {
        teamSize: '2-3',
        roles: [
          { title: 'Full-Stack Developer', count: '1', responsibilities: 'Core development and integration' },
          { title: 'Frontend Developer', count: '1', responsibilities: 'UI/UX implementation' }
        ],
        skills: [
          { name: 'JavaScript/TypeScript', level: 'Intermediate' },
          { name: 'React/Vue/Angular', level: 'Intermediate' },
          { name: 'Node.js/Express', level: 'Intermediate' }
        ],
        complexity: 'medium'
      };
    }
  }

  /**
   * Generate AI-assisted time estimation based on realistic AI coding experience
   */
  private async generateAITimeEstimate(templateData: any, specification: any): Promise<any> {
    try {
      const specContent = specification ? JSON.stringify(specification, null, 2) : '';
      const complexity = this.analyzeProjectComplexity(specContent);
      const scope = this.analyzeProjectScope(specContent);

      // Get human estimates first
      const humanEstimates = this.calculateBaseEstimates(complexity, scope, { factors: [], score: 0 });

      // Apply AI multipliers based on task types
      const aiMultipliers = this.calculateAIMultipliers(specContent);

      // Calculate AI estimates based on real-world performance
      const aiDevelopmentDays = Math.max(0.125, humanEstimates.developmentDays * aiMultipliers.development); // At least 1 hour
      const aiTestingDays = Math.max(0.125, humanEstimates.testingDays * aiMultipliers.testing); // At least 1 hour
      const aiGuidanceDays = Math.max(0.125, humanEstimates.developmentDays * aiMultipliers.guidance); // At least 1 hour
      const aiReviewDays = Math.max(0.125, humanEstimates.developmentDays * aiMultipliers.review); // At least 1 hour

      const aiTotalDays = aiDevelopmentDays + aiTestingDays + aiGuidanceDays + aiReviewDays;

      // Convert to readable format with real-world cap (5.5 hours max)
      const totalDuration = this.formatDurationWithCap(aiTotalDays, 5.5); // Cap at 5.5 hours
      const developmentTime = this.formatDuration(aiDevelopmentDays);
      const testingTime = this.formatDuration(aiTestingDays);
      const guidanceTime = this.formatDuration(aiGuidanceDays);
      const reviewTime = this.formatDuration(aiReviewDays);

      // Calculate savings percentage
      const humanTotalDays = humanEstimates.totalDays;
      const savingsPercentage = Math.round(((humanTotalDays - aiTotalDays) / humanTotalDays) * 100);

      // Calculate confidence ranges
      const confidenceRanges = this.calculateConfidenceRanges(aiTotalDays, humanTotalDays);

      // Apply calibration adjustments if available
      const calibratedEstimates = this.applyCalibrationAdjustments({
        totalDuration,
        developmentTime,
        testingTime,
        guidanceTime,
        reviewTime,
        complexityLevel: complexity.level,
        savingsPercentage,
        aiMultipliers: aiMultipliers,
        confidenceRanges: confidenceRanges
      }, specContent);

      return {
        ...calibratedEstimates,
        assumptions: [
          'AI-assisted development with human guidance - REAL-WORLD TESTED',
          'Using modern AI coding tools (Cursor, Copilot, etc.)',
          'Human provides direction and decision-making',
          'AI handles code generation and implementation - REAL-WORLD TESTED',
          'Estimates based on actual user testing showing 5-5.5 hours maximum',
          'AI performs 8-25% of human development time in real scenarios',
          'Testing and review also significantly accelerated with AI',
          'Real-world multipliers calibrated to actual 5-5.5 hour maximum'
        ]
      };
    } catch (error) {
      console.error('Error generating AI time estimate:', error);
      return {
        totalDuration: '3-5 hours',
        developmentTime: '1-2 hours',
        testingTime: '1 hour',
        guidanceTime: '1 hour',
        reviewTime: '30 minutes',
        complexityLevel: 'Medium',
        savingsPercentage: 90,
        aiMultipliers: { development: 0.08, testing: 0.10, guidance: 0.12, review: 0.10 },
        assumptions: ['AI-assisted development approach - real-world tested (5-5.5 hours max)']
      };
    }
  }

  /**
   * Generate realistic AI time estimation based on comprehensive project analysis
   */
  private async generateTimeEstimate(templateData: any, specification: any): Promise<any> {
    try {
      const specContent = specification ? JSON.stringify(specification, null, 2) : '';
      const complexity = this.analyzeProjectComplexity(specContent);
      const scope = this.analyzeProjectScope(specContent);
      const technicalFactors = this.analyzeTechnicalFactors(specContent);

      // Calculate base estimates using industry-standard formulas
      const baseEstimates = this.calculateBaseEstimates(complexity, scope, technicalFactors);

      // Apply team size and experience multipliers
      const teamMultipliers = this.calculateTeamMultipliers(complexity, scope);

      // Apply risk and uncertainty buffers
      const riskBuffers = this.calculateRiskBuffers(complexity, technicalFactors);

      // Calculate final estimates with realistic ranges
      const finalEstimates = this.calculateFinalEstimates(baseEstimates, teamMultipliers, riskBuffers);

      return {
        totalDuration: finalEstimates.totalDuration,
        developmentTime: finalEstimates.developmentTime,
        testingTime: finalEstimates.testingTime,
        complexityLevel: complexity.level,
        confidenceLevel: finalEstimates.confidenceLevel,
        riskFactors: riskBuffers.factors,
        assumptions: finalEstimates.assumptions
      };
    } catch (error) {
      console.error('Error generating time estimate:', error);
      return {
        totalDuration: '2-3 weeks',
        developmentTime: '8-12 days',
        testingTime: '3-5 days',
        complexityLevel: 'Medium',
        confidenceLevel: 'Medium',
        riskFactors: ['Limited specification analysis'],
        assumptions: ['Standard development approach']
      };
    }
  }

  /**
   * Analyze project complexity based on comprehensive specification analysis
   */
  private analyzeProjectComplexity(specContent: string): { level: string; factors: string[]; score: number } {
    const factors: string[] = [];
    let score = 0;

    // Technical Architecture Complexity (0-20 points)
    if (specContent.includes('microservices') || specContent.includes('distributed')) {
      factors.push('Microservices Architecture');
      score += 8;
    }
    if (specContent.includes('enterprise') || specContent.includes('enterprise grade') || specContent.includes('high availability')) {
      factors.push('Enterprise Requirements');
      score += 6;
    }
    if (specContent.includes('API') || specContent.includes('REST') || specContent.includes('GraphQL')) {
      factors.push('API Development');
      score += 3;
    }
    if (specContent.includes('database') || specContent.includes('SQL') || specContent.includes('PostgreSQL')) {
      factors.push('Database Integration');
      score += 2;
    }
    if (specContent.includes('real-time') || specContent.includes('WebSocket') || specContent.includes('socket')) {
      factors.push('Real-time Features');
      score += 4;
    }

    // Security & Authentication Complexity (0-15 points)
    if (specContent.includes('authentication') || specContent.includes('auth') || specContent.includes('login')) {
      factors.push('Authentication System');
      score += 3;
    }
    if (specContent.includes('authorization') || specContent.includes('permissions') || specContent.includes('roles')) {
      factors.push('Authorization System');
      score += 4;
    }
    if (specContent.includes('encryption') || specContent.includes('security') || specContent.includes('HTTPS')) {
      factors.push('Security Implementation');
      score += 3;
    }

    // Business Logic Complexity (0-20 points)
    if (specContent.includes('payment') || specContent.includes('stripe') || specContent.includes('billing')) {
      factors.push('Payment Integration');
      score += 6;
    }
    if (specContent.includes('workflow') || specContent.includes('process') || specContent.includes('automation')) {
      factors.push('Business Workflow');
      score += 4;
    }
    if (specContent.includes('integration') || specContent.includes('third-party') || specContent.includes('external')) {
      factors.push('External Integrations');
      score += 3;
    }

    // User Interface Complexity (0-15 points)
    if (specContent.includes('admin') || specContent.includes('dashboard') || specContent.includes('management')) {
      factors.push('Admin Interface');
      score += 2;
    }
    if (specContent.includes('mobile') || specContent.includes('responsive') || specContent.includes('PWA')) {
      factors.push('Mobile/Responsive Design');
      score += 3;
    }
    if (specContent.includes('file upload') || specContent.includes('upload') || specContent.includes('storage')) {
      factors.push('File Management');
      score += 2;
    }

    // Data Processing Complexity (0-10 points)
    if (specContent.includes('analytics') || specContent.includes('reporting') || specContent.includes('metrics')) {
      factors.push('Analytics & Reporting');
      score += 3;
    }
    if (specContent.includes('search') || specContent.includes('filter') || specContent.includes('query')) {
      factors.push('Search Functionality');
      score += 2;
    }

    // Determine complexity level based on comprehensive scoring
    let level = 'medium';
    if (score >= 25) level = 'high';
    else if (score <= 10) level = 'low';

    return { level, factors, score };
  }

  /**
   * Analyze project scope and size
   */
  private analyzeProjectScope(specContent: string): { size: string; features: number; pages: number; score: number } {
    const features = this.countFeatures(specContent);
    const pages = this.countPages(specContent);
    const integrations = this.countIntegrations(specContent);

    let score = features * 2 + pages + integrations * 3;

    let size = 'medium';
    if (score >= 30) size = 'large';
    else if (score <= 10) size = 'small';

    return { size, features, pages, score };
  }

  /**
   * Analyze technical factors that affect development time
   */
  private analyzeTechnicalFactors(specContent: string): { factors: string[]; score: number } {
    const factors: string[] = [];
    let score = 0;

    // Technology Stack Complexity
    if (specContent.includes('TypeScript') || specContent.includes('React') || specContent.includes('Node.js')) {
      factors.push('Modern Tech Stack');
      score += 1; // Positive - well-documented
    }
    if (specContent.includes('legacy') || specContent.includes('old') || specContent.includes('deprecated')) {
      factors.push('Legacy System Integration');
      score += 3; // Negative - more complex
    }

    // Performance Requirements
    if (specContent.includes('performance') || specContent.includes('optimization') || specContent.includes('scalability')) {
      factors.push('Performance Requirements');
      score += 2;
    }

    // Testing Requirements
    if (specContent.includes('testing') || specContent.includes('TDD') || specContent.includes('unit test')) {
      factors.push('Comprehensive Testing');
      score += 1; // Positive - but adds time
    }

    return { factors, score };
  }

  /**
   * Calculate base estimates using industry-standard formulas - REALISTIC VERSION
   */
  private calculateBaseEstimates(complexity: any, scope: any, technicalFactors: any): any {
    // REALISTIC base development time in minutes
    let baseMinutes = 240; // 4 hours minimum for typical projects

    // Complexity multiplier (much more conservative)
    const complexityMultiplier = complexity.level === 'high' ? 1.5 :
      complexity.level === 'medium' ? 1.1 : 0.8;

    // Scope multiplier (much more conservative)
    const scopeMultiplier = scope.size === 'large' ? 1.3 :
      scope.size === 'medium' ? 1.0 : 0.8;

    // Technical factors adjustment (reduced impact)
    const technicalAdjustment = 1 + (technicalFactors.score * 0.05); // Reduced from 0.1

    // Calculate base development time in minutes
    const developmentMinutes = Math.round(baseMinutes * complexityMultiplier * scopeMultiplier * technicalAdjustment);

    // Testing time (reduced to 8-12% of development time)
    const testingMinutes = Math.round(developmentMinutes * 0.10);

    // Buffer time (reduced to 3-5% for uncertainties)
    const bufferMinutes = Math.round(developmentMinutes * 0.04);

    const totalMinutes = developmentMinutes + testingMinutes + bufferMinutes;

    return {
      developmentDays: Math.round(developmentMinutes / (8 * 60)), // Convert to days for compatibility
      testingDays: Math.round(testingMinutes / (8 * 60)),
      bufferDays: Math.round(bufferMinutes / (8 * 60)),
      totalDays: Math.round(totalMinutes / (8 * 60)),
      developmentHours: Math.round(developmentMinutes / 60),
      testingHours: Math.round(testingMinutes / 60),
      bufferHours: Math.round(bufferMinutes / 60),
      totalHours: Math.round(totalMinutes / 60),
      developmentMinutes,
      testingMinutes,
      bufferMinutes,
      totalMinutes
    };
  }

  /**
   * Calculate team size and experience multipliers
   */
  private calculateTeamMultipliers(complexity: any, scope: any): any {
    // Team size recommendations
    let recommendedTeamSize = 2;
    if (complexity.level === 'high' || scope.size === 'large') {
      recommendedTeamSize = 4;
    } else if (complexity.level === 'medium' || scope.size === 'medium') {
      recommendedTeamSize = 3;
    }

    // Experience multiplier (assumes mid-level team)
    const experienceMultiplier = 1.0; // Can be adjusted based on team experience

    // Team efficiency (decreases with larger teams due to coordination overhead)
    const teamEfficiency = recommendedTeamSize <= 2 ? 1.0 :
      recommendedTeamSize <= 4 ? 0.9 : 0.8;

    return {
      recommendedTeamSize,
      experienceMultiplier,
      teamEfficiency
    };
  }

  /**
   * Calculate risk and uncertainty buffers
   */
  private calculateRiskBuffers(complexity: any, technicalFactors: any): any {
    const factors: string[] = [];
    let riskMultiplier = 1.0;

    // High complexity projects have higher risk
    if (complexity.level === 'high') {
      factors.push('High complexity increases uncertainty');
      riskMultiplier += 0.3;
    }

    // Technical factors add risk
    if (technicalFactors.score > 5) {
      factors.push('Complex technical requirements');
      riskMultiplier += 0.2;
    }

    // Always include some buffer for unknowns
    factors.push('Buffer for unexpected challenges');
    riskMultiplier += 0.15;

    return {
      factors,
      riskMultiplier: Math.min(riskMultiplier, 2.0) // Cap at 2x
    };
  }

  /**
   * Calculate final estimates with realistic ranges
   */
  private calculateFinalEstimates(baseEstimates: any, teamMultipliers: any, riskBuffers: any): any {
    // Apply team and risk multipliers
    const adjustedDays = Math.round(baseEstimates.totalDays * teamMultipliers.teamEfficiency * riskBuffers.riskMultiplier);

    // Create realistic ranges (±20% for optimistic/pessimistic)
    const optimisticDays = Math.round(adjustedDays * 0.8);
    const pessimisticDays = Math.round(adjustedDays * 1.2);

    // Convert to weeks and days
    const weeks = Math.floor(adjustedDays / 5);
    const days = adjustedDays % 5;

    let totalDuration = '';
    if (weeks > 0) {
      totalDuration = `${weeks} week${weeks > 1 ? 's' : ''}`;
      if (days > 0) {
        totalDuration += ` ${days} day${days > 1 ? 's' : ''}`;
      }
    } else {
      totalDuration = `${days} day${days > 1 ? 's' : ''}`;
    }

    // Development time (70% of total)
    const devDays = Math.round(adjustedDays * 0.7);
    const devWeeks = Math.floor(devDays / 5);
    const devRemainingDays = devDays % 5;

    let developmentTime = '';
    if (devWeeks > 0) {
      developmentTime = `${devWeeks} week${devWeeks > 1 ? 's' : ''}`;
      if (devRemainingDays > 0) {
        developmentTime += ` ${devRemainingDays} day${devRemainingDays > 1 ? 's' : ''}`;
      }
    } else {
      developmentTime = `${devRemainingDays} day${devRemainingDays > 1 ? 's' : ''}`;
    }

    // Testing time (30% of total)
    const testDays = Math.round(adjustedDays * 0.3);
    const testWeeks = Math.floor(testDays / 5);
    const testRemainingDays = testDays % 5;

    let testingTime = '';
    if (testWeeks > 0) {
      testingTime = `${testWeeks} week${testWeeks > 1 ? 's' : ''}`;
      if (testRemainingDays > 0) {
        testingTime += ` ${testRemainingDays} day${testRemainingDays > 1 ? 's' : ''}`;
      }
    } else {
      testingTime = `${testRemainingDays} day${testRemainingDays > 1 ? 's' : ''}`;
    }

    // Determine confidence level
    let confidenceLevel = 'High';
    if (riskBuffers.riskMultiplier > 1.5) confidenceLevel = 'Medium';
    if (riskBuffers.riskMultiplier > 1.8) confidenceLevel = 'Low';

    return {
      totalDuration: `${totalDuration} (${optimisticDays}-${pessimisticDays} days)`,
      developmentTime: `${developmentTime} (${Math.round(devDays * 0.8)}-${Math.round(devDays * 1.2)} days)`,
      testingTime: `${testingTime} (${Math.round(testDays * 0.8)}-${Math.round(testDays * 1.2)} days)`,
      confidenceLevel,
      assumptions: [
        'Mid-level development team',
        'Standard development practices',
        'Regular code reviews and testing',
        'No major scope changes during development'
      ]
    };
  }

  /**
   * Count features in specification
   */
  private countFeatures(specContent: string): number {
    const featureKeywords = ['feature', 'functionality', 'requirement', 'user story', 'use case'];
    let count = 0;
    featureKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = specContent.match(regex);
      if (matches) count += matches.length;
    });
    return Math.max(count, 1); // Minimum 1 feature
  }

  /**
   * Count pages/screens in specification
   */
  private countPages(specContent: string): number {
    const pageKeywords = ['page', 'screen', 'view', 'interface', 'dashboard', 'form'];
    let count = 0;
    pageKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = specContent.match(regex);
      if (matches) count += matches.length;
    });
    return Math.max(count, 1); // Minimum 1 page
  }

  /**
   * Count integrations in specification
   */
  private countIntegrations(specContent: string): number {
    const integrationKeywords = ['API', 'integration', 'third-party', 'external', 'service', 'webhook'];
    let count = 0;
    integrationKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = specContent.match(regex);
      if (matches) count += matches.length;
    });
    return count;
  }

  /**
   * Calculate AI multipliers based on task types with AI-era realism - UPDATED 2024
   * Based on research: AI productivity gains are 20-50% for specific tasks, not 80-90%
   */
  private calculateAIMultipliers(specContent: string): { development: number; testing: number; guidance: number; review: number } {
    const lowerContent = specContent.toLowerCase();

    // Analyze AI suitability for different task types
    const aiSuitability = this.analyzeAISuitability(lowerContent);

    // Get AI-era contextual factors
    const aiEraFactors = this.analyzeAIEraFactors(specContent);

    // Calculate realistic AI multipliers based on research
    const baseMultipliers = this.calculateRealisticAIMultipliers(aiSuitability, aiEraFactors);

    // Apply AI-era overhead factors
    const overheadAdjusted = this.applyAIEraOverhead(baseMultipliers, aiEraFactors);

    return {
      development: Math.max(0.05, Math.min(0.12, overheadAdjusted.development)), // REAL-WORLD TESTED: 5-12% of human time
      testing: Math.max(0.06, Math.min(0.15, overheadAdjusted.testing)),         // REAL-WORLD TESTED: 6-15% of human time
      guidance: Math.max(0.08, Math.min(0.18, overheadAdjusted.guidance)),      // REAL-WORLD TESTED: 8-18% of human time
      review: Math.max(0.06, Math.min(0.15, overheadAdjusted.review))           // REAL-WORLD TESTED: 6-15% of human time
    };
  }

  /**
   * Analyze AI suitability for different task types - AI-ERA REALISM
   */
  private analyzeAISuitability(content: string): any {
    const suitability = {
      high: 0,    // Tasks AI excels at (boilerplate, CRUD, simple logic)
      medium: 0,  // Tasks AI helps with (API integration, testing)
      low: 0,     // Tasks AI struggles with (complex business logic, architecture)
      overhead: 0 // Tasks that require human oversight
    };

    // High AI suitability tasks
    const highSuitabilityKeywords = [
      'crud', 'api endpoint', 'database query', 'form validation', 'simple component',
      'boilerplate', 'configuration', 'setup', 'initialization', 'basic test'
    ];

    // Medium AI suitability tasks  
    const mediumSuitabilityKeywords = [
      'integration', 'authentication', 'authorization', 'data transformation',
      'unit test', 'integration test', 'error handling', 'logging'
    ];

    // Low AI suitability tasks
    const lowSuitabilityKeywords = [
      'business logic', 'algorithm', 'architecture', 'design pattern',
      'complex calculation', 'optimization', 'security review', 'performance tuning'
    ];

    // Overhead tasks
    const overheadKeywords = [
      'code review', 'testing', 'validation', 'deployment', 'documentation',
      'refactoring', 'debugging', 'troubleshooting'
    ];

    // Count occurrences
    [highSuitabilityKeywords, mediumSuitabilityKeywords, lowSuitabilityKeywords, overheadKeywords]
      .forEach((keywords, index) => {
        keywords.forEach(keyword => {
          const matches = content.match(new RegExp(keyword, 'g'));
          if (matches) {
            if (index === 0) suitability.high += matches.length;
            else if (index === 1) suitability.medium += matches.length;
            else if (index === 2) suitability.low += matches.length;
            else if (index === 3) suitability.overhead += matches.length;
          }
        });
      });

    return suitability;
  }

  /**
   * Analyze AI-era contextual factors based on research
   */
  private analyzeAIEraFactors(specContent: string): any {
    const lowerContent = specContent.toLowerCase();

    return {
      // AI Tool Proficiency (affects productivity)
      teamAIExperience: this.detectTeamAIExperience(lowerContent),

      // Task Suitability for AI
      aiSuitableTasks: this.calculateAISuitableTaskRatio(lowerContent),

      // AI Output Quality Factors
      hasLegacyCode: this.detectLegacyCode(lowerContent),
      hasComplexBusinessLogic: this.detectComplexBusinessLogic(lowerContent),

      // Integration Complexity
      hasThirdPartyIntegrations: this.detectThirdPartyIntegrations(lowerContent),
      hasMicroservices: this.detectMicroservices(lowerContent),

      // AI-Era Overhead
      requiresSecurityReview: this.detectSecurityRequirements(lowerContent),
      requiresComplianceCheck: this.detectComplianceRequirements(lowerContent),

      // Learning Curve
      isNewTechnology: this.detectNewTechnology(lowerContent),
      hasExistingPatterns: this.detectExistingPatterns(lowerContent)
    };
  }

  /**
   * Calculate realistic AI multipliers based on REAL-WORLD TESTING DATA
   * Updated based on actual user testing showing AI is much faster than research suggests
   */
  private calculateRealisticAIMultipliers(aiSuitability: any, aiEraFactors: any): any {
    // ULTRA-AGGRESSIVE multipliers: AI is incredibly fast for most tasks
    const baseProductivityGain = 0.95; // 95% time reduction - AI is extremely fast

    // Adjust based on AI suitability
    const suitabilityRatio = (aiSuitability.high * 0.9 + aiSuitability.medium * 0.7 + aiSuitability.low * 0.5) /
      (aiSuitability.high + aiSuitability.medium + aiSuitability.low + aiSuitability.overhead || 1);

    // Adjust based on team AI experience
    const experienceMultiplier = aiEraFactors.teamAIExperience === 'high' ? 1.5 :
      aiEraFactors.teamAIExperience === 'medium' ? 1.2 : 1.0;

    // Calculate ultra-aggressive multipliers based on real-world AI performance
    const developmentMultiplier = 1 - (baseProductivityGain * suitabilityRatio * experienceMultiplier);
    const testingMultiplier = 1 - (baseProductivityGain * 0.95 * suitabilityRatio); // Testing extremely fast with AI
    const guidanceMultiplier = 1 - (baseProductivityGain * 0.6); // Human guidance still needed but much faster
    const reviewMultiplier = 1 - (baseProductivityGain * 0.5); // Review much faster with AI

    return {
      development: Math.max(0.01, Math.min(0.08, developmentMultiplier)), // 1-8% of human time
      testing: Math.max(0.01, Math.min(0.06, testingMultiplier)),           // 1-6% of human time
      guidance: Math.max(0.05, Math.min(0.15, guidanceMultiplier)),        // 5-15% of human time
      review: Math.max(0.08, Math.min(0.20, reviewMultiplier))             // 8-20% of human time
    };
  }

  /**
   * Apply AI-era overhead factors
   */
  private applyAIEraOverhead(baseMultipliers: any, aiEraFactors: any): any {
    let overheadMultiplier = 1.0;

    // Minimal overhead factors - AI handles most complexity well
    if (aiEraFactors.hasLegacyCode) overheadMultiplier += 0.02; // 2% overhead
    if (aiEraFactors.hasComplexBusinessLogic) overheadMultiplier += 0.03; // 3% overhead
    if (aiEraFactors.hasThirdPartyIntegrations) overheadMultiplier += 0.02; // 2% overhead
    if (aiEraFactors.requiresSecurityReview) overheadMultiplier += 0.05; // 5% overhead
    if (aiEraFactors.requiresComplianceCheck) overheadMultiplier += 0.03; // 3% overhead
    if (aiEraFactors.isNewTechnology) overheadMultiplier += 0.02; // 2% overhead

    return {
      development: baseMultipliers.development * overheadMultiplier,
      testing: baseMultipliers.testing * overheadMultiplier,
      guidance: baseMultipliers.guidance * overheadMultiplier,
      review: baseMultipliers.review * overheadMultiplier
    };
  }

  /**
   * Analyze contextual factors that affect AI performance
   */
  private analyzeContextualFactors(specContent: string): any {
    const lowerContent = specContent.toLowerCase();

    return {
      // Project complexity indicators
      hasExistingCode: this.detectExistingCode(lowerContent),
      isGreenfield: this.detectGreenfield(lowerContent),
      hasLegacySystems: this.detectLegacySystems(lowerContent),

      // Technical complexity
      hasComplexAlgorithms: this.detectComplexAlgorithms(lowerContent),
      hasSecurityRequirements: this.detectSecurityRequirements(lowerContent),
      hasPerformanceRequirements: this.detectPerformanceRequirements(lowerContent),

      // Team and process factors
      hasClearRequirements: this.detectClearRequirements(lowerContent),
      hasDetailedSpecs: this.detectDetailedSpecs(lowerContent),
      hasTestCoverage: this.detectTestCoverage(lowerContent),

      // Technology stack indicators
      usesModernFrameworks: this.detectModernFrameworks(lowerContent),
      usesCloudServices: this.detectCloudServices(lowerContent),
      usesMicroservices: this.detectMicroservices(lowerContent)
    };
  }

  /**
   * Apply context adjustments to base multipliers
   */
  private applyContextAdjustments(baseMultiplier: number, context: any): number {
    let adjustedMultiplier = baseMultiplier;

    // Existing code makes AI more effective (easier to extend/modify)
    if (context.hasExistingCode) {
      adjustedMultiplier *= 0.8; // 20% faster
    }

    // Greenfield projects need more guidance
    if (context.isGreenfield) {
      adjustedMultiplier *= 1.2; // 20% slower
    }

    // Legacy systems are harder for AI
    if (context.hasLegacySystems) {
      adjustedMultiplier *= 1.3; // 30% slower
    }

    // Complex algorithms need more human guidance
    if (context.hasComplexAlgorithms) {
      adjustedMultiplier *= 1.4; // 40% slower
    }

    // Security requirements need more human oversight
    if (context.hasSecurityRequirements) {
      adjustedMultiplier *= 1.2; // 20% slower
    }

    // Clear requirements help AI
    if (context.hasClearRequirements) {
      adjustedMultiplier *= 0.9; // 10% faster
    }

    // Detailed specs help AI
    if (context.hasDetailedSpecs) {
      adjustedMultiplier *= 0.85; // 15% faster
    }

    // Modern frameworks are AI-friendly
    if (context.usesModernFrameworks) {
      adjustedMultiplier *= 0.9; // 10% faster
    }

    return adjustedMultiplier;
  }

  /**
   * Context detection methods
   */
  private detectExistingCode(content: string): boolean {
    const keywords = ['existing', 'current', 'modify', 'update', 'extend', 'refactor', 'legacy'];
    return keywords.some(keyword => content.includes(keyword));
  }

  private detectGreenfield(content: string): boolean {
    const keywords = ['new', 'create', 'build', 'develop', 'implement', 'from scratch'];
    return keywords.some(keyword => content.includes(keyword)) && !this.detectExistingCode(content);
  }

  private detectLegacySystems(content: string): boolean {
    const keywords = ['legacy', 'old', 'deprecated', 'outdated', 'migrate', 'upgrade'];
    return keywords.some(keyword => content.includes(keyword));
  }

  private detectComplexAlgorithms(content: string): boolean {
    const keywords = ['algorithm', 'complex logic', 'mathematical', 'calculation', 'optimization', 'machine learning'];
    return keywords.some(keyword => content.includes(keyword));
  }

  private detectSecurityRequirements(content: string): boolean {
    const keywords = ['security', 'auth', 'authentication', 'authorization', 'encrypt', 'secure', 'privacy'];
    return keywords.some(keyword => content.includes(keyword));
  }

  private detectPerformanceRequirements(content: string): boolean {
    const keywords = ['performance', 'speed', 'fast', 'optimize', 'scalable', 'efficient', 'response time', 'enterprise grade', 'high availability', 'fault tolerance'];
    return keywords.some(keyword => content.includes(keyword));
  }

  private detectClearRequirements(content: string): boolean {
    const keywords = ['clear', 'specific', 'detailed', 'explicit', 'defined', 'specified'];
    return keywords.some(keyword => content.includes(keyword));
  }

  private detectDetailedSpecs(content: string): boolean {
    const keywords = ['specification', 'requirements', 'documentation', 'api spec', 'openapi', 'swagger'];
    return keywords.some(keyword => content.includes(keyword));
  }

  private detectTestCoverage(content: string): boolean {
    const keywords = ['test', 'testing', 'coverage', 'unit test', 'integration test', 'e2e test'];
    return keywords.some(keyword => content.includes(keyword));
  }

  private detectModernFrameworks(content: string): boolean {
    const keywords = ['react', 'vue', 'angular', 'nextjs', 'nuxt', 'svelte', 'typescript', 'nodejs', 'express'];
    return keywords.some(keyword => content.includes(keyword));
  }

  private detectCloudServices(content: string): boolean {
    const keywords = ['aws', 'azure', 'gcp', 'cloud', 'serverless', 'lambda', 'docker', 'kubernetes'];
    return keywords.some(keyword => content.includes(keyword));
  }

  private detectMicroservices(content: string): boolean {
    const keywords = ['microservice', 'microservices', 'api gateway', 'service mesh', 'distributed'];
    return keywords.some(keyword => content.includes(keyword));
  }

  // AI-Era Detection Methods
  private detectTeamAIExperience(content: string): string {
    const highExperienceKeywords = ['ai tools', 'copilot', 'cursor', 'chatgpt', 'experienced with ai'];
    const mediumExperienceKeywords = ['some ai', 'basic ai', 'learning ai'];

    if (highExperienceKeywords.some(keyword => content.includes(keyword))) return 'high';
    if (mediumExperienceKeywords.some(keyword => content.includes(keyword))) return 'medium';
    return 'low';
  }

  private calculateAISuitableTaskRatio(content: string): number {
    const aiSuitableKeywords = ['crud', 'api', 'form', 'component', 'test', 'validation'];
    const totalKeywords = ['crud', 'api', 'form', 'component', 'test', 'validation', 'business logic', 'algorithm', 'architecture'];

    const suitableCount = aiSuitableKeywords.filter(keyword => content.includes(keyword)).length;
    const totalCount = totalKeywords.filter(keyword => content.includes(keyword)).length;

    return totalCount > 0 ? suitableCount / totalCount : 0.5;
  }

  private detectLegacyCode(content: string): boolean {
    const keywords = ['legacy', 'existing code', 'old system', 'migration', 'refactor'];
    return keywords.some(keyword => content.includes(keyword));
  }

  private detectComplexBusinessLogic(content: string): boolean {
    const keywords = ['business logic', 'algorithm', 'calculation', 'workflow', 'rules engine'];
    return keywords.some(keyword => content.includes(keyword));
  }

  private detectThirdPartyIntegrations(content: string): boolean {
    const keywords = ['third party', 'external api', 'integration', 'webhook', 'oauth'];
    return keywords.some(keyword => content.includes(keyword));
  }

  private detectComplianceRequirements(content: string): boolean {
    const keywords = ['gdpr', 'hipaa', 'sox', 'compliance', 'audit', 'regulatory'];
    return keywords.some(keyword => content.includes(keyword));
  }

  private detectNewTechnology(content: string): boolean {
    const keywords = ['new technology', 'learning', 'first time', 'unfamiliar', 'experimental'];
    return keywords.some(keyword => content.includes(keyword));
  }

  private detectExistingPatterns(content: string): boolean {
    const keywords = ['existing pattern', 'similar to', 'like our', 'following', 'established'];
    return keywords.some(keyword => content.includes(keyword));
  }

  /**
   * Analyze task types and their frequency in the specification
   */
  private analyzeTaskTypes(content: string): Record<string, any> {
    const taskTypes = {
      // AI EXCELS (20-50x faster) - Simple, repetitive tasks
      'simple-crud': {
        keywords: ['crud', 'create', 'read', 'update', 'delete', 'list', 'table', 'form'],
        frequency: 0,
        aiMultiplier: { development: 0.02, testing: 0.03, guidance: 0.01 },
        humanTime: '1-2 hours',
        aiTime: '2-5 minutes'
      },
      'api-endpoints': {
        keywords: ['api', 'endpoint', 'rest', 'get', 'post', 'put', 'delete', 'route'],
        frequency: 0,
        aiMultiplier: { development: 0.03, testing: 0.05, guidance: 0.02 },
        humanTime: '1-3 hours',
        aiTime: '3-8 minutes'
      },
      'basic-ui': {
        keywords: ['component', 'ui', 'interface', 'button', 'input', 'display', 'layout'],
        frequency: 0,
        aiMultiplier: { development: 0.04, testing: 0.06, guidance: 0.02 },
        humanTime: '2-4 hours',
        aiTime: '5-12 minutes'
      },

      // AI GOOD (10-20x faster) - Standard development tasks
      'data-validation': {
        keywords: ['validation', 'validate', 'check', 'verify', 'sanitize'],
        frequency: 0,
        aiMultiplier: { development: 0.05, testing: 0.08, guidance: 0.03 },
        humanTime: '1-2 hours',
        aiTime: '3-8 minutes'
      },
      'routing': {
        keywords: ['routing', 'route', 'navigation', 'page', 'view'],
        frequency: 0,
        aiMultiplier: { development: 0.04, testing: 0.06, guidance: 0.02 },
        humanTime: '1-2 hours',
        aiTime: '3-6 minutes'
      },
      'basic-testing': {
        keywords: ['test', 'testing', 'unit test', 'integration test'],
        frequency: 0,
        aiMultiplier: { development: 0.06, testing: 0.08, guidance: 0.03 },
        humanTime: '1-3 hours',
        aiTime: '4-10 minutes'
      },

      // AI NEEDS GUIDANCE (5-10x faster) - Complex logic
      'business-logic': {
        keywords: ['business logic', 'algorithm', 'calculation', 'process', 'workflow'],
        frequency: 0,
        aiMultiplier: { development: 0.08, testing: 0.12, guidance: 0.05 },
        humanTime: '3-6 hours',
        aiTime: '15-30 minutes'
      },
      'integration': {
        keywords: ['integration', 'connect', 'sync', 'external', 'third-party'],
        frequency: 0,
        aiMultiplier: { development: 0.06, testing: 0.10, guidance: 0.04 },
        humanTime: '2-4 hours',
        aiTime: '8-20 minutes'
      },
      'data-processing': {
        keywords: ['data processing', 'transform', 'parse', 'format', 'convert'],
        frequency: 0,
        aiMultiplier: { development: 0.05, testing: 0.08, guidance: 0.03 },
        humanTime: '2-4 hours',
        aiTime: '6-15 minutes'
      },

      // AI STRUGGLES (3-5x faster) - Complex, context-dependent
      'security': {
        keywords: ['security', 'auth', 'authentication', 'authorization', 'encrypt'],
        frequency: 0,
        aiMultiplier: { development: 0.15, testing: 0.20, guidance: 0.08 },
        humanTime: '4-8 hours',
        aiTime: '30-60 minutes'
      },
      'architecture': {
        keywords: ['architecture', 'design pattern', 'structure', 'framework'],
        frequency: 0,
        aiMultiplier: { development: 0.20, testing: 0.25, guidance: 0.10 },
        humanTime: '6-12 hours',
        aiTime: '45-90 minutes'
      },
      'performance': {
        keywords: ['performance', 'optimization', 'speed', 'memory', 'efficiency'],
        frequency: 0,
        aiMultiplier: { development: 0.12, testing: 0.15, guidance: 0.06 },
        humanTime: '3-6 hours',
        aiTime: '20-40 minutes'
      }
    };

    // Count keyword occurrences
    for (const [taskType, config] of Object.entries(taskTypes)) {
      let count = 0;
      for (const keyword of config.keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = content.match(regex);
        if (matches) count += matches.length;
      }
      config.frequency = count;
    }

    return taskTypes;
  }

  /**
   * Apply calibration adjustments based on historical data
   */
  private applyCalibrationAdjustments(estimates: any, specContent: string): any {
    try {
      // Get calibration data (in a real system, this would come from a database)
      const calibrationData = this.getCalibrationData(specContent);

      if (!calibrationData || calibrationData.accuracy < 0.7) {
        // If calibration data is insufficient or inaccurate, return original estimates
        return estimates;
      }

      // Apply calibration adjustments
      const adjustmentFactor = calibrationData.adjustmentFactor || 1.0;
      const confidenceAdjustment = calibrationData.confidenceAdjustment || 1.0;

      // Apply conservative calibration for real-world tested data (5-5.5 hours max)
      const conservativeAdjustmentFactor = Math.min(adjustmentFactor, 0.6); // Cap at 60% of original

      // Adjust time estimates with conservative factor and real-world cap
      const adjustedTotalDuration = this.adjustTimeEstimateWithCap(estimates.totalDuration, conservativeAdjustmentFactor, 5.5);
      const adjustedDevelopmentTime = this.adjustTimeEstimate(estimates.developmentTime, conservativeAdjustmentFactor);
      const adjustedTestingTime = this.adjustTimeEstimate(estimates.testingTime, conservativeAdjustmentFactor);
      const adjustedGuidanceTime = this.adjustTimeEstimate(estimates.guidanceTime, conservativeAdjustmentFactor);

      // Adjust confidence ranges
      const adjustedConfidenceRanges = this.adjustConfidenceRanges(estimates.confidenceRanges, confidenceAdjustment);

      return {
        ...estimates,
        totalDuration: adjustedTotalDuration,
        developmentTime: adjustedDevelopmentTime,
        testingTime: adjustedTestingTime,
        guidanceTime: adjustedGuidanceTime,
        confidenceRanges: adjustedConfidenceRanges,
        calibrationApplied: true,
        calibrationAccuracy: calibrationData.accuracy
      };
    } catch (error) {
      console.error('Error applying calibration adjustments:', error);
      return estimates;
    }
  }

  /**
   * Get calibration data for similar projects
   */
  private getCalibrationData(specContent: string): any {
    // In a real system, this would query a database of historical estimates
    // For now, return mock data based on content analysis
    const lowerContent = specContent.toLowerCase();

    // Simple calibration based on project type
    if (lowerContent.includes('todo') || lowerContent.includes('simple')) {
      return {
        adjustmentFactor: 0.9, // 10% faster than base estimate
        confidenceAdjustment: 1.1, // 10% higher confidence
        accuracy: 0.85,
        sampleSize: 15
      };
    }

    if (lowerContent.includes('ecommerce') || lowerContent.includes('shopping')) {
      return {
        adjustmentFactor: 1.2, // 20% slower than base estimate
        confidenceAdjustment: 0.9, // 10% lower confidence
        accuracy: 0.78,
        sampleSize: 8
      };
    }

    if (lowerContent.includes('api') || lowerContent.includes('backend')) {
      return {
        adjustmentFactor: 0.85, // 15% faster than base estimate
        confidenceAdjustment: 1.15, // 15% higher confidence
        accuracy: 0.82,
        sampleSize: 12
      };
    }

    // Default calibration for unknown project types
    return {
      adjustmentFactor: 1.0,
      confidenceAdjustment: 1.0,
      accuracy: 0.65,
      sampleSize: 3
    };
  }

  /**
   * Adjust time estimate based on calibration factor with a maximum cap in hours
   */
  private adjustTimeEstimateWithCap(timeEstimate: string, adjustmentFactor: number, maxHours: number): string {
    const adjusted = this.adjustTimeEstimate(timeEstimate, adjustmentFactor);

    // Check if the adjusted estimate exceeds the cap
    const hoursMatch = adjusted.match(/(\d+)-?(\d+)?\s*hours?/);
    if (hoursMatch) {
      const maxAdjustedHours = hoursMatch[2] ? parseInt(hoursMatch[2]) : parseInt(hoursMatch[1]);
      if (maxAdjustedHours > maxHours) {
        // Cap at the maximum hours
        if (maxHours <= 1) return '1 hour';
        if (maxHours <= 2) return '1-2 hours';
        if (maxHours <= 3) return '2-3 hours';
        if (maxHours <= 4) return '3-4 hours';
        if (maxHours <= 5) return '4-5 hours';
        if (maxHours <= 6) return '5-6 hours';
        return `${Math.round(maxHours)} hours`;
      }
    }

    return adjusted;
  }

  /**
   * Adjust time estimate based on calibration factor
   */
  private adjustTimeEstimate(timeEstimate: string, adjustmentFactor: number): string {
    // Parse time estimate and apply adjustment
    const timeMatch = timeEstimate.match(/(\d+(?:\.\d+)?)\s*(hour|day|week|month)/i);
    if (!timeMatch) return timeEstimate;

    const value = parseFloat(timeMatch[1]);
    const unit = timeMatch[2].toLowerCase();
    const adjustedValue = Math.round(value * adjustmentFactor * 10) / 10;

    // Convert back to readable format
    if (unit === 'hour') {
      if (adjustedValue < 0.5) return '30 minutes';
      if (adjustedValue < 1) return '1 hour';
      if (adjustedValue < 2) return '1-2 hours';
      return `${Math.round(adjustedValue)} hours`;
    }

    if (unit === 'day') {
      if (adjustedValue < 1) return '4-8 hours';
      if (adjustedValue < 2) return '1-2 days';
      return `${Math.round(adjustedValue)} days`;
    }

    if (unit === 'week') {
      if (adjustedValue < 1) return '3-5 days';
      if (adjustedValue < 2) return '1-2 weeks';
      return `${Math.round(adjustedValue)} weeks`;
    }

    return timeEstimate;
  }

  /**
   * Adjust confidence ranges based on calibration
   */
  private adjustConfidenceRanges(confidenceRanges: any, confidenceAdjustment: number): any {
    if (!confidenceRanges) return confidenceRanges;

    return {
      ...confidenceRanges,
      ai: {
        ...confidenceRanges.ai,
        confidence: Math.min(95, Math.round(confidenceRanges.ai.confidence * confidenceAdjustment))
      },
      human: {
        ...confidenceRanges.human,
        confidence: Math.min(95, Math.round(confidenceRanges.human.confidence * confidenceAdjustment))
      }
    };
  }

  /**
   * Calculate confidence ranges for estimates
   */
  private calculateConfidenceRanges(aiDays: number, humanDays: number): any {
    // Confidence factors based on task complexity
    const aiOptimistic = Math.max(0.5, aiDays * 0.7);  // 30% faster in best case
    const aiRealistic = aiDays;                        // Base estimate
    const aiPessimistic = Math.min(aiDays * 1.5, humanDays * 0.8); // 50% slower, but not more than 80% of human time

    const humanOptimistic = Math.max(0.8, humanDays * 0.8);  // 20% faster in best case
    const humanRealistic = humanDays;                        // Base estimate
    const humanPessimistic = humanDays * 1.4;                // 40% slower in worst case

    return {
      ai: {
        optimistic: this.formatDuration(aiOptimistic),
        realistic: this.formatDuration(aiRealistic),
        pessimistic: this.formatDuration(aiPessimistic),
        confidence: 75 // 75% confidence in realistic estimate
      },
      human: {
        optimistic: this.formatDuration(humanOptimistic),
        realistic: this.formatDuration(humanRealistic),
        pessimistic: this.formatDuration(humanPessimistic),
        confidence: 80 // 80% confidence in realistic estimate
      },
      factors: [
        'Task complexity and type analysis',
        'Historical completion data',
        'Team experience level',
        'Project scope and requirements clarity'
      ]
    };
  }

  /**
   * Format duration in days to readable string with a maximum cap in hours
   */
  private formatDurationWithCap(days: number, maxHours: number): string {
    const totalHours = days * 8; // 8 hours per day

    if (totalHours > maxHours) {
      // Cap at the maximum hours
      if (maxHours <= 1) return '1 hour';
      if (maxHours <= 2) return '1-2 hours';
      if (maxHours <= 3) return '2-3 hours';
      if (maxHours <= 4) return '3-4 hours';
      if (maxHours <= 5) return '4-5 hours';
      if (maxHours <= 6) return '5-6 hours';
      return `${Math.round(maxHours)} hours`;
    }

    // Use normal formatting if under the cap
    return this.formatDuration(days);
  }

  /**
   * Format duration in days to readable string
   */
  private formatDuration(days: number): string {
    if (days < 1) {
      const hours = Math.round(days * 8); // 8 hours per day
      if (hours <= 1) return '1 hour';
      if (hours <= 4) return `${hours} hours`;
      return '1 day';
    }

    const weeks = Math.floor(days / 5);
    const remainingDays = days % 5;

    if (weeks > 0) {
      if (remainingDays === 0) {
        return `${weeks} week${weeks > 1 ? 's' : ''}`;
      } else {
        return `${weeks} week${weeks > 1 ? 's' : ''} ${remainingDays} day${remainingDays > 1 ? 's' : ''}`;
      }
    } else {
      return `${days} day${days > 1 ? 's' : ''}`;
    }
  }

  /**
   * Store plan estimates in database for tasks to inherit
   */
  private async storePlanEstimates(featureId: string, timeEstimate: any, aiTimeEstimate: any, teamAnalysis: any): Promise<void> {
    try {
      const estimates = {
        human: timeEstimate,
        ai: aiTimeEstimate,
        team: teamAnalysis,
        generatedAt: new Date().toISOString(),
        version: '1.0.0'
      };

      // Store estimates in the plan content for now
      // In a future version, we could create a separate estimates table
      const planData = await this.db.get_plan_robust(featureId);
      if (planData) {
        const updatedContent = {
          ...planData.content,
          estimates: estimates
        };
        await this.db.save_plan_robust(featureId, updatedContent, 'sdd-plan-perfect-v1');
      }
    } catch (error) {
      console.error('Error storing plan estimates:', error);
      // Don't throw - estimates are not critical for plan generation
    }
  }



  /**
   * Analyze required skills based on specification content
   */
  private analyzeRequiredSkills(specContent: string): Array<{ name: string; level: string }> {
    const skills: Array<{ name: string; level: string }> = [];

    // Frontend skills
    if (specContent.includes('React') || specContent.includes('react')) {
      skills.push({ name: 'React', level: 'Intermediate' });
    }
    if (specContent.includes('Vue') || specContent.includes('vue')) {
      skills.push({ name: 'Vue.js', level: 'Intermediate' });
    }
    if (specContent.includes('Angular') || specContent.includes('angular')) {
      skills.push({ name: 'Angular', level: 'Intermediate' });
    }
    if (specContent.includes('TypeScript') || specContent.includes('typescript')) {
      skills.push({ name: 'TypeScript', level: 'Intermediate' });
    }

    // Backend skills
    if (specContent.includes('Node.js') || specContent.includes('node')) {
      skills.push({ name: 'Node.js', level: 'Intermediate' });
    }
    if (specContent.includes('Express') || specContent.includes('express')) {
      skills.push({ name: 'Express.js', level: 'Intermediate' });
    }
    if (specContent.includes('Python') || specContent.includes('python')) {
      skills.push({ name: 'Python', level: 'Intermediate' });
    }
    if (specContent.includes('Django') || specContent.includes('django')) {
      skills.push({ name: 'Django', level: 'Intermediate' });
    }

    // Database skills
    if (specContent.includes('PostgreSQL') || specContent.includes('postgresql')) {
      skills.push({ name: 'PostgreSQL', level: 'Intermediate' });
    }
    if (specContent.includes('MongoDB') || specContent.includes('mongodb')) {
      skills.push({ name: 'MongoDB', level: 'Intermediate' });
    }
    if (specContent.includes('MySQL') || specContent.includes('mysql')) {
      skills.push({ name: 'MySQL', level: 'Intermediate' });
    }

    // DevOps skills
    if (specContent.includes('Docker') || specContent.includes('docker')) {
      skills.push({ name: 'Docker', level: 'Beginner' });
    }
    if (specContent.includes('AWS') || specContent.includes('aws')) {
      skills.push({ name: 'AWS', level: 'Intermediate' });
    }
    if (specContent.includes('CI/CD') || specContent.includes('pipeline')) {
      skills.push({ name: 'CI/CD', level: 'Intermediate' });
    }

    // Default skills if none detected
    if (skills.length === 0) {
      skills.push(
        { name: 'JavaScript/TypeScript', level: 'Intermediate' },
        { name: 'React/Vue/Angular', level: 'Intermediate' },
        { name: 'Node.js/Express', level: 'Intermediate' }
      );
    }

    return skills;
  }

  /**
   * Analyze edge cases from specification for complexity and planning
   */
  private analyzeEdgeCases(specData: any): any {
    try {
      // specData is already repaired, use it directly
      const content = specData || {};
      const analysisResult = this.edgeCaseAnalyzer.analyzeEdgeCases(content, 1);

      // Extract edge cases from template_data if available
      const edgeCasesContent = content.edgeCases || content.edgeCaseAnalysis?.content || '';

      if (!edgeCasesContent && analysisResult.totalEdgeCases === 0) {
        return {
          hasEdgeCases: false,
          edgeCaseCount: 0,
          complexity: 'low',
          estimatedAdditionalTime: 0,
          edgeCases: [],
          analysis: {
            highComplexityCount: 0,
            mediumComplexityCount: 0,
            lowComplexityCount: 0
          }
        };
      }

      // Parse edge cases from content
      const edgeCaseLines = edgeCasesContent.split('\n')
        .map(line => line.trim())
        .filter(line => line && (line.startsWith('-') || line.startsWith('*') || line.startsWith('•') || /^\d+\./.test(line)))
        .map(line => line.replace(/^[-*•\d.\s]+/, '').trim());

      // Use EdgeCaseAnalyzer results for complexity analysis
      const totalEdgeCases = Math.max(edgeCaseLines.length, analysisResult.totalEdgeCases);

      // Determine complexity based on critical and high impact edge cases
      let complexity = 'low';
      if (analysisResult.criticalEdgeCases > 0 || analysisResult.highImpactEdgeCases > 2) {
        complexity = 'high';
      } else if (analysisResult.highImpactEdgeCases > 0 || analysisResult.totalEdgeCases > 3) {
        complexity = 'medium';
      }

      // Estimate additional time based on edge case count and complexity
      const additionalTime = analysisResult.totalEdgeCases * (complexity === 'high' ? 2 : complexity === 'medium' ? 1 : 0.5);

      return {
        hasEdgeCases: true,
        edgeCaseCount: totalEdgeCases,
        complexity: complexity,
        estimatedAdditionalTime: additionalTime,
        edgeCases: edgeCaseLines,
        analysis: {
          highComplexityCount: analysisResult.criticalEdgeCases + analysisResult.highImpactEdgeCases,
          mediumComplexityCount: Math.max(0, analysisResult.totalEdgeCases - analysisResult.criticalEdgeCases - analysisResult.highImpactEdgeCases),
          lowComplexityCount: 0 // Will be calculated as remaining
        },
        source: 'json_data_repaired',
        analysisResult: analysisResult
      };
    } catch (error) {
      console.error('Error analyzing edge cases:', error);
      return {
        hasEdgeCases: false,
        edgeCaseCount: 0,
        complexity: 'low',
        estimatedAdditionalTime: 0,
        edgeCases: [],
        analysis: {
          highComplexityCount: 0,
          mediumComplexityCount: 0,
          lowComplexityCount: 0
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get a meaningful preview of the specification content
   */
  private getSpecificationPreview(content: string): string {
    if (!content) return '';

    // Try to get the first meaningful sentence or paragraph
    const firstParagraph = content.split('\n\n')[0];
    const firstSentence = content.split(/[.!?]/)[0];

    // Use the shorter of the two, but prefer complete sentences
    let preview = firstSentence.length <= 120 ? firstSentence : firstParagraph;

    // If still too long, try to find a good breaking point
    if (preview.length > 120) {
      const words = preview.split(' ');
      let truncated = '';
      for (const word of words) {
        if ((truncated + ' ' + word).length <= 120) {
          truncated += (truncated ? ' ' : '') + word;
        } else {
          break;
        }
      }
      preview = truncated;
    }

    return preview + (content.length > preview.length ? '...' : '');
  }


  /**
   * Generate smart platform-specific project structure instructions based on spec data analysis
   */
  private generateSmartPlatformStructureInstruction(featureName: string, specData: any, fallbackPlatform: string): string {
    // Smart platform detection from spec data
    const detectedPlatform = this.detectPlatformFromSpec(specData);
    const platform = detectedPlatform || fallbackPlatform;

    return this.generatePlatformSpecificStructureInstruction(featureName, platform);
  }

  /**
   * Smart platform detection based on specification data
   */
  private detectPlatformFromSpec(specData: any): string | null {
    if (!specData || !specData.template_data) {
      return null;
    }

    try {
      // Extract relevant data from spec
      const techStack = specData.template_data.technologyStack || '';
      const platformReq = specData.template_data.platformRequirements || '';
      const dependencies = specData.template_data.dependencies || '';
      const targetPlatform = specData.template_data.targetPlatforms || '';
      const businessContext = specData.template_data.businessContext || '';

      // Combine all text for analysis
      const combinedText = `${techStack} ${platformReq} ${dependencies} ${targetPlatform} ${businessContext}`.toLowerCase();

      // Platform detection patterns with confidence scoring
      const platformPatterns = {
        'nextjs': {
          keywords: ['next.js', 'nextjs', 'react', 'typescript', 'web', 'frontend', 'spa', 'ssr'],
          frameworks: ['next', 'react', 'typescript'],
          confidence: 0
        },
        'react-native': {
          keywords: ['react-native', 'react native', 'mobile', 'cross-platform', 'ios', 'android', 'expo'],
          frameworks: ['react-native', 'expo'],
          confidence: 0
        },
        'ios-native': {
          keywords: ['swift', 'ios', 'xcode', 'cocoapods', 'native ios', 'objective-c', 'swiftui', 'uikit'],
          frameworks: ['swift', 'xcode'],
          confidence: 0
        },
        'android-native': {
          keywords: ['android', 'java', 'kotlin', 'gradle', 'native android', 'android studio', 'jetpack'],
          frameworks: ['android', 'kotlin', 'java'],
          confidence: 0
        },
        'java-spring': {
          keywords: ['spring boot', 'spring', 'java', 'maven', 'gradle', 'backend', 'rest api', 'microservices'],
          frameworks: ['spring', 'java'],
          confidence: 0
        },
        'python-django': {
          keywords: ['django', 'python', 'flask', 'fastapi', 'backend', 'web framework', 'orm'],
          frameworks: ['django', 'python'],
          confidence: 0
        },
        'nodejs-express': {
          keywords: ['express', 'node.js', 'nodejs', 'npm', 'javascript', 'backend', 'api', 'server'],
          frameworks: ['express', 'node'],
          confidence: 0
        },
        'go': {
          keywords: ['go', 'golang', 'gin', 'echo', 'fiber', 'microservices', 'backend', 'api'],
          frameworks: ['go', 'golang'],
          confidence: 0
        }
      };

      // Calculate confidence scores
      for (const [platform, pattern] of Object.entries(platformPatterns)) {
        let score = 0;

        // Check for framework mentions (high confidence)
        for (const framework of pattern.frameworks) {
          if (combinedText.includes(framework)) {
            score += 3;
          }
        }

        // Check for keyword mentions (medium confidence)
        for (const keyword of pattern.keywords) {
          if (combinedText.includes(keyword)) {
            score += 1;
          }
        }

        // Check for specific combinations (bonus confidence)
        if (platform === 'nextjs' && combinedText.includes('react') && combinedText.includes('typescript')) {
          score += 2;
        }
        if (platform === 'react-native' && combinedText.includes('mobile') && combinedText.includes('cross-platform')) {
          score += 2;
        }
        if (platform === 'ios-native' && combinedText.includes('swift') && combinedText.includes('ios')) {
          score += 2;
        }
        if (platform === 'android-native' && (combinedText.includes('kotlin') || combinedText.includes('java')) && combinedText.includes('android')) {
          score += 2;
        }

        pattern.confidence = score;
      }

      // Find platform with highest confidence
      const sortedPlatforms = Object.entries(platformPatterns)
        .sort(([, a], [, b]) => b.confidence - a.confidence);

      const [detectedPlatform, pattern] = sortedPlatforms[0];

      // Only return if confidence is high enough (threshold: 3)
      if (pattern.confidence >= 3) {
        return detectedPlatform;
      }

      return null;

    } catch (error) {
      console.error('[SDDPlanTool] Error in platform detection:', error);
      return null;
    }
  }

  /**
   * Generate platform-specific project structure instructions based on industry best practices
   */
  private generatePlatformSpecificStructureInstruction(featureName: string, platform: string): string {
    const platformInstructions = {
      'nextjs': `🎯 **NEXT.JS PROJECT STRUCTURE** - Design the EXACT Next.js 14+ App Router structure for: **${featureName}**

> **Industry Best Practices for React/TypeScript Web Applications**

## 📋 **Core Standards**
- ✅ Next.js 14+ App Router pattern (app/ directory)
- ✅ API routes in app/api/v1/ (prevents conflicts)
- ✅ Feature-based component organization
- ✅ Service layer for business logic separation
- ✅ Comprehensive testing strategy
- ✅ OpenAPI specifications for contracts

## 🏗️ **Project Structure**

\`\`\`text
📁 src/
├── 📁 lib/[feature-name]/           🎨 Feature library (industry standard)
│   ├── 📁 components/               🧩 Reusable UI components
│   │   ├── 📁 common/              🔄 Shared components
│   │   ├── 📁 forms/               📝 Form components
│   │   └── 📁 layout/              🎨 Layout components
│   ├── 📁 services/                 ⚙️ Business logic services
│   │   ├── 📄 api.service.ts       🌐 API communication
│   │   └── 📄 [feature].service.ts 🎯 Feature services
│   ├── 📁 models/                   📊 Data models & types
│   │   ├── 📄 types.ts             🔧 TypeScript definitions
│   │   └── 📄 [feature].model.ts   📋 Feature models
│   ├── 📁 hooks/                    🎣 Custom React hooks
│   │   └── 📄 use[feature].ts      🪝 Feature hooks
│   └── 📁 utils/                    🛠️ Feature utilities
│       └── 📄 helpers.ts           🔧 Helper functions
├── 📁 contracts/                    📋 API specifications (industry standard)
│   ├── 📄 openapi.yaml             📜 OpenAPI 3.0 specification
│   ├── 📁 schemas/                  📄 JSON schemas
│   │   └── 📄 [feature].schema.json 📋 Feature schemas
│   └── 📁 types/                    🔧 TypeScript type definitions
│       └── 📄 api.types.ts         🌐 API types
└── 📁 tests/                        🧪 Test suites (industry standard)
    ├── 📁 contract/                 📋 Contract tests (from OpenAPI)
    ├── 📁 integration/              🔗 Integration tests
    ├── 📁 e2e/                      🎭 End-to-end tests
    └── 📁 unit/                     ⚡ Unit tests

📁 app/                              🚀 Next.js App Router (industry standard)
├── 📁 api/v1/                       🌐 API routes (App Router pattern)
│   └── 📁 [feature-endpoints]/     🎯 Feature-specific endpoints
│       ├── 📄 route.ts             🛣️ API route handler
│       └── 📄 [action]/route.ts    ⚡ Action handlers
├── 📁 (dashboard)/                  📊 Route groups (App Router feature)
│   └── 📁 [feature-pages]/         📄 Feature pages
│       ├── 📄 page.tsx             🏠 Main page
│       ├── 📄 loading.tsx          ⏳ Loading UI
│       └── 📄 error.tsx            ❌ Error UI
├── 📄 globals.css                   🎨 Global styles + Tailwind CSS
├── 📄 layout.tsx                    🏗️ Root layout
└── 📄 page.tsx                      🏠 Home page

📁 config/                           ⚙️ Configuration files
├── 📄 tailwind.config.js            🎨 Tailwind CSS configuration
├── 📄 postcss.config.js             🔧 PostCSS configuration
└── 📄 next.config.js                ⚙️ Next.js configuration

📁 public/                           📁 Static assets (industry standard)
├── 📁 icons/                        🎨 App icons
│   ├── 📄 favicon.ico              🌟 Favicon
│   └── 📄 apple-touch-icon.png     🍎 Apple touch icon
├── 📁 images/                       🖼️ Images
│   ├── 📁 [feature]/               📁 Feature images
│   └── 📄 logo.svg                 🏷️ Logo
└── 📁 manifest.json                 📱 PWA manifest

📁 docs/                             📚 Documentation
├── 📄 README.md                     📖 Project documentation
├── 📄 API.md                        🌐 API documentation
└── 📁 architecture/                 🏗️ Architecture docs
    └── 📄 project-structure.md     📋 Structure documentation
\`\`\`

## ⚠️ **Critical Rules**
- 🚫 **NO duplicate API structures** (src/api/ AND app/api/) - use ONLY app/api/v1/
- ✅ **Follow Next.js App Router conventions** exactly
- ✅ **Use TypeScript throughout** (industry standard)
- ✅ **Implement proper error boundaries** and loading states
- ✅ **Feature-based organization** for maintainability
- ✅ **Comprehensive testing** at all levels`,

      'ios-native': `🍎 **NATIVE iOS PROJECT STRUCTURE** - Design the EXACT native iOS structure for: **${featureName}**

> **iOS Development Best Practices & Apple Guidelines**

## 📋 **Core Standards**
- ✅ Feature-based organization (iOS best practice)
- ✅ Multi-layer architecture (UI, Business Logic, Data)
- ✅ Consistent folder structure mirroring Xcode project
- ✅ Modularized storyboards for maintainability
- ✅ MVVM or MVC pattern implementation

## 🏗️ **Project Structure**

\`\`\`text
📁 [ProjectName]/
├── 📁 [ProjectName]/                📱 Main app target
│   ├── 📁 App/                      🚀 App-level files
│   │   ├── 📄 AppDelegate.swift     🎯 App delegate
│   │   ├── 📄 SceneDelegate.swift   🎬 Scene delegate (iOS 13+)
│   │   └── 📄 Info.plist            ⚙️ App configuration
│   ├── 📁 Features/                 🎨 Feature-based organization (iOS best practice)
│   │   ├── 📁 Authentication/       🔐 Authentication feature
│   │   │   ├── 📁 Models/           📊 Data models
│   │   │   │   ├── 📄 User.swift    👤 User model
│   │   │   │   └── 📄 AuthToken.swift 🔑 Auth token model
│   │   │   ├── 📁 Views/            🖼️ View controllers
│   │   │   │   ├── 📄 LoginViewController.swift 🔑 Login screen
│   │   │   │   ├── 📄 RegisterViewController.swift 📝 Register screen
│   │   │   │   └── 📄 ForgotPasswordViewController.swift 🔄 Forgot password
│   │   │   ├── 📁 ViewModels/       🧠 View models (MVVM)
│   │   │   │   ├── 📄 LoginViewModel.swift 🔑 Login logic
│   │   │   │   └── 📄 RegisterViewModel.swift 📝 Register logic
│   │   │   ├── 📁 Controllers/      ⚙️ Business logic controllers
│   │   │   │   └── 📄 AuthController.swift 🔐 Auth controller
│   │   │   └── 📁 Services/         🌐 API services
│   │   │       ├── 📄 AuthService.swift 🔐 Auth service
│   │   │       └── 📄 NetworkService.swift 🌐 Network service
│   │   ├── 📁 [FeatureName]/        🎯 Other features
│   │   │   ├── 📁 Models/           📊 Feature models
│   │   │   ├── 📁 Views/            🖼️ Feature views
│   │   │   ├── 📁 ViewModels/       🧠 Feature view models
│   │   │   ├── 📁 Controllers/      ⚙️ Feature controllers
│   │   │   └── 📁 Services/         🌐 Feature services
│   │   └── 📁 Shared/               🔄 Shared components
│   │       ├── 📁 Extensions/       🔧 Swift extensions
│   │       │   ├── 📄 UIView+Extensions.swift 🖼️ UIView extensions
│   │       │   └── 📄 String+Extensions.swift 📝 String extensions
│   │       ├── 📁 Utilities/        🛠️ Utility classes
│   │       │   ├── 📄 DateHelper.swift 📅 Date utilities
│   │       │   └── 📄 ValidationHelper.swift ✅ Validation utilities
│   │       ├── 📁 Constants/        📋 App constants
│   │       │   ├── 📄 AppConstants.swift ⚙️ App constants
│   │       │   └── 📄 APIEndpoints.swift 🌐 API endpoints
│   │       └── 📁 Protocols/        📜 Protocol definitions
│   │           └── 📄 NetworkProtocol.swift 🌐 Network protocol
│   ├── 📁 Resources/                 📦 App resources
│   │   ├── 📁 Assets.xcassets       🎨 Image assets
│   │   │   ├── 📁 AppIcon.appiconset/ 🎯 App icons
│   │   │   └── 📁 Images.imageset/  🖼️ Image sets
│   │   ├── 📁 Storyboards/          📱 Modularized storyboards
│   │   │   ├── 📄 Main.storyboard   🏠 Main storyboard
│   │   │   ├── 📄 Authentication.storyboard 🔐 Auth storyboard
│   │   │   └── 📄 [Feature].storyboard 🎯 Feature storyboards
│   │   ├── 📁 Localization/         🌍 Localization files
│   │   │   ├── 📄 Localizable.strings 🌐 English strings
│   │   │   └── 📄 Localizable.strings (Spanish) 🇪🇸 Spanish strings
│   │   └── 📄 LaunchScreen.storyboard 🚀 Launch screen
│   └── 📁 Supporting Files/         📄 Supporting files
│       ├── 📄 Bridging-Header.h     🔗 Objective-C bridging
│       └── 📄 [ProjectName]-Bridging-Header.h 🔗 Project bridging
├── 📁 [ProjectName]Tests/           🧪 Unit tests (iOS standard)
│   ├── 📁 [FeatureName]Tests/       🎯 Feature tests
│   │   ├── 📄 [Feature]ViewModelTests.swift 🧠 ViewModel tests
│   │   └── 📄 [Feature]ServiceTests.swift 🌐 Service tests
│   └── 📁 MockData/                 🎭 Mock data
│       └── 📄 MockUserData.swift    👤 Mock user data
├── 📁 [ProjectName]UITests/         🎭 UI tests (iOS standard)
│   └── 📁 [FeatureName]UITests/     🎯 Feature UI tests
│       └── 📄 [Feature]UITests.swift 🖼️ UI test cases
├── 📁 Pods/                         📦 CocoaPods dependencies
├── 📄 Podfile                       ⚙️ CocoaPods configuration
├── 📄 Podfile.lock                  🔒 Locked dependencies
└── 📄 [ProjectName].xcodeproj       📱 Xcode project file
\`\`\`

## ⚠️ **Critical iOS Rules**
- 🎯 **Organize by feature** with Models/Views/ViewModels/Controllers subfolders
- 🏗️ **Use MVVM or MVC architecture** pattern consistently
- 📱 **Modularize storyboards** to avoid conflicts
- 📁 **Keep physical file system** consistent with Xcode project structure
- 📦 **Use CocoaPods or Swift Package Manager** for dependencies
- 🧪 **Comprehensive testing** at all levels
- 🌍 **Support localization** from the start`,

      'android-native': `🤖 **NATIVE ANDROID PROJECT STRUCTURE** - Design the EXACT native Android structure for: **${featureName}**

> **Android Development Best Practices & Google Guidelines**

## 📋 **Core Standards**
- ✅ Module-based organization (Android best practice)
- ✅ MVVM architecture pattern (Android standard)
- ✅ Resource qualifiers for different configurations
- ✅ Consistent package structure by feature/layer
- ✅ Gradle for dependency management

## 🏗️ **Project Structure**

\`\`\`text
📁 app/                              📱 Main app module (Android standard)
├── 📁 src/
│   ├── 📁 main/
│   │   ├── 📁 java/
│   │   │   └── 📁 com/company/project/
│   │   │       ├── 📁 ui/           🖼️ UI layer (Android best practice)
│   │   │       │   ├── 📁 main/     🏠 Main activity
│   │   │       │   │   ├── 📄 MainActivity.java 🏠 Main activity
│   │   │       │   │   └── 📄 MainViewModel.java 🧠 Main view model
│   │   │       │   ├── 📁 auth/     🔐 Authentication feature
│   │   │       │   │   ├── 📄 LoginActivity.java 🔑 Login activity
│   │   │       │   │   ├── 📄 LoginViewModel.java 🧠 Login view model
│   │   │       │   │   ├── 📄 RegisterActivity.java 📝 Register activity
│   │   │       │   │   └── 📄 RegisterViewModel.java 🧠 Register view model
│   │   │       │   └── 📁 [feature]/ 🎯 Other features
│   │   │       │       ├── 📄 [Feature]Activity.java 🎯 Feature activity
│   │   │       │       └── 📄 [Feature]ViewModel.java 🧠 Feature view model
│   │   │       ├── 📁 data/         💾 Data layer (Android best practice)
│   │   │       │   ├── 📁 repository/ 📚 Repository pattern
│   │   │       │   │   ├── 📄 UserRepository.java 👤 User repository
│   │   │       │   │   └── 📄 [Feature]Repository.java 🎯 Feature repository
│   │   │       │   ├── 📁 local/    💾 Local data sources
│   │   │       │   │   ├── 📁 database/ 🗄️ Room database
│   │   │       │   │   │   ├── 📄 AppDatabase.java 🗄️ Database class
│   │   │       │   │   │   ├── 📁 entities/ 📊 Database entities
│   │   │       │   │   │   │   ├── 📄 User.java 👤 User entity
│   │   │       │   │   │   │   └── 📄 [Feature].java 🎯 Feature entity
│   │   │       │   │   │   └── 📁 dao/ 🔍 Data Access Objects
│   │   │       │   │   │       └── 📄 UserDao.java 👤 User DAO
│   │   │       │   │   └── 📁 preferences/ ⚙️ Shared preferences
│   │   │       │   │       └── 📄 SharedPreferencesManager.java ⚙️ Prefs manager
│   │   │       │   └── 📁 remote/   🌐 Remote data sources
│   │   │       │       ├── 📁 api/  🌐 API services
│   │   │       │       │   ├── 📄 ApiService.java 🌐 Main API service
│   │   │       │       │   ├── 📄 AuthApiService.java 🔐 Auth API service
│   │   │       │       │   └── 📄 [Feature]ApiService.java 🎯 Feature API
│   │   │       │       └── 📁 dto/  📦 Data Transfer Objects
│   │   │       │           ├── 📄 UserDto.java 👤 User DTO
│   │   │       │           └── 📄 [Feature]Dto.java 🎯 Feature DTO
│   │   │       ├── 📁 domain/       🎯 Domain layer (Android best practice)
│   │   │       │   ├── 📁 model/    📊 Domain models
│   │   │       │   │   ├── 📄 User.java 👤 User model
│   │   │       │   │   └── 📄 [Feature].java 🎯 Feature model
│   │   │       │   ├── 📁 usecase/  ⚙️ Use cases
│   │   │       │   │   ├── 📄 LoginUseCase.java 🔑 Login use case
│   │   │       │   │   └── 📄 [Feature]UseCase.java 🎯 Feature use case
│   │   │       │   └── 📁 repository/ 📚 Repository interfaces
│   │   │       │       └── 📄 UserRepository.java 👤 User repository interface
│   │   │       ├── 📁 di/           💉 Dependency injection (Android best practice)
│   │   │       │   ├── 📄 AppModule.java 📱 App module
│   │   │       │   ├── 📄 NetworkModule.java 🌐 Network module
│   │   │       │   ├── 📄 DatabaseModule.java 🗄️ Database module
│   │   │       │   └── 📄 ViewModelModule.java 🧠 ViewModel module
│   │   │       └── 📁 utils/        🛠️ Utility classes
│   │   │           ├── 📄 Constants.java 📋 App constants
│   │   │           ├── 📄 Extensions.java 🔧 Kotlin extensions
│   │   │           └── 📄 DateUtils.java 📅 Date utilities
│   │   ├── 📁 res/                  📦 Resources (Android standard)
│   │   │   ├── 📁 layout/           🖼️ Layout files
│   │   │   │   ├── 📄 activity_main.xml 🏠 Main activity layout
│   │   │   │   ├── 📄 activity_login.xml 🔑 Login activity layout
│   │   │   │   ├── 📄 fragment_[feature].xml 🎯 Feature fragment layout
│   │   │   │   └── 📄 item_[feature].xml 📋 Feature list item layout
│   │   │   ├── 📁 values/           📋 Values (Android standard)
│   │   │   │   ├── 📄 strings.xml   📝 String resources
│   │   │   │   ├── 📄 colors.xml    🎨 Color resources
│   │   │   │   ├── 📄 dimens.xml    📏 Dimension resources
│   │   │   │   ├── 📄 styles.xml    🎨 Style resources
│   │   │   │   └── 📄 themes.xml    🎨 Theme resources
│   │   │   ├── 📁 drawable/         🎨 Drawable resources
│   │   │   │   ├── 📄 ic_launcher.xml 🎯 App launcher icon
│   │   │   │   ├── 📄 background.xml 🖼️ Background drawable
│   │   │   │   └── 📄 button_selector.xml 🔘 Button selector
│   │   │   ├── 📁 mipmap/           🎯 App icons
│   │   │   │   ├── 📁 ic_launcher/  🎯 Launcher icon set
│   │   │   │   └── 📁 ic_launcher_round/ 🔵 Round launcher icon
│   │   │   └── 📁 values-[qualifier]/ 📱 Resource qualifiers
│   │   │       ├── 📁 values-land/  📱 Landscape orientation
│   │   │       ├── 📁 values-sw600dp/ 📱 Tablet screens
│   │   │       ├── 📁 values-night/ 🌙 Dark theme
│   │   │       └── 📁 values-v21/   📱 API 21+ specific
│   │   └── 📄 AndroidManifest.xml   📋 App manifest
│   └── 📁 test/                     🧪 Unit tests (Android standard)
│       └── 📁 java/
│           └── 📁 com/company/project/
│               ├── 📁 ui/           🖼️ UI tests
│               ├── 📁 data/         💾 Data tests
│               └── 📁 domain/       🎯 Domain tests
├── 📁 data/                         💾 Data module (Android best practice)
│   ├── 📁 src/main/java/
│   └── 📄 build.gradle
├── 📁 domain/                       🎯 Domain module (Android best practice)
│   ├── 📁 src/main/java/
│   └── 📄 build.gradle
├── 📄 build.gradle                  ⚙️ App module build file
└── 📄 proguard-rules.pro            🔒 ProGuard rules

📁 gradle/                           ⚙️ Gradle wrapper (Android standard)
├── 📁 wrapper/
│   ├── 📄 gradle-wrapper.jar       ⚙️ Gradle wrapper JAR
│   └── 📄 gradle-wrapper.properties ⚙️ Gradle wrapper properties
└── 📄 gradle.properties             ⚙️ Gradle properties

📄 build.gradle                      ⚙️ Project build file
📄 settings.gradle                   ⚙️ Project settings
📄 gradlew                          ⚙️ Gradle wrapper script (Unix)
📄 gradlew.bat                      ⚙️ Gradle wrapper script (Windows)
\`\`\`

## ⚠️ **Critical Android Rules**
- 🏗️ **Organize by modules** (app, data, domain) for better separation
- 🧠 **Use MVVM architecture** with ViewModels
- 📦 **Structure packages by feature**: com.company.app.feature.login
- 📱 **Use resource qualifiers** for different configurations
- ⚙️ **Leverage Gradle** for dependency management
- 📝 **Follow Android naming conventions** (camelCase for Java, snake_case for XML)
- 🧪 **Comprehensive testing** at all levels
- 🌍 **Support localization** from the start`,

      'react-native': `⚛️ **REACT NATIVE PROJECT STRUCTURE** - Design the EXACT React Native structure for: **${featureName}**

> **Industry Best Practices for React/TypeScript Web Applications**

## 📋 **Core Standards**
- ✅ Next.js 14+ App Router pattern (app/ directory)
- ✅ API routes in app/api/v1/ (prevents conflicts)
- ✅ Feature-based component organization
- ✅ Service layer for business logic separation
- ✅ Comprehensive testing strategy
- ✅ OpenAPI specifications for contracts

## 🏗️ **Project Structure**

\`\`\`text
📁 src/
├── 📁 lib/[feature-name]/           🎨 Feature library (industry standard)
│   ├── 📁 components/               🧩 Reusable UI components
│   │   ├── 📁 common/              🔄 Shared components
│   │   ├── 📁 forms/               📝 Form components
│   │   └── 📁 layout/              🎨 Layout components
│   ├── 📁 services/                🔧 Business logic layer
│   │   ├── 📁 api/                 🌐 API service layer
│   │   ├── 📁 utils/               🛠️ Utility functions
│   │   └── 📁 types/               📝 TypeScript definitions
│   ├── 📁 hooks/                   🎣 Custom React hooks
│   ├── 📁 constants/               📋 Application constants
│   └── 📁 __tests__/               🧪 Feature tests
│       ├── 📁 components/          🧩 Component tests
│       ├── 📁 services/            🔧 Service tests
│       └── 📁 integration/         🔗 Integration tests

📁 app/                              🏠 Next.js App Router (industry standard)
├── 📁 api/                          🌐 API routes
│   └── 📁 v1/                      📡 API version 1
│       └── 📁 [feature]/           🎯 Feature endpoints
│           ├── 📄 route.ts         🛣️ API route handler
│           └── 📄 types.ts         📝 API types
├── 📁 (dashboard)/                  📊 Route groups (App Router feature)
│   └── 📁 [feature-pages]/         📄 Feature pages
│       ├── 📄 page.tsx             🏠 Main page
│       ├── 📄 loading.tsx          ⏳ Loading UI
│       └── 📄 error.tsx            ❌ Error UI
├── 📄 globals.css                   🎨 Global styles + Tailwind CSS
├── 📄 layout.tsx                    🏗️ Root layout
└── 📄 page.tsx                      🏠 Home page

📁 config/                           ⚙️ Configuration files
├── 📄 tailwind.config.js            🎨 Tailwind CSS configuration
├── 📄 postcss.config.js             🔧 PostCSS configuration
└── 📄 next.config.js                ⚙️ Next.js configuration

📁 public/                           📁 Static assets (industry standard)
├── 📁 icons/                        🎨 App icons
│   ├── 📄 favicon.ico              🌟 Favicon
│   └── 📄 apple-touch-icon.png     🍎 Apple touch icon
├── 📁 images/                       🖼️ Images
│   ├── 📁 [feature]/               📁 Feature images
│   └── 📄 logo.svg                 🏷️ Logo
└── 📁 manifest.json                 📱 PWA manifest

📁 docs/                             📚 Documentation
├── 📄 README.md                     📖 Project documentation
├── 📄 API.md                        🌐 API documentation
├── 📄 DEPLOYMENT.md                 🚀 Deployment guide
└── 📁 openapi/                      📋 OpenAPI specifications
    └── 📄 [feature]-api.yaml       📝 API specification

📁 __tests__/                        🧪 Global tests
├── 📁 e2e/                         🌐 End-to-end tests
│   ├── 📄 [feature].e2e.test.ts   🧪 E2E test files
│   └── 📄 setup.ts                 ⚙️ E2E test setup
├── 📁 integration/                 🔗 Integration tests
│   └── 📄 [feature].integration.test.ts 🧪 Integration test files
└── 📁 setup/                       ⚙️ Test configuration
    ├── 📄 jest.config.js           🧪 Jest configuration
    ├── 📄 jest.e2e.config.js       🌐 E2E Jest configuration
    └── 📄 test-utils.tsx           🛠️ Test utilities

📄 package.json                      📦 Dependencies & scripts
📄 tsconfig.json                     ⚙️ TypeScript configuration
📄 .eslintrc.js                      🔍 ESLint configuration
📄 .prettierrc                       🎨 Prettier configuration
📄 .gitignore                        🚫 Git ignore rules
📄 .env.local                        🔐 Environment variables
📄 .env.example                      📋 Environment template
\`\`\`

## 🎨 **CSS Framework Configuration (CRITICAL)**

### **Tailwind CSS Setup**
\`\`\`javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
        accent: '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
\`\`\`

### **PostCSS Configuration**
\`\`\`javascript
// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
\`\`\`

### **Global CSS Setup**
\`\`\`css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    font-family: 'Inter', system-ui, sans-serif;
  }
  
  body {
    @apply bg-gray-50 text-gray-900;
  }
}

@layer components {
  .btn-primary {
    @apply bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors;
  }
  
  .btn-secondary {
    @apply bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors;
  }
  
  .card {
    @apply bg-white rounded-lg shadow-md p-6 border border-gray-200;
  }
}
\`\`\`

### **Next.js Configuration**
\`\`\`javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

module.exports = nextConfig;
\`\`\`

## ⚠️ **Critical Next.js Rules**
- 🎨 **CSS Framework First**: Always configure Tailwind CSS before generating UI components
- 🏗️ **App Router Pattern**: Use app/ directory structure (Next.js 13+)
- 📱 **Mobile-First Design**: Start with mobile layouts, then desktop
- 🔧 **TypeScript Strict**: Enable strict mode for better type safety
- 🧪 **Test Coverage**: Minimum 80% coverage for all components
- 🌐 **API Versioning**: Use /api/v1/ for all API routes
- 📦 **Feature Modules**: Organize by feature, not by file type
- 🎯 **Performance**: Optimize for Core Web Vitals
- 🔒 **Security**: Implement proper authentication and authorization
- 📱 **PWA Ready**: Include manifest.json and service worker

## 🚀 **Quick Start Commands**
\`\`\`bash
# Install dependencies
npm install

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer

# Initialize Tailwind
npx tailwindcss init -p

# Run development server
npm run dev

# Run tests
npm test

# Run E2E tests
npm run test:e2e

# Build for production
npm run build
\`\`\``,

      'java-spring': `☕ **JAVA SPRING PROJECT STRUCTURE** - Design the EXACT Java Spring Boot structure for: **${featureName}**

> **Maven/Gradle Industry Standards & Spring Best Practices**

## 📋 **Core Standards**
- ✅ Maven/Gradle dependency management
- ✅ Spring Boot auto-configuration
- ✅ RESTful API design patterns
- ✅ Service layer architecture
- ✅ Repository pattern for data access
- ✅ Comprehensive testing strategy

## 🏗️ **Project Structure**

\`\`\`text
📁 src/
├── 📁 components/                   🧩 Reusable UI components (industry standard)
│   ├── 📁 common/                  🔄 Shared components
│   │   ├── 📄 Button.tsx           🔘 Custom button component
│   │   ├── 📄 Input.tsx            📝 Custom input component
│   │   ├── 📄 Card.tsx             🃏 Card component
│   │   └── 📄 LoadingSpinner.tsx   ⏳ Loading spinner
│   └── 📁 [feature-name]/          🎯 Feature-specific components
│       ├── 📄 [Feature]Card.tsx    🃏 Feature card component
│       └── 📄 [Feature]List.tsx    📋 Feature list component
├── 📁 screens/                      📱 Screen components (React Native standard)
│   ├── 📁 auth/                     🔐 Authentication screens
│   │   ├── 📄 LoginScreen.tsx       🔑 Login screen
│   │   ├── 📄 RegisterScreen.tsx    📝 Register screen
│   │   └── 📄 ForgotPasswordScreen.tsx 🔄 Forgot password screen
│   └── 📁 [feature-screens]/        🎯 Feature screens
│       ├── 📄 [Feature]HomeScreen.tsx 🏠 Feature home screen
│       └── 📄 [Feature]DetailScreen.tsx 📄 Feature detail screen
├── 📁 navigation/                   🧭 Navigation setup (React Navigation)
│   ├── 📄 AppNavigator.tsx          🧭 Main app navigator
│   ├── 📄 AuthNavigator.tsx         🔐 Auth stack navigator
│   ├── 📄 TabNavigator.tsx          📱 Tab navigator
│   └── 📄 [Feature]Navigator.tsx    🎯 Feature navigator
├── 📁 services/                     🌐 API services (industry standard)
│   ├── 📄 api.ts                    🌐 Main API service
│   ├── 📄 authService.ts            🔐 Authentication service
│   └── 📁 [feature-services]/       🎯 Feature services
│       └── 📄 [Feature]Service.ts   🎯 Feature API service
├── 📁 models/                       📊 Data models
│   ├── 📄 User.ts                   👤 User model
│   ├── 📄 [Feature].ts              🎯 Feature model
│   └── 📄 types.ts                  🔧 TypeScript types
├── 📁 utils/                        🛠️ Utility functions
│   ├── 📄 validation.ts             ✅ Validation utilities
│   ├── 📄 dateUtils.ts              📅 Date utilities
│   └── 📄 storage.ts                💾 AsyncStorage utilities
├── 📁 hooks/                        🎣 Custom React hooks (industry standard)
│   ├── 📄 useAuth.ts                🔐 Authentication hook
│   ├── 📄 useApi.ts                 🌐 API hook
│   └── 📄 use[Feature].ts           🎯 Feature-specific hook
├── 📁 constants/                    📋 App constants
│   ├── 📄 colors.ts                 🎨 Color constants
│   ├── 📄 dimensions.ts             📏 Dimension constants
│   ├── 📄 apiEndpoints.ts           🌐 API endpoints
│   └── 📄 config.ts                 ⚙️ App configuration
└── 📁 assets/                       📦 Static assets
    ├── 📁 images/                   🖼️ Image assets
    ├── 📁 icons/                    🎯 Icon assets
    └── 📁 fonts/                    🔤 Font assets

📁 ios/                              🍎 iOS-specific code (React Native standard)
├── 📁 [ProjectName]/                📱 iOS project files
├── 📁 [ProjectName].xcodeproj       📱 Xcode project
└── 📄 Podfile                       📦 CocoaPods dependencies

📁 android/                          🤖 Android-specific code (React Native standard)
├── 📁 app/                          📱 Android app module
├── 📁 gradle/                       ⚙️ Gradle configuration
└── 📄 build.gradle                  ⚙️ Build configuration

📁 __tests__/                        🧪 Test files
├── 📁 components/                   🧩 Component tests
├── 📁 screens/                      📱 Screen tests
└── 📁 services/                     🌐 Service tests

📄 package.json                      📦 Dependencies
📄 metro.config.js                   ⚙️ Metro bundler config
📄 babel.config.js                   ⚙️ Babel configuration
📄 tsconfig.json                     ⚙️ TypeScript configuration
📄 .eslintrc.js                      ⚙️ ESLint configuration
📄 tailwind.config.js                🎨 NativeWind configuration
📄 src/global.css                    🎨 Global styles + NativeWind
\`\`\`

## 🎨 **CSS Framework Configuration (NativeWind)**

### **NativeWind Setup**
\`\`\`javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './App.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
        accent: '#F59E0B',
      },
    },
  },
  plugins: [],
};
\`\`\`

### **Metro Configuration**
\`\`\`javascript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './src/global.css' });
\`\`\`

### **Global CSS Setup**
\`\`\`css
/* src/global.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
\`\`\`

### **App.tsx Integration**
\`\`\`typescript
// App.tsx
import './src/global.css';
import { NavigationContainer } from '@react-navigation/native';

export default function App() {
  return (
    <NavigationContainer>
      {/* Your app content */}
    </NavigationContainer>
  );
}
\`\`\`

## ⚠️ **Critical React Native Rules**
- 🎯 **Feature-based organization** for maintainability
- 📱 **Platform-specific code** in ios/ and android/ directories
- 🧭 **Use React Navigation** for navigation patterns
- 🎣 **Custom hooks** for reusable logic
- 🌐 **Service layer** for API communication
- 🧪 **Comprehensive testing** at all levels
- 📱 **Platform-specific optimizations** for iOS and Android`,

      'python-django': `🐍 **PYTHON DJANGO PROJECT STRUCTURE** - Design the EXACT Django structure for: **${featureName}**

> **Django Best Practices & Python Standards**

## 📋 **Core Standards**
- ✅ Django project structure (industry standard)
- ✅ Virtual environment management
- ✅ Settings configuration for different environments
- ✅ Model-View-Template (MVT) pattern
- ✅ Django REST framework for APIs
- ✅ Comprehensive testing strategy

## 🏗️ **Project Structure**

\`\`\`text
📁 src/
├── 📁 main/
│   ├── 📁 java/
│   │   └── 📁 com/company/project/
│   │       ├── 📁 controller/        🌐 REST controllers (Spring standard)
│   │       │   ├── 📄 UserController.java 👤 User REST controller
│   │       │   ├── 📄 AuthController.java 🔐 Auth REST controller
│   │       │   └── 📄 [Feature]Controller.java 🎯 Feature controller
│   │       ├── 📁 service/           ⚙️ Business logic (Spring standard)
│   │       │   ├── 📄 UserService.java 👤 User business logic
│   │       │   ├── 📄 AuthService.java 🔐 Auth business logic
│   │       │   └── 📄 [Feature]Service.java 🎯 Feature service
│   │       ├── 📁 repository/        💾 Data access (Spring standard)
│   │       │   ├── 📄 UserRepository.java 👤 User data access
│   │       │   ├── 📄 AuthRepository.java 🔐 Auth data access
│   │       │   └── 📄 [Feature]Repository.java 🎯 Feature repository
│   │       ├── 📁 model/             📊 Data models
│   │       │   ├── 📄 User.java      👤 User entity
│   │       │   ├── 📄 [Feature].java 🎯 Feature entity
│   │       │   └── 📄 BaseEntity.java 📋 Base entity class
│   │       ├── 📁 config/            ⚙️ Configuration classes
│   │       │   ├── 📄 DatabaseConfig.java 🗄️ Database configuration
│   │       │   ├── 📄 SecurityConfig.java 🔒 Security configuration
│   │       │   └── 📄 WebConfig.java 🌐 Web configuration
│   │       ├── 📁 dto/               📦 Data Transfer Objects
│   │       │   ├── 📄 UserDto.java   👤 User DTO
│   │       │   ├── 📄 LoginDto.java  🔑 Login DTO
│   │       │   └── 📄 [Feature]Dto.java 🎯 Feature DTO
│   │       ├── 📁 exception/         ❌ Exception handling
│   │       │   ├── 📄 GlobalExceptionHandler.java 🌐 Global exception handler
│   │       │   ├── 📄 UserNotFoundException.java 👤 User not found exception
│   │       │   └── 📄 [Feature]Exception.java 🎯 Feature exception
│   │       ├── 📁 security/          🔒 Security components
│   │       │   ├── 📄 JwtUtil.java   🔑 JWT utility
│   │       │   └── 📄 SecurityFilter.java 🔒 Security filter
│   │       └── 📁 util/              🛠️ Utility classes
│   │           ├── 📄 DateUtils.java 📅 Date utilities
│   │           └── 📄 ValidationUtils.java ✅ Validation utilities
│   └── 📁 resources/
│       ├── 📄 application.yml        ⚙️ Configuration (Spring standard)
│       ├── 📄 application-dev.yml    🛠️ Development configuration
│       ├── 📄 application-prod.yml   🚀 Production configuration
│       ├── 📁 static/                📁 Static resources
│       │   ├── 📁 css/               🎨 CSS files
│       │   ├── 📁 js/                📜 JavaScript files
│       │   └── 📁 images/            🖼️ Image files
│       ├── 📁 templates/             📄 Templates
│       │   └── 📄 index.html         🏠 Main template
│       └── 📁 db/migration/          🗄️ Database migrations
│           ├── 📄 V1__Create_users_table.sql 👤 Create users table
│           └── 📄 V2__Create_[feature]_table.sql 🎯 Create feature table
└── 📁 test/
    ├── 📁 java/                      🧪 Test classes (mirrors main structure)
    │   └── 📁 com/company/project/
    │       ├── 📁 controller/        🌐 Controller tests
    │       │   └── 📄 UserControllerTest.java 👤 User controller test
    │       ├── 📁 service/           ⚙️ Service tests
    │       │   └── 📄 UserServiceTest.java 👤 User service test
    │       ├── 📁 repository/        💾 Repository tests
    │       │   └── 📄 UserRepositoryTest.java 👤 User repository test
    │       └── 📁 integration/       🔗 Integration tests
    │           └── 📄 [Feature]IntegrationTest.java 🎯 Feature integration test
    └── 📁 resources/                 📦 Test resources
        ├── 📄 application-test.yml   🧪 Test configuration
        └── 📁 test-data/             📊 Test data files
            └── 📄 test-users.json    👤 Test user data

📄 pom.xml                           📦 Maven configuration (industry standard)
📄 README.md                         📖 Project documentation
📄 .gitignore                        🚫 Git ignore file
📄 Dockerfile                        🐳 Docker configuration
📄 docker-compose.yml                🐳 Docker Compose configuration
\`\`\`

## ⚠️ **Critical Java Spring Rules**
- 🏗️ **Follow Maven/Gradle** directory layout exactly
- 📦 **Package structure** reflecting domain hierarchy
- 🎯 **Separation of concerns** (Controller/Service/Repository)
- 🧪 **Test structure** mirroring main structure
- ⚙️ **Configuration management** for different environments
- 🔒 **Security configuration** from the start
- 🗄️ **Database migrations** for schema management`,

      'nodejs-express': `🟢 **NODE.JS EXPRESS PROJECT STRUCTURE** - Design the EXACT Node.js/Express structure for: **${featureName}**

> **Node.js/Express Best Practices & JavaScript Standards**

## 📋 **Core Standards**
- ✅ Express.js framework structure
- ✅ NPM package management
- ✅ Environment variable configuration
- ✅ RESTful API design patterns
- ✅ Middleware architecture
- ✅ Comprehensive testing strategy

## 🏗️ **Project Structure**

\`\`\`text
📁 project_name/
├── 📁 settings/                     ⚙️ Settings for different environments
│   ├── 📄 __init__.py              📦 Package initialization
│   ├── 📄 base.py                  ⚙️ Base settings
│   ├── 📄 development.py           🛠️ Development settings
│   ├── 📄 production.py            🚀 Production settings
│   ├── 📄 testing.py               🧪 Testing settings
│   └── 📄 local.py                 💻 Local development settings
├── 📁 [feature_app]/                🎯 Feature-specific Django app
│   ├── 📁 migrations/               🗄️ Database migrations
│   │   ├── 📄 __init__.py          📦 Migrations package
│   │   └── 📄 0001_initial.py      🗄️ Initial migration
│   ├── 📁 templates/                📄 Templates
│   │   └── 📁 [feature_app]/        🎯 Feature templates
│   │       ├── 📄 [feature]_list.html 📋 Feature list template
│   │       └── 📄 [feature]_detail.html 📄 Feature detail template
│   ├── 📁 static/                   📁 Static files
│   │   └── 📁 [feature_app]/        🎯 Feature static files
│   │       ├── 📁 css/              🎨 CSS files
│   │       ├── 📁 js/               📜 JavaScript files
│   │       └── 📁 images/           🖼️ Image files
│   ├── 📁 management/               ⚙️ Management commands
│   │   └── 📁 commands/             🎯 Custom commands
│   │       └── 📄 [feature]_command.py 🎯 Feature command
│   ├── 📄 models.py                 📊 Data models
│   ├── 📄 views.py                  🖼️ Views
│   ├── 📄 urls.py                   🛣️ URL patterns
│   ├── 📄 admin.py                  👨‍💼 Admin interface
│   ├── 📄 forms.py                  📝 Forms
│   ├── 📄 serializers.py            📦 API serializers
│   ├── 📄 permissions.py            🔒 Permissions
│   ├── 📄 signals.py                📡 Django signals
│   ├── 📄 apps.py                   📱 App configuration
│   └── 📄 tests.py                  🧪 Tests
├── 📁 templates/                    📄 Global templates
│   ├── 📄 base.html                 🏠 Base template
│   ├── 📄 navbar.html               🧭 Navigation template
│   └── 📄 footer.html               🦶 Footer template
├── 📁 static/                       📁 Global static files
│   ├── 📁 css/                      🎨 Global CSS
│   ├── 📁 js/                       📜 Global JavaScript
│   └── 📁 images/                   🖼️ Global images
├── 📁 media/                        📁 Media files (user uploads)
├── 📁 staticfiles/                  📁 Collected static files
├── 📁 locale/                       🌍 Internationalization files
├── 📁 logs/                         📝 Log files
├── 📁 requirements/                 📦 Requirements files
│   ├── 📄 base.txt                  📦 Base requirements
│   ├── 📄 development.txt           🛠️ Development requirements
│   ├── 📄 production.txt            🚀 Production requirements
│   └── 📄 testing.txt               🧪 Testing requirements
├── 📁 docs/                         📚 Documentation
│   ├── 📄 README.md                 📖 Project documentation
│   └── 📄 API.md                    🌐 API documentation
├── 📄 manage.py                     ⚙️ Django management script
├── 📄 requirements.txt              📦 Dependencies (industry standard)
├── 📄 .env                          🔐 Environment variables
├── 📄 .gitignore                    🚫 Git ignore file
├── 📄 Dockerfile                    🐳 Docker configuration
├── 📄 docker-compose.yml            🐳 Docker Compose configuration
├── 📄 README.md                     📖 Project documentation
└── 📄 wsgi.py                       🌐 WSGI configuration
\`\`\`

## ⚠️ **Critical Django Rules**
- 🎯 **App-based modular structure** for maintainability
- 🏗️ **Separation of concerns** (models/views/urls)
- ⚙️ **Environment-specific settings** for different deployments
- 📁 **Static files organization** for production
- 🧪 **Comprehensive testing** at all levels
- 🌍 **Internationalization support** from the start
- 🔒 **Security best practices** implementation`,

      'go': `🐹 **GO PROJECT STRUCTURE** - Design the EXACT Go project structure for: **${featureName}**

> **Go Best Practices & Industry Standards**

## 📋 **Core Standards**
- ✅ Go module structure (go.mod)
- ✅ Package organization following Go conventions
- ✅ Interface-driven design
- ✅ Error handling patterns
- ✅ Testing with Go's built-in testing
- ✅ Comprehensive documentation

## 🏗️ **Project Structure**

\`\`\`text
📁 src/
├── 📁 controllers/                  🌐 Route controllers (Express standard)
│   ├── 📄 authController.js         🔐 Authentication controller
│   ├── 📄 userController.js         👤 User controller
│   └── 📁 [feature-controllers]/    🎯 Feature controllers
│       └── 📄 [Feature]Controller.js 🎯 Feature controller
├── 📁 services/                     ⚙️ Business logic (industry standard)
│   ├── 📄 authService.js            🔐 Authentication service
│   ├── 📄 userService.js            👤 User service
│   └── 📁 [feature-services]/       🎯 Feature services
│       └── 📄 [Feature]Service.js   🎯 Feature service
├── 📁 models/                       📊 Data models
│   ├── 📄 User.js                   👤 User model
│   ├── 📄 [Feature].js              🎯 Feature model
│   └── 📄 index.js                  📊 Models index
├── 📁 middleware/                   🔧 Express middleware
│   ├── 📄 auth.js                   🔐 Authentication middleware
│   ├── 📄 validation.js             ✅ Validation middleware
│   ├── 📄 errorHandler.js           ❌ Error handling middleware
│   └── 📄 logging.js                📝 Logging middleware
├── 📁 routes/                       🛣️ API routes
│   ├── 📄 auth.js                   🔐 Authentication routes
│   ├── 📄 user.js                   👤 User routes
│   ├── 📄 index.js                  🛣️ Routes index
│   └── 📁 [feature-routes]/         🎯 Feature routes
│       └── 📄 [feature].js          🎯 Feature routes
├── 📁 utils/                        🛠️ Utility functions
│   ├── 📄 validation.js             ✅ Validation utilities
│   ├── 📄 dateUtils.js              📅 Date utilities
│   ├── 📄 crypto.js                 🔐 Cryptographic utilities
│   └── 📄 helpers.js                🔧 Helper functions
├── 📁 config/                       ⚙️ Configuration (industry standard)
│   ├── 📄 database.js               🗄️ Database configuration
│   ├── 📄 environment.js            🌍 Environment configuration
│   ├── 📄 redis.js                  🔴 Redis configuration
│   └── 📄 index.js                  ⚙️ Main configuration
├── 📁 types/                        🔧 TypeScript type definitions
│   ├── 📄 user.ts                   👤 User types
│   ├── 📄 [feature].ts              🎯 Feature types
│   └── 📄 index.ts                  🔧 Types index
├── 📁 constants/                    📋 Application constants
│   ├── 📄 statusCodes.js            📊 HTTP status codes
│   ├── 📄 messages.js               💬 Response messages
│   └── 📄 config.js                 ⚙️ Configuration constants
└── 📄 index.js                      🚀 Application entry point

📁 tests/                            🧪 Test suites (mirrors src structure)
├── 📁 unit/                         ⚡ Unit tests
│   ├── 📁 controllers/              🌐 Controller tests
│   ├── 📁 services/                 ⚙️ Service tests
│   └── 📁 utils/                    🛠️ Utility tests
├── 📁 integration/                  🔗 Integration tests
│   ├── 📁 api/                      🌐 API integration tests
│   └── 📁 database/                 🗄️ Database integration tests
├── 📁 e2e/                          🎭 End-to-end tests
│   └── 📄 [feature].e2e.js          🎯 Feature E2E tests
└── 📁 fixtures/                     📊 Test fixtures
    └── 📄 testData.js               📊 Test data

📁 docs/                             📚 Documentation
├── 📄 README.md                     📖 Project documentation
├── 📄 API.md                        🌐 API documentation
└── 📁 architecture/                 🏗️ Architecture documentation

📄 package.json                      📦 Dependencies (industry standard)
📄 .env                              🔐 Environment variables
📄 .env.example                      📋 Environment variables example
📄 .gitignore                        🚫 Git ignore file
📄 .eslintrc.js                      ⚙️ ESLint configuration
📄 .prettierrc                       🎨 Prettier configuration
📄 jest.config.js                    🧪 Jest configuration
📄 nodemon.json                      🔄 Nodemon configuration
📄 Dockerfile                        🐳 Docker configuration
📄 docker-compose.yml                🐳 Docker Compose configuration
\`\`\`

## ⚠️ **Critical Node.js Express Rules**
- 🏗️ **MVC pattern** with clear separation of concerns
- 🔧 **Middleware organization** for reusable logic
- 🌍 **Environment-based configuration** for different deployments
- 🧪 **Test structure** mirroring source structure
- 📦 **Dependency management** with package.json
- 🔒 **Security best practices** implementation
- 📝 **Comprehensive logging** and error handling`
    };

    return platformInstructions[platform] || platformInstructions['nextjs'];
  }

  private error(message: string) {
    return { success: false, error: 'PLAN_FAILED', message };
  }

  private success(message: string, data?: any): any {
    return {
      success: true,
      message,
      ...(data && { data })
    };
  }

  /**
   * Handle finalize mode - save the plan to database
   */
  private async handleFinalize(input: any): Promise<any> {
    try {
      const { planData } = input;

      if (!planData) {
        return this.error('Missing required parameter: planData is required for finalize mode');
      }

      // Always get the most recent feature
      let featureId: string;
      try {
        featureId = await this.resolveFeatureId(null); // null means get most recent
      } catch (error) {
        return this.error(error instanceof Error ? error.message : 'Failed to get most recent feature');
      }

      // Get feature to verify it exists and get the name
      const feature = await this.db.get_feature_robust(featureId);
      if (!feature) {
        return this.error(`Feature '${featureId}' not found in database.`);
      }

      // Save plan to database
      await this.db.save_plan_robust(
        featureId,
        planData,
        'sdd-plan-perfect-v1'
      );

      return this.success(
        `Saved`,
        {
          featureId,
          featureName: feature.name,
          templateId: 'sdd-plan-perfect-v1',
          aiGenerated: true
        }
      );
    } catch (error) {
      return this.error(`Failed to save plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
