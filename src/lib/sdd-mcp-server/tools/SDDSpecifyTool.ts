/**
 * SDD Specify Tool
 * Implements the /specify command for creating feature specifications
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { SpecifyInputSchema, SpecifyErrorSchema } from '../schemas/mcp-tools.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { ArchitecturePatternDetector } from '../utils/ArchitecturePatternDetector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


export class SDDSpecifyTool {
  private basePath: string;
  private architectureDetector: ArchitecturePatternDetector;

  constructor(basePath: string = process.cwd()) {
    this.basePath = path.resolve(basePath);
    this.architectureDetector = new ArchitecturePatternDetector();
  }


  getToolDefinition(): Tool {
    return {
      name: 'sdd_specify',
      description: '📋 STANDALONE SPECIFICATION: Analyze feature description and generate comprehensive specification template. Returns AI instructions to create specs/spec.md file following SDD methodology. This tool operates independently and does NOT trigger any other tools.',
      inputSchema: {
        type: 'object',
        properties: {
          input: {
            type: 'string',
            description: 'Free-form feature description',
            minLength: 10,
            maxLength: 5000
          },
          platform: {
            type: 'string',
            description: 'Target platform for the feature (mobile, web, desktop, backend, ai)',
            enum: ['mobile', 'web', 'desktop', 'backend', 'ai'],
            default: 'web'
          }
        },
        required: ['input']
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Whether the operation was successful'
          },
          nextStep: {
            type: 'string',
            description: 'Detailed instructions for creating specs/spec.md file with all requirements, user stories, acceptance scenarios, technical context, and SDD methodology'
          },
          templateData: {
            type: 'object',
            description: 'The filled specification template data with AI instructions and cursor_ai_instructions for completing the specification'
          },
          error: {
            type: 'string',
            description: 'Error message if operation failed'
          }
        },
        required: ['success']
      }
    };
  }

  async execute(input: any): Promise<any> {
    try {

      
      // Validate input
      if (!input.input) {
        return this.error('Missing required parameter: input is required');
      }

      const validatedInput = SpecifyInputSchema.parse(input);
      
      const platform = validatedInput.platform || 'web';
      const specsDir = path.join(this.basePath, 'specs');
      

      // Ensure specs directory exists
      if (!fs.existsSync(specsDir)) {
        fs.mkdirSync(specsDir, { recursive: true });
      }

      // Load template from file
      const template = this.loadSpecTemplate();
   
      // Fill template with user input
      const filledTemplate = this.fillTemplateWithUserInput(template, {
        userInput: validatedInput.input,
        platform: platform
      });
  
      // Validate constitutional gates compliance
      const gatesValidation = this.validateConstitutionalGates(platform, validatedInput.input, filledTemplate);
      if (!gatesValidation.valid) {
        return this.error(`Constitutional Gates Violation: ${gatesValidation.violations.join(', ')}. Please simplify your feature or document violations in Complexity Tracking.`);
      }

      // Extract template information for dynamic instructions
      const templateData = filledTemplate;
      const constitutionalGates = templateData.constitutionalGates || {};
      const platformGates = templateData.platformGates || {};
      const qualityGates = templateData.qualityGates || {};
      const sddPrinciples = templateData.sddPrinciples || {};
      
      // Extract feature name from template data
      const featureName = templateData.title?.replace('{{FEATURE_NAME}}', '').trim() || 'Generated Specification';
 
      // Get platform-specific gates
      const platformSpecificGates = platformGates[platform]?.gates || [];
      const platformQualityGates = platformGates[platform]?.qualityGates || [];
      
      // Get applicable constitutional gates for this platform
      const applicableConstitutionalGates = Object.entries(constitutionalGates)
        .filter(([_, gate]: [string, any]) => 
          gate.platforms && gate.platforms.includes(platform)
        )
        .map(([key, gate]: [string, any]) => `${gate.title}: ${gate.description}`);

      // Pre-format arrays to avoid JSON parsing issues
      const constitutionalGatesList = applicableConstitutionalGates.map(gate => `    * ${gate}`).join('\n');
      const platformGatesList = platformSpecificGates.map(gate => `     * ${gate}`).join('\n');
      const qualityGatesList = Object.entries(qualityGates).map(([key, gate]: [string, any]) => 
        `     * ${gate.title || key}: ${gate.items?.join(', ') || 'See template for details'}`
      ).join('\n');
      const sddPrinciplesList = Object.entries(sddPrinciples).map(([key, principle]: [string, any]) => 
        `     * ${key}: ${principle}`
      ).join('\n');

  

      const successMessage = `
🚫 CRITICAL: DO NOT READ OR SEARCH FOR ANY EXISTING FILES
- DO NOT read specs/spec.md or any .md files from filesystem
- DO NOT search for existing specifications
- The template data below contains ALL information you need
- Simply CREATE the specs/spec.md file with the content from the template below

🎯 SPECIFICATION TOOL OBJECTIVE:
Create a comprehensive, production-ready specification document that serves as the single source of truth for your project. This specification will guide all subsequent planning, task creation, and implementation phases.

📋 WHAT THIS TOOL DOES:
- Analyzes your input to extract requirements and technical context
- Applies SDD methodology with constitutional gates and quality standards
- Generates a structured specification following industry best practices
- Creates a foundation for all future development phases

1. FEATURE DETAILS:
   1.1. Feature Name: ${featureName}
   1.2. Platform: ${platform.toUpperCase()}
   1.3. Input Analysis: "${validatedInput.input.replace(/"/g, '\\"')}"

2. TEMPLATE PREPARED WITH COMPREHENSIVE GUIDANCE:
   2.1. User input and context: "${validatedInput.input.replace(/"/g, '\\"')}"
   2.2. Platform-specific constitutional gates: ${platformSpecificGates.length > 0 ? platformSpecificGates.join(', ') : 'None'}
   2.3. Platform-specific quality gates: ${platformQualityGates.length > 0 ? platformQualityGates.join(', ') : 'None'}
   2.4. Applicable constitutional gates for ${platform}:
${constitutionalGatesList}
   2.5. Quality gates enforcement: ${Object.keys(qualityGates).join(', ')}
   2.6. Placeholder content ({{...}}) ready for AI generation
   2.7. Structured template following complete SDD methodology

3. DETAILED INSTRUCTIONS FOR CURSOR AI (MANDATORY COMPLIANCE):

📝 SPECIFICATION CREATION PROCESS:
   3.1. **ANALYZE INPUT**: Carefully analyze the user input to understand the complete feature requirements
   3.2. **EXTRACT REQUIREMENTS**: Identify all functional and non-functional requirements
   3.3. **DEFINE USER SCENARIOS**: Create comprehensive user stories and acceptance criteria
   3.4. **IDENTIFY EDGE CASES**: Consider boundary conditions and error scenarios
   3.5. **TECH STACK ANALYSIS**: Extract and categorize all mentioned technologies
   3.6. **ARCHITECTURE PATTERN DETECTION (MANDATORY)**: Detect and document backend architecture pattern
   3.7. **CONSTITUTIONAL COMPLIANCE**: Ensure all applicable gates are addressed

🎯 MANDATORY SPECIFICATION STRUCTURE:
   3.8. **Feature Specification Header**: Clear, descriptive title
   3.9. **User Scenarios & Testing**: Primary user story, acceptance scenarios, edge cases
   3.10. **Requirements Section**: Functional requirements (FR-001, FR-002, etc.), key entities, database requirements
   3.11. **Technical Context**: Complete technology stack, platform requirements, performance goals
   3.12. **Architecture Section**: Backend architecture pattern, implications, and indicators
   3.13. **Review & Acceptance**: Clear criteria for specification approval
   3.14. **Execution Status**: Auto-maintained during specification process

🔧 CRITICAL REQUIREMENTS EXTRACTION:
   3.15. **TECH STACK EXTRACTION (MANDATORY)**:
       - Extract ALL technologies mentioned in user input
       - Categorize by type: frontend, backend, database, styling, testing, deployment
       - Include version numbers and specific configurations when mentioned
       - Ensure NO technologies are added that weren't mentioned
       - Ensure NO technologies are omitted that were mentioned
   3.16. **ARCHITECTURE PATTERN EXTRACTION (MANDATORY)**:
       - Detect backend architecture pattern from tech stack and user input:
         * **BaaS (Firebase)**: Client-side SDKs, Security Rules, no server-side controllers
         * **BaaS (Supabase)**: Client-side PostgREST, RLS policies, no server-side controllers
         * **BaaS (AWS Amplify)**: Client-side AppSync, IAM policies
         * **Traditional Backend**: Express/FastAPI controllers, service layers, REST APIs
         * **Serverless**: Lambda functions, Cloud Functions, Vercel Functions
         * **Hybrid**: Mixed patterns (e.g., Firebase + custom API endpoints)
       - Extract indicators: Keywords ("Firebase", "Supabase", "serverless", "Lambda"), dependencies, architecture description
       - Store pattern in metadata.architecturePattern field
       - Document implications: clientSideServices, serverSideLayers, securityRules, apiLayerRequired
   3.14. **UI/DESIGN SYSTEM REQUIREMENTS (MANDATORY)**:
       - **DESIGN SYSTEM MANDATE**: Extract and specify comprehensive design system requirements
       - **MODERN UI MANDATE**: Require modern, sophisticated UI design (NO basic/plain designs)
       - **STYLING FRAMEWORK**: Specify exact styling frameworks (Tailwind CSS, Material-UI, Chakra UI, etc.)
       - **DESIGN PATTERNS**: Define modern UI patterns (cards, gradients, shadows, animations, micro-interactions)
       - **VISUAL HIERARCHY**: Specify typography, spacing, color schemes, and visual hierarchy
       - **RESPONSIVE DESIGN**: Define responsive breakpoints and mobile-first approach
       - **ACCESSIBILITY**: Include accessibility requirements (WCAG compliance)
       - **BRAND CONSISTENCY**: Define brand colors, fonts, and visual identity
       - **USER EXPERIENCE**: Specify UX patterns, navigation, and interaction flows
       - **ANTI-SIMPLE-DESIGN RULE**: Explicitly prohibit basic, plain, or minimal designs
   3.15. **API INTEGRATION REQUIREMENTS (MANDATORY)**:
       - Ensure frontend connects to backend APIs
       - Define data flow and communication patterns
       - Specify authentication and authorization requirements
   4.7. Enforce ALL applicable constitutional gates for ${platform} platform:
${constitutionalGatesList}
   4.8. Enforce platform-specific gates:
${platformGatesList}
   4.9. Enforce quality gates:
${qualityGatesList}
   4.10. Follow SDD principles:
${sddPrinciplesList}
   4.11. Use the detailed Cursor AI instructions provided in the template data
   4.12. Create specs/spec.md file with all content filled from the template below

🤖 AI HONESTY CONTRACT 🤖
I, the AI assistant, hereby commit to:
1. Creating accurate, complete specifications without fabrication
2. Following all constitutional gates and quality requirements
3. Not skipping or simplifying specification sections
4. Providing realistic, implementable requirements
5. Being transparent about any platform limitations or complexities

VIOLATION OF THIS CONTRACT = SPECIFICATION REGENERATION REQUIRED

🧠 ADVANCED SPECIFICATION SAFETY PROTOCOLS 🧠

TRUTH-SEEKING SPECIFICATION PROMPT:
"I am an AI committed to specification accuracy and completeness. I will:
- Extract requirements from actual user input, not assumptions
- Create implementable specifications, not vague descriptions
- Admit when requirements are unclear or need clarification
- Never fabricate features or technical details
- Always base specifications on the provided input"

HALLUCINATION PREVENTION FOR SPECS:
- I will only specify features explicitly mentioned or clearly implied
- I will flag any assumptions with [ASSUMPTION] markers
- I will never add 'nice-to-have' features not requested
- I will use [CLARIFICATION NEEDED] for ambiguous requirements

SELF-VERIFICATION FOR SPECIFICATIONS:
□ Did I include ALL requirements from the input?
□ Are my specifications realistic for the platform?
□ Have I avoided over-engineering or gold-plating?
□ Do my FR-XXX IDs follow the exact format required?
□ Would a developer be able to implement this specification?

5. TEMPLATE DATA FOR AI PROCESSING:
${JSON.stringify(templateData, null, 2)}

6. MARKDOWN CONVERSION GUIDE:
   ⚠️ CRITICAL: The specs/spec.md file MUST contain ALL fields from the JSON template above
   ⚠️ You MUST fill ALL placeholders ({{...}}) in the template with actual content
   ⚠️ DO NOT add sections that don't exist in the template
   ⚠️ Follow the EXACT structure shown below:
   
   # [template_data.title]
   [Convert ALL fields from template_data to markdown format, following this structure]
   
   ## Metadata
   - Created: [template_data.metadata.created]
   - Status: [template_data.metadata.status]
   - Input: [template_data.metadata.input]
   - Platform: [template_data.metadata.platform]
   [Include ALL metadata fields from template_data.metadata]
   
   ## User Scenarios & Testing
   ### Primary User Story
   [template_data.userScenarios.primaryUserStory.content]
   
   ### Comprehensive User Stories
   [template_data.userScenarios.comprehensiveUserStories.content]
   
   ### Acceptance Scenarios
   #### Happy Path Scenarios
   [Extract happy path scenarios from template_data.userScenarios.acceptanceScenarios.content]
   
   #### Negative Scenarios
   [Extract negative scenarios from template_data.userScenarios.acceptanceScenarios.content]
   
   #### Edge Cases
   [Extract edge case scenarios from template_data.userScenarios.acceptanceScenarios.content]
   
   ### Edge Cases
   [template_data.userScenarios.edgeCases.content]
   
   ## Requirements
   ### Functional Requirements
   [template_data.requirements.functionalRequirements.content]
   
   ### Key Entities
   [template_data.requirements.keyEntities.content]
   [Only include if template_data.requirements.keyEntities.content exists and is not empty]
   
   ### Database Requirements
   [template_data.requirements.databaseRequirements.content]
   [Only include if template_data.requirements.databaseRequirements.content exists and is not empty]
   
   ### UI/Design System Requirements
   [template_data.requirements.uiDesignRequirements.content]
   [Include if template_data.requirements.uiDesignRequirements.content exists]
   
   ### Technology Stack Requirements
   [template_data.requirements.technologyStack.content]
   
   ## Architecture
   ### Pattern
   [template_data.architecture.pattern]
   
   ### Description
   [template_data.architecture.description]
   
   ### Indicators
   [Convert template_data.architecture.indicators to markdown list]
   
   ### Implications
   - **Client-Side Services**: [template_data.architecture.implications.clientSideServices]
   - **Server-Side Layers**: [template_data.architecture.implications.serverSideLayers]
   - **Security Rules**: [template_data.architecture.implications.securityRules]
   - **API Layer Required**: [template_data.architecture.implications.apiLayerRequired]
   
   ## API Specification (API-First Approach)
   ### API Endpoints
   [template_data.apiSpecification.endpoints.content]
   
   ### API Contracts
   [template_data.apiSpecification.contracts.content]
   
   ### OpenAPI Specification
   [template_data.apiSpecification.openApiSpec.content]
   
   ### API Versioning Strategy
   [template_data.apiSpecification.versioning.content]
   
   ### API Testing Strategy
   [template_data.apiSpecification.testing.content]
   
   ## Constitutional Gates
   [Convert ALL gates from template_data.constitutionalGates to markdown]
   [For EACH gate, use this format:]
   ### [Gate Title]
   **Description:** [Gate description]
   
   **Status:** ✅ PASSED - [Brief justification]
   [Include ALL constitutional gates that apply to this platform]
   
   ## Platform Gates
   [Convert template_data.platformGates to markdown sections with proper formatting]
   ### [Platform] Platform Gates
   [List all gates from template_data.platformGates.[platform].gates]
   - **Simplicity**: [Gate description]
   - **...**: [Other gates]
   [List all quality gates from template_data.platformGates.[platform].qualityGates]
   
   ### Quality Gates
   [Convert ALL quality gates from template_data.qualityGates]
   [For EACH quality gate section, use:]
   ### [Quality Gate Title]
   [List all items from template_data.qualityGates.[section].items]
   
   ## Review Checklist
   [Convert ALL checklists from template_data.reviewChecklist to markdown]
   [For EACH checklist, use:]
   ### [Checklist Title]
   - ✅ [Item 1 from template_data.reviewChecklist.[section].items]
   - ✅ [Item 2 from template_data.reviewChecklist.[section].items]
   
   ## Execution Status
   [List ALL items from template_data.executionStatus.items]
   - ✅ [Item 1 from template_data.executionStatus.items]
   - ✅ [Item 2 from template_data.executionStatus.items]
   
   ## Complexity Tracking
   [template_data.complexityTracking.description]
   [If table has rows, include:]
   | Violation | Justification | Simpler Alternative Rejected |
   |-----------|---------------|-----------------------------|
   [Fill table with rows from template_data.complexityTracking.table.rows]
   
   ## SDD Principles
   [List ALL SDD principles from template_data.sddPrinciples]
   - **[intentBeforeMechanism]**: [principle description]
   - **[multiStepRefinement]**: [principle description]
   [Include ALL principles from template_data.sddPrinciples object]
   
   ### CRITICAL FORMATTING RULES:
   - Always use blank lines between sections
   - For Constitutional Gates, format each gate EXACTLY as:
     ### [Gate Title]
     **Description:** [Gate description]
     
     **Status:** ✅ PASSED - [Brief justification]
   - For Constitutional Gates, ALWAYS show "Status:" on a new line after "Description:" with checkmark
   - Use ✅ PASSED when gate is satisfied, ❌ FAILED when violated
   - Add blank lines between different gates for readability
   - **Happy Path Scenarios**: Use numbered list format (1., 2., 3.) for proper Markdown rendering
   - **Acceptance Scenarios**: Must have subsections: "#### Happy Path Scenarios", "#### Negative Scenarios", "#### Edge Cases"
   - **Nested Lists**: Use 4 spaces or tab for sub-scenarios within numbered lists
   - **Platform Gates**: Format as "- **[Gate Title]**: [Gate description]"
   - **SDD Principles**: Format as "- **[Principle Name]**: [Principle description]"
   - DO NOT create sections: Executive Summary, Project Overview, Data Model, User Interface Mockups, Implementation Phases, Non-Functional Requirements, Success Criteria, Risk & Mitigation

🚨 CRITICAL: This tool ONLY creates specs/spec.md - it does NOT trigger or call any other tools. After completion, STOP and wait for user to manually call next tool if needed.
`;

      // Return template data in the message that AI can see
      return {
        success: true,
        nextStep: `${successMessage}

📋 CRITICAL TEMPLATE DATA FOR SPECIFICATION CREATION:
${JSON.stringify(templateData, null, 2)}

⚠️ AI MUST USE THIS TEMPLATE DATA to create specs/spec.md
⚠️ ALL placeholders {{...}} must be replaced with actual content
⚠️ Follow the EXACT structure from the template data above
⚠️ Do NOT add sections that don't exist in the template`
      };
    } catch (error) {
      // Return error response
      const errorOutput = SpecifyErrorSchema.parse({
        success: false,
        error: 'SPECIFICATION_CREATION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: {
          input: input?.input || 'Unknown input'
        }
      });

      return errorOutput;
    }
  }

  /**
   * Load template from file
   */
  private loadSpecTemplate(): any {
    // Get the MCP server's templates directory (not the user's project)
    // In dist: __dirname is dist/lib/sdd-mcp-server/tools/
    // Templates are at dist/lib/sdd-mcp-server/templates/
    const templatesPath = path.join(__dirname, '..', 'templates', 'spec.json');
    if (!fs.existsSync(templatesPath)) {
      throw new Error('Spec template not found at: ' + templatesPath);
    }
    const templateContent = fs.readFileSync(templatesPath, 'utf-8');
    const template = JSON.parse(templateContent);
    return template.template_data; // Extract template_data from the JSON structure
  }

  /**
   * Fill template with user input
   */
  private fillTemplateWithUserInput(template: any, options: {
    userInput: string;
    platform: string;
  }): any {
    const filledTemplate = JSON.parse(JSON.stringify(template)); // Deep copy
    
    // Extract feature name from user input
    const featureName = this.generateFeatureNameExtractionRules();
    
    // Fill basic placeholders

    
    if (filledTemplate.metadata) {
      filledTemplate.metadata.input = options.userInput;
    const currentDate = new Date().toISOString().split('T')[0];
    filledTemplate.metadata.created = currentDate;
      filledTemplate.metadata.platform = options.platform || 'web';
    }
    
    // Detect CLI and Library requirements
    const cliDetection = this.detectCLIRequirements(options.userInput);
    const libraryDetection = this.detectLibraryRequirements(options.userInput);
    
    // Detect architecture pattern from user input
    const architecturePattern = this.architectureDetector.detectFromInput(options.userInput);
    
    if (filledTemplate.metadata) {
      filledTemplate.metadata.cliDetection = cliDetection;
      filledTemplate.metadata.libraryDetection = libraryDetection;
      filledTemplate.metadata.architecturePattern = architecturePattern.pattern;
      filledTemplate.metadata.architectureConfidence = architecturePattern.confidence;
      filledTemplate.metadata.architectureIndicators = architecturePattern.indicators;
      filledTemplate.metadata.architectureDetectedFrom = architecturePattern.detectedFrom;
    }
    
    // Apply format-specific processing
    this.applyTemplateFormatting(filledTemplate);

    // Add Cursor AI instructions
    filledTemplate._cursor_ai_instructions = {
      userInput: options.userInput,
      featureName: featureName,
      platform: options.platform,
      cliDetection: cliDetection,
      libraryDetection: libraryDetection,
      instructions: this.getPlatformSpecificInstructions(options.userInput, featureName, options.platform, cliDetection, libraryDetection).instructions,
      placeholders: this.getPlatformSpecificInstructions(options.userInput, featureName, options.platform, cliDetection, libraryDetection).placeholders
    };

    return filledTemplate;
  }

  /**
   * Apply template-specific formatting based on format field
   */
  private applyTemplateFormatting(filledTemplate: any): void {
    // Apply formatting to functional requirements
    if (filledTemplate.requirements?.functionalRequirements?.format === 'numbered_list_with_ids') {
      const content = filledTemplate.requirements.functionalRequirements.content;
      if (content && content !== '{{FUNCTIONAL_REQUIREMENTS}}') {
        filledTemplate.requirements.functionalRequirements.content = this.formatFunctionalRequirements(content);
      }
    }

    // Apply formatting to user stories if needed
    if (filledTemplate.userScenarios?.comprehensiveUserStories?.format === 'numbered_list_with_personas') {
      const content = filledTemplate.userScenarios.comprehensiveUserStories.content;
      if (content && content !== '{{COMPREHENSIVE_USER_STORIES}}') {
        filledTemplate.userScenarios.comprehensiveUserStories.content = this.formatUserStoriesAsList(content);
      }
    }

    // Apply formatting to acceptance scenarios if needed
    if (filledTemplate.userScenarios?.acceptanceScenarios?.format === 'given_when_then_scenarios') {
      const content = filledTemplate.userScenarios.acceptanceScenarios.content;
      if (content && content !== '{{ACCEPTANCE_SCENARIOS}}') {
        filledTemplate.userScenarios.acceptanceScenarios.content = this.formatAcceptanceScenarios(content);
      }
    }
  }

  /**
   * Format user stories as a numbered list
   */
  private formatUserStoriesAsList(storiesText: string): string {
    if (!storiesText || storiesText.trim() === '') {
      return '1. **As a user**, I want to perform basic operations so that I can accomplish my tasks.';
    }

    const lines = storiesText.split('\n').filter(line => line.trim());

    // If already numbered, return as-is
    if (lines.some(line => /^\d+\./.test(line.trim()))) {
      return storiesText;
    }

    return lines.map((line, index) =>
      `${index + 1}. ${line.replace(/^[-•*]\s*/, '').trim()}`
    ).join('\n');
  }

  /**
   * Format acceptance scenarios with proper structure
   */
  private formatAcceptanceScenarios(scenariosText: string): string {
    if (!scenariosText || scenariosText.trim() === '') {
      return '**Happy Path Scenarios**\n1. Given the user is on the main page\n   When they perform an action\n   Then they see expected results';
    }

    // If already properly formatted, return as-is
    if (scenariosText.includes('**Happy Path Scenarios**') || scenariosText.includes('Given ') && scenariosText.includes('When ') && scenariosText.includes('Then ')) {
      return scenariosText;
    }

    // Basic formatting for Given-When-Then scenarios
    return `**Happy Path Scenarios**\n${scenariosText.split('\n').map(line => {
      if (line.trim()) {
        return `1. ${line.trim()}`;
      }
      return line;
    }).join('\n')}`;
  }

  /**
   * Get platform-specific Cursor AI instructions (extracted from SpecificationTemplate)
   */
  private getPlatformSpecificInstructions(userInput: string, featureName: string, platform: string, cliDetection?: any, libraryDetection?: any): any {
    const baseInstructions = {
      primaryUserStory: `Generate a primary user story for: ${userInput}. Focus on the main value proposition and user benefit.`,
      comprehensiveUserStories: `Generate 8-10 comprehensive user stories for: ${userInput}. Use format: **As a [user type], I want [goal] so that [benefit]**.`,
      acceptanceScenarios: `Generate comprehensive acceptance criteria for: ${userInput}. Use Given-When-Then format.`,
      edgeCases: `Generate edge cases for: ${userInput}. Consider boundary conditions, error states, and unusual user behaviors.`,
      functionalRequirements: `Generate comprehensive functional requirements for: ${userInput}. Format as a numbered list with IDs: 1. **FR-001**: [Requirement description] 2. **FR-002**: [Requirement description] etc. Each requirement must start with FR-XXX ID and be independently testable.`,
      keyEntities: `Identify key data entities for: ${userInput}. Include their attributes and relationships.`,
      databaseRequirements: `Define database requirements for: ${userInput}. Include PostgreSQL for ACID compliance.`,
      apiEndpoints: `Define RESTful/GraphQL API endpoints for: ${userInput}.`,
      apiContracts: `Define API contracts for: ${userInput}.`,
      openApiSpec: `Generate OpenAPI 3.0 specification for: ${userInput}.`,
      apiVersioning: `Define API versioning strategy for: ${userInput}.`,
      apiTesting: `Define API testing strategy for: ${userInput}.`,
      simplicityGate: `Validate that ${userInput} can be implemented with ≤10 projects.`,
      testFirstGate: `Plan test-first approach for ${userInput}.`,
      integrationFirstTestingGate: `Plan integration-first testing for ${userInput} using real dependencies.`,
      antiAbstractionGate: `Plan single domain model approach for ${userInput}.`,
      traceabilityGate: `Ensure every line of code for ${userInput} can trace back to numbered requirements (FR-XXX).`
    };

    // Platform-specific instructions
    const platformSpecificInstructions: any = {
      mobile: {},
      web: {},
      desktop: {},
      backend: {},
      ai: {}
    };

    const instructions = { ...baseInstructions, ...(platformSpecificInstructions[platform] || {}) };
    const placeholders = this.generatePlatformPlaceholders(platform);

    return { instructions, placeholders };
  }

  /**
   * Generate platform-specific placeholders
   */
  private generatePlatformPlaceholders(platform: string): any {
    return {
      "{{SUMMARY}}": "Replace with generated summary",
      "{{LANGUAGE_VERSION}}": "Replace with generated language/version",
      "{{PRIMARY_DEPENDENCIES}}": "Replace with generated primary dependencies",
      "{{TECHNOLOGY_STACK}}": "Replace with extracted complete technology stack",
      "{{FRONTEND_STACK}}": "Replace with extracted frontend technologies",
      "{{BACKEND_STACK}}": "Replace with extracted backend technologies"
    };
  }



  /**
   * Validate constitutional gates compliance
   */
  private validateConstitutionalGates(platform: string, userInput: string, templateData: any): {
    valid: boolean;
    violations: string[];
    warnings: string[];
  } {
    const violations: string[] = [];
    const warnings: string[] = [];

    const platformGates = templateData.platformGates || {};
    
    // Simplicity Gate - check for project count
    const projectCount = this.extractProjectCount(userInput);
    if (projectCount > 15) {
      violations.push(`Simplicity Gate Violation: ${projectCount} projects exceed limit of 15`);
    }
    
    // 🚀 INTELLIGENT LIBRARY DETECTION: Use enhanced library detection
    const libraryDetection = this.detectLibraryRequirements(userInput);

    if (['web', 'desktop', 'backend', 'ai'].includes(platform)) {
      if (libraryDetection.hasLibrary) {
        if (libraryDetection.requiresLibrary) {
          warnings.push(`Library-First Gate: Library approach detected (confidence: ${(libraryDetection.confidence * 100).toFixed(1)}%) - Implement as standalone library with thin UI veneer`);
        } else {
          warnings.push(`Library-First Gate Suggestion: Library elements detected (confidence: ${(libraryDetection.confidence * 100).toFixed(1)}%) - Consider library approach`);
        }
      } else {
        warnings.push('Library-First Gate Suggestion: Consider starting as standalone library for better reusability and testability');
      }
    }

    // 🚀 INTELLIGENT CLI DETECTION: Use enhanced CLI detection
    const cliDetection = this.detectCLIRequirements(userInput);

    if (cliDetection.hasCLI && ['desktop', 'backend', 'ai'].includes(platform)) {
      if (cliDetection.requiresCLI) {
        warnings.push(`CLI Interface Gate: CLI detected (confidence: ${(cliDetection.confidence * 100).toFixed(1)}%) - Consider exposing CLI with --json mode`);
    } else {
        warnings.push(`CLI Interface Gate Suggestion: CLI elements detected (confidence: ${(cliDetection.confidence * 100).toFixed(1)}%) - CLI optional`);
      }
    }
    
    // Test-First Gate - check for test planning
    if (!this.hasTestFirstApproach(userInput)) {
      warnings.push('Test-First Gate Warning: Consider planning test-first approach');
    }
    
    // Integration-First Testing Gate
    if (!this.hasIntegrationFirstTesting(userInput)) {
      warnings.push('Integration-First Testing Gate Warning: Consider real dependencies over mocks');
    }
    
    // Anti-Abstraction Gate
    if (this.hasExcessiveAbstraction(userInput)) {
      warnings.push('Anti-Abstraction Gate Warning: Consider single domain model approach');
    }
    
    // Traceability Gate
    if (!this.hasTraceability(userInput)) {
      warnings.push('Traceability Gate Warning: Ensure requirements can be traced to FR-XXX');
    }
    
    // Platform-specific gates validation
    const platformSpecificGates = platformGates[platform]?.gates || [];
    const platformQualityGates = platformGates[platform]?.qualityGates || [];
    
    // Validate platform-specific gates
    for (const gate of platformSpecificGates) {
      const validation = this.validatePlatformGate(gate, platform, userInput);
      if (validation.violation) {
        violations.push(validation.violation);
      } else if (validation.warning) {
        warnings.push(validation.warning);
      }
    }
    
    // Validate platform-specific quality gates
    for (const qualityGate of platformQualityGates) {
      const validation = this.validateQualityGate(qualityGate, platform, userInput);
      if (validation.violation) {
        violations.push(validation.violation);
      } else if (validation.warning) {
        warnings.push(validation.warning);
      }
    }
    
    return {
      valid: violations.length === 0,
      violations,
      warnings
    };
  }

  /**
   * Extract project count from user input
   */
  private extractProjectCount(userInput: string): number {
    const projectKeywords = ['project', 'app', 'service', 'api', 'library', 'module', 'component'];
    const words = userInput.toLowerCase().split(/\s+/);
    let count = 0;
    
    for (const word of words) {
      if (projectKeywords.some(keyword => word.includes(keyword))) {
        count++;
      }
    }
    
    // If no explicit projects mentioned, assume 1
    return Math.max(1, count);
  }

  /**
   * 🚀 INTELLIGENT LIBRARY DETECTION: Enhanced Library-First requirement detection
   * Analyzes specification text for library indicators with confidence scoring
   */
  private detectLibraryRequirements(userInput: string): {
    hasLibrary: boolean;
    confidence: number;
    libraryElements: string[];
    libraryPatterns: string[];
    libraryComplexity: 'simple' | 'moderate' | 'complex';
    requiresLibrary: boolean;
  } {
    const libraryKeywords = [
      'library', 'standalone', 'reusable', 'module', 'package',
      'component', 'sdk', 'api', 'framework', 'core',
      'engine', 'service', 'utility', 'tool', 'plugin'
    ];

    const libraryPatterns = [
      /standalone\s+(library|module|component)/gi,  // Standalone library
      /reusable\s+(component|module|library)/gi,    // Reusable component
      /modular\s+(architecture|design|approach)/gi, // Modular architecture
      /api\s+(library|sdk|framework)/gi,           // API library
      /core\s+(library|module|engine)/gi,           // Core library
      /plugin\s+(system|architecture)/gi,           // Plugin system
      /component\s+(library|framework)/gi,          // Component library
      /service\s+(layer|architecture)/gi,           // Service layer
      /utility\s+(library|functions)/gi,            // Utility library
      /engine\s+(library|framework)/gi              // Engine library
    ];

    const libraryElements: string[] = [];
    const detectedPatterns: string[] = [];

    // Detect keywords
    libraryKeywords.forEach(keyword => {
      if (userInput.toLowerCase().includes(keyword)) {
        libraryElements.push(keyword);
      }
    });

    // Detect patterns
    libraryPatterns.forEach(pattern => {
      const matches = userInput.match(pattern);
      if (matches) {
        detectedPatterns.push(...matches);
      }
    });

    // 🔧 EDGE CASE FIX: Check for "optional" library mentions
    const hasOptionalMention = /\boptional\s+(library|module|component)\b/gi.test(userInput) ||
      /\b(library|module|component)\s+optional\b/gi.test(userInput);

    // 🔧 EDGE CASE FIX: Check for simple application patterns
    const isSimpleApp = /\b(simple|basic)\s+(app|application|website)\b/gi.test(userInput) ||
      /\b(web|mobile)\s+(app|application)\b/gi.test(userInput) ||
      /\b(static|single-page)\s+(site|website)\b/gi.test(userInput);

    // Calculate confidence with improved algorithm
    let confidence = 0;

    // Strong library indicators (high weight)
    if (libraryElements.includes('library')) confidence += 0.4;
    if (libraryElements.includes('standalone')) confidence += 0.3;
    if (libraryElements.includes('reusable')) confidence += 0.3;
    if (libraryElements.includes('module')) confidence += 0.2;
    if (libraryElements.includes('package')) confidence += 0.2;

    // Medium library indicators
    if (libraryElements.includes('component')) confidence += 0.15;
    if (libraryElements.includes('sdk')) confidence += 0.15;
    if (libraryElements.includes('api')) confidence += 0.15;
    if (libraryElements.includes('framework')) confidence += 0.1;
    if (libraryElements.includes('core')) confidence += 0.1;

    // Pattern-based confidence
    if (detectedPatterns.length > 0) {
      confidence += Math.min(0.3, detectedPatterns.length * 0.1);
    }

    // Bonus for multiple indicators
    if (libraryElements.length >= 3) confidence += 0.1;
    if (detectedPatterns.length >= 2) confidence += 0.1;

    // 🔧 EDGE CASE FIX: Reduce confidence for optional mentions
    if (hasOptionalMention) {
      confidence *= 0.3; // Significantly reduce confidence for optional mentions
    }

    // 🔧 EDGE CASE FIX: Reduce confidence for simple applications
    if (isSimpleApp) {
      confidence *= 0.5; // Reduce confidence for simple applications
    }

    // Cap at 1.0
    confidence = Math.min(1.0, confidence);

    // Determine library complexity with improved logic
    let complexity = 'simple';

    // Check for complex indicators
    if (libraryElements.includes('framework') || libraryElements.includes('engine')) {
      complexity = 'complex';
    } else if (libraryElements.includes('sdk') || libraryElements.includes('plugin')) {
      complexity = 'moderate';
    } else if (libraryElements.length >= 3 || detectedPatterns.length >= 2) {
      complexity = 'moderate';
    }

    // 🔧 EDGE CASE FIX: Override complexity for simple applications
    if (isSimpleApp && complexity === 'moderate') {
      complexity = 'simple';
    }

    return {
      hasLibrary: confidence > 0.2,
      confidence,
      libraryElements,
      libraryPatterns: detectedPatterns,
      libraryComplexity: complexity as 'simple' | 'moderate' | 'complex',
      requiresLibrary: confidence > 0.4
    };
  }

  /**
   * 🚀 INTELLIGENT CLI DETECTION: Enhanced CLI requirement detection
   * Analyzes specification text for CLI indicators with confidence scoring
   */
  private detectCLIRequirements(userInput: string): {
    hasCLI: boolean;
    confidence: number;
    cliElements: string[];
    cliPatterns: string[];
    cliComplexity: 'simple' | 'moderate' | 'complex';
    requiresCLI: boolean;
  } {
    const cliKeywords = [
      'cli', 'command', 'terminal', 'console', 'command line',
      'command-line', 'cmd', 'shell', 'bash', 'powershell',
      'subcommand', 'command group', 'automation', 'script'
    ];

    const cliPatterns = [
      /--[a-zA-Z-]+/g,           // Long options: --help, --version
      /-[a-zA-Z]\b/g,            // Short options: -h, -v
      /\$ [a-zA-Z-]+/g,          // Command execution: $ npm install
      /`[a-zA-Z-]+`/g,           // Command references: `git clone`
      /command\s+line/gi,        // Command line references
      /terminal\s+interface/gi,  // Terminal interface
      /console\s+application/gi, // Console application
      /cli\s+tool/gi,            // CLI tool references
      /command\s+interface/gi,   // Command interface
      /script\s+execution/gi,    // Script execution
      /batch\s+processing/gi,   // Batch processing
      /automation\s+script/gi    // Automation scripts
    ];

    const cliElements: string[] = [];
    const detectedPatterns: string[] = [];

    // Detect keywords
    cliKeywords.forEach(keyword => {
      if (userInput.toLowerCase().includes(keyword)) {
        cliElements.push(keyword);
      }
    });

    // Detect patterns
    cliPatterns.forEach(pattern => {
      const matches = userInput.match(pattern);
      if (matches) {
        detectedPatterns.push(...matches);
      }
    });

    // 🔧 EDGE CASE FIX 1: Check for "optional" CLI mentions
    const hasOptionalMention = /\boptional\s+(cli|command|terminal|console)\b/gi.test(userInput) ||
      /\b(cli|command|terminal|console)\s+optional\b/gi.test(userInput);

    // 🔧 EDGE CASE FIX 2: Check for simple script patterns
    const isSimpleScript = /\$ (npm|yarn|node|python|bash|sh)\s+(run|start|build|install)/gi.test(userInput) ||
      /\bscript\s+that\s+runs\b/gi.test(userInput) ||
      /\bruns?\s+from\s+command\s+line\b/gi.test(userInput);

    // Calculate confidence with improved algorithm
    let confidence = 0;

    // Strong CLI indicators (high weight)
    if (cliElements.includes('cli')) confidence += 0.4;
    if (cliElements.includes('command-line') || cliElements.includes('command line')) confidence += 0.3;
    if (cliElements.includes('terminal')) confidence += 0.2;
    if (cliElements.includes('console')) confidence += 0.2;

    // Medium CLI indicators
    if (cliElements.includes('command')) confidence += 0.15;
    if (cliElements.includes('shell')) confidence += 0.15;
    if (cliElements.includes('bash')) confidence += 0.15;
    if (cliElements.includes('script')) confidence += 0.1;

    // Pattern-based confidence
    if (detectedPatterns.length > 0) {
      confidence += Math.min(0.3, detectedPatterns.length * 0.1);
    }

    // Bonus for multiple indicators
    if (cliElements.length >= 3) confidence += 0.1;
    if (detectedPatterns.length >= 2) confidence += 0.1;

    // 🔧 EDGE CASE FIX 1: Reduce confidence for optional mentions
    if (hasOptionalMention) {
      confidence *= 0.3; // Significantly reduce confidence for optional mentions
    }

    // Cap at 1.0
    confidence = Math.min(1.0, confidence);

    // Determine CLI complexity with improved logic
    let complexity = 'simple';

    // Check for complex indicators
    if (cliElements.includes('subcommand') || cliElements.includes('command group')) {
      complexity = 'complex';
    } else if (detectedPatterns.some(pattern => pattern.includes('--') && pattern.length > 3)) {
      complexity = 'moderate';
    } else if (cliElements.length >= 3 || detectedPatterns.length >= 2) {
      complexity = 'moderate';
    }

    // 🔧 EDGE CASE FIX 2: Override complexity for simple scripts
    if (isSimpleScript && complexity === 'moderate') {
      complexity = 'simple';
    }

    return {
      hasCLI: confidence > 0.2, // Lowered threshold from 0.3
      confidence,
      cliElements,
      cliPatterns: detectedPatterns,
      cliComplexity: complexity as 'simple' | 'moderate' | 'complex',
      requiresCLI: confidence > 0.4 // Lowered threshold from 0.5
    };
  }

  private hasCLIInterface(userInput: string): boolean {
    const detection = this.detectCLIRequirements(userInput);
    return detection.hasCLI;
  }

  /**
   * Check if feature has test-first approach
   */
  private hasTestFirstApproach(userInput: string): boolean {
    const testKeywords = ['test', 'testing', 'tdd', 'test-driven'];
    return testKeywords.some(keyword => 
      userInput.toLowerCase().includes(keyword)
    );
  }

  /**
   * Check if feature has integration-first testing
   */
  private hasIntegrationFirstTesting(userInput: string): boolean {
    const integrationKeywords = ['integration', 'real', 'database', 'service', 'api'];
    return integrationKeywords.some(keyword => 
      userInput.toLowerCase().includes(keyword)
    );
  }

  /**
   * Check if feature has excessive abstraction
   */
  private hasExcessiveAbstraction(userInput: string): boolean {
    const abstractionKeywords = ['dto', 'repository', 'unit of work', 'factory', 'builder', 'strategy'];
    return abstractionKeywords.some(keyword => 
      userInput.toLowerCase().includes(keyword)
    );
  }

  /**
   * Check if feature has traceability
   */
  private hasTraceability(userInput: string): boolean {
    const traceabilityKeywords = ['requirement', 'fr-', 'specification', 'trace', 'track'];
    return traceabilityKeywords.some(keyword => 
      userInput.toLowerCase().includes(keyword)
    );
  }

  /**
   * Validate platform-specific gate
   */
  private validatePlatformGate(gate: string, platform: string, userInput: string): {
    violation?: string;
    warning?: string;
  } {
    const content = userInput.toLowerCase();

    switch (gate) {
      case 'simplicity':
        // Already handled in main validation
        return {};

      case 'nativeFirst':
        if (platform === 'mobile') {
          const nativeKeywords = ['native', 'ios', 'android', 'swift', 'kotlin', 'react native', 'flutter'];
          const hasNative = nativeKeywords.some(keyword => content.includes(keyword));
          if (!hasNative) {
            return { warning: 'Native-First Gate: Consider native mobile development approach' };
          }
        }
        break;

      case 'offlineFirst':
        if (platform === 'mobile') {
          const offlineKeywords = ['offline', 'sync', 'cache', 'local storage', 'pwa'];
          const hasOffline = offlineKeywords.some(keyword => content.includes(keyword));
          if (!hasOffline) {
            return { warning: 'Offline-First Gate: Consider offline functionality for mobile' };
          }
        }
        break;

      case 'progressiveEnhancement':
        if (platform === 'web') {
          const peKeywords = ['progressive', 'enhancement', 'graceful degradation', 'baseline'];
          const hasPE = peKeywords.some(keyword => content.includes(keyword));
          if (!hasPE) {
            return { warning: 'Progressive Enhancement Gate: Consider progressive enhancement for web' };
          }
        }
        break;

      case 'responsiveDesign':
        if (platform === 'web') {
          const responsiveKeywords = ['responsive', 'mobile-first', 'breakpoint', 'viewport', 'css grid', 'flexbox'];
          const hasResponsive = responsiveKeywords.some(keyword => content.includes(keyword));
          if (!hasResponsive) {
            return { warning: 'Responsive Design Gate: Consider responsive design for web' };
          }
        }
        break;

      case 'libraryFirst':
        // Library-first applies to web, desktop, backend, ai
        // Mobile apps may also benefit from modular component approach
        if (['web', 'desktop', 'backend', 'ai', 'mobile'].includes(platform)) {
          const libraryKeywords = ['library', 'component', 'module', 'reusable', 'standalone', 'modular', 'core functionality'];
          const uiKeywords = ['ui', 'interface', 'frontend', 'view', 'screen', 'page', 'component library'];

          const hasLibrary = libraryKeywords.some(keyword => content.includes(keyword));
          const hasUI = uiKeywords.some(keyword => content.includes(keyword));

          // If it mentions UI/interface but no library/component approach
          if (hasUI && !hasLibrary) {
            return { warning: 'Library-First Gate: Consider building core functionality as reusable library/component first, with UI as thin veneer' };
          }

          // For backend/desktop, strongly recommend library approach
          if ((platform === 'backend' || platform === 'desktop') && !hasLibrary) {
            return { warning: 'Library-First Gate: Backend/desktop features should start as standalone libraries' };
          }
        }
        break;

      case 'performance':
        const performanceKeywords = ['performance', 'optimization', 'speed', 'fast', 'efficient', 'lazy loading'];
        const hasPerformance = performanceKeywords.some(keyword => content.includes(keyword));
        if (!hasPerformance) {
          return { warning: `${gate.charAt(0).toUpperCase() + gate.slice(1)} Gate: Consider performance optimization` };
        }
        break;

      case 'security':
        const securityKeywords = ['security', 'authentication', 'authorization', 'encryption', 'https', 'ssl'];
        const hasSecurity = securityKeywords.some(keyword => content.includes(keyword));
        if (!hasSecurity) {
          return { warning: 'Security Gate: Consider security requirements' };
        }
        break;

      case 'accessibility':
        const a11yKeywords = ['accessibility', 'a11y', 'aria', 'screen reader', 'wcag', 'inclusive'];
        const hasA11y = a11yKeywords.some(keyword => content.includes(keyword));
        if (!hasA11y) {
          return { warning: 'Accessibility Gate: Consider accessibility requirements' };
        }
        break;

      case 'browserCompatibility':
        if (platform === 'web') {
          const browserKeywords = ['browser', 'compatibility', 'cross-browser', 'polyfill', 'fallback'];
          const hasBrowser = browserKeywords.some(keyword => content.includes(keyword));
          if (!hasBrowser) {
            return { warning: 'Browser Compatibility Gate: Consider cross-browser compatibility' };
          }
        }
        break;

      case 'apiFirst':
        if (['web', 'mobile', 'backend'].includes(platform)) {
          const apiKeywords = ['api', 'rest', 'graphql', 'endpoint', 'service', 'microservice'];
          const hasAPI = apiKeywords.some(keyword => content.includes(keyword));
          if (!hasAPI) {
            return { warning: 'API-First Gate: Consider API-first design approach' };
          }
        }
        break;

      case 'nativeIntegration':
        if (platform === 'desktop') {
          const nativeKeywords = ['native', 'os integration', 'system', 'platform specific'];
          const hasNative = nativeKeywords.some(keyword => content.includes(keyword));
          if (!hasNative) {
            return { warning: 'Native Integration Gate: Consider native desktop integration' };
          }
        }
        break;

      case 'distribution':
        if (platform === 'desktop') {
          const distKeywords = ['distribution', 'installer', 'package', 'deployment', 'release'];
          const hasDist = distKeywords.some(keyword => content.includes(keyword));
          if (!hasDist) {
            return { warning: 'Distribution Gate: Consider distribution strategy for desktop' };
          }
        }
        break;

      case 'cliInterface':
        if (['desktop', 'backend', 'ai'].includes(platform)) {
          const cliKeywords = ['cli', 'command', 'terminal', 'console', 'command line'];
          const hasCLI = cliKeywords.some(keyword => content.includes(keyword));
          if (!hasCLI) {
            return { warning: 'CLI Interface Gate: Consider CLI interface for this platform' };
          }
        }
        break;

      case 'database':
        if (platform === 'backend') {
          const dbKeywords = ['database', 'db', 'sql', 'nosql', 'storage', 'persistence'];
          const hasDB = dbKeywords.some(keyword => content.includes(keyword));
          if (!hasDB) {
            return { warning: 'Database Gate: Consider database requirements for backend' };
          }
        }
        break;

      case 'monitoring':
        if (platform === 'backend') {
          const monitoringKeywords = ['monitoring', 'logging', 'metrics', 'observability', 'alerting'];
          const hasMonitoring = monitoringKeywords.some(keyword => content.includes(keyword));
          if (!hasMonitoring) {
            return { warning: 'Monitoring Gate: Consider monitoring and observability for backend' };
          }
        }
        break;

      case 'dataQuality':
        if (platform === 'ai') {
          const dataKeywords = ['data quality', 'data validation', 'data cleaning', 'data pipeline'];
          const hasData = dataKeywords.some(keyword => content.includes(keyword));
          if (!hasData) {
            return { warning: 'Data Quality Gate: Consider data quality requirements for AI' };
          }
        }
        break;

      case 'modelPerformance':
        if (platform === 'ai') {
          const modelKeywords = ['model performance', 'accuracy', 'precision', 'recall', 'f1', 'inference'];
          const hasModel = modelKeywords.some(keyword => content.includes(keyword));
          if (!hasModel) {
            return { warning: 'Model Performance Gate: Consider model performance requirements for AI' };
          }
        }
        break;

      case 'reproducibility':
        if (platform === 'ai') {
          const reproKeywords = ['reproducibility', 'reproducible', 'versioning', 'experiment tracking'];
          const hasRepro = reproKeywords.some(keyword => content.includes(keyword));
          if (!hasRepro) {
            return { warning: 'Reproducibility Gate: Consider reproducibility for AI' };
          }
        }
        break;

      case 'ethics':
        if (platform === 'ai') {
          const ethicsKeywords = ['ethics', 'bias', 'fairness', 'transparency', 'explainability'];
          const hasEthics = ethicsKeywords.some(keyword => content.includes(keyword));
          if (!hasEthics) {
            return { warning: 'Ethics Gate: Consider ethical AI requirements' };
          }
        }
        break;

      case 'deployment':
        if (platform === 'ai') {
          const deployKeywords = ['deployment', 'production', 'serving', 'inference', 'model serving'];
          const hasDeploy = deployKeywords.some(keyword => content.includes(keyword));
          if (!hasDeploy) {
            return { warning: 'Deployment Gate: Consider deployment strategy for AI' };
          }
        }
        break;

      case 'storeCompliance':
        if (platform === 'mobile') {
          const storeKeywords = ['store', 'app store', 'google play', 'compliance', 'guidelines'];
          const hasStore = storeKeywords.some(keyword => content.includes(keyword));
          if (!hasStore) {
            return { warning: 'Store Compliance Gate: Consider app store compliance for mobile' };
          }
        }
        break;

      default:
        // Unknown gate, no validation
        break;
    }

    return {};
  }

  /**
   * Validate platform-specific quality gate
   */
  private validateQualityGate(qualityGate: string, platform: string, userInput: string): {
    violation?: string;
    warning?: string;
  } {
    const content = userInput.toLowerCase();

    switch (qualityGate) {
      case 'deviceCompatibility':
        if (platform === 'mobile') {
          const deviceKeywords = ['device', 'compatibility', 'screen size', 'resolution', 'orientation'];
          const hasDevice = deviceKeywords.some(keyword => content.includes(keyword));
          if (!hasDevice) {
            return { warning: 'Device Compatibility: Consider device compatibility testing for mobile' };
          }
        }
        break;

      case 'batteryOptimization':
        if (platform === 'mobile') {
          const batteryKeywords = ['battery', 'power', 'optimization', 'efficiency', 'background'];
          const hasBattery = batteryKeywords.some(keyword => content.includes(keyword));
          if (!hasBattery) {
            return { warning: 'Battery Optimization: Consider battery optimization for mobile' };
          }
        }
        break;

      case 'memoryManagement':
        if (platform === 'mobile') {
          const memoryKeywords = ['memory', 'ram', 'gc', 'garbage collection', 'leak'];
          const hasMemory = memoryKeywords.some(keyword => content.includes(keyword));
          if (!hasMemory) {
            return { warning: 'Memory Management: Consider memory management for mobile' };
          }
        }
        break;

      case 'touchInterface':
        if (platform === 'mobile') {
          const touchKeywords = ['touch', 'gesture', 'swipe', 'tap', 'pinch', 'interface'];
          const hasTouch = touchKeywords.some(keyword => content.includes(keyword));
          if (!hasTouch) {
            return { warning: 'Touch Interface: Consider touch interface design for mobile' };
          }
        }
        break;

      case 'offlineSync':
        if (platform === 'mobile') {
          const syncKeywords = ['sync', 'offline', 'synchronization', 'conflict', 'merge'];
          const hasSync = syncKeywords.some(keyword => content.includes(keyword));
          if (!hasSync) {
            return { warning: 'Offline Sync: Consider offline synchronization for mobile' };
          }
        }
        break;

      case 'crossBrowserTesting':
        if (platform === 'web') {
          const browserKeywords = ['browser', 'testing', 'cross-browser', 'compatibility'];
          const hasBrowser = browserKeywords.some(keyword => content.includes(keyword));
          if (!hasBrowser) {
            return { warning: 'Cross-Browser Testing: Consider cross-browser testing for web' };
          }
        }
        break;

      case 'seoOptimization':
        if (platform === 'web') {
          const seoKeywords = ['seo', 'search', 'optimization', 'meta', 'semantic', 'structured data'];
          const hasSEO = seoKeywords.some(keyword => content.includes(keyword));
          if (!hasSEO) {
            return { warning: 'SEO Optimization: Consider SEO optimization for web' };
          }
        }
        break;

      case 'progressiveWebApp':
        if (platform === 'web') {
          const pwaKeywords = ['pwa', 'progressive web app', 'service worker', 'manifest', 'offline'];
          const hasPWA = pwaKeywords.some(keyword => content.includes(keyword));
          if (!hasPWA) {
            return { warning: 'Progressive Web App: Consider PWA features for web' };
          }
        }
        break;

      case 'coreWebVitals':
        if (platform === 'web') {
          const vitalsKeywords = ['core web vitals', 'lcp', 'fid', 'cls', 'performance', 'metrics'];
          const hasVitals = vitalsKeywords.some(keyword => content.includes(keyword));
          if (!hasVitals) {
            return { warning: 'Core Web Vitals: Consider Core Web Vitals for web' };
          }
        }
        break;

      case 'osIntegration':
        if (platform === 'desktop') {
          const osKeywords = ['os', 'operating system', 'integration', 'native', 'system'];
          const hasOS = osKeywords.some(keyword => content.includes(keyword));
          if (!hasOS) {
            return { warning: 'OS Integration: Consider OS integration for desktop' };
          }
        }
        break;

      case 'installerTesting':
        if (platform === 'desktop') {
          const installerKeywords = ['installer', 'installation', 'setup', 'package', 'distribution'];
          const hasInstaller = installerKeywords.some(keyword => content.includes(keyword));
          if (!hasInstaller) {
            return { warning: 'Installer Testing: Consider installer testing for desktop' };
          }
        }
        break;

      case 'apiTesting':
        if (['web', 'mobile', 'backend'].includes(platform)) {
          const apiKeywords = ['api testing', 'api', 'endpoint', 'contract', 'integration'];
          const hasAPI = apiKeywords.some(keyword => content.includes(keyword));
          if (!hasAPI) {
            return { warning: 'API Testing: Consider API testing strategy' };
          }
        }
        break;

      case 'databaseTesting':
        if (platform === 'backend') {
          const dbKeywords = ['database testing', 'db testing', 'data testing', 'migration'];
          const hasDB = dbKeywords.some(keyword => content.includes(keyword));
          if (!hasDB) {
            return { warning: 'Database Testing: Consider database testing for backend' };
          }
        }
        break;

      case 'loadTesting':
        if (platform === 'backend') {
          const loadKeywords = ['load testing', 'performance testing', 'stress testing', 'scalability'];
          const hasLoad = loadKeywords.some(keyword => content.includes(keyword));
          if (!hasLoad) {
            return { warning: 'Load Testing: Consider load testing for backend' };
          }
        }
        break;

      case 'securityTesting':
        if (platform === 'backend') {
          const securityKeywords = ['security testing', 'penetration testing', 'vulnerability', 'audit'];
          const hasSecurity = securityKeywords.some(keyword => content.includes(keyword));
          if (!hasSecurity) {
            return { warning: 'Security Testing: Consider security testing for backend' };
          }
        }
        break;

      case 'monitoringTesting':
        if (platform === 'backend') {
          const monitoringKeywords = ['monitoring testing', 'observability testing', 'alerting', 'metrics'];
          const hasMonitoring = monitoringKeywords.some(keyword => content.includes(keyword));
          if (!hasMonitoring) {
            return { warning: 'Monitoring Testing: Consider monitoring testing for backend' };
          }
        }
        break;

      case 'dataValidation':
        if (platform === 'ai') {
          const dataKeywords = ['data validation', 'data quality', 'data testing', 'validation'];
          const hasData = dataKeywords.some(keyword => content.includes(keyword));
          if (!hasData) {
            return { warning: 'Data Validation: Consider data validation for AI' };
          }
        }
        break;

      case 'modelTesting':
        if (platform === 'ai') {
          const modelKeywords = ['model testing', 'model validation', 'model evaluation', 'testing'];
          const hasModel = modelKeywords.some(keyword => content.includes(keyword));
          if (!hasModel) {
            return { warning: 'Model Testing: Consider model testing for AI' };
          }
        }
        break;

      case 'biasTesting':
        if (platform === 'ai') {
          const biasKeywords = ['bias testing', 'fairness testing', 'bias', 'fairness', 'equity'];
          const hasBias = biasKeywords.some(keyword => content.includes(keyword));
          if (!hasBias) {
            return { warning: 'Bias Testing: Consider bias testing for AI' };
          }
        }
        break;

      case 'performanceTesting':
        if (platform === 'ai') {
          const perfKeywords = ['performance testing', 'model performance', 'inference speed', 'latency'];
          const hasPerf = perfKeywords.some(keyword => content.includes(keyword));
          if (!hasPerf) {
            return { warning: 'Performance Testing: Consider performance testing for AI' };
          }
        }
        break;

      case 'deploymentTesting':
        if (platform === 'ai') {
          const deployKeywords = ['deployment testing', 'production testing', 'model serving', 'inference'];
          const hasDeploy = deployKeywords.some(keyword => content.includes(keyword));
          if (!hasDeploy) {
            return { warning: 'Deployment Testing: Consider deployment testing for AI' };
          }
        }
        break;

      default:
        // Unknown quality gate, no validation
        break;
    }

    return {};
  }


  /**
   * Error helper method
   */
  private error(message: string): any {
    return {
      success: false,
      error: message
    };
  }

  private success(message: string, data?: any): any {
    return {
      success: true,
      message,
      ...(data && { data })
    };
  }




  private generateFeatureNameExtractionRules(): any {
    return {
      "{{EXTRACTION_INSTRUCTIONS}}": "Extract a concise, meaningful feature name from the user input. Focus on the main product/feature/app/system name, not implementation details.",
      "{{FORMATTING_RULES}}": "Use kebab-case (lowercase-with-hyphens): e.g., 'task-management-system'. Max 4 words, prioritize nouns over verbs.",
      "{{EXAMPLES}}": "I want to build a task management system → task-management-system, Create a user authentication module → user-authentication-module, Build an e-commerce platform with React → ecommerce-platform, Need a dashboard for sales analytics → sales-analytics-dashboard, Develop a fitness tracking app → fitness-tracking-app",
      "{{FILTERING_RULES}}": "Remove common verbs/prepositions: want, need, build, create, make, develop, using, with, for, and, the, a, an. Keep nouns and meaningful terms only.",
      "{{VALIDATION_RULES}}": "Ensure kebab-case format, max 50 characters, fallback to 'untitled-feature' if extraction fails"
    };
  }

  /**
   * Format functional requirements as a proper numbered list with FR-XXX IDs
   */
  private formatFunctionalRequirements(requirementsText: string): string {
    if (!requirementsText || requirementsText.trim() === '') {
      return '1. **FR-001**: System shall provide basic functionality as specified by user requirements.';
    }

    // Split by lines and clean up
    const lines = requirementsText.split('\n').filter(line => line.trim());

    // If already properly formatted, return as-is
    if (lines.some(line => /^\d+\.\s*\*\*FR-\d{3}\*\*/.test(line.trim()))) {
      return requirementsText;
    }

    // Format each line as a numbered item with FR-XXX ID
    const formattedLines = lines.map((line, index) => {
      const requirementId = `FR-${String(index + 1).padStart(3, '0')}`;
      const cleanLine = line.replace(/^[-•*]\s*/, '').trim(); // Remove existing bullets

      // If line already has FR-XXX format, preserve it
      if (cleanLine.match(/^FR-\d{3}:/)) {
        return `${index + 1}. **${cleanLine.replace(':', '**:')}**`;
      }

      // Otherwise, add proper formatting
      return `${index + 1}. **${requirementId}**: ${cleanLine}`;
    });

    return formattedLines.join('\n');
  }



}