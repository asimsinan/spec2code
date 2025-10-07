import { BaseTemplate } from './BaseTemplate.js';
import { JsonRepairUtility } from '../utils/JsonRepairUtility.js';

export class SpecificationTemplate extends BaseTemplate {
  constructor(db: any) {
    super(db, 'spec_templates', 'specifications');
  }


  /**
   * Get the perfect template from database
   */
  async getPerfectTemplate(): Promise<any> {
    try {
      const template = await this.db.get_spec_template_robust('sdd-spec-perfect-v1');
      if (!template) {
        return null;
      }
      return template;
    } catch (error) {
      console.error('Error getting perfect template:', error);
      return null;
    }
  }

  /**
   * Fill the specification template with user data
   */
  async fillSpecificationTemplate(options: {
    userInput: string;
    featureName: string;
    platform?: string;
  }): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      // Get the perfect template from database
      const templateRecord = await this.db.get_spec_template_robust('sdd-spec-perfect-v1');

      if (!templateRecord) {
        return {
          success: false,
          error: 'Perfect SDD template not found in database'
        };
      }

      // Extract and parse the template_data from the template record
      const templateDataString = templateRecord.template_data;
      if (!templateDataString) {
        return {
          success: false,
          error: 'Template data not found in template record'
        };
      }

      // Parse the JSON string to get the actual template object using JsonRepairUtility
      const template = JsonRepairUtility.extractDbJsonContent(templateDataString, 'SpecificationTemplate');
      if (!template) {
        return {
          success: false,
          error: 'Failed to parse template data using JsonRepairUtility'
        };
      }

      // Fill the template with user input and Cursor AI instructions (no AI generation)
      const filledTemplate = this.fillTemplateWithUserInput(template, options);
      
