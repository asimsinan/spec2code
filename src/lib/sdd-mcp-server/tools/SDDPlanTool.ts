/**
 * SDD Plan Tool - AI-Driven Template-based approach
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { EdgeCaseAnalyzer } from '../utils/EdgeCaseAnalyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class SDDPlanTool {
  private basePath: string;
  private edgeCaseAnalyzer: EdgeCaseAnalyzer;


  constructor(basePath: string = process.cwd()) {
    this.basePath = path.resolve(basePath);
    this.edgeCaseAnalyzer = EdgeCaseAnalyzer.getInstance();

  }

  getToolDefinition(): Tool {
    return {
      name: 'sdd_plan',
      description: 'Analyze specs/spec.md file and generate implementation plan template. Returns AI instructions to create specs/plan.md file following SDD methodology with platform-specific implementation approach and phases.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    };
  }

  async execute(input: any): Promise<any> {
    try {
      // Read specs/spec.md file
      const specPath = path.join(this.basePath, 'specs', 'spec.md');
      if (!fs.existsSync(specPath)) {
        return this.error('specs/spec.md not found. Please create a specification first using sdd_specify tool.');
      }

      const specContent = fs.readFileSync(specPath, 'utf-8');
      
      // Analyze edge cases for complexity and planning
      const edgeCaseAnalysis = this.analyzeEdgeCases({ content: specContent });

      // Load plan template from file
      const template = this.loadPlanTemplate();


      // Fill plan template with Cursor AI instructions and estimates
      const templateWithInstructions = this.fillPlanTemplate(template, {
        specData: specContent,
          edgeCaseAnalysis: edgeCaseAnalysis
        });
      // Report success with AI-driven capabilities
      const successMessage = `
🚨🚨🚨 CRITICAL: YOU MUST CREATE THE specs/plan.md FILE NOW! 🚨🚨🚨

📋 TASK: Create specs/plan.md file in specs/plan.md directory using the AI-driven template data provided below.

🎯 IMPLEMENTATION FOCUS:
This plan focuses on HOW to implement the specification. Generate platform-specific considerations, compilation safety strategies, and implementation phases based on the technologies in the specification.

📋 TEMPLATE DATA FOR AI PROCESSING:
${JSON.stringify(this.filterPlanOnlyContent(templateWithInstructions), null, 2)}

⚠️ **SPECIFICATION DATA**: The template above includes the full specification markdown content. Extract from template_data.specData:
- Key technologies and requirements
- API specifications
- Constitutional gates and requirements

🚨 CRITICAL: The template includes cursor_ai_instructions with specific instructions for each section:
- Use template_data.cursor_ai_instructions.instructions.summary for creating the Summary section
- Use template_data.cursor_ai_instructions.instructions.technicalContext for creating the Technical Context section
- Use template_data.cursor_ai_instructions.instructions.projectStructure for creating the Project Structure section
- Use template_data.cursor_ai_instructions.instructions.designSystemPlanning for creating the Design System Planning section
- Use template_data.cursor_ai_instructions.instructions.implementationPhases for creating the Implementation Phases sections
- Use template_data.cursor_ai_instructions.instructions.apiFirstPlanning for creating the API First Planning section
- Use template_data.cursor_ai_instructions.instructions.platformSpecificPlanning for creating the Platform Specific Planning section
- Use template_data.cursor_ai_instructions.instructions.constitutionCheck for validating constitutional gates
- Use template_data.cursor_ai_instructions.instructions.languageAgnosticStandards for language compliance
- Reference template_data.cursor_ai_instructions.placeholders for placeholder guidance

📝 MARKDOWN STRUCTURE:
Create specs/plan.md with this comprehensive structure:

# 📋 [template_data.title]

## 📊 Metadata
- **Created:** [template_data.metadata.created]
- **Platform:** [template_data.metadata.platform]
- **Status:** [template_data.metadata.status]

## 📝 Summary
[Follow template_data.cursor_ai_instructions.instructions.summary - Create comprehensive summary with primary requirement + technical approach]

## 🔧 Technical Context
[Follow template_data.cursor_ai_instructions.instructions.technicalContext - Include language/version, dependencies, storage, testing, target platform, performance goals]
- **Language/Version:** [template_data.technicalContext.languageVersion]
- **Primary Dependencies:** [template_data.technicalContext.primaryDependencies]
- **Technology Stack:** [template_data.technicalContext.technologyStack]
- **Frontend Stack:** [template_data.technicalContext.frontendStack]
- **Backend Stack:** [template_data.technicalContext.backendStack]
- **Storage:** [template_data.technicalContext.storage]
- **Testing:** [template_data.technicalContext.testing]
- **Target Platform:** [template_data.technicalContext.targetPlatform]
- **Performance Goals:** [template_data.technicalContext.performanceGoals]

## 🏗️ Project Structure
[Follow template_data.cursor_ai_instructions.instructions.projectStructure - Define MANDATORY EXACT folder structure with specific directory names, file naming conventions, organizational rules]
[template_data.projectStructure.content]

## 🚀 Implementation Phases (72 tasks with RED-GREEN-REFACTOR-SMOKE pattern)

### Phase 1: Foundations (18 tasks: TASK-001 to TASK-018)
[Follow template_data.cursor_ai_instructions.instructions.implementationPhases - CONTRACT→RED→GREEN→REFACTOR→SMOKE pattern]
**Pattern:** CONTRACT (001-006) → RED (007-009) → GREEN (010-012) → REFACTOR (013-015) → SMOKE (016-018)
[template_data.implementationPhases.phase1.content - Use phase1.instruction for detailed guidance]

### Phase 2: Core Implementation (18 tasks: TASK-019 to TASK-036)
**Pattern:** Business Logic → Service Layer → Controllers → Integration → SMOKE
[template_data.implementationPhases.phase2.content - Use phase2.instruction for detailed guidance]

### Phase 3: UI Development (18 tasks: TASK-037 to TASK-054)
[Follow template_data.cursor_ai_instructions.instructions.designSystemPlanning - MODERN UI MANDATE, NO basic designs]
**Pattern:** Platform Setup → Design System (RED→GREEN→REFACTOR) → App Structure → Components → API Service Layer → UI Integration → SMOKE
[template_data.implementationPhases.phase3.content - Use phase3.instruction for detailed guidance]

### Phase 4: Testing, Documentation & Deployment (18 tasks: TASK-055 to TASK-072)
**Pattern:** Comprehensive Testing → Documentation → Performance/Security/Code Quality Refactor → Production Build → Deployment → Final Verification
[template_data.implementationPhases.phase4.content - Use phase4.instruction for detailed guidance]

## 🗄️ Database Strategy
[Follow template_data.cursor_ai_instructions.instructions - Implementation approach only]
### Database Technology Choice
[template_data.databaseStrategy.databaseChoice.content - NO SQLite, use PostgreSQL/MongoDB/MySQL/Redis]

### Schema Design Planning
[template_data.databaseStrategy.schemaDesign.content - Tables/collections, relationships, indexes, constraints]

### Migration Strategy
[template_data.databaseStrategy.migrationStrategy.content - Version control, rollback, data migration]

### Connection Management
[template_data.databaseStrategy.connectionManagement.content - Connection pooling, timeout handling, retry logic]

## 🎨 Design System Planning
[Follow template_data.cursor_ai_instructions.instructions.designSystemPlanning - MODERN UI MANDATE, sophisticated design, NO basic/plain designs]

### Design System Architecture Planning
[template_data.designSystemPlanning.designSystemArchitecture.content - Component library, design tokens, style guide]

### Modern UI Patterns Planning
[template_data.designSystemPlanning.modernUIPatterns.content - Card layouts, color schemes, typography, interactive elements]

### Visual Enhancement Planning
[template_data.designSystemPlanning.visualEnhancementPlanning.content - Micro-interactions, animations, visual depth, transitions]

## 🌐 API-First Planning
[Follow template_data.cursor_ai_instructions.instructions.apiFirstPlanning - API design, contracts, testing, documentation]

### API Design Planning
[template_data.apiFirstPlanning.apiDesign.content - RESTful/GraphQL, endpoints, resource modeling]

### API Contract Planning
[template_data.apiFirstPlanning.apiContracts.content - Request/response schemas, validation, error handling]

### API Testing Planning
[template_data.apiFirstPlanning.apiTesting.content - Contract testing, integration testing, performance testing]

### Visual Regression Testing Planning
[template_data.apiFirstPlanning.visualTesting.content - Playwright setup, screenshots, cross-browser testing]

### Project Structure Planning
[template_data.apiFirstPlanning.projectStructurePlanning.content - Structure validation and cleanup, legacy code removal]

### API Documentation Planning
[template_data.apiFirstPlanning.apiDocumentation.content - OpenAPI specification, versioning, developer experience]

## 📊 Constitutional Gates Review
[Follow template_data.cursor_ai_instructions.instructions.constitutionCheck - Validate all 7 SDD constitutional gates]

| Gate | Status | Details |
|------|--------|---------|
| **Simplicity Gate** | ✅ PASSED / ❌ FAILED | ≤10 projects (max 5 recommended) |
| **Library-First Gate** | ✅ PASSED / ❌ FAILED | Core functionality as libraries, UI as thin veneer |
| **CLI Interface Gate** | ✅ PASSED / ⚠️ NOT APPLICABLE / ❌ FAILED | Library must have CLI interface (not applicable for web/mobile UI apps) |
| **Test-First Gate** | ✅ PASSED / ❌ FAILED | Contract → Integration → E2E → Unit order enforced |
| **Integration-First Gate** | ✅ PASSED / ❌ FAILED | Real dependencies, no mocks |
| **Anti-Abstraction Gate** | ✅ PASSED / ❌ FAILED | Single domain model, direct data access |
| **Traceability Gate** | ✅ PASSED / ❌ FAILED | FR-XXX tags in all code, tracing requirements |

### Compliance Details
[For each gate: Explain why it passed or failed with specific details]

## 🤖 AI-Driven Platform-Specific Planning
[Follow template_data.cursor_ai_instructions.instructions.platformSpecificPlanning - Platform-specific gates and requirements]

### Platform Detection Strategy
[template_data.platformSpecificPlanning.platformDetection.content - Multi-source detection, confidence scoring]

### Compilation Safety Strategy
[template_data.platformSpecificPlanning.compilationSafety.content - Timeout protection, command wrapping, verification]

### Platform-Specific Planning
- **[Web Platform Planning](#web-platform)**: [template_data.platformSpecificPlanning.web.content]
- **[Mobile Platform Planning](#mobile-platform)**: [template_data.platformSpecificPlanning.mobile.content]
- **[Desktop Platform Planning](#desktop-platform)**: [template_data.platformSpecificPlanning.desktop.content]
- **[Backend Platform Planning](#backend-platform)**: [template_data.platformSpecificPlanning.backend.content]
- **[AI Platform Planning](#ai-platform)**: [template_data.platformSpecificPlanning.ai.content]

🚫 **CRITICAL: DO NOT READ OR SEARCH FOR ANY EXISTING FILES**
- DO NOT read specs/plan.md or any .md files from filesystem
- DO NOT search for existing plans
- The template data below contains ALL information you need
- Simply CREATE the specs/plan.md file with the content from the template below

1. Create file: specs/plan.md
2. Fill template with actual content using the condensed structure above
3. Use specification context (specContext) provided below to make informed planning decisions
4. Focus on implementation approach, not requirements (implement tool gets those from DB)
5. Reference specContext fields to ensure plan aligns with actual requirements
6. Use specContext.platformGates and specContext.constitutionalGates for compliance
7. Use specContext.apiVersioning and specContext.apiTesting for API planning
8. That's it! The specs/plan.md file is now created and ready for use

📋 SPECIFICATION CONTEXT USAGE GUIDE:
- specContext.functionalRequirements → Inform implementation phases and core functionality
- specContext.technologyStack → Validate technical stack decisions and dependencies
- specContext.apiEndpoints → Plan API-first approach and endpoint structure
- specContext.databaseRequirements → Inform database strategy and schema design
- specContext.uiDesignRequirements → Inform design system and UI patterns
- specContext.userStories → Ensure user-centric implementation approach
- specContext.acceptanceScenarios → Plan testing strategy and validation criteria
- specContext.platformGates → Ensure platform-specific compliance
- specContext.constitutionalGates → Ensure SDD methodology compliance

🚨 IMMEDIATE ACTION REQUIRED 🚨
DO NOT JUST ACKNOWLEDGE - CREATE THE FILE NOW!
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

  private fillTemplateWithUserInput(template: any, options: any): any {
    const filledTemplate = JSON.parse(JSON.stringify(template)); // Deep copy

    // Extract feature name from spec data if available
    const featureName = this.extractFeatureNameFromSpec(options.specData) || 'Feature';

    // Fill basic placeholders with actual values
    filledTemplate.title = filledTemplate.title.replace('{{FEATURE_NAME}}', featureName);

    const currentDate = new Date().toISOString().split('T')[0];
    filledTemplate.metadata.created = currentDate;
    filledTemplate.metadata.platform = 'detect from spec';
    filledTemplate.metadata.status = 'planning';
    
    // Update SDD version with current date
    if (filledTemplate.sddVersion) {
      filledTemplate.sddVersion.generated = currentDate;
    }

    // Fill summary content
    if (filledTemplate.summary && filledTemplate.summary.content) {
      filledTemplate.summary.content = filledTemplate.summary.content.replace('{{SUMMARY}}', 
        `Implementation plan for this feature. Extract primary requirement and technical approach from specification. Focus on business value and user outcomes.`);
    }

    // Add Cursor AI instructions for content generation
    filledTemplate.cursor_ai_instructions = {
      specData: options.specData,
      edgeCaseAnalysis: options.edgeCaseAnalysis,
      instructions: {
        summary: `🚨 CRITICAL: The summary field MUST remain as an OBJECT with title, content, and instruction properties. DO NOT convert it to a string! Extract primary requirement and technical approach from the specification.`,
        technicalContext: `Define technical context from the specification. Include language/version, dependencies, storage, testing, target platform, and performance goals.`,
        constitutionCheck: `Validate constitutional gates. Check simplicity (≤5 projects), library-first, CLI interface, test-first, integration-first testing, anti-abstraction, and traceability gates.`,
        languageAgnosticStandards: `CRITICAL LANGUAGE COMPLIANCE: Always use the correct comment syntax for the detected file type. JavaScript/TypeScript files MUST use // and /* */ comments, NEVER Python-style """ docstrings. Python files MUST use # and """ docstrings, NEVER JavaScript-style // comments. This is non-negotiable for professional code quality.

