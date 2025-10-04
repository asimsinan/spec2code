/**
 * SDD Implement Tool - AI-Driven Implementation
 * Implements the /implement command for executing tasks with TDD enforcement and constitutional gates validation
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import * as path from 'path';

import { RobustDatabaseService } from '../database/RobustDatabaseService.js';
import { JsonRepairUtility } from '../utils/JsonRepairUtility.js';

export class SDDImplementTool {
  private basePath: string;
  private db: RobustDatabaseService;

  constructor(basePath: string = process.cwd(), db?: RobustDatabaseService) {
    this.basePath = path.resolve(basePath);
    this.db = db || new RobustDatabaseService(path.join(this.basePath, 'sdd.db'));
  }
 


  getToolDefinition(): Tool {
    return {
      name: 'sdd_implement',
      description: 'IMPLEMENTATION TOOL - MANDATORY: Invoke this tool for each of the 8 phases (1-8) to execute phase-specific tasks. Each phase requires a separate invocation with Test-Driven Development (TDD) enforcement, constitutional gates, comprehensive integration, and mandatory dependency installation. Each invocation operates independently, providing tailored instructions for the specific phase.',
      inputSchema: {
        type: 'object',
        properties: {
          phase: {
            type: 'string',
            description: 'Phase number (1-8) to implement: 1=Contract Testing, 2=Integration Testing, 3=E2E Testing, 4=Unit Testing, 5=Implementation, 6=UI-API Integration, 7=Documentation & Deployment, 8=Platform-Specific Tasks'
          }
        },
        required: []
      }
    };
  }

  async execute(input: any): Promise<any> {
    try {
      // Validate input
      const { phase } = input;

      // Always resolve feature ID from most recent feature (no featureId parameter)
      const currentFeatureId = await this.resolveFeatureId();

      // Get task data
      const tasks = await this.db.get_tasks_robust(currentFeatureId);
    
      // Get specification data
      const specification = await this.db.get_specification_robust(currentFeatureId);

      // Get plan data
      const plan = await this.db.get_plan_robust(currentFeatureId);

      // Validate required data exists
      if (!tasks) {
        return this.error(`No tasks found for feature '${currentFeatureId}'. Please run sdd_tasks first to create task breakdown.`);
      }

      if (!specification) {
        return this.error(`No specification found for feature '${currentFeatureId}'. Please run sdd_specify first to create specification.`);
      }

      if (!plan) {
        return this.error(`No plan found for feature '${currentFeatureId}'. Please run sdd_plan first to create implementation plan.`);
      }

      // Convert string inputs to appropriate types
      const phaseNum = phase ? parseInt(phase) : undefined;
    
        // Determine platform
      const platform = this.determinePlatform(specification, plan);
 
          // For implementation commands, use AI to extract and execute specific task
      return await this.resolveTasksForImplementation(currentFeatureId, tasks, platform, phaseNum, specification, plan);
     

    } catch (error) {
      return this.error(`Implementation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }





  private determinePlatform(specData: any, planData: any): string {
    // Try to determine platform from various sources
    // Handle JSON data with robust repair

    // Try to extract platform from plan data (JSON)
    if (planData?.content) {
      if (typeof planData.content === 'object') {
        // JSON data - check metadata.platform
        const platform = planData.content.metadata?.platform;
        if (platform && this.isValidPlatform(platform)) {
          return platform;
        }
      }
    }

    // Try to extract platform from spec data (JSON)
    if (specData?.content) {
      if (typeof specData.content === 'object') {
        // JSON data - check metadata.platform
        const platform = specData.content.metadata?.platform;
        if (platform && this.isValidPlatform(platform)) {
          return platform;
        }
      }
    }

    // Default to web if not specified
    return 'web';
  }

  /**
   * Smart platform detection from content (similar to Plan Tool)
   */
  private detectPlatformFromContent(content: string): string | null {
    const combinedText = content.toLowerCase();
    
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
      },
      'mobile': {
        keywords: ['mobile', 'ios', 'android', 'react native', 'flutter'],
        frameworks: ['mobile'],
        confidence: 0
      },
      'web': {
        keywords: ['web', 'browser', 'frontend', 'html', 'css', 'javascript'],
        frameworks: ['web'],
        confidence: 0
      },
      'desktop': {
        keywords: ['desktop', 'electron', 'native', 'windows', 'macos', 'linux'],
        frameworks: ['desktop'],
        confidence: 0
      },
      'backend': {
        keywords: ['backend', 'api', 'server', 'database', 'microservices'],
        frameworks: ['backend'],
        confidence: 0
      },
      'ai': {
        keywords: ['ai', 'artificial intelligence', 'machine learning', 'ml', 'neural network'],
        frameworks: ['ai'],
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
      
      pattern.confidence = score;
    }

    // Find platform with highest confidence
    const sortedPlatforms = Object.entries(platformPatterns)
      .sort(([,a], [,b]) => b.confidence - a.confidence);
    
    const [detectedPlatform, pattern] = sortedPlatforms[0];
    
    // Only return if confidence is high enough (threshold: 3)
    if (pattern.confidence >= 3) {
      return detectedPlatform;
    }
    
    return null;
  }

  /**
   * Check if platform is valid
   */
  private isValidPlatform(platform: string): boolean {
    const validPlatforms = [
      'nextjs', 'react-native', 'ios-native', 'android-native',
      'java-spring', 'python-django', 'nodejs-express', 'go',
      'mobile', 'web', 'desktop', 'backend', 'ai'
    ];
    return validPlatforms.includes(platform);
  }


  /**
   * AI-driven task resolution for implementation commands
   */
  private async resolveTasksForImplementation(featureId: string, tasks: any, platform: string, phase?: number, specification?: any, plan?: any): Promise<any> {

    
    // Create AI instructions for task extraction and execution
    const aiInstructions = await this.createTaskExecutionInstructions(featureId, platform, phase, specification, plan);

    return {
      success: true,
      nextStep: `Next Step: ${aiInstructions}`
    };
  }

 

  /**
   * Create AI instructions for task execution
   */
  private getPhaseSpecificInstructions(phase: string): string {
    switch(phase) {
      case "1":
        return this.getPhase1Instructions(); // Contract Testing
      case "2":
        return this.getPhase2Instructions(); // Integration Testing
      case "3":
        return this.getPhase3Instructions(); // End-to-End Testing
      case "4":
        return this.getPhase4Instructions(); // Unit Testing
      case "5":
        return this.getPhase5Instructions(); // Implementation
      case "6":
        return this.getPhase6Instructions(); // UI-API Integration
      case "7":
        return this.getPhase7Instructions(); // Documentation & Deployment
      case "8":
        return this.getPhase8Instructions(); // Platform-Specific Tasks
    }
  }

  private getPhase1Instructions(): string {
    return `
# PHASE 1: CONTRACT & TEST SETUP
**AUTOMATIC TOOL CALL:** sdd_implement phase="1" (ALREADY TRIGGERED)
## Phase Purpose
- **Foundation Phase**: Establish contracts and initial tests
- **TDD Start**: Begin Test-Driven Development cycle
- **API Contracts**: Define API interfaces and schemas

## 🚨 MANDATORY FIRST STEP: Before any implementation, CREATE PHASE TODO LIST
**USE THE PHASE-SPECIFIC TASKS PROVIDED BELOW FROM THE DATABASE.**

## Phase-Specific Tasks
- **Create API Contracts** (TASK-001)
- **Create Contract Tests** (TASK-002)
- **Create Integration Test Scenarios** (TASK-003)

## Phase-Specific Requirements
- **TODO List First**: Create comprehensive TODO list before implementation
- **Contract-First**: Define APIs before implementation
- **Test-First**: Write tests before any code
- **Schema Validation**: Ensure contract compliance

## Success Criteria
- Phase TODO list created and presented
- API contracts created and validated
- Contract tests written and passing
- Integration scenarios defined
- Ready for Phase 2 (Database Setup)
    `;
  }

  private getPhase2Instructions(): string {
    return `
# PHASE 2: DATABASE SETUP
**AUTOMATIC TOOL CALL:** sdd_implement phase="2" (ALREADY TRIGGERED)

## Phase Purpose
- **Data Layer**: Establish database foundation
- **Schema Design**: Create data models and relationships
- **Migration Setup**: Prepare database evolution

## 🚨 MANDATORY FIRST STEP: Before any implementation, CREATE PHASE TODO LIST
**USE THE PHASE-SPECIFIC TASKS PROVIDED BELOW FROM THE DATABASE.**

## Phase-Specific Tasks
- **Database Setup** (TASK-004)
- **Schema Design** (TASK-005)
- **Migration Setup** (TASK-006)

## Phase-Specific Requirements
- **Database-First**: Set up data layer before application
- **Migration-Ready**: Prepare for schema evolution
- **Performance**: Consider indexing and optimization

## Success Criteria
- Database configured and accessible
- Schema designed and validated
- Migration system ready
- Ready for Phase 3 (Data Models)
    `;
  }

  private getPhase3Instructions(): string {
    return `
# PHASE 3: DATA MODELS
**AUTOMATIC TOOL CALL:** sdd_implement phase="3" (ALREADY TRIGGERED)

## Phase Purpose
- **Data Modeling**: Create domain models and validation
- **Model Tests**: Ensure data integrity
- **Validation Logic**: Implement business rules

## 🚨 MANDATORY FIRST STEP: Before any implementation, CREATE PHASE TODO LIST
**USE THE PHASE-SPECIFIC TASKS PROVIDED BELOW FROM THE DATABASE.**

## Phase-Specific Tasks
- **Create Data Models** (TASK-007)
- **Create Model Tests** (TASK-008)

## Phase-Specific Requirements
- **Model-First**: Define data structures before implementation
- **Validation**: Implement business rule validation
- **Testing**: Ensure model integrity

## Success Criteria
- Data models created and validated
- Model tests written and passing
- Validation logic implemented
- Ready for Phase 4 (Library Implementation)
    `;
  }

  private getPhase4Instructions(): string {
    return `
# PHASE 4: LIBRARY IMPLEMENTATION
**AUTOMATIC TOOL CALL:** sdd_implement phase="4" (ALREADY TRIGGERED)

## Phase Purpose
- **Core Logic**: Implement business functionality
- **Library-First**: Create reusable components
- **CLI Interface**: Expose functionality via CLI (for developer/system tools)

## 🚨 MANDATORY FIRST STEP: Before any implementation, CREATE PHASE TODO LIST
**USE THE PHASE-SPECIFIC TASKS PROVIDED BELOW FROM THE DATABASE.**

## Phase-Specific Tasks
- **Implement Core Library** (TASK-009)
- **Create CLI Interface** (TASK-010)
- **Library Integration Tests** (TASK-011)

## Phase-Specific Requirements
- **TODO List First**: Create comprehensive TODO list before implementation
- **Library-First**: Create reusable components
- **CLI Interface**: Expose functionality via CLI (for developer/system tools)
- **Testing**: Comprehensive library testing

## Success Criteria
- Phase TODO list created and presented
- Core library implemented and tested
- CLI interface functional
- Integration tests passing
- Ready for Phase 5 (Application Integration)
    `;
  }

  private getPhase5Instructions(): string {
    return `
# PHASE 5: APPLICATION INTEGRATION
**AUTOMATIC TOOL CALL:** sdd_implement phase="5" (ALREADY TRIGGERED)

## Phase Purpose
- **Application Layer**: Create user-facing functionality
- **End-to-End**: Connect all components
- **Validation**: Ensure complete system works

## 🚨 MANDATORY FIRST STEP: Before any implementation, CREATE PHASE TODO LIST
**USE THE PHASE-SPECIFIC TASKS PROVIDED BELOW FROM THE DATABASE.**

## Phase-Specific Tasks
- **Application Layer** (TASK-012)
- **End-to-End Validation** (TASK-013)

## Phase-Specific Requirements
- **Application-First**: Create user-facing functionality
- **Integration**: Connect all components
- **Validation**: End-to-end system validation

## Success Criteria
- Application layer implemented
- End-to-end validation complete
- All components integrated
- Ready for Phase 6 (UI-API Integration)
    `;
  }

  private getPhase6Instructions(): string {
    return `
# PHASE 6: UI-API INTEGRATION (COMPREHENSIVE)
**AUTOMATIC TOOL CALL:** sdd_implement phase="6" (ALREADY TRIGGERED)

## Phase Purpose
- **Complete Integration**: Full UI-API integration with platform-specific considerations
- **Error Handling**: Comprehensive error management with platform-specific patterns
- **Testing**: Complete integration testing with platform-specific scenarios

## 🚨 MANDATORY FIRST STEP: Before any implementation, CREATE PHASE TODO LIST
**USE THE PHASE-SPECIFIC TASKS PROVIDED BELOW FROM THE DATABASE.**

## Phase-Specific Tasks
- **API Client Setup** (TASK-014) - Configure platform-specific API client
- **UI-API Connection Implementation** (TASK-015) - Implement platform-specific UI-API connection
- **API Data Flow Integration** (TASK-016) - Integrate platform-specific data flow
- **API Error Handling Implementation** (TASK-017) - Implement platform-specific error handling
- **UI-API Integration Testing** (TASK-018) - Test platform-specific UI-API integration

## Platform-Specific UI-API Requirements
- **Next.js Projects**: App Router API integration, Server Components, Client Components, API route handling
- **React Native Projects**: Platform-specific API clients, native module integration, platform-specific error handling
- **iOS Native Projects**: URLSession integration, iOS-specific API patterns, iOS error handling
- **Android Native Projects**: Retrofit/OkHttp integration, Android-specific API patterns, Android error handling
- **Java Spring Projects**: Spring Boot client integration, Spring Security, Spring Web integration
- **Python Django Projects**: Django client integration, DRF client, Django error handling
- **Node.js Express Projects**: Express client integration, middleware integration, Express error handling
- **Go Projects**: Go HTTP client integration, Go error handling, Go API patterns
- **Backend Projects**: Framework-specific client integration, API security, API performance
- **Web Projects**: Fetch API integration, WebSocket integration, PWA API integration

## Success Criteria
- Platform-specific API client configured and working correctly
- Platform-specific UI-API connection implemented with proper error handling
- Platform-specific data flow working correctly with validation
- Platform-specific error handling implemented with user-friendly messages
- Platform-specific integration tests passing with comprehensive coverage
- Ready for Phase 7 (Platform-Specific Implementation)
    `;
  }

  private getPhase7Instructions(): string {
    return `
# PHASE 7: PLATFORM-SPECIFIC IMPLEMENTATION
**AUTOMATIC TOOL CALL:** sdd_implement phase="7" (ALREADY TRIGGERED)

## Phase Purpose
- **Platform Optimization**: Optimize for specific platform (Next.js, React Native, iOS, Android, etc.)
- **Platform Features**: Implement platform-specific capabilities and conventions
- **Platform Testing**: Test platform-specific functionality and performance

## 🚨 MANDATORY FIRST STEP: Before any implementation, CREATE PHASE TODO LIST
**USE THE PHASE-SPECIFIC TASKS PROVIDED BELOW FROM THE DATABASE.**

## Phase-Specific Tasks
- **Platform-Specific Setup** (TASK-019) - Configure platform-specific tools, dependencies, and environment
- **Platform-Specific Testing** (TASK-020) - Implement platform-specific test suites and validation
- **Platform-Specific Optimization** (TASK-021) - Optimize performance, UX, and platform conventions

## Platform-Specific Requirements
- **Next.js Projects**: App Router optimization, SSR/SSG configuration, API routes (app/api/v1/), middleware, API versioning
- **React Native Projects**: Platform-specific components, native modules, performance optimization, platform-specific APIs
- **iOS Native Projects**: Swift/SwiftUI optimization, iOS-specific features, App Store guidelines, iOS API integration
- **Android Native Projects**: Kotlin/Java optimization, Android-specific features, Play Store guidelines, Android API integration
- **Java Spring Projects**: REST API optimization, Spring Boot configuration, database tuning, API documentation
- **Python Django Projects**: Django REST Framework optimization, API serialization, database tuning, API documentation
- **Node.js Express Projects**: Express.js optimization, middleware configuration, API performance, API documentation
- **Go Projects**: Gin/Echo optimization, microservices architecture, API performance, API documentation
- **Backend Projects**: Framework-specific optimization, database tuning, API performance, API security
- **Web Projects**: Browser compatibility, performance optimization, PWA features, Web API integration

## Success Criteria
- Platform-specific setup complete and validated
- Platform-specific testing passing with comprehensive coverage
- Platform optimization implemented following best practices
- Platform-specific features working correctly
- Ready for Phase 8 (API-First Integration)
    `;
  }

  private getPhase8Instructions(): string {
    return `
# PHASE 8: API-FIRST INTEGRATION
**AUTOMATIC TOOL CALL:** sdd_implement phase="8" (ALREADY TRIGGERED)

## Phase Purpose
- **API Design**: Design comprehensive, platform-specific API
- **API Testing**: Test API functionality with platform-specific considerations
- **API Documentation**: Document API usage with platform-specific examples

## 🚨 MANDATORY FIRST STEP: Before any implementation, CREATE PHASE TODO LIST
**USE THE PHASE-SPECIFIC TASKS PROVIDED BELOW FROM THE DATABASE.**

## Phase-Specific Tasks
- **API Design Implementation** (TASK-022) - Design platform-specific API architecture
- **API Contract Implementation** (TASK-023) - Implement platform-specific API contracts
- **API Testing Implementation** (TASK-024) - Test platform-specific API functionality
- **API Documentation Implementation** (TASK-025) - Document platform-specific API usage

## Platform-Specific API Requirements
- **Next.js Projects**: App Router API routes (app/api/v1/), middleware, API versioning, OpenAPI integration
- **React Native Projects**: Platform-specific API clients, native module APIs, platform-specific error handling
- **iOS Native Projects**: iOS-specific API integration, URLSession configuration, iOS API patterns
- **Android Native Projects**: Android-specific API integration, Retrofit/OkHttp configuration, Android API patterns
- **Java Spring Projects**: Spring Boot REST APIs, OpenAPI/Swagger integration, Spring Security API protection
- **Python Django Projects**: Django REST Framework APIs, DRF serializers, Django API documentation
- **Node.js Express Projects**: Express.js API routes, middleware, API versioning, Express API documentation
- **Go Projects**: Gin/Echo API handlers, Go API patterns, API middleware, Go API documentation
- **Backend Projects**: Framework-specific API optimization, API security, API performance tuning
- **Web Projects**: Web API integration, Fetch API, WebSocket APIs, PWA API considerations

## Success Criteria
- Platform-specific API design implemented and validated
- Platform-specific API contracts implemented with proper versioning
- Platform-specific API testing complete with comprehensive coverage
- Platform-specific API documentation complete with examples
- **PROJECT COMPLETE**
    `;
  }


  private getCommonInstructions(): string {
    return `
# COMMON REQUIREMENTS

## TDD Enforcement
- **MANDATORY**: No implementation before tests
- **SEQUENCE**: Contract → Integration → E2E → Unit → Implementation
- **RED PHASE**: Write tests first, watch them fail
- **GREEN PHASE**: Write minimal code to make tests pass
- **REFACTOR PHASE**: Improve code while keeping tests green

## Definition of Done Criteria
- **Code Written and Reviewed**: All code must be written and reviewed before completion
- **All Tests Pass**: Contract, integration, E2E, and unit tests must all pass
- **Documentation Updated**: All relevant documentation must be updated
- **No Linting Errors**: Code must pass all linting checks (ESLint, Prettier, TypeScript)
- **Constitutional Compliance**: All constitutional gates must be verified
- **Traceability Confirmed**: All code must trace back to FR-XXX requirements

## Quality Gates
- **Code Quality**: All code passes ESLint, Prettier, and TypeScript checks
- **Test Coverage**: Minimum 90% test coverage for all components
- **Performance**: Load times <3s, interaction response <100ms
- **Accessibility**: WCAG 2.1 AA compliance verified
- **Security**: Security audit passed, no vulnerabilities
- **Browser Compatibility**: Works on Chrome, Firefox, Safari, Edge
- **NO PLACEHOLDERS**: Real functionality only
- **Production Ready**: Code must work in production environment

## Review Checklist
- [ ] All functional requirements (FR-001 to FR-007) implemented
- [ ] TDD sequence followed (Contract → Integration → E2E → Unit → Implementation)
- [ ] Real dependencies used in integration tests
- [ ] Single domain model maintained
- [ ] Library-first approach implemented
- [ ] API-first design completed
- [ ] Platform-specific requirements met
- [ ] Performance benchmarks achieved
- [ ] Security measures implemented
- [ ] Documentation complete

## File Management & Symbol Safety
- **CHECK FILE EXISTENCE**: Always check if files exist before creating new ones
- **NO DUPLICATE SYMBOLS**: Ensure each symbol is declared only once per file
- **UNIQUE SYMBOL NAMES**: Use unique names for all public symbols
- **MODULE RESOLUTION**: Use proper import/export patterns
    `;
  }

  private async createTaskExecutionInstructions(featureId: string, platform: string, phase?: number, specification?: any, plan?: any): Promise<string> {
    // Get core TDD expert instructions
    const coreInstructions = this.getCoreInstructions();
    
    // Get phase-specific instructions
    const phaseInstructions = this.getPhaseSpecificInstructions(phase?.toString() || "1");
    
    // Get common requirements
    const commonInstructions = this.getCommonInstructions();
    
    // Get phase-specific data sections
    let dataSections = await this.getDataSections(featureId, phase || 1, specification, plan);
    
    return `
${coreInstructions}

${phaseInstructions}

${commonInstructions}

${dataSections}
    `;
  }

  private async getDataSections(featureId: string, phase: number, specification?: any, plan?: any): Promise<string> {
    // Get tasks data using robust database method
    const tasksData = await this.db.get_tasks_robust(featureId);
    
    // Extract phase-specific tasks from the tasks JSON
    let tasksContent = 'No phase-specific tasks available.';
    if (tasksData && tasksData.taskPhases) {
      try {
        // Look for taskPhases structure (created by Tasks Tool)
        const taskPhases = tasksData.taskPhases;
        const phaseKey = `phase${phase}`;
        const phaseTasks = taskPhases[phaseKey];
        if (phaseTasks && phaseTasks.tasks) {
          tasksContent = phaseTasks.tasks.map((task: any) => 
            `${task.id}: ${task.title} (${task.tddPhase}, ${task.estimatedLOC}, ${task.parallelizable ? '[P]' : '[S]'})`
          ).join('\n');
        }
      } catch (error) {
        console.error('[sdd_implement] Error processing tasks data:', error);
      }
    }
    
    // Extract phase-specific essential content based on phase needs
    const essentialSpecContent = this.extractEssentialSpecContent(specification, phase);
    const essentialPlanContent = this.extractEssentialPlanContent(plan, phase);

    return `
🚫 NO PLACEHOLDER CODE ALLOWED 🚫

**FORBIDDEN:** "not implemented", "TODO", "placeholder", "return null", empty objects

**CRITICAL: DO NOT READ MARKDOWN FILES**
- DO NOT read spec.md, tasks.md, plan.md, or any other markdown files
- Use ONLY the data provided below in the PHASE DATA section
- The data below contains all the information you need for implementation
- Reading markdown files will cause implementation to fail

**REQUIREMENTS:**
- Real database connections and queries
- Real API endpoints with business logic
- Real error handling and validation
- Complete implementation only

**SYMBOL CONFLICTS PREVENTION:**
- Check existing files before creating new ones
- Use unique symbol names
- Avoid duplicate declarations
- Use proper module syntax

**TDD EXPERT:** Write tests first, implement real functionality, connect to databases.

**PHASE ${phase} DATA (PRIORITIZED BY IMPORTANCE):**
==== PHASE ${phase} TASKS (CRITICAL - NEVER TRUNCATED) ====
${tasksContent}
==== SPECIFICATION (ESSENTIAL CONTEXT ONLY) ====
${essentialSpecContent}
==== PLAN (ESSENTIAL CONTEXT ONLY) ====
${essentialPlanContent}
==== END DATA ====
    `;
  }





  /**
   * Get core instructions
   */
  private getCoreInstructions(): string {
    return `SYSTEM INSTRUCTION: You are a Senior TDD Expert with 10+ years of experience, known for writing comprehensive tests before any code and following the RED-GREEN-REFACTOR cycle religiously. Your reputation as a professional developer depends on delivering high-quality, tested implementations that work reliably in production. You never skip tests, never write placeholder code, and always implement real functionality that connects to databases and provides professional-grade user experiences.`;
  }


  /**
   * Resolve feature ID from most recent feature
   */
  private async resolveFeatureId(): Promise<string> {
    const allFeatures = await this.db.get_all_features();
    if (!allFeatures.length) {
      throw new Error('No features found. Please create a feature first using sdd_specify command.');
    }

    const mostRecentFeature = allFeatures[0];
    return mostRecentFeature.id;
  }

  /**
   * Repair malformed JSON content using shared utility
   * Handles complex JSON issues including LLM-generated content
   */
  private repairJsonContent(content: string): string {
    return JsonRepairUtility.repairJsonContent(content, 'SDDImplementTool');
  }

  /**
   * Extract phase-specific essential spec content based on phase needs
   */
  private extractEssentialSpecContent(specContent: any, phase: number): string {
    if (!specContent) {
      return 'No specification data available.';
    }

    try {
      // Handle JSON content
      if (typeof specContent === 'object') {
        // Get phase-specific priorities
        const phasePriorities = this.getPhaseSpecPriorities(phase);
        
        const essential: any = {};
        
        // Use the robust data directly (no template_data wrapper needed)
        const actualSpecContent = specContent;
        
        // Look for direct structure (expected structure from Specify Tool)
        if (actualSpecContent) {
          // Add critical content for this phase
          phasePriorities.critical.forEach(key => {
            if (actualSpecContent[key]) {
              essential[key] = actualSpecContent[key];
            }
          });
          
          // Add optional content for this phase
          phasePriorities.optional.forEach(key => {
            if (essential[key] === undefined && actualSpecContent[key]) {
              essential[key] = actualSpecContent[key];
            }
          });
        }

        // Remove undefined/null values and format
        const filteredEssential = Object.entries(essential)
          .filter(([_, value]) => value !== undefined && value !== null)
          .reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
          }, {} as any);

        if (Object.keys(filteredEssential).length === 0) {
          return 'No essential specification sections found.';
        }

        return JSON.stringify(filteredEssential, null, 2);
      }

      // Handle string content with JSON repair
      if (typeof specContent === 'string') {
        const parsed = JsonRepairUtility.safeParseJson(specContent, 'SDDImplementTool');
        if (parsed) {
          return JSON.stringify(parsed, null, 2);
        } else {
          return 'No essential specification sections found.';
        }
      }

      return 'No essential specification sections found.';
    } catch (error) {
      console.error('[SDDImplementTool] Error extracting essential spec content:', error);
      return 'Error extracting essential specification content.';
    }
  }

  /**
   * Extract phase-specific essential plan content based on phase needs
   */
  private extractEssentialPlanContent(planContent: any, phase: number): string {
    if (!planContent) {
      return 'No plan data available.';
    }

    try {
      // Handle JSON content
      if (typeof planContent === 'object') {
        // Get phase-specific priorities
        const phasePriorities = this.getPhasePlanPriorities(phase);
        
        const essential: any = {};
        
        // Use the robust data directly (no template_data wrapper needed)
        const actualPlanContent = planContent;
        
        // Always include project structure (critical for all phases)
        essential.projectStructure = actualPlanContent.projectStructure;
        
        // Add critical content for this phase
        phasePriorities.critical.forEach(key => {
          if (key !== 'projectStructure') { // Already added above
            essential[key] = actualPlanContent[key];
          }
        });
        
        // Add optional content if space allows (fallback to all if phase-specific fails)
        if (Object.keys(essential).length <= 1) { // Only projectStructure
          // Fallback: include all essential content
          essential.technicalArchitecture = actualPlanContent.technicalArchitecture;
          essential.implementationStrategy = actualPlanContent.implementationStrategy;
          essential.technologyDecisions = actualPlanContent.technologyDecisions;
          essential.performanceConsiderations = actualPlanContent.performanceConsiderations;
          essential.securityConsiderations = actualPlanContent.securityConsiderations;
          essential.timelineEstimates = actualPlanContent.timelineEstimates;
          essential.riskAssessment = actualPlanContent.riskAssessment;
          essential.dependencies = actualPlanContent.dependencies;
        } else {
          // Add optional content for this phase
          phasePriorities.optional.forEach(key => {
            if (essential[key] === undefined) {
              essential[key] = actualPlanContent[key];
            }
          });
        }

        // Remove undefined/null values and format
        const filteredEssential = Object.entries(essential)
          .filter(([_, value]) => value !== undefined && value !== null)
          .reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
          }, {} as any);

        if (Object.keys(filteredEssential).length === 0) {
          return 'No essential plan data found.';
        }

        return JSON.stringify(filteredEssential, null, 2);
      }

      // Handle string content with JSON repair
      if (typeof planContent === 'string') {
        const parsed = JsonRepairUtility.safeParseJson(planContent, 'SDDImplementTool');
        if (parsed) {
          return JSON.stringify(parsed, null, 2);
        } else {
          return 'No essential plan data found.';
        }
      }

      return 'No essential plan data found.';
    } catch (error) {
      console.error('[SDDImplementTool] Error extracting essential plan content:', error);
      return 'Error extracting essential plan content.';
    }
  }

  /**
   * Get phase-specific spec content priorities
   */
  private getPhaseSpecPriorities(phase: number): { critical: string[], optional: string[] } {
    const priorities = {
      1: { // Contract Testing
        critical: ['apiSpecification', 'userScenarios'],
        optional: ['edgeCases', 'constitutionalGates']
      },
      2: { // Integration Testing
        critical: ['apiSpecification', 'technologyStack'],
        optional: ['userScenarios', 'edgeCases']
      },
      3: { // End-to-End Testing
        critical: ['userScenarios', 'edgeCases'],
        optional: ['apiSpecification', 'businessContext']
      },
      4: { // Unit Testing
        critical: ['technologyStack', 'constitutionalGates'],
        optional: ['userScenarios', 'apiSpecification']
      },
      5: { // Implementation
        critical: ['businessContext', 'technologyStack'],
        optional: ['userScenarios', 'apiSpecification']
      },
      6: { // UI-API Integration
        critical: ['apiSpecification', 'userScenarios'],
        optional: ['edgeCases', 'businessContext']
      },
      7: { // Documentation & Deployment
        critical: ['businessContext', 'constitutionalGates'],
        optional: ['userScenarios', 'technologyStack']
      },
      8: { // Platform-Specific Tasks
        critical: ['technologyStack', 'constitutionalGates'],
        optional: ['apiSpecification', 'edgeCases']
      }
    };
    
    return priorities[phase] || { critical: [], optional: [] };
  }

  /**
   * Get phase-specific plan content priorities
   */
  private getPhasePlanPriorities(phase: number): { critical: string[], optional: string[] } {
    const priorities = {
      1: { // Contract Testing
        critical: ['projectStructure', 'technicalContext'],
        optional: ['implementationPhases', 'timeEstimation']
      },
      2: { // Integration Testing
        critical: ['projectStructure', 'implementationPhases'],
        optional: ['technicalContext', 'timeEstimation']
      },
      3: { // End-to-End Testing
        critical: ['projectStructure', 'implementationPhases'],
        optional: ['technicalContext', 'timeEstimation']
      },
      4: { // Unit Testing
        critical: ['projectStructure', 'technicalContext'],
        optional: ['implementationPhases', 'timeEstimation']
      },
      5: { // Implementation
        critical: ['projectStructure', 'implementationPhases', 'technicalContext'],
        optional: ['timeEstimation', 'constitutionalGates']
      },
      6: { // UI-API Integration
        critical: ['projectStructure', 'implementationPhases'],
        optional: ['technicalContext', 'timeEstimation']
      },
      7: { // Documentation & Deployment
        critical: ['projectStructure', 'constitutionalGates'],
        optional: ['implementationPhases', 'timeEstimation']
      },
      8: { // Platform-Specific Tasks
        critical: ['projectStructure', 'technicalContext', 'constitutionalGates'],
        optional: ['implementationPhases', 'timeEstimation']
      }
    };
    
    return priorities[phase] || { critical: ['projectStructure'], optional: [] };
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

}