      // Validate template structure AFTER filling
      const validation = await this.validateTemplateStructure(filledTemplate);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Template validation failed: ${validation.errors.join(', ')}`
        };
      }
      
      // Apply platform-specific gate filtering
      const platformFilteredTemplate = this.applyPlatformGates(filledTemplate, options.platform || 'web');
      
      return {
        success: true,
        data: platformFilteredTemplate
      };
    } catch (error) {
      console.error('Error filling specification template:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Fill template with user input and Cursor AI instructions (no AI generation)
   */
  private fillTemplateWithUserInput(template: any, options: any): any {
    const filledTemplate = JSON.parse(JSON.stringify(template)); // Deep copy
    const platform = options.platform || 'web';
    
    // Fill basic placeholders with actual values
    filledTemplate.title = filledTemplate.title.replace('{{FEATURE_NAME}}', options.featureName);
    
    filledTemplate.metadata.input = options.userInput;
    filledTemplate.metadata.created = new Date().toISOString().split('T')[0];
    filledTemplate.metadata.platform = platform;
    
    // 🚀 CLI FEATURE DETECTION: Detect CLI requirements from user input
    const cliDetection = this.detectCLIRequirements(options.userInput);
    filledTemplate.metadata.cliDetection = cliDetection;
    
    // 🚀 LIBRARY FEATURE DETECTION: Detect library requirements from user input
    const libraryDetection = this.detectLibraryRequirements(options.userInput);
    filledTemplate.metadata.libraryDetection = libraryDetection;
    
    // Get platform-specific instructions
    const platformInstructions = this.getPlatformSpecificInstructions(options.userInput, options.featureName, platform, cliDetection, libraryDetection);
    
    // Add Cursor AI instructions for content generation
    filledTemplate._cursor_ai_instructions = {
      userInput: options.userInput,
      featureName: options.featureName,
      platform: platform,
      cliDetection: cliDetection,
      instructions: platformInstructions.instructions,
      placeholders: platformInstructions.placeholders
    };
    
    return filledTemplate;
  }

  /**
   * Detect library requirements from user input
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
   * Detect CLI requirements from user input
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
      hasCLI: confidence > 0.2,
      confidence,
      cliElements,
      cliPatterns: detectedPatterns,
      cliComplexity: complexity as 'simple' | 'moderate' | 'complex',
      requiresCLI: confidence > 0.4
    };
  }

  /**
   * Get platform-specific Cursor AI instructions
   */
  private getPlatformSpecificInstructions(userInput: string, featureName: string, platform: string, cliDetection?: any, libraryDetection?: any): any {
    const baseInstructions = {
      // User Scenarios (common to all platforms)
      primaryUserStory: `Generate a primary user story for: ${userInput}. Focus on the main value proposition and user benefit.`,
      acceptanceScenarios: `Generate acceptance scenarios for: ${userInput}. Use Given-When-Then format. Include happy path, error cases, and edge cases.`,
      edgeCases: `Generate edge cases for: ${userInput}. Consider boundary conditions, error states, and unusual user behaviors.`,
      
      // Requirements (common to all platforms)
      functionalRequirements: `Generate functional requirements for: ${userInput}. Use FR-001, FR-002 format. Be specific about what the system must do.`,
      keyEntities: `Identify key data entities for: ${userInput}. Include their attributes and relationships. Only include if the feature involves data.`,
      databaseRequirements: `Define database requirements for: ${userInput}. Choose appropriate database type: PostgreSQL for relational data with ACID compliance, MySQL for web applications, MongoDB for document data, Redis for caching. For appointment schedulers: PostgreSQL with proper indexing for time-based queries, real-time updates, and data integrity. Include data volume, performance, consistency, security, scalability, and backup requirements.`,
      
      // API-First requirements
      apiEndpoints: `Define RESTful/GraphQL API endpoints for: ${userInput}. Include GET, POST, PUT, DELETE operations with clear descriptions, parameters, and responses.`,
      apiContracts: `Define API contracts for: ${userInput}. Include request/response schemas, validation rules, and error handling.`,
      openApiSpec: `Generate OpenAPI 3.0 specification for: ${userInput}. Include authentication, all endpoints, schemas, and examples.`,
      apiVersioning: `Define API versioning strategy for: ${userInput}. Include versioning method, lifecycle, and migration approach.`,
      apiTesting: `Define API testing strategy for: ${userInput}. Include contract testing, integration testing, and performance requirements.`,
      
      // 🚀 CLI Feature Detection
      cliFeatureDetection: cliDetection ? 
        `CLI REQUIREMENTS DETECTED for ${userInput}: 
        - CLI Status: ${cliDetection.hasCLI ? 'REQUIRED' : 'NOT REQUIRED'} (confidence: ${(cliDetection.confidence * 100).toFixed(1)}%)
        - CLI Complexity: ${cliDetection.cliComplexity}
        - Detected Keywords: ${cliDetection.cliElements.join(', ') || 'None'}
        - Detected Patterns: ${cliDetection.cliPatterns.join(', ') || 'None'}
        - Implementation: ${cliDetection.requiresCLI ? 'Include CLI components with architectural separation' : 'Focus on core functionality without CLI components'}` :
        `No CLI requirements detected for ${userInput}. Focus on core functionality without CLI components.`,
      
      // 🚀 LIBRARY Feature Detection
      libraryFeatureDetection: libraryDetection ? 
        `LIBRARY REQUIREMENTS DETECTED for ${userInput}: 
        - Library Status: ${libraryDetection.hasLibrary ? 'REQUIRED' : 'NOT REQUIRED'} (confidence: ${(libraryDetection.confidence * 100).toFixed(1)}%)
        - Library Complexity: ${libraryDetection.libraryComplexity}
        - Detected Keywords: ${libraryDetection.libraryElements.join(', ') || 'None'}
        - Detected Patterns: ${libraryDetection.libraryPatterns.join(', ') || 'None'}
        - Implementation: ${libraryDetection.requiresLibrary ? 'Implement as standalone library with thin UI veneer' : 'Consider library approach for better reusability'}` :
        `No library requirements detected for ${userInput}. Consider library approach for better reusability and testability.`,
      
      // Common gates
      simplicityGate: `Validate that ${userInput} can be implemented with ≤10 projects. If not, suggest simplifications.`,
      testFirstGate: `Plan test-first approach for ${userInput}: Contract → Integration → E2E → Unit → Implementation → UI-API Integration.`,
      integrationFirstTestingGate: `Plan integration-first testing for ${userInput} using real dependencies. Justify any mocks needed.`,
      antiAbstractionGate: `Plan single domain model approach for ${userInput}. Avoid DTO/Repository/Unit-of-Work unless necessary.`,
      traceabilityGate: `Ensure every line of code for ${userInput} can trace back to numbered requirements (FR-XXX).`,
      
      // Quality Gates
      beforeImplementation: `Verify ${userInput} has spec.md, plan.md, and tests written first.`,
      duringImplementation: `Follow Red → Green → Refactor for ${userInput}. Keep app code thin over library.`,
      qualityChecks: `Ensure specification is complete and ready for planning for ${userInput}.`,
      
      // Complexity Tracking
      complexityTracking: `If any constitutional gate is violated for ${userInput}, document: 1) What was violated, 2) Why it was necessary, 3) Why simpler alternatives won't work.`
    };

    // Platform-specific instructions
    const platformSpecificInstructions = {
      mobile: {
        nativeFirstGate: `Design ${userInput} using native iOS/Android patterns and components. Avoid cross-platform frameworks unless justified.`,
        offlineFirstGate: `Ensure ${userInput} works offline with local data storage and sync when online.`,
        performanceGate: `Optimize ${userInput} for 60fps UI, <3s launch time, and <100MB memory usage.`,
        accessibilityGate: `Implement full accessibility support for ${userInput}: screen reader, touch targets, voice control.`,
        securityGate: `Implement security for ${userInput}: data encryption, secure storage, biometric authentication, permission handling.`,
        storeComplianceGate: `Ensure ${userInput} meets App Store and Google Play guidelines for review approval.`,
        apiFirstGate: `Design mobile-optimized APIs for ${userInput}: efficient data transfer, offline sync, push notifications, and mobile-specific endpoints.`
      },
      web: {
        progressiveEnhancementGate: `Build ${userInput} to work without JavaScript, then enhance with JS. Graceful degradation.`,
        responsiveDesignGate: `Design ${userInput} mobile-first with breakpoints for tablet and desktop. All screen sizes supported.`,
        performanceGate: `Optimize ${userInput} for <3s load time, <100ms interaction response, and Core Web Vitals.`,
        accessibilityGate: `Implement WCAG 2.1 AA compliance for ${userInput}: keyboard navigation, screen readers, color contrast.`,
        securityGate: `Implement web security for ${userInput}: HTTPS, CSP, XSS/CSRF protection, secure headers.`,
        browserCompatibilityGate: `Ensure ${userInput} works on Chrome, Firefox, Safari, and Edge. 95% of target browsers supported.`,
        apiFirstGate: `Design web-optimized APIs for ${userInput}: RESTful endpoints, JSON responses, CORS support, and progressive enhancement fallbacks.`
      },
      desktop: {
        nativeIntegrationGate: `Integrate ${userInput} with OS features: menus, notifications, file associations, system preferences.`,
        performanceGate: `Optimize ${userInput} for <2s startup time and <50MB base memory usage.`,
        accessibilityGate: `Implement OS accessibility features for ${userInput}: screen readers, keyboard shortcuts, high contrast.`,
        securityGate: `Implement desktop security for ${userInput}: code signing, sandboxing, auto-updates, secure storage.`,
        distributionGate: `Plan installer, auto-updates, and uninstaller for ${userInput}. Code signing and update mechanisms.`,
        cliInterfaceGate: cliDetection?.requiresCLI ? 
          `Design CLI interface for ${userInput} with --json mode, stdin/stdout, stderr errors. CLI complexity: ${cliDetection.cliComplexity}. Include architectural separation between GUI and CLI components.` :
          `CLI interface not required for ${userInput}. Focus on GUI implementation.`
      },
      backend: {
        apiFirstGate: `Design RESTful/GraphQL APIs for ${userInput} with OpenAPI specs, documentation, and versioning.`,
        databaseGate: `Design database schema for ${userInput}: proper indexing, migrations, data integrity, performance.`,
        performanceGate: `Optimize ${userInput} for <100ms response time, horizontal scaling, and high throughput.`,
        securityGate: `Implement backend security for ${userInput}: authentication, authorization, input validation, rate limiting.`,
        monitoringGate: `Implement monitoring for ${userInput}: logging, metrics, health checks, alerting, observability.`,
        cliInterfaceGate: cliDetection?.requiresCLI ? 
          `Design CLI tools for ${userInput}: management, debugging, deployment, with --json mode. CLI complexity: ${cliDetection.cliComplexity}. Include architectural separation between API and CLI components.` :
          `CLI tools not required for ${userInput}. Focus on API implementation.`
      },
      ai: {
        dataQualityGate: `Ensure data quality for ${userInput}: clean, validated, representative datasets with preprocessing.`,
        modelPerformanceGate: `Optimize model performance for ${userInput}: accuracy, precision, recall, F1-score metrics.`,
        reproducibilityGate: `Ensure reproducibility for ${userInput}: deterministic training, version control, experiment tracking.`,
        ethicsGate: `Implement ethical AI for ${userInput}: bias detection, fairness, explainability, privacy protection.`,
        deploymentGate: `Plan model deployment for ${userInput}: serving, monitoring, rollback, A/B testing, production readiness.`,
        cliInterfaceGate: cliDetection?.requiresCLI ? 
          `Design CLI tools for ${userInput}: training, evaluation, inference, with --json mode. CLI complexity: ${cliDetection.cliComplexity}. Include architectural separation between ML pipeline and CLI components.` :
          `CLI tools not required for ${userInput}. Focus on ML pipeline implementation.`
      }
    };

    // Merge base instructions with platform-specific ones
    const instructions = { ...baseInstructions, ...platformSpecificInstructions[platform] };

    // Generate placeholders based on platform
    const placeholders = this.generatePlatformPlaceholders(platform);

    return { instructions, placeholders };
  }

  /**
   * Generate platform-specific placeholders
   */
  private generatePlatformPlaceholders(platform: string): any {
    const basePlaceholders = {
      // User Scenarios
      '{{PRIMARY_USER_STORY}}': 'Replace with generated primary user story',
      '{{ACCEPTANCE_SCENARIOS}}': 'Replace with generated acceptance scenarios (Given-When-Then format)',
      '{{EDGE_CASES}}': 'Replace with generated edge cases',
      
      // Requirements
        '{{FUNCTIONAL_REQUIREMENTS}}': 'Replace with generated functional requirements (FR-001, FR-002 format)',
        '{{KEY_ENTITIES}}': 'Replace with generated key entities (only if data involved)',
        '{{DATABASE_REQUIREMENTS}}': 'Replace with generated database requirements (PostgreSQL for relational data, MongoDB for documents, Redis for caching)',
        '{{TECH_STACK_REQUIREMENTS}}': 'Replace with extracted technology stack requirements from user input',
      
      // API-First placeholders
      '{{API_ENDPOINTS}}': 'Replace with generated API endpoints (RESTful/GraphQL)',
      '{{API_CONTRACTS}}': 'Replace with generated API contracts (request/response schemas)',
      '{{OPENAPI_SPEC}}': 'Replace with generated OpenAPI 3.0 specification',
      '{{API_VERSIONING}}': 'Replace with generated API versioning strategy',
      '{{API_TESTING}}': 'Replace with generated API testing strategy',
      
      // 🚀 CLI Feature Detection placeholders
      '{{CLI_FEATURE_DETECTION}}': 'Replace with CLI feature detection results and requirements',
      '{{CLI_REQUIREMENTS}}': 'Replace with CLI-specific requirements if CLI is detected',
      '{{CLI_ARCHITECTURAL_SEPARATION}}': 'Replace with CLI architectural separation guidelines',
      
      // Common gates
      '{{SIMPLICITY_GATE_CHECK}}': 'Replace with simplicity gate validation',
      '{{TEST_FIRST_GATE_CHECK}}': 'Replace with test-first gate validation',
      '{{INTEGRATION_FIRST_TESTING_GATE_CHECK}}': 'Replace with integration-first testing gate validation',
      '{{ANTI_ABSTRACTION_GATE_CHECK}}': 'Replace with anti-abstraction gate validation',
      '{{TRACEABILITY_GATE_CHECK}}': 'Replace with traceability gate validation',
      
      // Complexity Tracking
      '{{COMPLEXITY_TRACKING_ROWS}}': 'Replace with complexity tracking table rows if any gates are violated'
    };

    const platformPlaceholders = {
      mobile: {
        '{{NATIVE_FIRST_GATE_CHECK}}': 'Replace with native-first gate validation',
        '{{OFFLINE_FIRST_GATE_CHECK}}': 'Replace with offline-first gate validation',
        '{{PERFORMANCE_GATE_CHECK}}': 'Replace with performance gate validation (60fps, <3s launch, <100MB)',
        '{{ACCESSIBILITY_GATE_CHECK}}': 'Replace with accessibility gate validation (screen reader, touch)',
        '{{SECURITY_GATE_CHECK}}': 'Replace with security gate validation (encryption, secure storage)',
        '{{STORE_COMPLIANCE_GATE_CHECK}}': 'Replace with store compliance gate validation',
        '{{API_FIRST_GATE_CHECK}}': 'Replace with API-first gate validation (mobile-optimized APIs)'
      },
      web: {
        '{{PROGRESSIVE_ENHANCEMENT_GATE_CHECK}}': 'Replace with progressive enhancement gate validation',
        '{{RESPONSIVE_DESIGN_GATE_CHECK}}': 'Replace with responsive design gate validation',
        '{{PERFORMANCE_GATE_CHECK}}': 'Replace with performance gate validation (<3s load, <100ms interaction)',
        '{{ACCESSIBILITY_GATE_CHECK}}': 'Replace with accessibility gate validation (WCAG 2.1 AA)',
        '{{SECURITY_GATE_CHECK}}': 'Replace with security gate validation (HTTPS, CSP, XSS/CSRF)',
        '{{BROWSER_COMPATIBILITY_GATE_CHECK}}': 'Replace with browser compatibility gate validation',
        '{{API_FIRST_GATE_CHECK}}': 'Replace with API-first gate validation (web-optimized APIs)'
      },
      desktop: {
        '{{NATIVE_INTEGRATION_GATE_CHECK}}': 'Replace with native integration gate validation',
        '{{PERFORMANCE_GATE_CHECK}}': 'Replace with performance gate validation (<2s startup, <50MB)',
        '{{ACCESSIBILITY_GATE_CHECK}}': 'Replace with accessibility gate validation (OS features)',
        '{{SECURITY_GATE_CHECK}}': 'Replace with security gate validation (code signing, sandboxing)',
        '{{DISTRIBUTION_GATE_CHECK}}': 'Replace with distribution gate validation',
        '{{CLI_INTERFACE_GATE_CHECK}}': 'Replace with CLI interface gate validation'
      },
      backend: {
        '{{API_FIRST_GATE_CHECK}}': 'Replace with API-first gate validation',
        '{{DATABASE_GATE_CHECK}}': 'Replace with database gate validation',
        '{{PERFORMANCE_GATE_CHECK}}': 'Replace with performance gate validation (<100ms response)',
        '{{SECURITY_GATE_CHECK}}': 'Replace with security gate validation (auth, validation)',
        '{{MONITORING_GATE_CHECK}}': 'Replace with monitoring gate validation',
        '{{CLI_INTERFACE_GATE_CHECK}}': 'Replace with CLI interface gate validation'
      },
      ai: {
        '{{DATA_QUALITY_GATE_CHECK}}': 'Replace with data quality gate validation',
        '{{MODEL_PERFORMANCE_GATE_CHECK}}': 'Replace with model performance gate validation',
        '{{REPRODUCIBILITY_GATE_CHECK}}': 'Replace with reproducibility gate validation',
        '{{ETHICS_GATE_CHECK}}': 'Replace with ethics gate validation',
        '{{DEPLOYMENT_GATE_CHECK}}': 'Replace with deployment gate validation',
        '{{CLI_INTERFACE_GATE_CHECK}}': 'Replace with CLI interface gate validation'
      }
    };

    return { ...basePlaceholders, ...platformPlaceholders[platform] };
  }



  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Apply platform-specific gate filtering
   */
  private applyPlatformGates(template: any, platform: string): any {
    const filteredTemplate = JSON.parse(JSON.stringify(template)); // Deep copy
    
    if (!template.platformGates || !template.platformGates[platform]) {
      return filteredTemplate; // Return unfiltered if no platform gates defined
    }
    
    const platformGates = template.platformGates[platform];
    // const allowedGates = platformGates.gates || []; // Unused variable
    
    // Filter constitutional gates based on platform
    if (filteredTemplate.constitutionalGates) {
      const filteredConstitutionalGates: any = {};
      
      Object.entries(filteredTemplate.constitutionalGates).forEach(([key, gate]: [string, any]) => {
        if (gate.platforms && gate.platforms.includes(platform)) {
          filteredConstitutionalGates[key] = gate;
        }
      });
      
      filteredTemplate.constitutionalGates = filteredConstitutionalGates;
    }
    
    // Filter quality gates based on platform
    if (filteredTemplate.qualityGates && platformGates.qualityGates) {
      const filteredQualityGates: any = {};
      
      platformGates.qualityGates.forEach((qualityGate: string) => {
        if (filteredTemplate.qualityGates[qualityGate]) {
          filteredQualityGates[qualityGate] = filteredTemplate.qualityGates[qualityGate];
        }
      });
      
      filteredTemplate.qualityGates = filteredQualityGates;
    }
    
    // Update platform in metadata
    if (filteredTemplate.metadata) {
      filteredTemplate.metadata.platform = platform;
    }
    
    return filteredTemplate;
  }

 

  // Implement abstract methods from BaseTemplate
  async fillTemplateWithAI(template: any, options: any): Promise<{
    success: boolean;
    data: any;
    templateId: string;
    aiGenerated: boolean;
    errors?: string[];
    warnings?: string[];
  }> {
    const result = await this.fillSpecificationTemplate(options);
    return {
      success: result.success,
      data: result.data || {},
      templateId: 'sdd-spec-perfect-v1',
      aiGenerated: true,
      errors: result.success ? undefined : [result.error || 'Unknown error']
    };
  }

  async validateTemplateStructure(templateData: any): Promise<any> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Basic structure validation
    if (!templateData.title) {
      errors.push('Template must have a title');
    }
    if (!templateData.metadata) {
      errors.push('Template must have metadata');
    }
    if (!templateData.userScenarios) {
      errors.push('Template must have userScenarios');
    }
    if (!templateData.requirements) {
      errors.push('Template must have requirements');
    }
    
    // Platform gates validation
    if (!templateData.platformGates) {
      errors.push('Template must have platformGates');
    } else {
      const requiredPlatforms = ['mobile', 'web', 'desktop', 'backend', 'ai'];
      const missingPlatforms = requiredPlatforms.filter(platform => !templateData.platformGates[platform]);
      if (missingPlatforms.length > 0) {
        errors.push(`Template missing platform gates for: ${missingPlatforms.join(', ')}`);
      }
    }
    
    // Enhanced SDD structure validation
    if (!templateData.constitutionalGates) {
      errors.push('Template must have constitutionalGates');
    } else {
      // Check for common gates that should exist for all platforms
      const commonGates = ['simplicityGate', 'testFirstGate', 'integrationFirstTestingGate', 'antiAbstractionGate', 'traceabilityGate'];
      const missingCommonGates = commonGates.filter(gate => !templateData.constitutionalGates[gate]);
      if (missingCommonGates.length > 0) {
        errors.push(`Template missing common constitutional gates: ${missingCommonGates.join(', ')}`);
      }
      
      // Check that each gate has platform information
      Object.entries(templateData.constitutionalGates).forEach(([key, gate]: [string, any]) => {
        if (!gate.platforms || !Array.isArray(gate.platforms)) {
          warnings.push(`Constitutional gate ${key} missing platform information`);
        }
      });
    }
    
    if (!templateData.qualityGates) {
      errors.push('Template must have qualityGates');
    }
    
    if (!templateData.complexityTracking) {
      errors.push('Template must have complexityTracking');
    }
    
    if (!templateData.sddPrinciples) {
      errors.push('Template must have sddPrinciples');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  async generateMarkdownFromData(filledData: any): Promise<string> {
    const data = filledData.content || filledData;
    
    // Check if this is a template with Cursor AI instructions
    if (data._cursor_ai_instructions) {
      return this.generateTemplateMarkdown(data);
    }
    
    // Otherwise, generate regular markdown for enhanced template
    return this.generateRegularMarkdown(data);
  }

  /**
   * Generate regular markdown for enhanced template
   */
  private generateRegularMarkdown(data: any): string {
    const platform = data.metadata?.platform || 'web';
    
    return `# ${data.title}

**Created**: ${data.metadata.created}  
**Status**: ${data.metadata.status}  
**Platform**: ${platform.toUpperCase()}  
**Input**: User description: "${data.metadata.input}"

## User Scenarios & Testing (mandatory)

### Primary User Story
${data.userScenarios.primaryUserStory.content}

### Acceptance Scenarios
${data.userScenarios.acceptanceScenarios}

### Edge Cases
${data.userScenarios.edgeCases}

## Requirements (mandatory)

### Functional Requirements
${data.requirements.functionalRequirements}

### Key Entities (if the feature involves data)
${data.requirements.keyEntities}

### Technology Stack Requirements
${data.requirements.technologyStack?.content || '{{TECH_STACK_REQUIREMENTS}}'}

## API Specification (API-First Approach)

### API Endpoints
${data.apiSpecification?.endpoints?.content || '{{API_ENDPOINTS}}'}

### API Contracts
${data.apiSpecification?.contracts?.content || '{{API_CONTRACTS}}'}

### OpenAPI Specification
${data.apiSpecification?.openApiSpec?.content || '{{OPENAPI_SPEC}}'}

### API Versioning Strategy
${data.apiSpecification?.versioning?.content || '{{API_VERSIONING}}'}

### API Testing Strategy
${data.apiSpecification?.testing?.content || '{{API_TESTING}}'}

## Constitutional Gates (${platform.toUpperCase()} Platform)

${this.generatePlatformGatesMarkdown(data.constitutionalGates, platform)}

## Quality Gates (Enforcement Rules)

### Before ANY Implementation
${data.qualityGates?.beforeImplementation?.items?.map(item => `- [ ] ${item}`).join('\n') || '- [ ] Quality gates not defined'}

### During Implementation
${data.qualityGates?.duringImplementation?.items?.map(item => `- [ ] ${item}`).join('\n') || '- [ ] Quality gates not defined'}

### Quality Checks
${data.qualityGates?.qualityChecks?.items?.map(item => `- [ ] ${item}`).join('\n') || '- [ ] Quality gates not defined'}

## Review & Acceptance Checklist

### Content Quality
${data.reviewChecklist?.contentQuality?.items?.map(item => `- [ ] ${item}`).join('\n') || '- [ ] Review checklist not defined'}

### Requirement Completeness
${data.reviewChecklist?.requirementCompleteness?.items?.map(item => `- [ ] ${item}`).join('\n') || '- [ ] Review checklist not defined'}

### Constitutional Compliance
${data.reviewChecklist?.constitutionalCompliance?.items?.map(item => `- [ ] ${item}`).join('\n') || '- [ ] Review checklist not defined'}

## Complexity Tracking
${data.complexityTracking?.description || 'Complexity tracking not defined'}

| Violation | Justification | Simpler Alternative Rejected |
|-----------|---------------|------------------------------|
| ${data.complexityTracking?.table?.rows || 'No violations'} |

---
## Execution Status (auto-maintained during /specify)
${data.executionStatus?.items?.map(item => `- [ ] ${item}`).join('\n') || '- [ ] Execution status not defined'}
`;
  }

  /**
   * Generate markdown from template with Cursor AI instructions
   */
  private generateTemplateMarkdown(data: any): string {
    const instructions = data._cursor_ai_instructions;
    const platform = instructions.platform || 'web';
    
    return `# ${data.title}

**Created**: ${data.metadata.created}  
**Status**: ${data.metadata.status}  
**Platform**: ${platform.toUpperCase()}  
**Input**: User description: "${data.metadata.input}"

## 🚀 CLI Feature Detection

${instructions.cliDetection ? 
  `**CLI Status**: ${instructions.cliDetection.hasCLI ? 'REQUIRED' : 'NOT REQUIRED'} (confidence: ${(instructions.cliDetection.confidence * 100).toFixed(1)}%)  
**CLI Complexity**: ${instructions.cliDetection.cliComplexity}  
**Detected Keywords**: ${instructions.cliDetection.cliElements.join(', ') || 'None'}  
**Detected Patterns**: ${instructions.cliDetection.cliPatterns.join(', ') || 'None'}  
**Implementation**: ${instructions.cliDetection.requiresCLI ? 'Include CLI components with architectural separation' : 'Focus on core functionality without CLI components'}` :
  'No CLI requirements detected. Focus on core functionality without CLI components.'}

## 🚀 LIBRARY Feature Detection

${instructions.libraryDetection ? 
  `**Library Status**: ${instructions.libraryDetection.hasLibrary ? 'REQUIRED' : 'NOT REQUIRED'} (confidence: ${(instructions.libraryDetection.confidence * 100).toFixed(1)}%)  
**Library Complexity**: ${instructions.libraryDetection.libraryComplexity}  
**Detected Keywords**: ${instructions.libraryDetection.libraryElements.join(', ') || 'None'}  
**Detected Patterns**: ${instructions.libraryDetection.libraryPatterns.join(', ') || 'None'}  
**Implementation**: ${instructions.libraryDetection.requiresLibrary ? 'Implement as standalone library with thin UI veneer' : 'Consider library approach for better reusability'}` :
  'No library requirements detected. Consider library approach for better reusability and testability.'}

## Cursor AI Instructions

**User Input**: ${instructions.userInput}  
**Feature Name**: ${instructions.featureName}  
**Platform**: ${platform.toUpperCase()}

### Instructions for Content Generation:

#### User Scenarios
1. **Primary User Story**: ${instructions.instructions.primaryUserStory}
2. **Acceptance Scenarios**: ${instructions.instructions.acceptanceScenarios}
3. **Edge Cases**: ${instructions.instructions.edgeCases}

#### Requirements
4. **Functional Requirements**: ${instructions.instructions.functionalRequirements}
5. **Key Entities**: ${instructions.instructions.keyEntities}

#### 🚀 CLI Feature Detection
6. **CLI Feature Detection**: ${instructions.instructions.cliFeatureDetection}

#### 🚀 LIBRARY Feature Detection
7. **LIBRARY Feature Detection**: ${instructions.instructions.libraryFeatureDetection}

#### Constitutional Gates (${platform.toUpperCase()} Platform Compliance)
${this.generatePlatformInstructionsMarkdown(instructions.instructions, platform)}

#### Quality Gates
13. **Before Implementation**: ${instructions.instructions.beforeImplementation}
14. **During Implementation**: ${instructions.instructions.duringImplementation}
15. **Quality Checks**: ${instructions.instructions.qualityChecks}

#### Complexity Tracking
16. **Complexity Tracking**: ${instructions.instructions.complexityTracking}

---

## Template Structure (Replace placeholders with generated content)

### User Scenarios & Testing (mandatory)

#### Primary User Story
${data.userScenarios.primaryUserStory.content}

#### Acceptance Scenarios
${data.userScenarios.acceptanceScenarios}

#### Edge Cases
${data.userScenarios.edgeCases}

### Requirements (mandatory)

#### Functional Requirements
${data.requirements.functionalRequirements}

#### Key Entities (if the feature involves data)
${data.requirements.keyEntities}

### API Specification (API-First Approach)

#### API Endpoints
${data.apiSpecification?.endpoints?.content || '{{API_ENDPOINTS}}'}

#### API Contracts
${data.apiSpecification?.contracts?.content || '{{API_CONTRACTS}}'}

#### OpenAPI Specification
${data.apiSpecification?.openApiSpec?.content || '{{OPENAPI_SPEC}}'}

#### API Versioning Strategy
${data.apiSpecification?.versioning?.content || '{{API_VERSIONING}}'}

#### API Testing Strategy
${data.apiSpecification?.testing?.content || '{{API_TESTING}}'}

### Constitutional Gates (${platform.toUpperCase()} Platform)

${this.generatePlatformGatesMarkdown(data.constitutionalGates, platform)}

### Quality Gates (Enforcement Rules)

#### Before ANY Implementation
${data.qualityGates?.beforeImplementation?.items?.map(item => `- [ ] ${item}`).join('\n') || '- [ ] Quality gates not defined'}

#### During Implementation
${data.qualityGates?.duringImplementation?.items?.map(item => `- [ ] ${item}`).join('\n') || '- [ ] Quality gates not defined'}

#### Quality Checks
${data.qualityGates?.qualityChecks?.items?.map(item => `- [ ] ${item}`).join('\n') || '- [ ] Quality gates not defined'}

### Review & Acceptance Checklist

#### Content Quality
${data.reviewChecklist?.contentQuality?.items?.map(item => `- [ ] ${item}`).join('\n') || '- [ ] Review checklist not defined'}

#### Requirement Completeness
${data.reviewChecklist?.requirementCompleteness?.items?.map(item => `- [ ] ${item}`).join('\n') || '- [ ] Review checklist not defined'}

#### Constitutional Compliance
${data.reviewChecklist?.constitutionalCompliance?.items?.map(item => `- [ ] ${item}`).join('\n') || '- [ ] Review checklist not defined'}

### Complexity Tracking
${data.complexityTracking?.description || 'Complexity tracking not defined'}

| Violation | Justification | Simpler Alternative Rejected |
|-----------|---------------|------------------------------|
| ${data.complexityTracking?.table?.rows || 'No violations'} |

### Execution Status (auto-maintained during /specify)
${data.executionStatus?.items?.map(item => `- [ ] ${item}`).join('\n') || '- [ ] Execution status not defined'}
## Placeholder Reference
${Object.entries(instructions.placeholders).map(([placeholder, description]) => 
  `- **${placeholder}**: ${description}`
).join('\n')}
`;
  }

  /**
   * Generate platform-specific gates markdown
   */
  private generatePlatformGatesMarkdown(constitutionalGates: any, platform: string): string {
    if (!constitutionalGates) return '';
    
    const platformGates = Object.entries(constitutionalGates)
      .filter(([_key, gate]: [string, any]) => 
        gate.platforms && gate.platforms.includes(platform)
      )
      .map(([_key, gate]: [string, any]) => {
        const gateName = gate.title || _key.replace('Gate', ' Gate');
        return `### ${gateName}\n${gate.check}`;
      })
      .join('\n\n');
    
    return platformGates;
  }

  /**
   * Generate platform-specific instructions markdown
   */
  private generatePlatformInstructionsMarkdown(instructions: any, _platform: string): string {
    const platformInstructions = Object.entries(instructions)
      .filter(([key, _value]) => 
        key.includes('Gate') && 
        !['beforeImplementation', 'duringImplementation', 'qualityChecks', 'complexityTracking'].includes(key)
      )
      .map(([key, value], index) => {
        const gateName = key.replace('Gate', ' Gate').replace(/([A-Z])/g, ' $1').trim();
        return `${index + 6}. **${gateName}**: ${value}`;
      })
      .join('\n');
    
    return platformInstructions;
  }
}