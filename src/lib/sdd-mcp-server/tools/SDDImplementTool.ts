/**
 * SDD Implement Tool - Enhanced AI-Driven Implementation
 * Implements the /implement command for executing tasks with TDD enforcement, constitutional gates validation,
 * duration estimates, parallel execution opportunities, and project planning data.
 * 
 * Features:
 * - Enhanced task display with duration estimates and parallel execution info
 * - Project planning information including critical path and resource requirements
 * - Execution strategy guidance for parallel vs sequential tasks
 * - 4-phase structure with 44 atomic tasks (11 per phase) following Implement-Run-Verify pattern
 * - Real-time project planning data integration
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import * as path from 'path';

import { RobustDatabaseService } from '../database/RobustDatabaseService.js';
import { JsonRepairUtility } from '../utils/JsonRepairUtility.js';
import { ErrorRecoveryManager, ErrorContext } from '../utils/ErrorRecoveryManager.js';
import { PlanCommunicationEnhancer } from '../utils/PlanCommunicationEnhancer.js';
import { PerformanceOptimizer } from '../utils/PerformanceOptimizer.js';

export class SDDImplementTool {
  private basePath: string;
  private db: RobustDatabaseService;
  private errorRecoveryManager: ErrorRecoveryManager;
  private planCommunicationEnhancer: PlanCommunicationEnhancer;
  private performanceOptimizer: PerformanceOptimizer;

  constructor(basePath: string = process.cwd(), db?: RobustDatabaseService) {
    this.basePath = path.resolve(basePath);
    this.db = db || new RobustDatabaseService(path.join(this.basePath, 'sdd.db'));
    this.errorRecoveryManager = ErrorRecoveryManager.getInstance();
    this.planCommunicationEnhancer = PlanCommunicationEnhancer.getInstance();
    this.performanceOptimizer = PerformanceOptimizer.getInstance();
    

  }


  getToolDefinition(): Tool {
    return {
      name: 'sdd_implement',
      description: `🚨 CRITICAL TOOL CALL REQUIRED: When user types "/sdd_implement phase=X" or "sdd_implement phase=X", you MUST IMMEDIATELY call this tool. Do NOT analyze, plan, read files, or do any other actions first. This tool provides complete implementation instructions for any phase (1-4) with enhanced task information including duration estimates, parallel execution opportunities, project planning data, and execution strategy. This is the PRIMARY development tool. MANDATORY: Call this tool for ALL implementation requests. DO NOT IGNORE THIS TOOL CALL.

## Enhanced Implementation Instructions
- **Phase-Specific Tasks**: Loads actual tasks from database for the specified phase
- **TDD Enforcement**: Enforces Test-Driven Development with Contract → Integration → E2E → Unit → Implementation sequence
- **Platform Detection**: Automatically detects platform and provides platform-specific instructions
- **Constitutional Gates**: Ensures compliance with all quality gates and requirements
- **Parallel Execution**: Identifies tasks that can run in parallel for optimal efficiency
- **Real Implementation**: Provides instructions for real functionality, not mocks or placeholders

## Phase Structure (Balanced 4-Phase)
- **Phase 1**: Foundations & Data (11 tasks) - API contracts, database setup, data models
- **Phase 2**: Core Implementation (11 tasks) - Core library, business logic, API structure  
- **Phase 3**: UI Development with Mock APIs (11 tasks) - UI components with mock services
- **Phase 4**: Real API Integration & Verification (11 tasks) - Replace mocks with real APIs

## Critical Requirements
- **NO MOCK CODE**: All implementations must be real, production-ready functionality
- **TDD MANDATORY**: Write tests first, then implement code following RED-GREEN-REFACTOR
- **DATABASE CONNECTIONS**: Use real database connections and queries
- **ERROR HANDLING**: Implement comprehensive error handling and validation
- **PLATFORM-SPECIFIC**: Follow platform-specific best practices and configurations`,
      inputSchema: {
        type: 'object',
        properties: {
          phase: {
            type: 'string',
            description: 'Phase number (1-4) to execute immediately: 1=Foundations & Data (11 tasks), 2=Core Implementation (11 tasks), 3=UI Development with Mock APIs (11 tasks), 4=Real API Integration & Verification (11 tasks)'
          }
        },
        required: []
      }
    };
  }

  async execute(input: any): Promise<any> {
    const context: ErrorContext = {
      tool: 'SDDImplementTool',
      operation: 'execute',
      timestamp: new Date()
    };

    try {
      // Validate input
      const { phase } = input;


      const currentFeatureId = await this.errorRecoveryManager.addRetryMechanism(
        () => this.resolveFeatureId(),
        { ...context, operation: 'resolveFeatureId' },
        3
      );

      // Get data with retry mechanism and graceful degradation, using JSON repair
      const rawTasks = await this.errorRecoveryManager.addRetryMechanism(
        () => this.db.get_tasks_robust(currentFeatureId),
        { ...context, operation: 'getTasks', featureId: currentFeatureId },
        3
      );
      const tasks = JsonRepairUtility.validateAndRepairDbContent(rawTasks, 'SDDImplementTool');

      const rawSpecification = await this.errorRecoveryManager.addRetryMechanism(
        () => this.db.get_specification_robust(currentFeatureId),
        { ...context, operation: 'getSpecification', featureId: currentFeatureId },
        3
      );
      const specification = JsonRepairUtility.validateAndRepairDbContent(rawSpecification, 'SDDImplementTool');

      const rawPlan = await this.errorRecoveryManager.addRetryMechanism(
        () => this.db.get_plan_robust(currentFeatureId),
        { ...context, operation: 'getPlan', featureId: currentFeatureId },
        3
      );
      const plan = JsonRepairUtility.validateAndRepairDbContent(rawPlan, 'SDDImplementTool');

      // Validate required data exists with graceful degradation
      if (!tasks) {
        const error = new Error(`No tasks found for feature '${currentFeatureId}'. Please run sdd_tasks first to create task breakdown.`);
        this.errorRecoveryManager.addDetailedErrorLogging(error, { ...context, operation: 'validateTasks', featureId: currentFeatureId });
        return this.error(this.errorRecoveryManager.addUserFriendlyErrorMessages(error, { ...context, operation: 'validateTasks', featureId: currentFeatureId }));
      }

      if (!specification) {
        const error = new Error(`No specification found for feature '${currentFeatureId}'. Please run sdd_specify first to create specification.`);
        this.errorRecoveryManager.addDetailedErrorLogging(error, { ...context, operation: 'validateSpecification', featureId: currentFeatureId });
        return this.error(this.errorRecoveryManager.addUserFriendlyErrorMessages(error, { ...context, operation: 'validateSpecification', featureId: currentFeatureId }));
      }

      if (!plan) {
        const error = new Error(`No plan found for feature '${currentFeatureId}'. Please run sdd_plan first to create implementation plan.`);
        this.errorRecoveryManager.addDetailedErrorLogging(error, { ...context, operation: 'validatePlan', featureId: currentFeatureId });
        return this.error(this.errorRecoveryManager.addUserFriendlyErrorMessages(error, { ...context, operation: 'validatePlan', featureId: currentFeatureId }));
      }

      // Convert string inputs to appropriate types
      const phaseNum = phase ? parseInt(phase) : undefined;

      // Determine platform with error handling
      const platform = await this.errorRecoveryManager.addRetryMechanism(
        () => Promise.resolve(this.determinePlatform(specification, plan)),
        { ...context, operation: 'determinePlatform', featureId: currentFeatureId },
        2
      );

      // For implementation commands, use AI to extract and execute specific task
      const aiInstructions = await this.errorRecoveryManager.addRetryMechanism(
        () => this.resolveTasksForImplementation(currentFeatureId, tasks, platform, phaseNum, specification, plan),
        { ...context, operation: 'resolveTasksForImplementation', featureId: currentFeatureId, phase: phaseNum },
        2
      );

      // Return the AI instructions as a plain string to avoid JSON parsing issues
      return aiInstructions;

    } catch (error) {
      const enhancedError = error as Error;
      this.errorRecoveryManager.addDetailedErrorLogging(enhancedError, context);
      const userFriendlyMessage = this.errorRecoveryManager.addUserFriendlyErrorMessages(enhancedError, context);
      return this.error(`Implementation failed: ${userFriendlyMessage}`);
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

    // Try intelligent content-based platform detection
    let contentToAnalyze = '';

    // Combine content from both spec and plan for better detection
    if (specData?.content) {
      if (typeof specData.content === 'string') {
        contentToAnalyze += specData.content + ' ';
      } else if (typeof specData.content === 'object') {
        contentToAnalyze += JSON.stringify(specData.content) + ' ';
      }
    }

    if (planData?.content) {
      if (typeof planData.content === 'string') {
        contentToAnalyze += planData.content + ' ';
      } else if (typeof planData.content === 'object') {
        contentToAnalyze += JSON.stringify(planData.content) + ' ';
      }
    }

    // Use intelligent platform detection from content
    if (contentToAnalyze.trim()) {
      const detectedPlatform = this.detectPlatformFromContent(contentToAnalyze);
      if (detectedPlatform && this.isValidPlatform(detectedPlatform)) {

        return detectedPlatform;
      }
    }
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
      .sort(([, a], [, b]) => b.confidence - a.confidence);

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
  private async resolveTasksForImplementation(featureId: string, tasks: any, platform: string, phase?: number, specification?: any, plan?: any): Promise<string> {
    try {
      // Create AI instructions for task extraction and execution
      const aiInstructions = await this.createTaskExecutionInstructions(featureId, platform, phase, specification, plan);

      // Return the instructions as a plain string to avoid JSON parsing issues
      return aiInstructions;
    } catch (error) {
      console.error(`[SDDImplementTool] Error in resolveTasksForImplementation:`, error);
      return `Failed to create task execution instructions: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }



  /**
   * Create AI instructions for task execution
   */
  private async getPhaseSpecificInstructions(phase: string, platform?: string, language?: string, featureId?: string): Promise<string> {
    switch (phase) {
      case "1":
        return await this.getPhase1Instructions(platform, language, featureId); // Foundations & Data
      case "2":
        return await this.getPhase2Instructions(platform, language, featureId); // Application & Core Integration
      case "3":
        return await this.getPhase3Instructions(platform, language, featureId); // API-First, Platform & Smoke
      case "4":
        return await this.getPhase4Instructions(platform, language, featureId); // Full Integration & Verification
      default:
        return await this.getPhase1Instructions(platform, language, featureId); // Default to Phase 1
    }
  }

  private async getPhase1Instructions(platform?: string, language?: string, featureId?: string): Promise<string> {
    const platformCommands = this.getPlatformInstallationCommands(platform);
    const criticalDependencies = this.getCriticalDependencies(platform, language);
    const contractTestCommands = this.getPlatformTestCommands(platform, 'contract');
    const platformSpecificRequirements = this.getPlatformSpecificRequirements(platform);

    // Load actual task data from database
    let phaseTasksContent = 'No phase-specific tasks available.';
    if (featureId) {
      try {
        const tasksData = await this.db.get_tasks_robust(featureId);
        if (tasksData && tasksData.taskPhases && tasksData.taskPhases.phase1 && tasksData.taskPhases.phase1.tasks) {
          const tasks = tasksData.taskPhases.phase1.tasks;
          phaseTasksContent = tasks.map((task: any) =>
            `- **${task.title}** (${task.id}) - ${task.description}`
          ).join('\n');
        }
      } catch (error) {
        console.error('[sdd_implement] Error loading phase 1 tasks:', error);
      }
    }

    return `
🚨🚨🚨 CRITICAL WARNINGS (READ FIRST) 🚨🚨🚨
- NEVER create placeholder code, mocks, or "TODO" implementations
- ALWAYS implement real functionality with database connections
- ALWAYS write tests BEFORE implementing code (TDD)
- ALWAYS install dependencies before any implementation
- NEVER read markdown files - use only data provided below
- 🚨 WORKING DIRECTORY: Create ALL files in the CURRENT PROJECT DIRECTORY (where you are now)
- 🚨 DO NOT create new folders with feature names - work in the existing project structure

# PHASE 1: FOUNDATIONS & DATA (ATOMIC)
**AUTOMATIC TOOL CALL:** /sdd_implement phase=1 (ALREADY TRIGGERED)

🚨 CRITICAL: Execute the implementation directly using only the information provided below.

## Phase Purpose
- **Foundation Phase**: Contracts, tests, integration scenarios, DB/schema/migrations, models, and unit verification
- **TDD Start**: Begin Test-Driven Development cycle with Contract → Integration → E2E → Unit → Implementation
- **API Contracts**: Generate, validate, and verify OpenAPI contracts
- **Database Setup**: Configure, initialize, design schema, and implement migrations
- **Data Models**: Develop, lint, verify, and test data models

## 🚨 MANDATORY FIRST STEP: CREATE PHASE TODO LIST for following Phase-Specific Tasks
${phaseTasksContent ? `\n${'='.repeat(80)}\n📋 PHASE-SPECIFIC TASKS\n${'='.repeat(80)}\n${phaseTasksContent}\n${'='.repeat(80)}\n` : ''}

## 🚨 MANDATORY SECOND STEP: DEPENDENCY INSTALLATION
**BEFORE ANY IMPLEMENTATION, INSTALL ALL REQUIRED DEPENDENCIES:**

### Platform-Specific Installation Commands
${platformCommands ? `\n${'='.repeat(60)}\n📦 PLATFORM-SPECIFIC INSTALLATION COMMANDS\n${'='.repeat(60)}\n${platformCommands}\n${'='.repeat(60)}\n` : ''}

### Critical Dependencies to Install
${criticalDependencies ? `\n${'='.repeat(60)}\n🔧 CRITICAL DEPENDENCIES TO INSTALL\n${'='.repeat(60)}\n${criticalDependencies}\n${'='.repeat(60)}\n` : ''}

## Platform-Specific Requirements
${platformSpecificRequirements ? `\n${'='.repeat(80)}\n🏗️  PLATFORM-SPECIFIC REQUIREMENTS\n${'='.repeat(80)}\n${platformSpecificRequirements}\n${'='.repeat(80)}\n` : ''}

## Phase-Specific Requirements
- **Dependencies First**: Install all packages before any implementation
- **Contract-First**: Generate API contracts before implementation
- **Test-First**: Write tests before any code following TDD sequence
- **Database-First**: Set up data layer before application
- **Model-First**: Define data structures before implementation
- **Test Execution**: Run tests to verify they work correctly
- **Schema Validation**: Ensure contract and database compliance

${this.getTestingStepsTemplate('Contract', 'TASK-005', contractTestCommands ? `\n${'='.repeat(60)}\n🧪 CONTRACT TEST COMMANDS\n${'='.repeat(60)}\n${contractTestCommands}\n${'='.repeat(60)}\n` : '')}

### 3. Run Integration Tests (TASK-009, TASK-017, TASK-018)
- **Integration Scenarios**: Define integration test scenarios (TASK-009)
- **Core Integration Tests**: Run core integration tests (TASK-017)
- **API Integration Tests**: Run API integration tests (TASK-018)

### 4. Run Database Implementation (TASK-003, TASK-004, TASK-006, TASK-008)
- **Database Configuration**: Configure database (TASK-003)
- **Schema Design**: Design database schema (TASK-004)
- **Data Models**: Develop data models (TASK-006)
- **Migration Scripts**: Implement migration scripts (TASK-008)

### 5. Run Model Tests (TASK-010, TASK-021)
- **Model Unit Tests**: Execute model unit tests (TASK-010)
- **Core Component Tests**: Run unit tests for core components (TASK-021)

## Success Criteria
- All dependencies installed and verified
- API contracts generated, validated, and verified
- Contract tests implemented, run, and verified
- Integration scenarios defined, executed, and verified
- Database configured, initialized, schema designed, and migrations applied
- Data models developed, linted, verified, and tested
- **All tests executed and verified to work correctly**
- **All testing frameworks verified to be working correctly**
- Ready for Phase 2 (Application & Core Integration)
    `;
  }

  private async getPhase2Instructions(platform?: string, language?: string, featureId?: string): Promise<string> {
    const databaseTestCommands = this.getPlatformTestCommands(platform, 'database');
    const platformSpecificRequirements = this.getPlatformSpecificRequirements(platform);

    // Load actual task data from database
    let phaseTasksContent = 'No phase-specific tasks available.';
    if (featureId) {
      try {
        const tasksData = await this.db.get_tasks_robust(featureId);
        if (tasksData && tasksData.taskPhases && tasksData.taskPhases.phase2 && tasksData.taskPhases.phase2.tasks) {
          const tasks = tasksData.taskPhases.phase2.tasks;
          phaseTasksContent = tasks.map((task: any) =>
            `- **${task.title}** (${task.id}) - ${task.description}`
          ).join('\n');
        }
      } catch (error) {
        console.error('[sdd_implement] Error loading phase 2 tasks:', error);
      }
    }

    return `
🚨🚨🚨 CRITICAL WARNINGS (READ FIRST) 🚨🚨🚨
- NEVER create placeholder code, mocks, or "TODO" implementations
- ALWAYS implement real functionality with database connections
- ALWAYS write tests BEFORE implementing code (TDD)
- ALWAYS install dependencies before any implementation
- NEVER read markdown files - use only data provided below
- 🚨 WORKING DIRECTORY: Create ALL files in the CURRENT PROJECT DIRECTORY (where you are now)
- 🚨 DO NOT create new folders with feature names - work in the existing project structure

# PHASE 2: APPLICATION & CORE INTEGRATION (ATOMIC)
**AUTOMATIC TOOL CALL:** sdd_implement phase="2" (ALREADY TRIGGERED)

## Phase Purpose
- **Core Implementation**: Implement core library with business functionality
- **Application Layer**: Create user-facing functionality and application layer
- **API Client**: Configure and verify API client setup
- **Integration Testing**: Run library and application integration tests

## 🚨 MANDATORY FIRST STEP: Before any implementation, CREATE PHASE TODO LIST
**USE THE PHASE-SPECIFIC TASKS PROVIDED BELOW FROM THE DATABASE.**

## Phase-Specific Tasks
${phaseTasksContent ? `\n${'='.repeat(80)}\n📋 PHASE-SPECIFIC TASKS\n${'='.repeat(80)}\n${phaseTasksContent}\n${'='.repeat(80)}\n` : ''}

## Platform-Specific Requirements
${platformSpecificRequirements ? `\n${'='.repeat(80)}\n🏗️  PLATFORM-SPECIFIC REQUIREMENTS\n${'='.repeat(80)}\n${platformSpecificRequirements}\n${'='.repeat(80)}\n` : ''}

## Phase-Specific Requirements
- **Library-First**: Implement core library before application layer
- **API Client**: Configure API client for UI-API integration
- **Application Layer**: Create user-facing functionality
- **Integration Testing**: Run comprehensive integration tests
- **Test Execution**: Run integration tests to verify they work correctly
- **Integration Verification**: Verify integration testing framework is properly configured

${this.getTestingStepsTemplate('Library Integration', 'TASK-025', databaseTestCommands ? `\n${'='.repeat(60)}\n🗄️  DATABASE TEST COMMANDS\n${'='.repeat(60)}\n${databaseTestCommands}\n${'='.repeat(60)}\n` : '')}

### 3. Run Application Layer Tests (TASK-021)
- **Application Testing**: Execute application layer tests
- **Application Verification**: Verify application layer test results

## Success Criteria
- Core library implemented and tested
- API client configured and verified
- Application layer implemented and tested
- **Integration tests executed and verified to work correctly**
- **Integration testing framework verified to be working correctly**
- Library integration tests passing
- Application layer tests passing
- Ready for Phase 3 (API-First, Platform & Smoke)
    `;
  }

  private async getPhase3Instructions(platform?: string, language?: string, featureId?: string): Promise<string> {
    const e2eTestCommands = this.getPlatformTestCommands(platform, 'e2e');
    const platformSpecificRequirements = this.getPlatformSpecificRequirements(platform);

    // Load actual task data from database
    let phaseTasksContent = 'No phase-specific tasks available.';
    if (featureId) {
      try {
        const tasksData = await this.db.get_tasks_robust(featureId);
        if (tasksData && tasksData.taskPhases && tasksData.taskPhases.phase3 && tasksData.taskPhases.phase3.tasks) {
          const tasks = tasksData.taskPhases.phase3.tasks;
          phaseTasksContent = tasks.map((task: any) =>
            `- **${task.title}** (${task.id}) - ${task.description}`
          ).join('\n');
        }
      } catch (error) {
        console.error('[sdd_implement] Error loading phase 3 tasks:', error);
      }
    }

    return `
🚨🚨🚨 CRITICAL WARNINGS (READ FIRST) 🚨🚨🚨
- NEVER create placeholder code, mocks, or "TODO" implementations
- ALWAYS implement real functionality with database connections
- ALWAYS write tests BEFORE implementing code (TDD)
- ALWAYS install dependencies before any implementation
- NEVER read markdown files - use only data provided below
- 🚨 WORKING DIRECTORY: Create ALL files in the CURRENT PROJECT DIRECTORY (where you are now)
- 🚨 DO NOT create new folders with feature names - work in the existing project structure

# PHASE 3: API-FIRST, PLATFORM & SMOKE (ATOMIC)
**AUTOMATIC TOOL CALL:** sdd_implement phase="3" (ALREADY TRIGGERED)

## Phase Purpose
- **API-First Design**: Implement comprehensive API design and contract enforcement
- **Platform Setup**: Setup platform environment and execute platform tests
- **Platform Optimization**: Optimize platform performance and verify metrics
- **SMOKE Testing**: Execute SMOKE test suite and analyze results

## 🚨 MANDATORY FIRST STEP: Before any implementation, CREATE PHASE TODO LIST
**USE THE PHASE-SPECIFIC TASKS PROVIDED BELOW FROM THE DATABASE.**

## Phase-Specific Tasks
${phaseTasksContent ? `\n${'='.repeat(80)}\n📋 PHASE-SPECIFIC TASKS\n${'='.repeat(80)}\n${phaseTasksContent}\n${'='.repeat(80)}\n` : ''}

## Platform-Specific Requirements
${platformSpecificRequirements ? `\n${'='.repeat(80)}\n🏗️  PLATFORM-SPECIFIC REQUIREMENTS\n${'='.repeat(80)}\n${platformSpecificRequirements}\n${'='.repeat(80)}\n` : ''}

## Phase-Specific Requirements
- **API-First**: Design and implement comprehensive API with contract enforcement
- **Platform-Specific**: Setup platform environment and execute platform-specific tests
- **Performance**: Optimize platform performance and verify metrics
- **SMOKE Testing**: Execute comprehensive SMOKE test suite
- **Test Execution**: Run API integration and platform tests to verify they work correctly
- **Integration Verification**: Verify API integration and platform testing frameworks

${this.getTestingStepsTemplate('API Integration', 'TASK-035', e2eTestCommands)}

### 3. Run Platform Tests (TASK-038)
- **Platform Testing**: Execute platform-specific tests
- **Platform Verification**: Verify platform test results

### 4. Execute SMOKE Test Suite (TASK-037)
- **SMOKE Testing**: Execute comprehensive SMOKE test suite
- **SMOKE Analysis**: Analyze SMOKE failures and flakies
- **SMOKE Reporting**: Publish SMOKE summary report

## Success Criteria
- API design implemented and verified
- API contract enforcement implemented and tested
- Platform environment setup and tested
- Platform performance optimized and verified
- **API integration tests executed and verified to work correctly**
- **Platform tests executed and verified to work correctly**
- **SMOKE test suite executed and analyzed**
- API integration tests passing
- Platform tests passing
- SMOKE test results analyzed and reported
- Ready for Phase 4 (Full Integration & Verification)
    `;
  }

  private async getPhase4Instructions(platform?: string, language?: string, featureId?: string): Promise<string> {
    // Load actual task data from database
    let phaseTasksContent = 'No phase-specific tasks available.';
    if (featureId) {
      try {
        const tasksData = await this.db.get_tasks_robust(featureId);
        if (tasksData && tasksData.taskPhases && tasksData.taskPhases.phase4 && tasksData.taskPhases.phase4.tasks) {
          const tasks = tasksData.taskPhases.phase4.tasks;
          phaseTasksContent = tasks.map((task: any) =>
            `- **${task.title}** (${task.id}) - ${task.description}`
          ).join('\n');
        }
      } catch (error) {
        console.error('[sdd_implement] Error loading phase 4 tasks:', error);
      }
    }

    return `
🚨🚨🚨 CRITICAL WARNINGS (READ FIRST) 🚨🚨🚨
- NEVER create placeholder code, mocks, or "TODO" implementations
- ALWAYS implement real functionality with database connections
- ALWAYS write tests BEFORE implementing code (TDD)
- ALWAYS install dependencies before any implementation
- NEVER read markdown files - use only data provided below
- 🚨 WORKING DIRECTORY: Create ALL files in the CURRENT PROJECT DIRECTORY (where you are now)
- 🚨 DO NOT create new folders with feature names - work in the existing project structure

# PHASE 4: FULL INTEGRATION & VERIFICATION (ATOMIC)
**AUTOMATIC TOOL CALL:** sdd_implement phase="4" (ALREADY TRIGGERED)

## Phase Purpose
- **Documentation**: Generate and verify API documentation
- **Full Testing**: Execute comprehensive FULL test suite
- **Coverage & Performance**: Verify coverage and performance metrics
- **Release Preparation**: Update documentation and release notes
- **Final Sign-off**: Complete final review and project sign-off

## 🚨 MANDATORY FIRST STEP: Before any implementation, CREATE PHASE TODO LIST
**USE THE PHASE-SPECIFIC TASKS PROVIDED BELOW FROM THE DATABASE.**

## Phase-Specific Tasks
${phaseTasksContent ? `\n${'='.repeat(80)}\n📋 PHASE-SPECIFIC TASKS\n${'='.repeat(80)}\n${phaseTasksContent}\n${'='.repeat(80)}\n` : ''}

## Phase-Specific Requirements
- **Documentation-First**: Generate comprehensive API documentation
- **Full Testing**: Execute complete test suite with all test types
- **Coverage Verification**: Verify test coverage and performance metrics
- **Release Preparation**: Update documentation and prepare release notes
- **Final Review**: Complete comprehensive project review and sign-off
- **Test Execution**: Run FULL test suite to verify everything works correctly
- **Final Verification**: Verify all testing frameworks and project completion

${this.getTestingStepsTemplate('FULL Test Suite', 'TASK-049', this.getPlatformTestCommands(platform, 'unit'))}

### 3. Final Review & Sign-off (TASK-049)
- **Final Review**: Complete comprehensive project review
- **Sign-off**: Complete project sign-off and approval

## Success Criteria
- API documentation generated and verified
- **FULL test suite executed and verified to work correctly**
- **Coverage and performance verified to meet requirements**
- Documentation and release notes updated
- **Final review completed and project signed off**
- All test frameworks verified and working correctly
- **PROJECT COMPLETE - READY FOR PRODUCTION**
    `;
  }

  private getConsolidatedCommonInstructions(): string {
    return `
# CONSOLIDATED COMMON REQUIREMENTS (UNIVERSAL)

## 🚨 TDD ENFORCEMENT (UNIVERSAL)
- **MANDATORY**: No implementation before tests
- **SEQUENCE**: Contract → Integration → E2E → Unit → Implementation
- **RED PHASE**: Write tests first, watch them fail
- **GREEN PHASE**: Write minimal code to make tests pass
- **REFACTOR PHASE**: Improve code while keeping tests green
- **TEST EXECUTION**: Always run tests after creating them to verify they work
- **VERIFICATION**: Verify test framework is working before proceeding

## 🚨 TESTING PROTOCOL (UNIVERSAL)
- **Test Framework**: Ensure testing framework is properly configured
- **Test Discovery**: Verify tests are discovered and can be run
- **Test Execution**: Confirm tests execute successfully
- **Test Environment**: Verify test environment is set up correctly

## 🚨 QUALITY GATES (UNIVERSAL)
- **Code Quality**: All code passes linting checks
- **Test Coverage**: Minimum 90% test coverage for all components
- **Performance**: Load times <3s, interaction response <100ms
- **NO PLACEHOLDERS**: Real functionality only
- **Production Ready**: Code must work in production environment

## 🚨 DEFINITION OF DONE (UNIVERSAL)
- **Code Written and Reviewed**: All code must be written and reviewed before completion
- **All Tests Pass**: Contract, integration, E2E, and unit tests must all pass
- **Documentation Updated**: All relevant documentation must be updated
- **Constitutional Compliance**: All constitutional gates must be verified
- **Traceability Confirmed**: All code must trace back to FR-XXX requirements

## 🚨 FILE MANAGEMENT & SYMBOL SAFETY (UNIVERSAL)
- **CHECK FILE EXISTENCE**: Always check if files exist before creating new ones
- **NO DUPLICATE SYMBOLS**: Ensure each symbol is declared only once per file
- **UNIQUE SYMBOL NAMES**: Use unique names for all public symbols
- **MODULE RESOLUTION**: Use proper import/export patterns

## 🚨 REVIEW CHECKLIST (UNIVERSAL)
- [ ] All functional requirements implemented
- [ ] TDD sequence followed (Contract → Integration → E2E → Unit → Implementation)
- [ ] Real dependencies used in integration tests
- [ ] Single domain model maintained
- [ ] Library-first approach implemented
- [ ] API-first design completed
- [ ] Platform-specific requirements met
- [ ] Performance benchmarks achieved
- [ ] Security measures implemented
- [ ] Documentation complete
`;
  }

  private getCommonInstructions(platform?: string, language?: string): string {
    const languageSpecificLinting = this.getLanguageSpecificLinting(language);
    const languageUnusedImports = this.getLanguageUnusedImportsPrevention(language);
    const platformTestingConfig = this.getPlatformTestingConfiguration(platform);
    const platformCSSConfig = this.getPlatformCSSFrameworkConfiguration(platform);

    return `
${this.getConsolidatedCommonInstructions()}

## Platform-Specific Testing Configuration
${platformTestingConfig ? `\n${'='.repeat(80)}\n🧪 PLATFORM-SPECIFIC TESTING CONFIGURATION\n${'='.repeat(80)}\n${platformTestingConfig}\n${'='.repeat(80)}\n` : ''}

## Language-Specific Linting & Type Safety
${languageSpecificLinting ? `\n${'='.repeat(80)}\n🔍 LANGUAGE-SPECIFIC LINTING & TYPE SAFETY\n${'='.repeat(80)}\n${languageSpecificLinting}\n${'='.repeat(80)}\n` : ''}

## Language-Specific Unused Imports Prevention
${languageUnusedImports ? `\n${'='.repeat(80)}\n📦 LANGUAGE-SPECIFIC UNUSED IMPORTS PREVENTION\n${'='.repeat(80)}\n${languageUnusedImports}\n${'='.repeat(80)}\n` : ''}

## Universal Duplicate Definition Prevention
- **UNIQUE NAMES**: Use unique names for all interfaces, types, classes, and functions
- **NAMESPACE ORGANIZATION**: Use namespaces or modules to organize definitions
- **INTERFACE MERGING**: Use interface merging instead of duplicate definitions
- **TYPE ALIASES**: Use type aliases for generic definitions
- **BEFORE COMMIT**: Always check for duplicate definitions before committing
- **AUTO-DETECT**: Configure tools to detect and warn about duplicate definitions

## Platform-Specific CSS Framework Configuration
${platformCSSConfig ? `\n${'='.repeat(80)}\n🎨 PLATFORM-SPECIFIC CSS FRAMEWORK CONFIGURATION\n${'='.repeat(80)}\n${platformCSSConfig}\n${'='.repeat(80)}\n` : ''}

## Universal Dependency Installation Requirements
- **MANDATORY FIRST STEP**: Always install dependencies before any implementation
- **PLATFORM-SPECIFIC**: Use correct package manager for each platform
- **TESTING DEPENDENCIES**: Install testing frameworks before writing tests
- **TYPE CHECKING**: Install type checkers and linters before coding
- **DATABASE DRIVERS**: Install database drivers and ORMs before database operations
- **API TESTING**: Install API testing tools before API implementation
- **VERIFICATION**: Verify all dependencies work before proceeding

## Universal Mock Detection & Prevention
- **NO MOCK IMPLEMENTATIONS**: Never create mock functions that don't actually work
- **REAL FUNCTIONALITY**: Always implement real business logic, not placeholders
- **REAL DATABASE CONNECTIONS**: Use actual database connections, not mock data
- **REAL API ENDPOINTS**: Implement real API endpoints with proper error handling
- **REAL SUBSCRIPTIONS**: Use real-time subscriptions that actually update state
- **REAL FILE OPERATIONS**: Use actual file system operations, not mock file systems
- **REAL AUTHENTICATION**: Implement real authentication flows, not mock auth
- **REAL VALIDATION**: Use real validation logic, not mock validation
- **REAL ERROR HANDLING**: Implement comprehensive error handling, not mock errors
- **REAL TESTING**: Use real test data and real test scenarios, not mock tests

## Mock Replacement Strategies
- **DATABASE MOCKS**: Replace with real database connections using proper ORM/ODM
- **API MOCKS**: Replace with real API implementations using proper HTTP clients
- **SUBSCRIPTION MOCKS**: Replace with real-time subscriptions using WebSockets/SSE
- **FILE MOCKS**: Replace with real file system operations using proper file APIs
- **AUTH MOCKS**: Replace with real authentication using proper auth libraries
- **VALIDATION MOCKS**: Replace with real validation using proper validation libraries
- **TEST MOCKS**: Replace with real test data and real test scenarios
- **CONFIG MOCKS**: Replace with real configuration using proper config management

## Mock Detection Patterns
- **FUNCTION NAMES**: Avoid functions with "mock", "fake", "stub", "placeholder" in names
- **COMMENT PATTERNS**: Avoid comments like "// Mock implementation", "// TODO: implement"
- **RETURN VALUES**: Avoid returning null, undefined, empty objects, or hardcoded values
- **CONSOLE LOGS**: Avoid console.log statements that don't perform real operations
- **HARDCODED DATA**: Avoid hardcoded data that should come from real sources
- **EMPTY FUNCTIONS**: Avoid functions that don't perform any real operations
- **PLACEHOLDER CODE**: Avoid code that says "not implemented" or "placeholder"

## Real Implementation Requirements
- **BUSINESS LOGIC**: Implement actual business rules and calculations
- **DATA PERSISTENCE**: Use real database operations for data storage
- **API INTEGRATION**: Connect to real APIs with proper error handling
- **USER INTERACTION**: Implement real user interface interactions
- **ERROR HANDLING**: Provide comprehensive error handling and user feedback
- **VALIDATION**: Implement real input validation and data sanitization
- **AUTHENTICATION**: Use real authentication mechanisms
- **AUTHORIZATION**: Implement real permission and access control
- **LOGGING**: Use real logging mechanisms for debugging and monitoring
- **TESTING**: Write real tests that validate actual functionality
`;

    // Generate platform and language specific instructions
    const platformSpecificInstructions = this.generatePlatformSpecificInstructions(platform, language);

    return this.getConsolidatedCommonInstructions() + platformSpecificInstructions;
  }

  private async createTaskExecutionInstructions(featureId: string, platform: string, phase?: number, specification?: any, plan?: any): Promise<string> {
    try {

      // Get core TDD expert instructions
      const coreInstructions = this.getCoreInstructions(platform, this.detectLanguage(platform));


      // Get phase-specific instructions
      const phaseInstructions = await this.getPhaseSpecificInstructions(phase?.toString() || "1", platform, this.detectLanguage(platform), featureId);

      // Get common requirements with platform-specific instructions
      const commonInstructions = this.getCommonInstructions(platform, this.detectLanguage(platform));

      // Get phase-specific data sections
      let dataSections = await this.getDataSections(featureId, phase || 1, specification, plan);

      const result = `
🚨 CRITICAL INSTRUCTIONS (HIGHEST PRIORITY) 🚨

${phaseInstructions}

${coreInstructions}

${dataSections}

${commonInstructions}
    `;


      return result;
    } catch (error) {
      console.error(`[SDDImplementTool] Error in createTaskExecutionInstructions:`, error);
      throw error;
    }
  }

  private async getDataSections(featureId: string, phase: number, specification?: any, plan?: any): Promise<string> {
    // Get tasks data using robust database method with JSON repair
    let tasksData;
    try {
      const rawTasksData = await this.db.get_tasks_robust(featureId);
      // Use JsonRepairUtility to ensure data is properly parsed
      tasksData = JsonRepairUtility.validateAndRepairDbContent(rawTasksData, 'SDDImplementTool');
    } catch (error) {
      console.error(`[SDDImplementTool] Error loading tasks data:`, error);
      return 'Error loading tasks data from database.';
    }

    // Extract phase-specific tasks from the tasks JSON
    let tasksContent = 'No phase-specific tasks available.';
    if (tasksData && tasksData.taskPhases) {
      try {
        // Look for taskPhases structure (created by Tasks Tool)
        const taskPhases = tasksData.taskPhases;
        const phaseKey = `phase${phase}`;
        const phaseTasks = taskPhases[phaseKey];
        if (phaseTasks && phaseTasks.tasks) {
          // Enhanced task display with duration and parallel execution info
          tasksContent = phaseTasks.tasks.map((task: any) => {
            const duration = task.estimatedDuration || task.estimatedLOC || 'TBD';
            const parallel = task.parallelExecution?.canRunInParallel || task.parallelizable;
            const parallelInfo = parallel ? '[P]' : '[S]';
            const parallelTasks = task.parallelExecution?.parallelTasks?.length || 0;
            const parallelNote = parallel && parallelTasks > 0 ? ` (can run with ${parallelTasks} others)` : '';

            return `${task.id}: ${task.title}
  └─ Phase: ${task.tddPhase} | Duration: ${duration} | Type: ${parallelInfo}${parallelNote}
  └─ Dependencies: ${task.dependencies?.length ? task.dependencies.join(', ') : 'None'}`;
          }).join('\n\n');
        }
      } catch (error) {
        console.error('[sdd_implement] Error processing tasks data:', error);
      }
    }

    // Extract project planning information if available
    let projectPlanningContent = '';
    if (tasksData && tasksData.projectPlanning) {
      const planning = tasksData.projectPlanning;
      projectPlanningContent = `
==== PROJECT PLANNING (EXECUTION STRATEGY) ====
Total Duration: ${planning.totalEstimatedDuration || 'TBD'}
Parallel Savings: ${planning.parallelExecutionSavings || 'TBD'}
Critical Path: ${planning.executionStrategy?.criticalPath || 'TBD'}
Parallelization Level: ${planning.executionStrategy?.parallelizationLevel || 'TBD'}
Resource Requirements: ${planning.executionStrategy?.resourceRequirements || 'TBD'}

Phase Breakdown:
- Phase 1: ${planning.phaseBreakdown?.phase1?.estimatedDuration || 'TBD'} (${planning.phaseBreakdown?.phase1?.maxParallelTasks || 0} parallel tasks)
- Phase 2: ${planning.phaseBreakdown?.phase2?.estimatedDuration || 'TBD'} (${planning.phaseBreakdown?.phase2?.maxParallelTasks || 0} parallel tasks)
- Phase 3: ${planning.phaseBreakdown?.phase3?.estimatedDuration || 'TBD'} (${planning.phaseBreakdown?.phase3?.maxParallelTasks || 0} parallel tasks)
- Phase 4: ${planning.phaseBreakdown?.phase4?.estimatedDuration || 'TBD'} (${planning.phaseBreakdown?.phase4?.maxParallelTasks || 0} parallel tasks)
`;
    }

    // Extract phase-specific essential content based on phase needs
    const essentialSpecContent = this.extractEssentialSpecContent(specification, phase);
    const essentialPlanContent = await this.extractEssentialPlanContent(plan, phase);

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

**EXECUTION STRATEGY:**
- Tasks marked with [P] can run in parallel with other tasks
- Tasks marked with [S] must run sequentially
- Prioritize critical path tasks for faster completion
- Use parallel execution where possible to reduce total time
- Check dependencies before starting any task

**PHASE ${phase} DATA (PRIORITIZED BY IMPORTANCE):**
${projectPlanningContent}==== PHASE ${phase} TASKS (CRITICAL - NEVER TRUNCATED) ====
${tasksContent}
==== SPECIFICATION (ESSENTIAL CONTEXT ONLY) ====
${essentialSpecContent}
==== PLAN (ESSENTIAL CONTEXT ONLY) ====
${essentialPlanContent}
==== END DATA ====
    `;
  }





  /**
   * Get platform-specific installation commands
   */
  private getPlatformInstallationCommands(platform?: string): string {
    if (!platform) {
      return `- **All Platforms**: Install dependencies using platform-specific package manager`;
    }

    const commands: { [key: string]: string } = {
      'nextjs': `- **Next.js**: 
  \`\`\`bash
  npm install          # Install all dependencies from package.json
  # OR
  yarn install         # Alternative package manager (faster)
  \`\`\`
  **What it does**: Installs React, Next.js, TypeScript, and all project dependencies
  **Verification**: Check for node_modules/ folder and no error messages`,

      'react-native': `- **React Native**: 
  \`\`\`bash
  npm install          # Install all dependencies from package.json
  # OR  
  yarn install         # Alternative package manager
  \`\`\`
  **What it does**: Installs React Native, Metro bundler, and mobile development tools
  **Verification**: Check for node_modules/ folder and no error messages`,

      'ios-native': `- **iOS Native**: 
  \`\`\`bash
  pod install          # Install iOS dependencies from Podfile
  \`\`\`
  **What it does**: Installs iOS-specific dependencies and native modules
  **Prerequisites**: Must be run from ios/ directory, requires CocoaPods
  **Verification**: Check for Pods/ folder and .xcworkspace file`,

      'android-native': `- **Android Native**: 
  \`\`\`bash
  ./gradlew build      # Build project and install dependencies
  # OR
  ./gradlew assembleDebug  # Alternative: build debug version
  \`\`\`
  **What it does**: Downloads Android dependencies and builds the project
  **Prerequisites**: Must be run from android/ directory, requires Java/Android SDK
  **Verification**: Check for build/ folder and successful build output`,

      'java-spring': `- **Java Spring**: 
  \`\`\`bash
  mvn install          # Maven: install dependencies and build
  # OR
  ./gradlew build      # Gradle: install dependencies and build
  \`\`\`
  **What it does**: Downloads Spring Boot, database drivers, and all Java dependencies
  **Verification**: Check for target/ (Maven) or build/ (Gradle) folder`,

      'python-django': `- **Python Django**: 
  \`\`\`bash
  pip install -r requirements.txt    # Install from requirements file
  # OR
  pip install -e .                   # Install in development mode
  \`\`\`
  **What it does**: Installs Django, database adapters, and Python dependencies
  **Prerequisites**: Requires Python 3.8+ and virtual environment
  **Verification**: Check for installed packages with \`pip list\``,

      'nodejs-express': `- **Node.js Express**: 
  \`\`\`bash
  npm install          # Install all dependencies from package.json
  # OR
  yarn install         # Alternative package manager
  \`\`\`
  **What it does**: Installs Express.js, middleware, and server dependencies
  **Verification**: Check for node_modules/ folder and no error messages`,

      'go': `- **Go**: 
  \`\`\`bash
  go mod tidy          # Download dependencies and clean up
  go mod download      # Alternative: just download dependencies
  \`\`\`
  **What it does**: Downloads Go modules and updates go.mod/go.sum files
  **Prerequisites**: Requires Go 1.16+ and go.mod file
  **Verification**: Check go.mod file and no error messages`
    };

    return commands[platform] || `- **${platform}**: Install dependencies using platform-specific package manager`;
  }

  /**
   * Get platform-specific test commands
   */
  private getPlatformTestCommands(platform?: string, testType: string = 'contract'): string {
    if (!platform) {
      return `# Platform-specific test commands\n- Run tests using platform-specific test framework`;
    }

    const testCommands: { [key: string]: string } = {
      'nextjs': `- **Next.js**: 
  \`\`\`bash
  npm test -- --testPathPattern=${testType}    # Run tests matching pattern
  # OR
  npm run test:${testType}                     # If custom script exists
  \`\`\`
  **What it does**: Runs Jest tests with specific pattern matching
  **Verification**: Look for "PASS" or "FAIL" in output`,

      'react-native': `- **React Native**: 
  \`\`\`bash
  npm test -- --testPathPattern=${testType}    # Run tests matching pattern
  # OR
  npx react-native test --pattern=${testType}  # React Native specific
  \`\`\`
  **What it does**: Runs Jest tests for React Native components
  **Verification**: Look for "PASS" or "FAIL" in output`,

      'ios-native': `- **iOS Native**: 
  \`\`\`bash
  xcodebuild test -scheme YourApp -destination 'platform=iOS Simulator,name=iPhone 15'
  # OR
  xcodebuild test -workspace YourApp.xcworkspace -scheme YourApp
  \`\`\`
  **What it does**: Runs XCTest unit tests in iOS Simulator
  **Prerequisites**: Must be run from ios/ directory, requires Xcode
  **Verification**: Look for "Test Suite" results in output`,

      'android-native': `- **Android Native**: 
  \`\`\`bash
  ./gradlew test${testType.charAt(0).toUpperCase() + testType.slice(1)}UnitTest
  # OR
  ./gradlew testDebugUnitTest                  # Run all debug unit tests
  \`\`\`
  **What it does**: Runs JUnit tests for Android components
  **Prerequisites**: Must be run from android/ directory
  **Verification**: Look for "BUILD SUCCESSFUL" in output`,

      'java-spring': `- **Java Spring**: 
  \`\`\`bash
  mvn test -Dtest=*${testType.charAt(0).toUpperCase() + testType.slice(1)}Test
  # OR
  ./gradlew test --tests "*${testType.charAt(0).toUpperCase() + testType.slice(1)}Test"
  \`\`\`
  **What it does**: Runs JUnit tests with Spring Boot test context
  **Verification**: Look for "BUILD SUCCESS" and test results`,

      'python-django': `- **Python Django**: 
  \`\`\`bash
  python manage.py test --pattern=*${testType}*
  # OR
  pytest --pattern=*${testType}*               # If using pytest
  \`\`\`
  **What it does**: Runs Django tests with specific pattern matching
  **Prerequisites**: Must be run from project root with manage.py
  **Verification**: Look for "OK" or "FAILED" in output`,

      'nodejs-express': `- **Node.js Express**: 
  \`\`\`bash
  npm test -- --grep="${testType}"             # Run tests matching grep pattern
  # OR
  npm run test:${testType}                     # If custom script exists
  \`\`\`
  **What it does**: Runs Jest/Mocha tests for Express.js endpoints
  **Verification**: Look for "PASS" or "FAIL" in output`,

      'go': `- **Go**: 
  \`\`\`bash
  go test ./... -run ${testType.charAt(0).toUpperCase() + testType.slice(1)}
  # OR
  go test -v ./...                             # Run all tests with verbose output
  \`\`\`
  **What it does**: Runs Go tests with specific function name pattern
  **Prerequisites**: Must be run from Go module root
  **Verification**: Look for "PASS" or "FAIL" in output`
    };

    return `# Platform-specific test commands\n${testCommands[platform] || `- **${platform}**: Run ${testType} tests using platform-specific test framework`}`;
  }

  /**
   * Get platform-specific requirements
   */
  private getPlatformSpecificRequirements(platform?: string): string {
    if (!platform) {
      return `- **All Platforms**: Platform-specific optimization, features, and performance tuning`;
    }

    const requirements: { [key: string]: string } = {
      'nextjs': `- **Next.js Projects**: App Router optimization, SSR/SSG configuration, API routes (app/api/v1/), middleware, API versioning`,
      'react-native': `- **React Native Projects**: Platform-specific components, native modules, performance optimization, platform-specific APIs`,
      'ios-native': `- **iOS Native Projects**: Swift/SwiftUI optimization, iOS-specific features, App Store guidelines, iOS API integration`,
      'android-native': `- **Android Native Projects**: Kotlin/Java optimization, Android-specific features, Play Store guidelines, Android API integration`,
      'java-spring': `- **Java Spring Projects**: REST API optimization, Spring Boot configuration, database tuning, API documentation`,
      'python-django': `- **Python Django Projects**: Django REST Framework optimization, API serialization, database tuning, API documentation`,
      'nodejs-express': `- **Node.js Express Projects**: Express.js optimization, middleware configuration, API performance, API documentation`,
      'go': `- **Go Projects**: Gin/Echo optimization, microservices architecture, API performance, API documentation`
    };

    return requirements[platform] || `- **${platform} Projects**: Platform-specific optimization, features, and performance tuning`;
  }

  /**
   * Get language-specific linting and type safety configuration
   */
  private getLanguageSpecificLinting(language?: string): string {
    if (!language) {
      return `- **All Languages**: Use language-specific linting and type checking tools`;
    }

    const lintingConfigs: { [key: string]: string } = {
      'typescript': `- **TypeScript**: ESLint with @typescript-eslint/parser, strict tsconfig.json, no 'any' types, unique interface names`,
      'javascript': `- **JavaScript**: ESLint with recommended rules, Prettier integration, consistent coding standards`,
      'python': `- **Python**: flake8 with F401, autoflake for unused imports, mypy for type checking, black for formatting`,
      'java': `- **Java**: IDE warnings, SpotBugs for static analysis, Checkstyle for code style, built-in type system`,
      'go': `- **Go**: goimports for import organization, go vet for analysis, golangci-lint for comprehensive linting`,
      'swift': `- **Swift**: SwiftLint with unused_import rule, built-in type system, Xcode warnings`,
      'kotlin': `- **Kotlin**: ktlint for formatting, IDE warnings for unused imports, built-in type system`,
      'rust': `- **Rust**: rustc warnings, cargo clippy for linting, built-in ownership system`,
      'csharp': `- **C#**: IDE warnings, Roslyn analyzers, built-in type system, consistent naming conventions`
    };

    return lintingConfigs[language] || `- **${language}**: Use language-specific linting and type checking tools`;
  }

  /**
   * Get language-specific unused imports prevention
   */
  private getLanguageUnusedImportsPrevention(language?: string): string {
    if (!language) {
      return `- **All Languages**: Remove unused imports before committing code`;
    }

    const unusedImportsConfigs: { [key: string]: string } = {
      'typescript': `- **TypeScript/JavaScript**: ESLint rules @typescript-eslint/no-unused-vars and eslint/no-unused-vars`,
      'javascript': `- **JavaScript**: ESLint rules @typescript-eslint/no-unused-vars and eslint/no-unused-vars`,
      'python': `- **Python**: flake8 with F401 (imported but unused) and autoflake for removal`,
      'java': `- **Java**: IDE warnings and static analysis tools like SpotBugs`,
      'go': `- **Go**: goimports tool to automatically organize and remove unused imports`,
      'swift': `- **Swift**: SwiftLint with unused_import rule`,
      'kotlin': `- **Kotlin**: ktlint and IDE warnings for unused imports`,
      'rust': `- **Rust**: rustc warnings and cargo clippy for unused imports`,
      'csharp': `- **C#**: IDE warnings and Roslyn analyzers for unused using statements`
    };

    return unusedImportsConfigs[language] || `- **${language}**: Use language-specific tools to remove unused imports`;
  }

  /**
   * Get platform-specific CSS framework configuration
   */
  private getPlatformCSSFrameworkConfiguration(platform?: string): string {
    if (!platform) {
      return `- **All Platforms**: Configure platform-specific CSS framework with proper setup and integration`;
    }
    
    // Use the template but format for configuration context
    const templateResult = this.getPlatformSetupTemplate(platform, 'css');
    return templateResult.replace('CRITICAL CSS FRAMEWORK SETUP:', `- **${platform}**:`).replace('Before generating any UI components, you MUST create proper', 'Create').replace('This prevents "ugly UI" issues and ensures proper styling. Always configure', 'This ensures proper styling. Configure');
  }

  /**
   * Get platform-specific testing configuration
   */
  private getPlatformTestingConfiguration(platform?: string): string {
    if (!platform) {
      return `- **All Platforms**: Configure platform-specific testing framework with realistic coverage thresholds`;
    }

    const testingConfigs: { [key: string]: string } = {
      'nextjs': `- **Next.js**: Jest with realistic 70% coverage, exclude .d.ts and .stories, use next/core-web-vitals ESLint rules`,
      'react-native': `- **React Native**: Jest with React Native testing library, realistic coverage thresholds, platform-specific test patterns`,
      'ios-native': `- **iOS Native**: XCTest with realistic coverage, SwiftLint integration, iOS-specific test patterns`,
      'android-native': `- **Android Native**: JUnit with realistic coverage, ktlint integration, Android-specific test patterns`,
      'java-spring': `- **Java Spring**: JUnit with realistic coverage, Checkstyle integration, Spring Boot test patterns`,
      'python-django': `- **Python Django**: pytest with realistic coverage, flake8 integration, Django test patterns`,
      'nodejs-express': `- **Node.js Express**: Jest with realistic coverage, ESLint integration, Express test patterns`,
      'go': `- **Go**: Go testing package with realistic coverage, go vet integration, Go test patterns`
    };

    return testingConfigs[platform] || `- **${platform}**: Configure platform-specific testing framework with realistic coverage thresholds`;
  }

  /**
   * Get platform-specific API requirements
   */
  private getPlatformAPIRequirements(platform?: string): string {
    if (!platform) {
      return `- **All Platforms**: Platform-specific API design, documentation, and integration`;
    }

    const requirements: { [key: string]: string } = {
      'nextjs': `- **Next.js Projects**: App Router API routes (app/api/v1/), middleware, API versioning, OpenAPI integration`,
      'react-native': `- **React Native Projects**: Platform-specific API clients, native module APIs, platform-specific error handling`,
      'ios-native': `- **iOS Native Projects**: iOS-specific API integration, URLSession configuration, iOS API patterns`,
      'android-native': `- **Android Native Projects**: Android-specific API integration, Retrofit/OkHttp configuration, Android API patterns`,
      'java-spring': `- **Java Spring Projects**: Spring Boot REST APIs, OpenAPI/Swagger integration, Spring Security API protection`,
      'python-django': `- **Python Django Projects**: Django REST Framework APIs, DRF serializers, Django API documentation`,
      'nodejs-express': `- **Node.js Express Projects**: Express.js API routes, middleware, API versioning, Express API documentation`,
      'go': `- **Go Projects**: Go HTTP APIs, Gin/Echo integration, Go API documentation, microservices patterns`
    };

    return requirements[platform] || `- **${platform} Projects**: Platform-specific API design, documentation, and integration`;
  }

  /**
   * Get platform-specific UI-API requirements
   */
  private getPlatformUIAPIRequirements(platform?: string): string {
    if (!platform) {
      return `- **All Platforms**: Platform-specific API integration, error handling, and performance optimization`;
    }

    const requirements: { [key: string]: string } = {
      'nextjs': `- **Next.js Projects**: App Router API integration, Server Components, Client Components, API route handling`,
      'react-native': `- **React Native Projects**: Platform-specific API clients, native module integration, platform-specific error handling`,
      'ios-native': `- **iOS Native Projects**: URLSession integration, iOS-specific API patterns, iOS error handling`,
      'android-native': `- **Android Native Projects**: Retrofit/OkHttp integration, Android-specific API patterns, Android error handling`,
      'java-spring': `- **Java Spring Projects**: Spring Boot client integration, Spring Security, Spring Web integration`,
      'python-django': `- **Python Django Projects**: Django client integration, DRF client, Django error handling`,
      'nodejs-express': `- **Node.js Express Projects**: Express client integration, middleware integration, Express error handling`,
      'go': `- **Go Projects**: Go HTTP client integration, Go error handling, Go API patterns`
    };

    return requirements[platform] || `- **${platform} Projects**: Platform-specific API integration, error handling, and performance optimization`;
  }

  /**
   * Get critical dependencies based on platform and language
   */
  private getCriticalDependencies(platform?: string, language?: string): string {
    const dependencies: string[] = [];

    // Add testing framework based on platform
    if (platform === 'nextjs' || platform === 'react-native' || platform === 'nodejs-express') {
      dependencies.push('- **Testing Framework**: Jest, Vitest');
    } else if (platform === 'java-spring') {
      dependencies.push('- **Testing Framework**: JUnit, Mockito');
    } else if (platform === 'python-django') {
      dependencies.push('- **Testing Framework**: pytest, unittest');
    } else if (platform === 'go') {
      dependencies.push('- **Testing Framework**: Go testing package, testify');
    } else {
      dependencies.push('- **Testing Framework**: Platform-specific testing framework');
    }

    // Add type checking based on language
    if (language === 'typescript' || language === 'javascript') {
      dependencies.push('- **Type Checking**: TypeScript, ESLint');
    } else if (language === 'python') {
      dependencies.push('- **Type Checking**: mypy, pylint');
    } else if (language === 'java') {
      dependencies.push('- **Type Checking**: Built-in Java type system');
    } else if (language === 'go') {
      dependencies.push('- **Type Checking**: Built-in Go type system');
    } else {
      dependencies.push('- **Type Checking**: Language-specific type checker');
    }

    // Add linting based on language
    if (language === 'typescript' || language === 'javascript') {
      dependencies.push('- **Linting**: ESLint, Prettier');
    } else if (language === 'python') {
      dependencies.push('- **Linting**: flake8, black');
    } else if (language === 'java') {
      dependencies.push('- **Linting**: Checkstyle, SpotBugs');
    } else if (language === 'go') {
      dependencies.push('- **Linting**: golangci-lint, gofmt');
    } else {
      dependencies.push('- **Linting**: Language-specific linter');
    }

    // Add database dependencies
    dependencies.push('- **Database**: Database drivers and ORMs');

    // Add API testing based on platform
    if (platform === 'nextjs' || platform === 'react-native' || platform === 'nodejs-express') {
      dependencies.push('- **API Testing**: Supertest, axios');
    } else if (platform === 'java-spring') {
      dependencies.push('- **API Testing**: MockMvc, TestRestTemplate');
    } else if (platform === 'python-django') {
      dependencies.push('- **API Testing**: requests, Django test client');
    } else if (platform === 'go') {
      dependencies.push('- **API Testing**: httptest, testify');
    } else {
      dependencies.push('- **API Testing**: Platform-specific API testing tools');
    }

    return dependencies.join('\n');
  }

  /**
   * Generate platform and language specific instructions
   */
  private generatePlatformSpecificInstructions(platform?: string, language?: string): string {
    if (!platform) return '';

    const instructions: string[] = [];

    // Language-specific comment syntax
    if (language) {
      instructions.push(this.getLanguageSpecificInstructions(language));
    }

    // Platform-specific configuration
    instructions.push(this.getPlatformSpecificConfiguration(platform, language));

    // Platform-specific quality gates
    instructions.push(this.getPlatformSpecificQualityGates(platform));

    // Universal API testing guidance
    instructions.push(this.getUniversalApiTestingGuidance(platform));

    // UI guidance is now handled by specific tasks (TASK-025, TASK-026, TASK-027, TASK-028, TASK-035, TASK-036)

    return instructions.join('\n\n');
  }

  /**
   * Detect language based on platform
   */
  private detectLanguage(platform: string): string {
    const platformLanguageMap: { [key: string]: string } = {
      'nextjs': 'typescript',
      'react-native': 'typescript',
      'ios-native': 'swift',
      'android-native': 'kotlin',
      'java-spring': 'java',
      'python-django': 'python',
      'nodejs-express': 'typescript',
      'go': 'go',
      'web': 'javascript',
      'backend': 'typescript'
    };

    return platformLanguageMap[platform] || 'javascript';
  }

  /**
   * Get language-specific instructions
   */
  private getLanguageSpecificInstructions(language: string): string {
    const languageInstructions: { [key: string]: string } = {
      'typescript': `
## TypeScript-Specific Requirements
- **COMMENT SYNTAX**: Use // for single-line comments and /* */ for multi-line comments
- **NEVER USE**: Python-style """ docstrings in TypeScript files
- **TYPE SAFETY**: Use proper TypeScript types and interfaces
- **CONFIGURATION**: Create tsconfig.json with proper path mapping for @/ aliases

## TypeScript Linting & Type Safety
- **ESLINT CONFIG**: Use @typescript-eslint/parser and @typescript-eslint/recommended
- **TYPE DEFINITIONS**: Ensure all interfaces and types are correctly defined and exported
- **UNIQUE NAMES**: Use unique interface names to avoid conflicts across files
- **MODULE RESOLUTION**: Verify tsconfig.json includes all necessary files and correct paths
- **TYPED LINTING**: Enable typed linting with project option pointing to tsconfig.json
- **CONSISTENT TYPES**: Use consistent type definitions (interface vs type)
- **NO ANY TYPES**: Avoid using 'any' type, use proper TypeScript types
- **STRICT MODE**: Enable strict mode in tsconfig.json for better type checking

## Unused Imports Prevention
- **ESLINT RULES**: Enable @typescript-eslint/no-unused-vars and eslint/no-unused-vars
- **AUTO-REMOVE**: Configure VS Code to remove unused imports on save
- **IMPORT ORGANIZATION**: Use import sorting tools like @trivago/prettier-plugin-sort-imports
- **BEFORE COMMIT**: Always check for and remove unused imports before committing

## Duplicate Interface Prevention
- **UNIQUE NAMES**: Use unique interface names to avoid conflicts across files
- **NAMESPACE ORGANIZATION**: Use namespaces or modules to organize interfaces
- **INTERFACE MERGING**: Use interface merging instead of duplicate definitions
- **TYPE ALIASES**: Use type aliases for generic interfaces
- **BEFORE COMMIT**: Always check for duplicate interface definitions before committing`,

      'javascript': `
## JavaScript-Specific Requirements
- **COMMENT SYNTAX**: Use // for single-line comments and /* */ for multi-line comments
- **NEVER USE**: Python-style """ docstrings in JavaScript files
- **MODULE SYSTEM**: Use ES6 import/export syntax

## Unused Imports Prevention
- **ESLINT RULES**: Enable eslint/no-unused-vars rule
- **AUTO-REMOVE**: Configure VS Code to remove unused imports on save
- **IMPORT ORGANIZATION**: Use import sorting tools for consistent import order
- **BEFORE COMMIT**: Always check for and remove unused imports before committing`,

      'python': `
## Python-Specific Requirements
- **COMMENT SYNTAX**: Use # for single-line comments and """ for multi-line docstrings
- **NEVER USE**: JavaScript-style // comments in Python files
- **DOCSTRINGS**: Use proper Python docstring format

## Unused Imports Prevention
- **FLAKE8 RULE**: Use F401 rule to detect imported but unused modules
- **AUTOFLAKE**: Use autoflake --remove-all-unused-imports to auto-remove
- **ISORT**: Use isort to organize imports and remove unused ones
- **BEFORE COMMIT**: Always run flake8 and autoflake before committing`,

      'java': `
## Java-Specific Requirements
- **COMMENT SYNTAX**: Use // for single-line comments and /* */ for multi-line comments
- **PACKAGE STRUCTURE**: Follow Java package naming conventions
- **ANNOTATIONS**: Use appropriate Java annotations

## Unused Imports Prevention
- **IDE WARNINGS**: Enable unused import warnings in IntelliJ IDEA or Eclipse
- **SPOTBUGS**: Use SpotBugs to detect unused imports
- **AUTO-REMOVE**: Configure IDE to remove unused imports on save
- **BEFORE COMMIT**: Always check for and remove unused imports before committing`,

      'swift': `
## Swift-Specific Requirements
- **COMMENT SYNTAX**: Use // for single-line comments and /* */ for multi-line comments
- **DOCUMENTATION**: Use Swift documentation comments with ///

## Unused Imports Prevention
- **SWIFTLINT**: Use SwiftLint with unused_import rule
- **XCODE WARNINGS**: Enable unused import warnings in Xcode
- **AUTO-REMOVE**: Configure Xcode to remove unused imports on save
- **BEFORE COMMIT**: Always check for and remove unused imports before committing`,

      'kotlin': `
## Kotlin-Specific Requirements
- **COMMENT SYNTAX**: Use // for single-line comments and /* */ for multi-line comments
- **DOCUMENTATION**: Use KDoc format for documentation

## Unused Imports Prevention
- **KTLINT**: Use ktlint to detect and remove unused imports
- **IDE WARNINGS**: Enable unused import warnings in IntelliJ IDEA or Android Studio
- **AUTO-REMOVE**: Configure IDE to remove unused imports on save
- **BEFORE COMMIT**: Always check for and remove unused imports before committing`,

      'go': `
## Go-Specific Requirements
- **COMMENT SYNTAX**: Use // for single-line comments and /* */ for multi-line comments
- **DOCUMENTATION**: Use Go documentation comments
- **PACKAGE STRUCTURE**: Follow Go package conventions

## Unused Imports Prevention
- **GOIMPORTS**: Use goimports tool to automatically organize and remove unused imports
- **GOFMT**: Use gofmt to format code and remove unused imports
- **GO VET**: Use go vet to detect unused imports
- **BEFORE COMMIT**: Always run goimports and gofmt before committing`
    };

    return languageInstructions[language] || '';
  }

  /**
   * Get platform-specific configuration instructions
   */
  private getPlatformSpecificConfiguration(platform: string, language?: string): string {
    const configInstructions: { [key: string]: string } = {
      'nextjs': `
## Next.js Configuration Requirements
- **TSCONFIG.JSON**: Create with proper path mapping for @/ aliases
- **EXAMPLE CONFIG**:
  \`\`\`json
  {
    "compilerOptions": {
      "baseUrl": "./",
      "paths": {
        "@/*": ["src/*"]
      },
      "moduleResolution": "node",
      "esModuleInterop": true,
      "skipLibCheck": true,
      "strict": true,
      "noImplicitAny": true,
      "strictNullChecks": true,
      "noImplicitReturns": true,
      "noFallthroughCasesInSwitch": true,
      "noUncheckedIndexedAccess": true
    }
  }
  \`\`\`
- **CRITICAL**: Always create tsconfig.json before generating code with @/ imports

## TypeScript Linting Configuration
- **ESLINT CONFIG**: Create .eslintrc.js with TypeScript support
- **EXAMPLE ESLINT CONFIG**:
  \`\`\`javascript
  module.exports = {
    parser: '@typescript-eslint/parser',
    extends: [
      'eslint:recommended',
      '@typescript-eslint/recommended'
    ],
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      project: './tsconfig.json'
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-unused-vars': 'error'
    }
  };
  \`\`\`
- **TSCONFIG STRICT**: Enable strict mode for better type checking

## Environment Variable Handling
- **NEVER ASSIGN**: process.env.NODE_ENV = 'production' (read-only property)
- **USE BUILD-TIME**: Set NODE_ENV before starting application
- **CORRECT USAGE**: const isProduction = process.env.NODE_ENV === 'production'
- **BUILD COMMAND**: NODE_ENV=production npm run build

## Jest Configuration Requirements
- **E2E TESTS**: Create separate jest.e2e.config.js for E2E tests
- **TEST MATCH**: Include E2E test patterns in Jest configuration
- **COVERAGE THRESHOLDS**: Set realistic coverage thresholds (start with 70%, not 90%)
- **EXAMPLE CONFIG**:
  \`\`\`javascript
  module.exports = {
    displayName: "e2e",
    testMatch: ["**/__tests__/e2e/**/*.test.js"],
    testEnvironment: "node",
    setupFilesAfterEnv: ["<rootDir>/__tests__/e2e/setup.js"],
    collectCoverageFrom: [
      "src/**/*.{js,jsx,ts,tsx}",
      "!src/**/*.d.ts",
      "!src/**/*.stories.{js,jsx,ts,tsx}"
    ],
    coverageThreshold: {
      global: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70
      }
    }
  };
  \`\`\`
- **PACKAGE.JSON**: Add "test:e2e": "jest --config=jest.e2e.config.js"`,

      'react-native': `
## React Native Configuration Requirements
- **TSCONFIG.JSON**: Create with proper path mapping for @/ aliases
- **METRO CONFIG**: Ensure Metro bundler supports path aliases
- **EXAMPLE CONFIG**:
  \`\`\`json
  {
    "compilerOptions": {
      "baseUrl": "./",
      "paths": {
        "@/*": ["src/*"]
      }
    }
  }
  \`\`\`

## TypeScript Linting Configuration
- **ESLINT CONFIG**: Create .eslintrc.js with TypeScript support
- **EXAMPLE ESLINT CONFIG**:
  \`\`\`javascript
  module.exports = {
    parser: '@typescript-eslint/parser',
    extends: [
      'eslint:recommended',
      '@typescript-eslint/recommended'
    ],
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      project: './tsconfig.json'
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-unused-vars': 'error'
    }
  };
  \`\`\`
- **TSCONFIG STRICT**: Enable strict mode for better type checking

## Environment Variable Handling
- **NEVER ASSIGN**: process.env.NODE_ENV = 'production' (read-only property)
- **USE BABLE PLUGIN**: babel-plugin-transform-inline-environment-variables
- **CORRECT USAGE**: const isProduction = process.env.NODE_ENV === 'production'
- **BUILD-TIME**: Environment variables are inlined during build

## Jest Configuration Requirements
- **E2E TESTS**: Create separate jest.e2e.config.js for E2E tests
- **DETOX INTEGRATION**: Use Detox for React Native E2E testing
- **COVERAGE THRESHOLDS**: Set realistic coverage thresholds (start with 70%, not 90%)
- **EXAMPLE CONFIG**:
  \`\`\`javascript
  module.exports = {
    displayName: "e2e",
    testMatch: ["**/__tests__/e2e/**/*.test.js"],
    testEnvironment: "node",
    setupFilesAfterEnv: ["<rootDir>/__tests__/e2e/setup.js"],
    collectCoverageFrom: [
      "src/**/*.{js,jsx,ts,tsx}",
      "!src/**/*.d.ts",
      "!src/**/*.stories.{js,jsx,ts,tsx}"
    ],
    coverageThreshold: {
      global: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70
      }
    }
  };
  \`\`\`
- **PACKAGE.JSON**: Add "test:e2e": "jest --config=jest.e2e.config.js"`,

      'ios-native': `
## iOS Native Configuration Requirements
- **XCODE PROJECT**: Ensure proper module structure
- **SWIFT PACKAGE MANAGER**: Use SPM for dependencies
- **NO PATH ALIASES**: Use relative imports in Swift`,

      'android-native': `
## Android Native Configuration Requirements
- **GRADLE CONFIG**: Ensure proper module structure
- **KOTLIN PACKAGES**: Follow Android package conventions
- **NO PATH ALIASES**: Use relative imports in Kotlin`,

      'java-spring': `
## Java Spring Configuration Requirements
- **MAVEN/GRADLE**: Use proper dependency management
- **PACKAGE STRUCTURE**: Follow Spring Boot conventions
- **NO PATH ALIASES**: Use Java package imports

## Environment Variable Handling
- **NEVER ASSIGN**: System.setProperty("NODE_ENV", "production") (immutable)
- **USE APPLICATION.PROPERTIES**: \`spring.profiles.active=production\`
- **CORRECT USAGE**: Use @Value annotation with property injection
- **START COMMAND**: java -Dspring.profiles.active=production -jar app.jar

## Testing Configuration Requirements
- **E2E TESTS**: Use @SpringBootTest for integration testing
- **TEST PROFILES**: Create application-test.properties for test environment
- **EXAMPLE CONFIG**:
  \`\`\`java
  @SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
  @ActiveProfiles("test")
  class E2ETest {
    // E2E test implementation
  }
  \`\`\`
- **MAVEN/GRADLE**: Configure test profiles in build files`,

      'python-django': `
## Python Django Configuration Requirements
- **PYTHON PATH**: Ensure proper module structure
- **DJANGO SETTINGS**: Configure INSTALLED_APPS properly
- **NO PATH ALIASES**: Use Python module imports

## Environment Variable Handling
- **NEVER ASSIGN**: os.environ['NODE_ENV'] = 'production' (immutable)
- **USE DJANGO SETTINGS**: DEBUG = False in settings.py
- **CORRECT USAGE**: DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'
- **START COMMAND**: NODE_ENV=production python manage.py runserver

## Testing Configuration Requirements
- **E2E TESTS**: Use Django's LiveServerTestCase for E2E testing
- **TEST SETTINGS**: Create test_settings.py for test environment
- **EXAMPLE CONFIG**:
  \`\`\`python
  from django.test import LiveServerTestCase
  from selenium import webdriver
  
  class E2ETest(LiveServerTestCase):
      def setUp(self):
          self.browser = webdriver.Chrome()
      
      def test_e2e_scenario(self):
          # E2E test implementation
          pass
  \`\`\`
- **MANAGE.PY**: Configure test settings in manage.py`,

      'nodejs-express': `
## Node.js Express Configuration Requirements
- **PACKAGE.JSON**: Use proper module structure
- **TSCONFIG.JSON**: Create if using TypeScript
- **NO PATH ALIASES**: Use relative imports or npm packages

## Environment Variable Handling
- **NEVER ASSIGN**: process.env.NODE_ENV = 'production' (read-only property)
- **USE DOTENV**: require('dotenv').config() for .env files
- **CORRECT USAGE**: const isProduction = process.env.NODE_ENV === 'production'
- **START COMMAND**: NODE_ENV=production node server.js

## Jest Configuration Requirements
- **E2E TESTS**: Create separate jest.e2e.config.js for E2E tests
- **SUPERTEST**: Use Supertest for API E2E testing
- **COVERAGE THRESHOLDS**: Set realistic coverage thresholds (start with 70%, not 90%)
- **EXAMPLE CONFIG**:
  \`\`\`javascript
  module.exports = {
    displayName: "e2e",
    testMatch: ["**/__tests__/e2e/**/*.test.js"],
    testEnvironment: "node",
    setupFilesAfterEnv: ["<rootDir>/__tests__/e2e/setup.js"],
    collectCoverageFrom: [
      "src/**/*.{js,jsx,ts,tsx}",
      "!src/**/*.d.ts",
      "!src/**/*.stories.{js,jsx,ts,tsx}"
    ],
    coverageThreshold: {
      global: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70
      }
    }
  };
  \`\`\`
- **PACKAGE.JSON**: Add "test:e2e": "jest --config=jest.e2e.config.js"`,

      'go': `
## Go Configuration Requirements
- **GO MOD**: Use Go modules for dependency management
- **PACKAGE STRUCTURE**: Follow Go conventions
- **NO PATH ALIASES**: Use Go package imports`
    };

    return configInstructions[platform] || '';
  }

  /**
   * Get platform-specific quality gates
   */
  private getPlatformSpecificQualityGates(platform: string): string {
    const qualityGates: { [key: string]: string } = {
      'nextjs': `
## Next.js Quality Gates
- **Code Quality**: ESLint, Prettier, TypeScript checks
- **Performance**: Core Web Vitals compliance
- **Accessibility**: WCAG 2.1 AA compliance
- **Browser Compatibility**: Chrome, Firefox, Safari, Edge`,

      'react-native': `
## React Native Quality Gates
- **Code Quality**: ESLint, Prettier, TypeScript checks
- **Performance**: 60fps animations, <3s load time
- **Platform Testing**: iOS and Android testing
- **Accessibility**: Platform-specific accessibility`,

      'ios-native': `
## iOS Native Quality Gates
- **Code Quality**: SwiftLint, SwiftFormat
- **Performance**: 60fps UI, <2s app launch
- **App Store**: App Store guidelines compliance
- **Accessibility**: VoiceOver support`,

      'android-native': `
## Android Native Quality Gates
- **Code Quality**: Android Lint, ktlint
- **Performance**: 60fps UI, <2s app launch
- **Play Store**: Play Store guidelines compliance
- **Accessibility**: TalkBack support`,

      'java-spring': `
## Java Spring Quality Gates
- **Code Quality**: Checkstyle, SpotBugs, PMD
- **Performance**: <100ms API response time
- **Security**: OWASP compliance
- **Testing**: JUnit, Mockito, Integration tests`,

      'python-django': `
## Python Django Quality Gates
- **Code Quality**: Flake8, Black, isort
- **Performance**: <100ms API response time
- **Security**: Django security best practices
- **Testing**: pytest, Django test framework`,

      'nodejs-express': `
## Node.js Express Quality Gates
- **Code Quality**: ESLint, Prettier
- **Performance**: <100ms API response time
- **Security**: Helmet.js, input validation
- **Testing**: Jest, Supertest`,

      'go': `
## Go Quality Gates
- **Code Quality**: gofmt, golint, go vet
- **Performance**: <50ms API response time
- **Security**: Go security best practices
- **Testing**: Go testing framework`
    };

    return qualityGates[platform] || '';
  }

  /**
   * Get generic testing steps template
   */
  private getTestingStepsTemplate(testType: string, taskId: string, testCommands: string): string {
    return `
## 🚨 MANDATORY TESTING STEPS
**AFTER CREATING ${testType.toUpperCase()} TESTS, YOU MUST:**

### 1. Run ${testType} Tests (${taskId})
\`\`\`bash
${testCommands}
\`\`\`

### 2. Verify ${testType} Results (${taskId.replace('RUN', 'VERIFY')})
- **Test Framework**: Ensure ${testType} testing framework is properly configured
- **Test Discovery**: Verify ${testType} tests are discovered and can be run
- **Test Execution**: Confirm ${testType} tests execute successfully
- **Test Environment**: Verify ${testType} test environment is set up correctly
`;
  }

  /**
   * Get templated platform setup instructions
   */
  private getPlatformSetupTemplate(platform: string, setupType: 'typescript' | 'css' | 'language'): string {
    const templates = {
      typescript: {
        configFile: 'tsconfig.json',
        baseRequirements: 'strict: true',
        tools: '@typescript-eslint/parser, @typescript-eslint/eslint-plugin, prettier',
        platforms: {
          nextjs: { 
            additional: 'baseUrl: ".", paths: {"@/*": ["./src/*"]}, jsx: "react", module: "esnext"' 
          },
          'react-native': { 
            additional: 'jsx: "react-native", module: "esnext"' 
          },
          'nodejs-express': { 
            additional: 'module: "commonjs", target: "es2020"' 
          }
        }
      },
      css: {
        configFiles: 'tailwind.config.js, postcss.config.js, globals.css',
        platforms: {
          nextjs: { 
            framework: 'Tailwind CSS',
            additional: 'postcss.config.js, globals.css'
          },
          'react-native': { 
            framework: 'NativeWind',
            additional: 'babel.config.js, metro.config.js'
          },
          'ios-native': { 
            framework: 'SwiftUI styling patterns and design tokens',
            additional: 'design system configuration'
          },
          'android-native': { 
            framework: 'Material Design 3 theming and design tokens',
            additional: 'theme configuration'
          },
          'java-spring': { 
            framework: 'Thymeleaf templates with Bootstrap or custom CSS',
            additional: 'template configuration'
          }
        }
      },
      language: {
        platforms: {
          typescript: {
            configFile: 'tsconfig.json',
            requirements: 'strict: true',
            tools: '@typescript-eslint/parser, @typescript-eslint/eslint-plugin, prettier'
          },
          javascript: {
            configFile: 'package.json',
            requirements: 'ESLint configuration and scripts',
            tools: 'ESLint and Prettier'
          },
          swift: {
            configFile: 'Package.swift',
            requirements: 'Swift 5.9+',
            tools: 'SwiftLint'
          },
          kotlin: {
            configFile: 'build.gradle.kts',
            requirements: 'Kotlin 1.9+',
            tools: 'ktlint'
          },
          java: {
            configFile: 'pom.xml',
            requirements: 'Java 17+',
            tools: 'SpotBugs and Checkstyle'
          }
        }
      }
    };

    const template = templates[setupType];
    const platformConfig = template.platforms[platform];
    
    if (!platformConfig) return '';

    const { configFile, requirements, tools, framework, additional } = platformConfig;
    const setupTypeUpper = setupType.toUpperCase();
    const languageName = setupType === 'language' ? platform : setupType;
    
    if (setupType === 'css') {
      const cssTemplate = template as any;
      return `CRITICAL ${setupTypeUpper} FRAMEWORK SETUP: Before generating any UI components, you MUST create proper ${framework} configuration (${cssTemplate.configFiles}${additional ? `, ${additional}` : ''}). This prevents "ugly UI" issues and ensures proper styling. Always configure ${framework} before creating UI components.`;
    } else {
      return `CRITICAL ${setupTypeUpper} SETUP: Before generating any ${languageName} code, you MUST create proper ${configFile} with "${requirements}"${additional ? `, ${additional}` : ''}, and comprehensive linting configuration. This prevents ${setupType === 'typescript' ? 'type' : 'compilation'} errors and ensures code quality. Always install and configure ${tools} for proper linting and formatting.`;
    }
  }

  /**
   * Get platform-specific TypeScript setup instructions
   */
  private getPlatformTypeScriptSetup(platform?: string, language?: string): string {
    if (!platform || language !== 'typescript') {
      return '';
    }
    return this.getPlatformSetupTemplate(platform, 'typescript');
  }

  /**
   * Get platform-specific CSS framework setup instructions
   */
  private getPlatformCSSFrameworkSetup(platform?: string): string {
    if (!platform) {
      return '';
    }
    return this.getPlatformSetupTemplate(platform, 'css');
  }

  /**
   * Get language-specific setup instructions
   */
  private getLanguageSpecificSetup(language?: string): string {
    if (!language) {
      return '';
    }
    return this.getPlatformSetupTemplate(language, 'language');
  }

  /**
   * Get core instructions
   */
  private getCoreInstructions(platform?: string, language?: string): string {
    const platformTypeScriptSetup = this.getPlatformTypeScriptSetup(platform, language);
    const platformCSSSetup = this.getPlatformCSSFrameworkSetup(platform);
    const languageSpecificSetup = this.getLanguageSpecificSetup(language);

    return `🚨🚨🚨 TDD EXPERT INSTRUCTIONS (CRITICAL) 🚨🚨🚨

You are a Senior TDD Expert with 10+ years of experience, known for writing comprehensive tests before any code and following the RED-GREEN-REFACTOR cycle religiously. Your reputation as a professional developer depends on delivering high-quality, tested implementations that work reliably in production.

🚨 MANDATORY TDD CYCLE:
1. RED: Write failing tests first
2. GREEN: Write minimal code to pass tests
3. REFACTOR: Improve code while keeping tests green

🚨 CRITICAL RULES:
- NEVER skip tests, never write placeholder code
- ALWAYS implement real functionality that connects to databases
- ALWAYS provide professional-grade user experiences
- Execute implementation directly using only information provided below

${platformTypeScriptSetup ? `\n${'='.repeat(80)}\n🔧 PLATFORM TYPESCRIPT SETUP\n${'='.repeat(80)}\n${platformTypeScriptSetup}\n${'='.repeat(80)}\n` : ''}

${languageSpecificSetup ? `\n${'='.repeat(80)}\n⚙️  LANGUAGE-SPECIFIC SETUP\n${'='.repeat(80)}\n${languageSpecificSetup}\n${'='.repeat(80)}\n` : ''}

CRITICAL DUPLICATE PREVENTION: NEVER create duplicate interface definitions with conflicting properties. Always use unique names, namespaces, or interface merging. Check for existing definitions before creating new ones. This prevents compilation errors and ensures code consistency.

${platformCSSSetup ? `\n${'='.repeat(80)}\n🎨 CSS FRAMEWORK SETUP\n${'='.repeat(80)}\n${platformCSSSetup}\n${'='.repeat(80)}\n` : ''}

CRITICAL DEPENDENCY INSTALLATION: ALWAYS install all required dependencies before any implementation. Use platform-specific package managers (npm, yarn, pip, maven, gradle, go mod, etc.) and verify all dependencies work correctly. Missing dependencies cause implementation failures and poor developer experience.

CRITICAL MOCK PREVENTION: NEVER create mock implementations, placeholder functions, or fake data. Always implement real functionality with actual database connections, real API endpoints, real-time subscriptions, and comprehensive error handling. Mock implementations cause production failures and poor user experiences.`;
  }


  /**
   * Resolve feature ID from most recent feature that has all required components
   */
  private async resolveFeatureId(): Promise<string> {
    const allFeatures = await this.db.get_all_features_robust();
    if (!allFeatures.length) {
      throw new Error('No features found. Please create a feature first using sdd_specify command.');
    }

    // Find a feature that has specification, plan, and tasks
    for (const feature of allFeatures) {
      try {
        const hasSpec = await this.db.get_specification_robust(feature.id);
        const hasPlan = await this.db.get_plan_robust(feature.id);
        const hasTasks = await this.db.get_tasks_robust(feature.id);


        if (hasSpec && hasPlan && hasTasks) {
          return feature.id;
        }
      } catch (error) {
        console.error(`[SDDImplementTool] Error checking feature ${feature.id}:`, error.message);
        continue;
      }
    }

    // If no complete feature found, return the most recent one and let the error handling deal with it
    const mostRecentFeature = allFeatures[0];
    return mostRecentFeature.id;
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
  private async extractEssentialPlanContent(planContent: any, phase: number): Promise<string> {
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

        // Enhanced plan content with detailed descriptions (with caching)
        const cacheKey = `plan-content-${phase}-${JSON.stringify(actualPlanContent).slice(0, 100)}`;
        const enhancedPlanDescriptions = await this.performanceOptimizer.getCachedData(
          cacheKey,
          () => Promise.resolve(this.planCommunicationEnhancer.extractDetailedPlanDescriptions(actualPlanContent, phase)),
          10 * 60 * 1000 // 10 minutes cache
        ) || this.planCommunicationEnhancer.extractDetailedPlanDescriptions(actualPlanContent, phase);
        
        // Combine essential data with enhanced descriptions
        const combinedContent = {
          essentialData: filteredEssential,
          enhancedDescriptions: enhancedPlanDescriptions
        };

        // Cache the combined content for future use
        this.performanceOptimizer.addDataCaching(
          `combined-plan-${phase}-${Date.now()}`,
          combinedContent,
          5 * 60 * 1000 // 5 minutes cache
        );

        return JSON.stringify(combinedContent, null, 2);
      }

      // Handle string content with JSON repair
      if (typeof planContent === 'string') {
        const parsed = JsonRepairUtility.safeParseJson(planContent, 'SDDImplementTool');
        if (parsed) {
          // Enhanced plan content with detailed descriptions (with caching)
          const cacheKey = `plan-content-string-${phase}-${parsed.toString().slice(0, 100)}`;
          const enhancedPlanDescriptions = await this.performanceOptimizer.getCachedData(
            cacheKey,
            () => Promise.resolve(this.planCommunicationEnhancer.extractDetailedPlanDescriptions(parsed, phase)),
            10 * 60 * 1000 // 10 minutes cache
          ) || this.planCommunicationEnhancer.extractDetailedPlanDescriptions(parsed, phase);
          
          // Combine essential data with enhanced descriptions
          const combinedContent = {
            essentialData: parsed,
            enhancedDescriptions: enhancedPlanDescriptions
          };
          
          // Cache the combined content for future use
          this.performanceOptimizer.addDataCaching(
            `combined-plan-string-${phase}-${Date.now()}`,
            combinedContent,
            5 * 60 * 1000 // 5 minutes cache
          );
          
          return JSON.stringify(combinedContent, null, 2);
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
      1: { // Foundations & Data
        critical: ['apiSpecification', 'userScenarios', 'technologyStack'],
        optional: ['edgeCases', 'constitutionalGates', 'businessContext']
      },
      2: { // Application & Core Integration
        critical: ['apiSpecification', 'userScenarios', 'technologyStack'],
        optional: ['edgeCases', 'businessContext', 'constitutionalGates']
      },
      3: { // API-First, Platform & Smoke
        critical: ['apiSpecification', 'technologyStack', 'constitutionalGates'],
        optional: ['userScenarios', 'edgeCases', 'businessContext']
      },
      4: { // Full Integration & Verification
        critical: ['businessContext', 'constitutionalGates', 'apiSpecification'],
        optional: ['userScenarios', 'technologyStack', 'edgeCases']
      }
    };

    return priorities[phase] || { critical: [], optional: [] };
  }

  /**
   * Get phase-specific plan content priorities
   */
  private getPhasePlanPriorities(phase: number): { critical: string[], optional: string[] } {
    const priorities = {
      1: { // Foundations & Data
        critical: ['projectStructure', 'technicalContext', 'implementationPhases'],
        optional: ['timeEstimation', 'constitutionalGates']
      },
      2: { // Application & Core Integration
        critical: ['projectStructure', 'implementationPhases', 'technicalContext'],
        optional: ['timeEstimation', 'constitutionalGates']
      },
      3: { // API-First, Platform & Smoke
        critical: ['projectStructure', 'technicalContext', 'constitutionalGates'],
        optional: ['implementationPhases', 'timeEstimation']
      },
      4: { // Full Integration & Verification
        critical: ['projectStructure', 'constitutionalGates', 'implementationPhases'],
        optional: ['technicalContext', 'timeEstimation']
      }
    };

    return priorities[phase] || { critical: ['projectStructure'], optional: [] };
  }

  /**
   * Get performance metrics for monitoring and optimization
   */
  public getPerformanceMetrics(): any {
    return {
      errorRecovery: this.errorRecoveryManager.getErrorStatistics(),
      performance: this.performanceOptimizer.getPerformanceMetrics(),
      timestamp: new Date().toISOString()
    };
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

  /**
   * Success helper method
   */
  private success(message: string, data?: any): any {
    return {
      success: true,
      message,
      ...(data && { data })
    };
  }

  /**
   * Get universal API testing guidance to prevent platform-specific testing issues
   */
  private getUniversalApiTestingGuidance(platform: string): string {
    const baseGuidance = `
## 🚨 UNIVERSAL API TESTING PATTERN (PREVENTS PLATFORM CONTEXT ERRORS)

### ❌ COMMON ERROR TO AVOID
**"Trying to import Next.js API routes directly, but they expect specific Next.js context"**

### ✅ SOLUTION: Context Adapter Pattern

#### 1. Abstract Business Logic (Platform-Agnostic)
\`\`\`typescript
// ✅ GOOD: Pure business logic - easily testable
export class UserController {
  static async createUser(userData: UserData): Promise<User> {
    // Pure business logic - no platform dependencies
    const user = await UserService.create(userData);
    return user;
  }
  
  static async getUser(id: string): Promise<User> {
    // Pure business logic - no platform dependencies
    return await UserService.findById(id);
  }
}
\`\`\`

#### 2. Create Context Adapters
\`\`\`typescript
// ✅ Universal API context interface
interface ApiContext {
  getBody(): any;
  getParams(): Record<string, string>;
  getQuery(): Record<string, string>;
  sendResponse(data: any, status?: number): void;
  sendError(error: string, status?: number): void;
}

// ✅ Next.js context adapter
export class NextJsContextAdapter implements ApiContext {
  constructor(private req: NextApiRequest, private res: NextApiResponse) {}
  
  getBody() { return this.req.body; }
  getParams() { return this.req.query; }
  getQuery() { return this.req.query; }
  sendResponse(data: any, status = 200) { 
    this.res.status(status).json(data); 
  }
  sendError(error: string, status = 500) { 
    this.res.status(status).json({ error }); 
  }
}

// ✅ Test context adapter
export class TestContextAdapter implements ApiContext {
  constructor(private mockReq: any, private mockRes: any) {}
  
  getBody() { return this.mockReq.body; }
  getParams() { return this.mockReq.params; }
  getQuery() { return this.mockReq.query; }
  sendResponse(data: any, status = 200) { 
    this.mockRes.status = status;
    this.mockRes.data = data;
    return { status, data };
  }
  sendError(error: string, status = 500) { 
    this.mockRes.status = status;
    this.mockRes.error = error;
    return { status, error };
  }
}
\`\`\`

#### 3. Thin API Route Wrappers
\`\`\`typescript
// ✅ Next.js API route (thin wrapper)
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const context = new NextJsContextAdapter(req, res);
  return UserController.createUser(context.getBody())
    .then(user => context.sendResponse(user))
    .catch(err => context.sendError(err.message, 500));
}

// ✅ Express route (thin wrapper)
app.post('/api/users', (req, res) => {
  const context = new ExpressContextAdapter(req, res);
  return UserController.createUser(context.getBody())
    .then(user => context.sendResponse(user))
    .catch(err => context.sendError(err.message, 500));
});
\`\`\`

#### 4. Universal Testing Pattern
\`\`\`typescript
// ✅ Test business logic directly (no platform context needed)
describe('UserController', () => {
  it('should create user', async () => {
    const mockUserData = { name: 'John', email: 'john@example.com' };
    const result = await UserController.createUser(mockUserData);
    expect(result).toBeDefined();
    expect(result.name).toBe('John');
  });
  
  it('should handle API context', async () => {
    const mockContext = new TestContextAdapter(
      { body: { name: 'John', email: 'john@example.com' } },
      {}
    );
    
    const result = await UserController.createUser(mockContext.getBody());
    expect(result).toBeDefined();
  });
});
\`\`\`

### 🎯 BENEFITS
- **✅ No platform context errors** - Business logic is platform-agnostic
- **✅ Easy testing** - Test business logic without mocking platform APIs
- **✅ Platform flexibility** - Same logic works with Next.js, Express, etc.
- **✅ Maintainable** - Clear separation of concerns
- **✅ Industry standard** - Follows established patterns

### 🚨 MANDATORY IMPLEMENTATION
- **ALWAYS** abstract business logic into pure functions/classes
- **ALWAYS** use context adapters for platform-specific code
- **ALWAYS** test business logic independently of platform context
- **NEVER** import platform API routes directly in tests
- **NEVER** mix business logic with platform-specific code`;

    // Add platform-specific examples
    const platformExamples: { [key: string]: string } = {
      'nextjs': `

### 🔧 Next.js Specific Implementation
\`\`\`typescript
// pages/api/users/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { UserController } from '@/controllers/UserController';
import { NextJsContextAdapter } from '@/adapters/NextJsContextAdapter';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const context = new NextJsContextAdapter(req, res);
  
  switch (req.method) {
    case 'POST':
      return UserController.createUser(context.getBody())
        .then(user => context.sendResponse(user, 201))
        .catch(err => context.sendError(err.message, 400));
    case 'GET':
      return UserController.getUsers(context.getQuery())
        .then(users => context.sendResponse(users))
        .catch(err => context.sendError(err.message, 500));
    default:
      return context.sendError('Method not allowed', 405);
  }
}
\`\`\``,

      'nodejs-express': `

### 🔧 Express Specific Implementation
\`\`\`typescript
// routes/users.js
import { UserController } from '@/controllers/UserController';
import { ExpressContextAdapter } from '@/adapters/ExpressContextAdapter';

app.post('/api/users', (req, res) => {
  const context = new ExpressContextAdapter(req, res);
  return UserController.createUser(context.getBody())
    .then(user => context.sendResponse(user, 201))
    .catch(err => context.sendError(err.message, 400));
});
\`\`\``,

      'java-spring': `

### 🔧 Spring Boot Specific Implementation
\`\`\`java
// UserController.java
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody UserData userData) {
        try {
            User user = UserService.createUser(userData);
            return ResponseEntity.status(201).body(user);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(null);
        }
    }
}
\`\`\``
    };

    return baseGuidance + (platformExamples[platform] || '');
  }



}