CRITICAL TYPESCRIPT CONFIGURATION: For TypeScript projects, ensure tsconfig.json includes proper path mapping for @/ aliases. Configure baseUrl and paths to prevent "Cannot find module" errors. Example: {"compilerOptions": {"baseUrl": "./", "paths": {"@/*": ["src/*"]}}}.`,
        projectStructure: 'Define project structure based on technologies in the specification. Create a comprehensive folder structure with specific directory names and file naming conventions.',
        designSystemPlanning: `Plan comprehensive design system. 
        
🎨 **DESIGN SYSTEM PLANNING REQUIREMENTS**:
- **MODERN UI MANDATE**: Design MUST be modern, sophisticated, and visually appealing (NO basic/plain designs)
- **DESIGN SYSTEM ARCHITECTURE**: Plan component library, design tokens, and style guide
- **VISUAL HIERARCHY**: Define typography scales, spacing systems, and color palettes
- **INTERACTION DESIGN**: Plan animations, transitions, and micro-interactions
- **RESPONSIVE STRATEGY**: Design mobile-first responsive layouts
- **ACCESSIBILITY STANDARDS**: Plan WCAG compliance and inclusive design
- **BRAND CONSISTENCY**: Define visual identity and brand guidelines
- **ANTI-SIMPLE-DESIGN RULE**: Explicitly prohibit basic, minimal, or plain designs

