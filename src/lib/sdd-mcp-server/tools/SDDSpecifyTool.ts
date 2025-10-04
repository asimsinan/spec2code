/**
 * SDD Specify Tool
 * Implements the /specify command for creating feature specifications
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { SpecifyInputSchema, SpecifyErrorSchema } from '../schemas/mcp-tools.js';
import * as fs from 'fs';
import * as path from 'path';
import { RobustDatabaseService } from '../database/RobustDatabaseService.js';
import { SpecificationTemplate } from '../templates/SpecificationTemplate.js';
import { JsonRepairUtility } from '../utils/JsonRepairUtility.js';

export class SDDSpecifyTool {
  private basePath: string;
  private db: RobustDatabaseService;

  private specTemplate: SpecificationTemplate;

  constructor(basePath: string = process.cwd(), db?: RobustDatabaseService) {
    this.basePath = basePath;
    this.db = db || new RobustDatabaseService(path.join(basePath, 'sdd.db'));
    this.specTemplate = new SpecificationTemplate(this.db);
  }

  /**
   * Initialize database if it doesn't exist
   * This ensures the database is created in the project root where the user is working
   */
  private async initializeDatabaseIfNeeded(): Promise<void> {
    try {
      // Touch the database to ensure schema is created
      await this.db.get_all_features();
      
      // Install templates if needed
      await this.ensureTemplatesInstalled();
    } catch (error) {
      console.error('SDDSpecifyTool: Database initialization failed:', error);
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
      console.error('SDDSpecifyTool: Error checking/installing templates:', error);
    }
  }

  /**
   * Check if templates need to be installed
   */
  private async checkIfTemplatesNeeded(): Promise<boolean> {
    try {
      // Check if spec template exists
      const specTemplate = await this.db.get_spec_template('sdd-spec-perfect-v1');
      return !specTemplate;
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
      console.error('SDDSpecifyTool: Error installing templates:', error);
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
      console.error(`SDDSpecifyTool: Error installing template ${fileName}:`, error);
    }
  }

  getToolDefinition(): Tool {
    return {
      name: 'sdd_specify',
      description: 'Create a feature specification from user input. Generates spec.md in specs/ folder. This is a standalone tool - do not call other tools after completion.',
      inputSchema: {
        type: 'object',
        properties: {
          input: {
            type: 'string',
            description: 'Free-form feature description',
            minLength: 10,
            maxLength: 5000
          },
          featureName: {
            type: 'string',
            description: 'Optional feature name (will be generated from input if not provided)',
            minLength: 3,
            maxLength: 100
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
          featureName: {
            type: 'string',
            description: 'Feature name'
          },
          specPath: {
            type: 'string',
            description: 'Path to generated spec.md file'
          },
          constitutionalCompliant: {
            type: 'boolean',
            description: 'Whether specification is constitutional compliant'
          },
          violations: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of constitutional violations'
          },
          warnings: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of warnings'
          },
          nextStep: {
            type: 'string',
            description: 'Next step instructions or result content'
          },
          templateData: {
            type: 'object',
            description: 'The template data with AI directions for Cursor to fill'
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
      // Initialize database if needed (creates sdd.db in project root)
      await this.initializeDatabaseIfNeeded();
      
      // Validate input
      const validatedInput = SpecifyInputSchema.parse(input);
      // PROJECT_ROOT env var logged silently

      // If no featureName provided, get the most recent feature from database
      let featureName: string;
      let featureId: string;
      
      if (validatedInput.featureName) {
        // Use provided featureName
        featureName = validatedInput.featureName;
        featureId = this.createFeatureId(featureName);
      } else {
        // Get most recent feature from database
        const recentFeature = await this.getMostRecentFeature();
        if (recentFeature) {
          featureName = recentFeature.name;
          featureId = recentFeature.id;
        } else {
          // No features exist, extract from input
          featureName = this.extractFeatureName(validatedInput.input);
          featureId = this.createFeatureId(featureName);
        }
      }
      
      const platform = validatedInput.platform || 'web';
      const specsDir = path.join(this.basePath, 'specs');

      // Ensure specs directory exists
      if (!fs.existsSync(specsDir)) {
        fs.mkdirSync(specsDir, { recursive: true });
      }

      await this.createFeatureInDatabase(featureId, featureName, validatedInput.input);

      const fillResult = await this.specTemplate.fillSpecificationTemplate({
        userInput: validatedInput.input,
        featureName: featureName,
        platform: platform
      });

      if (!fillResult.success) {
        return this.error(`Failed to prepare specification template: ${fillResult.error}`);
      }

      // Validate constitutional gates compliance
      const gatesValidation = this.validateConstitutionalGates(platform, validatedInput.input, fillResult.data);
      if (!gatesValidation.valid) {
        return this.error(`Constitutional Gates Violation: ${gatesValidation.violations.join(', ')}. Please simplify your feature or document violations in Complexity Tracking.`);
      }
   
      // Note: Specification will be saved via sdd_db_filler tool after filling

      // Extract template information for dynamic instructions
      const templateData = fillResult.data;
      const constitutionalGates = templateData.constitutionalGates || {};
      const platformGates = templateData.platformGates || {};
      const qualityGates = templateData.qualityGates || {};
      const sddPrinciples = templateData.sddPrinciples || {};
 
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
🚨 CRITICAL: You MUST create a spec.md file in specs/spec.md

🚨 IMPORTANT: DO NOT call any other tools (sdd_plan, sdd_tasks, sdd_implement, etc.) after this. Only complete the specification creation task.

🚨 CRITICAL: DO NOT create todo lists, task lists, or tracking lists. This is specification creation only.

🚨 FORBIDDEN: Do NOT say "Now I'll create a todo list" or similar phrases. Do NOT call sdd_plan tool. This is SPECIFICATION CREATION ONLY.

1. FEATURE DETAILS:
   1.1. Feature Name: ${featureName}
   1.2. Platform: ${platform.toUpperCase()}

2. ENHANCED SDD TEMPLATE PROVIDED:The specification template has been prepared with complete SDD compliance:
   2.1. User input and context: "${validatedInput.input.replace(/"/g, '\\"')}"
   2.2. Platform-specific constitutional gates: ${platformSpecificGates.length > 0 ? platformSpecificGates.join(', ') : 'None'}
   2.3. Platform-specific quality gates: ${platformQualityGates.length > 0 ? platformQualityGates.join(', ') : 'None'}
   2.4. Applicable constitutional gates for ${platform}:
${constitutionalGatesList}
   2.5. Quality gates enforcement: ${Object.keys(qualityGates).join(', ')}
   2.6. SDD principles: ${Object.keys(sddPrinciples).join(', ')}
   2.7. Template version: ${templateData.sddVersion?.version || 'Unknown'}
   2.8. Placeholder content ({{...}}) ready for AI generation
   2.9. Structured template following complete SDD methodology

3. CURSOR AI TASKS (MANDATORY COMPLIANCE):
   4.1. Process the template data provided to generate comprehensive specification
   4.2. Replace placeholders ({{...}}) with generated content based on the specific instructions provided
   4.3. DO NOT create todo lists, task lists, or tracking lists - this is specification creation only
   4.4. DO NOT say "Now I'll create a todo list" or call sdd_plan tool - this is SPECIFICATION CREATION ONLY
   4.5. Follow the EXACT specification template structure:
      4.5.1. Feature Specification: [FEATURE NAME] header
      4.5.2. User Scenarios & Testing (mandatory) section
      4.5.3. Requirements (mandatory) with FR-001, FR-002, etc.
      4.5.4. Key Entities section if data involved
      4.5.5. Review & Acceptance Checklist
      4.5.6. Execution Status (auto-maintained during /specify)
   4.6. **MANDATORY TECH STACK EXTRACTION:**
      4.6.1. Extract ALL technologies mentioned in the user input
      4.6.2. Categorize technologies by type (frontend, backend, styling, charts, etc.)
      4.6.3. Create comprehensive tech stack requirements section
      4.6.4. Ensure NO technologies are added that weren't mentioned
      4.6.5. Ensure NO technologies are omitted that were mentioned
      4.6.6. **MANDATORY UI/INTERFACE STYLING**: Include styling frameworks and UI requirements
      4.6.7. **MANDATORY UI-API INTEGRATION**: Ensure frontend connects to backend APIs
   4.7. Enforce ALL applicable constitutional gates for ${platform} platform:
${constitutionalGatesList}
   4.8. Enforce platform-specific gates:
${platformGatesList}
   4.9. Enforce quality gates:
${qualityGatesList}
   4.10. Follow SDD principles:
${sddPrinciplesList}
   4.11. Use the detailed Cursor AI instructions provided in the template data
   4.12. MANDATORY FILE CREATION: Create the final spec.md file with filled content in specs/spec.md
      4.12.1. The file MUST be created in the correct location: specs/spec.md
      4.12.2. IMPORTANT: You must create the markdown file manually from the filled JSON template data using proper markdown formatting
      4.13.2. CRITICAL: The 'data' parameter must be a JSON object with these exact properties:
         4.13.2.1. feature_id: string
         4.13.2.2. template_id: string  
         4.13.2.3. content: JSON object (the filled template data as JSON, NOT markdown)
         4.13.2.4. ai_generated: true
      4.13.3. Do NOT pass data as a string or array. It must be a proper JSON object.
      4.13.4. IMPORTANT: Store the filled template data as JSON in the content field, not as markdown text.

5. TEMPLATE DATA FOR AI PROCESSING:
${JSON.stringify(fillResult.data, null, 2)}

6. MARKDOWN CONVERSION GUIDE:
   To create the spec.md file from the JSON template data above, follow this structure:
   
   # [template_data.title]
   
   ## Metadata
   - Created: [template_data.metadata.created]
   - Status: [template_data.metadata.status]
   - Input: [template_data.metadata.input]
   
   ## User Scenarios & Testing
   ### Primary User Story
   [template_data.userScenarios.primaryUserStory.content]
   
   ### Acceptance Scenarios
   [template_data.userScenarios.acceptanceScenarios.content]
   
   ### Edge Cases
   [template_data.userScenarios.edgeCases.content]
   
   ## Requirements
   ### Functional Requirements
   [template_data.requirements.functionalRequirements.content]
   
   ### Key Entities
   [template_data.requirements.keyEntities.content]
   
   ### Database Requirements
   [template_data.requirements.databaseRequirements.content]
   
   ### Technology Stack Requirements
   [template_data.requirements.technologyStack.content]
   
   ## API Specification (API-First Approach)
   ### API Endpoints
   [template_data.apiSpecification.endpoints.content]
   
   ### API Contracts
   [template_data.apiSpecification.contracts.content]
   
   ### OpenAPI Specification
   [template_data.apiSpecification.openApiSpec.content]
   
   ## Constitutional Gates
   [Convert template_data.constitutionalGates to markdown sections with proper formatting]
   
   ## Quality Gates (Enforcement Rules)
   [Convert template_data.qualityGates to markdown sections with proper formatting]
   
   ## Complexity Tracking
   [template_data.complexityTracking.description]
   [template_data.complexityTracking.table.rows]
   
   ## SDD Principles
   [Convert template_data.sddPrinciples to markdown list]
   
   ### CRITICAL FORMATTING RULES:
   - Always use blank lines between sections
   - For Constitutional Gates and Quality Gates, format each gate as:
     ### [Gate Title]
     **Description:** [Gate description]
     
     **Status:** [Gate status with checkmark]
   - Ensure "Status:" always appears on a new line after "Description:"
   - Use proper markdown formatting with **bold** for labels
   - Add blank lines between different gates for readability

7. FINAL REMINDER: DO NOT call sdd_plan, sdd_tasks, sdd_implement, or any other tools. Only complete the specification creation task as described above.

8. Mandatory Last Step: Use sdd_db_filler tool to save the filled specification to database with this exact data structure:
      8.1. Data structure:
         {
           "operation": "upsert",
           "table": "specifications",
           "data": {
             "feature_id": "${featureId}",
             "template_id": "sdd-spec-perfect-v1",
            "content": fillResult.data,
             "ai_generated": true
           }
         }
`;

      const outputData = {
        success: true,
        nextStep: successMessage
      };
      return outputData;
    } catch (error) {
      // Return error response
      const errorOutput = SpecifyErrorSchema.parse({
        success: false,
        error: 'SPECIFICATION_CREATION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: {
          input: input?.input || 'Unknown input',
          featureName: input?.featureName || 'Unknown feature name'
        }
      });

      return errorOutput;
    }
  }

  private createFeatureId(featureName: string): string {
    const timestamp = Date.now();
    // Sanitize feature name for ID (replace spaces and special chars with hyphens)
    const sanitizedName = featureName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return `${sanitizedName}-${timestamp}`;
  }

  private async createFeatureInDatabase(featureId: string, featureName: string, input: string): Promise<void> {
    // 🚀 INTELLIGENT CLI DETECTION: Detect CLI requirements
    const cliDetection = this.detectCLIRequirements(input);

    // 🚀 INTELLIGENT LIBRARY DETECTION: Detect library requirements
    const libraryDetection = this.detectLibraryRequirements(input);

    const featureData = {
      id: featureId,
      name: featureName,
      cliRequired: cliDetection.requiresCLI,
      cliDetected: cliDetection.hasCLI,
      cliConfidence: cliDetection.confidence,
      cliComplexity: cliDetection.cliComplexity,
      libraryRequired: libraryDetection.requiresLibrary,
      libraryDetected: libraryDetection.hasLibrary,
      libraryConfidence: libraryDetection.confidence,
      libraryComplexity: libraryDetection.libraryComplexity
    };

    await this.db.create_feature(featureData);
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
    if (projectCount > 5) {
      violations.push(`Simplicity Gate Violation: ${projectCount} projects exceed limit of 5`);
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

  private hasLibraryFirstApproach(userInput: string): boolean {
    const detection = this.detectLibraryRequirements(userInput);
    return detection.hasLibrary;
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
   * Determine platform from specification and plan data
   */
  private determinePlatform(specData: any, planData: any): string {
    // Try to determine platform from various sources
    // Note: specData and planData contain raw markdown content, not JSON

    // Try to extract platform from markdown content
    if (planData?.content) {
      const planContent = planData.content.toLowerCase();
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

    if (specData?.content) {
      const specContent = specData.content.toLowerCase();
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

  /**
   * Error helper method
   */
  private error(message: string): any {
    return {
      success: false,
      error: message
    };
  }



  private async getMostRecentFeature(): Promise<{ id: string; name: string } | null> {
    try {
      const features = await this.db.get_all_features();
      if (features.length === 0) {
        return null;
      }
      
     
      
      return {
        id: features[0].id,
        name: features[0].name
      };
    } catch (error) {
      console.error('[SDDSpecifyTool] Error getting most recent feature:', error);
      return null;
    }
  }

  private extractFeatureName(input: string): string {
    // Simple feature name extraction - take first few words and make them kebab-case
    const words = input.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .slice(0, 3)
      .filter(word => word.length > 0);

    return words.join('-') || 'untitled-feature';
  }



}