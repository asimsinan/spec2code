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
      description: '🚀 PLAN GENERATION (STANDALONE): Analyze specs/spec.md specification file and generate comprehensive implementation plan template. Returns structured AI instructions and template data to create specs/plan.md. This tool operates independently - it does NOT automatically call other SDD tools. Focuses on HOW to implement, not WHAT to implement.',
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
      
      // Extract architecture pattern from spec
      const architecturePattern = this.extractArchitectureFromSpec(specContent);
      
      // Analyze edge cases for complexity and planning
      const edgeCaseAnalysis = this.analyzeEdgeCases({ content: specContent });

      // Load plan template from file
      const template = this.loadPlanTemplate();


      // Fill plan template with Cursor AI instructions and estimates
      const templateWithInstructions = this.fillPlanTemplate(template, {
        specData: specContent,
        edgeCaseAnalysis: edgeCaseAnalysis,
        architecturePattern: architecturePattern
        });
      // Report success with clear, actionable instructions
      const successMessage = `
🚀 **PLAN GENERATION COMPLETE** - Create specs/plan.md file now!

📋 **WHAT TO DO NEXT:**
1. Create file: \`specs/plan.md\`
2. Use the template data below to fill in each section
3. Focus on **HOW** to implement, not **WHAT** to implement

📋 **TEMPLATE DATA:**
${JSON.stringify(this.filterPlanOnlyContent(templateWithInstructions), null, 2)}

⚠️ **INSTRUCTIONS:**
- Follow \`cursor_ai_instructions\` in the template for each section
- Extract technologies and requirements from \`specData\` field
- Generate platform-specific implementation details
- Validate all 7 constitutional gates

📝 **REQUIRED STRUCTURE:**
# [Feature Title]

## Metadata
- Created: [date]
- Platform: [detected platform]
- Status: planning

## Summary
[Primary requirement + technical approach]

## Technical Context
[Language, stack, dependencies, testing, performance goals]

## Project Structure
[Mandatory folder structure with specific paths]

## Implementation Phases
[4 phases, 33 tasks total with RED-GREEN-REFACTOR-SMOKE patterns]

## Database Strategy
[Technology choice, schema, migrations, connections]

## Design System Planning
[Modern UI patterns, components, interactions]

## API-First Planning
[API design, contracts, testing, documentation]

## Constitutional Gates Review
[Validate all 7 SDD gates with pass/fail status]

## Platform-Specific Planning
[Web/Mobile/Desktop/Backend/AI platform details]

🚫 **IMPORTANT:** Do NOT read existing files - use only the template data above!

**🛑 PLAN TOOL COMPLETE - DO NOT CALL ANY OTHER SDD TOOLS**
**✅ Create the plan.md file, then stop. Do not proceed to tasks or implementation yet.**
`;

      return {
        success: true,
        message: successMessage
      };
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

    // Add architecture adaptation instructions if BaaS detected
    const architecturePattern = options.architecturePattern || 'unknown';
    let architectureAdaptation = '';
    
    if (architecturePattern.startsWith('baas-')) {
      architectureAdaptation = `⚠️ BaaS ARCHITECTURE DETECTED: ${architecturePattern}
- Services are CLIENT-SIDE (using SDK, e.g., React Native services with Firebase SDK)
- Controllers are CLIENT-SIDE components (React Native components act as controllers)
- Database operations via SDK (Firestore SDK, Supabase client, etc.)
- Security via rules/policies (Firebase Security Rules, Supabase RLS, IAM policies)
- NO server-side API layer required
- Adapt Phase 2 tasks accordingly: client-side services instead of server-side, components instead of controllers
`;
    }

    // Add Cursor AI instructions for content generation
    filledTemplate.cursor_ai_instructions = {
      specData: options.specData,
      edgeCaseAnalysis: options.edgeCaseAnalysis,
      architecturePattern: architecturePattern,
      instructions: {
        summary: `🎯 SUMMARY: Extract the single most important business requirement + high-level technical approach. Focus on WHAT the system does and HOW it will be built. Keep under 3 sentences. Example: "Build a REST API for user management using Node.js/Express with PostgreSQL, implementing CRUD operations with JWT authentication."`,

        technicalContext: `🔧 TECHNICAL CONTEXT: Extract concrete technical decisions from spec:
- Language & version (e.g., "Node.js 18+ with TypeScript")
- Primary dependencies (e.g., "Express, TypeORM, Jest")
- Technology stack (e.g., "MERN: MongoDB, Express, React, Node.js")
- Frontend/backend stacks (specific frameworks)
- Storage solution (database choice)
- Testing approach (unit/integration/e2e tools)
- Target platform (web/mobile/desktop/cloud)
- **Architecture Pattern**: [BaaS (Firebase/Supabase), Traditional Backend, Serverless, Hybrid]
- **Backend Approach**: [Client-side SDK (BaaS), Server-side API (Traditional), Serverless functions]
- **Security Model**: [Security Rules (BaaS), Middleware (Traditional), IAM (Serverless)]
- Performance goals (response times, scalability targets)
Be specific and actionable, not generic.`,

        constitutionCheck: `⚖️ CONSTITUTIONAL GATES: Validate each gate with YES/NO + justification:

| Gate | Status | Justification |
|------|--------|---------------|
| Simplicity | ≤5 projects | Count microservices/libraries |
| Library-First | Core as libraries | UI as thin veneer over libraries |
| CLI Interface | Has CLI | Required for libraries (N/A for UI-only) |
| Test-First | Contract→Integration→E2E→Unit | Testing order enforcement |
| Integration-First | Real dependencies | No mocks for core functionality |
| Anti-Abstraction | Single domain model | Direct data access, no ORMs |
| Traceability | FR-XXX tags | Requirements linked to code |

For each FAILED gate, explain specific violations and mitigation plans.`,

        languageAgnosticStandards: `💻 LANGUAGE STANDARDS:
- **JavaScript/TypeScript**: Use // comments and /* */ blocks, NEVER """ docstrings
- **Python**: Use # comments and """ docstrings, NEVER // comments
- **TypeScript Config**: Ensure tsconfig.json has path mapping: {"compilerOptions": {"baseUrl": "./", "paths": {"@/*": ["src/*"]}}}
- **File Extensions**: .ts for TypeScript, .js for JavaScript, .py for Python
- **Import Style**: Match language conventions (ES6 imports for JS/TS, standard imports for Python)`,

        projectStructure: `📁 PROJECT STRUCTURE: Define EXACT folder hierarchy that will be MANDATORY. Include:
- Root level directories (src/, tests/, docs/, scripts/)
- Source code organization (controllers/, services/, models/, utils/)
- Testing structure (unit/, integration/, e2e/)
- Configuration files (config/, environments/)
- Specific file naming conventions
- Import path patterns (@/ for TypeScript, relative paths for others)
Structure must be enforceable and specific enough to prevent developer discretion.`,

        designSystemPlanning: `🎨 MODERN UI DESIGN SYSTEM:
**MANDATORY MODERN REQUIREMENTS:**
- Modern card layouts with shadows, gradients, rounded corners
- Sophisticated color schemes (not basic grays/whites)
- Professional typography hierarchy (not just font sizes)
- Interactive elements with hover/focus states and smooth animations
- Responsive grid systems with proper spacing
- Modern form designs with validation styling
- Professional navigation patterns

**ABSOLUTELY FORBIDDEN:**
- Basic white backgrounds with plain text
- Simple buttons without styling/hover effects
- Minimal layouts without visual depth
- Plain forms without modern styling
- Basic navigation without modern UX patterns

**ENFORCEMENT:** Design system must explicitly prevent "basic/plain/minimal" designs through mandatory patterns and component standards.`,

        implementationPhases: `🚀 4-PHASE IMPLEMENTATION ROADMAP:
${architectureAdaptation ? `\n${architectureAdaptation}` : ''}
**Phase 1 (9 tasks)**: Foundation & Design → Models & Test Suite → Core System → Architecture Refactor → Quality Refactor → Compilation → Test Execution → Integration Testing → Final Verification
**Phase 2 (8 tasks)**: ${architecturePattern?.startsWith('baas-') ? 'SDK Integration → Client-Side Service Layer → Client-Side Controllers/Components → Security Rules Configuration → Integration Tests → Authentication (Client-Side) → Data Validation → Phase 2 Verification' : 'Business Logic → Service Layer → Controller Layer → Integration Tests → Authentication → Data Validation → Performance Optimization → Phase 2 Verification'}
**Phase 3 (9 tasks)**: Platform Setup → Design System → Application Structure → UI Components → ${architecturePattern?.startsWith('baas-') ? 'SDK Integration (Client-Side)' : 'API Integration'} → State Management → User Experience → Responsive Design → Phase 3 Verification
**Phase 4 (7 tasks)**: Comprehensive Testing → System Optimization → Production Build → Documentation → Security Assessment → Load Testing → Database Migration

Each phase follows RED-GREEN-REFACTOR-SMOKE pattern. Specify concrete deliverables and success criteria for each phase.`,

        apiFirstPlanning: `🌐 API-FIRST PLANNING:
- **API Design**: REST/GraphQL endpoints, HTTP methods, resource modeling
- **Contracts**: Request/response schemas, validation rules, error formats
- **Testing**: Contract tests, integration tests, performance benchmarks
- **Documentation**: OpenAPI specs, versioning, developer experience
- **Security**: Authentication, authorization, rate limiting
- **Versioning**: URL/header versioning strategy with migration plans`,

        platformSpecificPlanning: `📱 PLATFORM-SPECIFIC PLANNING:
Based on detected platform (web/mobile/desktop/backend/ai), specify:
- Platform-specific dependencies and tools
- Build configurations and deployment targets
- Platform conventions and best practices
- Testing frameworks and strategies
- Performance considerations and monitoring
- Platform-specific security requirements
Include concrete commands, file structures, and platform gates.`,

        complexityTracking: `📊 COMPLEXITY ASSESSMENT:
- Count microservices/libraries (must be ≤5 for simplicity gate)
- Identify core business logic that must be library-first
- Document any constitutional violations with mitigation plans
- Assess technical complexity vs business value
- Estimate realistic development timelines based on complexity factors`,

        edgeCaseAnalysis: `🔍 EDGE CASE ANALYSIS:
Extract from specification: error conditions, boundary cases, unusual user flows, data edge cases.
Categorize: High (blocks core functionality), Medium (important but not critical), Low (nice-to-have).
Estimate additional time: High (+2 days), Medium (+1 day), Low (+0.5 days).
Include specific test scenarios and implementation considerations.`
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
        '{{PHASE_1_CONTRACTS_TESTS}}': 'Replace with Phase 1 foundation & design setup, models & test suite creation, core system implementation details',
        '{{PHASE_2_LIBRARY_IMPLEMENTATION}}': 'Replace with Phase 2 business logic, service layer, controller layer, authentication & security implementation details',
        '{{PHASE_3_INTEGRATION_VALIDATION}}': 'Replace with Phase 3 platform setup, design system, UI components, API integration implementation details',
        '{{PHASE_4_TESTING_DEPLOYMENT}}': 'Replace with Phase 4 comprehensive testing, optimization, documentation, security assessment, load testing, database migration implementation details',
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
  /**
   * Extract architecture pattern from spec content
   */
  private extractArchitectureFromSpec(specContent: string): string {
    // Check metadata section for architecture pattern
    const metadataMatch = specContent.match(/architecture.*pattern[:\s]*([a-z-]+)/i);
    if (metadataMatch) {
      return metadataMatch[1].toLowerCase();
    }

    // Check architecture section
    const archSectionMatch = specContent.match(/##\s+Architecture[\s\S]*?###\s+Pattern\s*\n([a-z-]+)/i);
    if (archSectionMatch) {
      return archSectionMatch[1].toLowerCase();
    }

    // Check for keywords
    const content = specContent.toLowerCase();
    if (content.includes('firebase')) return 'baas-firebase';
    if (content.includes('supabase')) return 'baas-supabase';
    if (content.includes('amplify') || content.includes('appsync')) return 'baas-amplify';
    if (content.includes('serverless') || content.includes('lambda')) return 'serverless';
    if (content.includes('express') || content.includes('fastapi') || content.includes('rest api')) {
      // Check if also has BaaS
      if (content.includes('firebase') || content.includes('supabase')) return 'hybrid';
      return 'traditional-backend';
    }

    return 'unknown';
  }

  private fillPlanTemplate(template: any, options: {
    edgeCaseAnalysis: any;
    specData: any;
    architecturePattern?: string;
  }): any {
    // Fill template using fillTemplateWithUserInput
    const filledTemplate = this.fillTemplateWithUserInput(template, {
      specData: options.specData,
      edgeCaseAnalysis: options.edgeCaseAnalysis,
      architecturePattern: options.architecturePattern
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