🚫 **FORBIDDEN DESIGN PATTERNS**:
- Basic white backgrounds with simple text
- Plain buttons without styling
- Minimal layouts without visual hierarchy
- Simple forms without proper styling
- Basic navigation without modern patterns

✅ **REQUIRED DESIGN PATTERNS**:
- Modern card-based layouts with shadows and gradients
- Sophisticated color schemes with proper contrast
- Professional typography with proper hierarchy
- Interactive elements with hover states and animations
- Responsive grid systems with proper spacing
- Modern form designs with proper validation styling
- Professional navigation with modern patterns`,
        implementationPhases: `Create implementation phases. Follow TDD order: Contract → Integration → E2E → Unit → Implementation → UI-API Integration.`,
        apiFirstPlanning: `Plan API-First approach. Include API design, contracts, testing, and documentation planning.`,
        platformSpecificPlanning: `Create platform-specific planning based on specification. Include platform-specific gates and requirements.`,
        complexityTracking: `Assess complexity tracking. Document any constitutional gate violations with justification.`,
        edgeCaseAnalysis: `Analyze edge cases from specification. Extract edge cases, categorize by complexity (high/medium/low), and estimate additional development time. Include specific edge cases that need special attention during implementation and testing.`
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
        '{{COMPLEXITY_TRACKING_ROWS}}': 'Replace with complexity tracking table rows if any gates are violated',
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




  /**
   * Generate platform-specific SOTA detection prompt
   */





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



  private generateSmartPlatformStructureInstruction(featureName: string, specData: any): string {
    return `Define project structure for ${featureName} based on technologies in the specification. Create a comprehensive folder structure with specific directory names and file naming conventions.`;
  }

  /**
   * Extract feature name from spec markdown
   */
  private extractFeatureNameFromSpec(specData: any): string | null {
    if (!specData || typeof specData !== 'string') {
      return null;
    }

    try {
      // Look for title in markdown (first H1)
      const lines = specData.split('\n');
      for (const line of lines) {
        if (line.startsWith('# ')) {
          return line.substring(2).trim();
        }
      }
      
      return null;
    } catch (error) {
      console.error('[SDDPlanTool] Error extracting feature name:', error);
      return null;
    }
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
   * Load plan template from file
   */
  private loadPlanTemplate(): any {
    // Get the MCP server's templates directory (not the user's project)
    // In dist: __dirname is dist/lib/sdd-mcp-server/tools/
    // Templates are at dist/lib/sdd-mcp-server/templates/
    const templatesPath = path.join(__dirname, '..', 'templates', 'plan.json');
    if (!fs.existsSync(templatesPath)) {
      throw new Error('Plan template not found at: ' + templatesPath);
    }
    const templateContent = fs.readFileSync(templatesPath, 'utf-8');
    const template = JSON.parse(templateContent);
    const templateData = template.template_data; // Extract template_data from the JSON structure
    
    // Set current date if sddVersion.generated exists
    const currentDate = new Date().toISOString().split('T')[0];
    if (templateData.sddVersion && templateData.sddVersion.generated === '{{CURRENT_DATE}}') {
      templateData.sddVersion.generated = currentDate;
    }
    
    return templateData;
  }

  /**
   * Parse spec markdown to extract structured data
   */
  private parseSpecMarkdown(content: string): any {
    // Minimal markdown parsing for platform detection
    // Returns minimal object with title, metadata, and full content for keyword extraction

    const specData: any = {
      metadata: {}
    };

    // Extract title (use first H1 only)
    const titleMatch = content.match(/^#\s+(.+)/);
    if (titleMatch) {
      specData.title = titleMatch[1];
    }

    // Extract metadata (handle emojis in headers)
    const metadataMatch = content.match(/##\s*.*Metadata\n([\s\S]*?)(?=\n## |$)/);
    if (metadataMatch) {
      specData.metadata = this.parseMetadata(metadataMatch[1]);
    }

    // Include full content for keyword extraction in platform detection
    specData.content = content;

    return specData;
  }

  /**
   * Parse metadata section
   */
  private parseMetadata(metadataContent: string): any {
    const metadata: any = {};
    const lines = metadataContent.split('\n');

    for (const line of lines) {
      const match = line.match(/- \*\*(.+?)\*\*\:\s*(.+)/);
      if (match) {
        const key = match[1].toLowerCase().replace(/\s+/g, '');
        const value = match[2];
        metadata[key] = value;
      }
    }

    return metadata;
  }

  /**
   * Fill plan template with data
   */
  private fillPlanTemplate(template: any, options: {
    edgeCaseAnalysis: any;
    specData: any;
  }): any {
    // Fill template using fillTemplateWithUserInput
    const filledTemplate = this.fillTemplateWithUserInput(template, {
      specData: options.specData,
      edgeCaseAnalysis: options.edgeCaseAnalysis
    });

    return filledTemplate;
  }



  /**
   * Filter template to include only plan-specific content
   */
  private filterPlanOnlyContent(template: any): any {
    const filtered = JSON.parse(JSON.stringify(template)); // Deep copy

    // Keep only plan-specific sections
    const planOnlySections = [
      'title',
      'metadata', 
      'summary',
      'technicalContext',
      'implementationPhases',
      'projectStructure',
      'databaseStrategy',
      'designSystemPlanning',
      'apiFirstPlanning',
      'platformSpecificPlanning',
      'sddVersion',             // Plan version info
      'cursor_ai_instructions' // AI instructions for content generation
    ];

    // Keep only essential sections
    const essentialTemplate: any = {};
    planOnlySections.forEach(section => {
      if (filtered[section]) {
        essentialTemplate[section] = filtered[section];
      }
    });

    // Add essential metadata
    essentialTemplate.metadata = {
      ...essentialTemplate.metadata
    };


    return essentialTemplate;
  }
}
