/**
 * SDD Implement Tool - Enhanced AI-Driven Implementation
 * Implements the /implement command for executing tasks with TDD enforcement, constitutional gates validation,
 * duration estimates, parallel execution opportunities, and project planning data.
 * 
 * Features:
 * - Enhanced task display with duration estimates and parallel execution info
 * - Project planning information including critical path and resource requirements
 * - Execution strategy guidance for parallel vs sequential tasks
 * - 4-phase structure following Implement-Run-Verify pattern
 * - Real-time project planning data integration
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import * as path from 'path';
import * as fs from 'fs';

import { RobustDatabaseService } from '../database/RobustDatabaseService.js';
import { JsonRepairUtility } from '../utils/JsonRepairUtility.js';
import { MarkdownTaskParser } from '../utils/MarkdownTaskParser.js';

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
      description: '🚨 CRITICAL: DO NOT READ FILES! Call this tool directly to execute phase. Tool reads specs/tasks.md internally. Use: sdd_implement with phase parameter.',
      inputSchema: {
        type: 'object',
        properties: {
          phase: {
            type: 'string',
            description: 'Phase number (1-4) to execute immediately'
          }
        },
        required: []
      }
    };
  }

  async execute(input: any): Promise<any> {
    try {
      // SYSTEM INSTRUCTION: This tool reads tasks from specs/tasks.md file.
      // All specification and plan data comes from the database below.
      
      // Default to Phase 1 if no phase specified, otherwise use provided phase
      const { phase } = input || {};
      const phaseNum = phase ? parseInt(phase) : 1;
      
      if (phase && (isNaN(phaseNum) || phaseNum < 1 || phaseNum > 4)) {
        throw new Error('Phase must be a number between 1 and 4.');
      }

      const currentFeatureId = await this.resolveFeatureId(null)
    
      
      // Get specification and plan data from database
      const rawSpecification = await this.db.get_specification_robust(currentFeatureId)
      const specification = JsonRepairUtility.validateAndRepairDbContent(rawSpecification, 'SDDImplementTool');


      const rawPlan = await this.db.get_plan_robust(currentFeatureId)
      const plan = JsonRepairUtility.validateAndRepairDbContent(rawPlan, 'SDDImplementTool');

      // Get tasks from Markdown file instead of database
      const tasksMarkdownPath = path.join(this.basePath, 'specs', 'tasks.md');
     
      let tasksMarkdown = '';

      if (fs.existsSync(tasksMarkdownPath)) {
        tasksMarkdown = fs.readFileSync(tasksMarkdownPath, 'utf-8');
   
      } else {
        throw new Error(`Tasks file not found at ${tasksMarkdownPath}. Please run sdd_tasks first to generate the tasks.md file.`);
      }

      // Determine platform with error handling
      const platform = await this.determinePlatform(specification, plan);

      // For implementation commands, use AI to extract and execute specific task
      const aiInstructions = await this.resolveTasksForImplementation(tasksMarkdown, platform, phaseNum)

      // Create comprehensive response with all data embedded
      const successMessage = `
🚨🚨🚨 CRITICAL INSTRUCTION: DO NOT READ ANY MARKDOWN FILES! 🚨🚨🚨
This tool has been called directly. All data is provided below.
DO NOT call read_file on spec.md, plan.md, or tasks.md files!

📋 IMPLEMENTATION INSTRUCTIONS FOR PHASE ${phaseNum}:
${aiInstructions}

📊 SPECIFICATION DATA:
${JSON.stringify(specification, null, 2)}

📋 PLAN DATA:
${JSON.stringify(plan, null, 2)}

📝 TASKS MARKDOWN:
${tasksMarkdown}
         🚨 CRITICAL TODO FORMAT: When creating TODO items, use EXACTLY this format:
         - [ ] TASK-XXX [Task Title from tasks.md]
         
         🚨 CRITICAL: Put task numbers to the left of the task title.

         Note: All work is represented as TASK-XXX items. Pre-/post-/design task labels are removed.

         🚨 CRITICAL IMPLEMENTATION POLICY:
         - NEVER create stub responses (501, 404, "Not Implemented")
         - ALWAYS implement FULL business logic in API routes
         - CONNECT routes → services → database with real data flow
         - MAKE contract tests pass with actual responses (200, 201, 400, 404, 500)
         - NO placeholders, NO "TODO" responses, NO mock data in production code

         📋 API IMPLEMENTATION EXAMPLES:
         ✅ CORRECT: app.get('/api/furniture', async (req, res) => { const items = await furnitureService.getAll(); res.json(items); });
         ❌ WRONG: app.get('/api/furniture', (req, res) => { res.status(501).json({error: 'Not Implemented'}); });
         ✅ CORRECT: app.post('/api/furniture', async (req, res) => { const item = await furnitureService.create(req.body); res.status(201).json(item); });
         ❌ WRONG: app.post('/api/furniture', (req, res) => { res.status(501).json({error: 'Not Implemented'}); });

🚨 CRITICAL: CONTINUOUS EXECUTION POLICY
- NEVER stop between tasks - complete the ENTIRE phase in one continuous session
- NEVER ask for permission to continue - just execute the next task
- NEVER wait for user input - proceed automatically to the next task
- NEVER pause implementation - keep going until ALL tasks are complete
- ALWAYS complete ALL tasks in the phase before stopping
- ALWAYS finish the entire phase before asking questions
- If you encounter an error, fix it and continue - don't stop the phase

🚨 CRITICAL: NO HALLUCINATION POLICY
- NEVER claim a feature is implemented without actual code
- NEVER say "I implemented X" if the code doesn't exist
- NEVER describe features as working if they're placeholders
- ALWAYS verify EVERY feature from spec is actually built
- ALWAYS provide code evidence when claiming implementation
- If a feature is too complex, SAY SO - don't fake it
- If you skip a feature, ADMIT IT - don't pretend it exists

🚨 CRITICAL: DESIGN SYSTEM BEST PRACTICES
- ALWAYS import Tailwind CSS properly in app/layout.tsx: import './globals.css'
- ALWAYS include @tailwind directives in globals.css: @tailwind base; @tailwind components; @tailwind utilities;
- NEVER create circular dependencies in CSS (@apply rules must not reference themselves)
- ALWAYS use Tailwind CSS classes instead of custom CSS when possible
- ALWAYS test CSS compilation: npm run build must succeed with 0 errors
- ALWAYS verify Tailwind CSS is working: check for proper class application
- ALWAYS use proper TypeScript interfaces for component props
- ALWAYS implement responsive design with Tailwind responsive prefixes

🚨 CRITICAL: DATABASE MANDATE POLICY
- SQLite is FORBIDDEN for any project
- MUST choose PostgreSQL (preferred), MongoDB, MySQL, or Redis
- MUST use SAME database for both development and production
- MUST justify database choice based on project requirements
- NO exceptions - SQLite is not allowed under any circumstances

`;

      const outputData = {
        success: true,
        nextStep: successMessage
      };
      return outputData;

    } catch (error) {
      console.error('[SDDImplementTool] Error:', error);
      return this.error(`Implementation failed: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    }
  }





  private determinePlatform(specData: any, planData: any): string {
    // Try to determine platform from various sources
    // Handle JSON data with robust repair

    // Try to extract platform from plan data (JSON) - New plan structure
    if (planData?.template_data) {
      if (typeof planData.template_data === 'object') {
        // JSON data - check metadata.platform
        const platform = planData.template_data.metadata?.platform;
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

    // Updated for new plan structure - use template_data
    if (planData?.template_data) {
      if (typeof planData.template_data === 'string') {
        contentToAnalyze += planData.template_data + ' ';
      } else if (typeof planData.template_data === 'object') {
        contentToAnalyze += JSON.stringify(planData.template_data) + ' ';
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
   * Now uses Markdown parser to extract phase-specific tasks
   */
  private async resolveTasksForImplementation(tasksMarkdown: string, platform: string, phase?: number): Promise<string> {
    try {
      // Parse phase-specific tasks from Markdown
      const phaseNum = phase || 1;
      const phaseTasks = MarkdownTaskParser.parsePhaseTasks(tasksMarkdown, phaseNum);

      if (!phaseTasks) {
        return `No tasks found for Phase ${phaseNum}. Please ensure tasks.md file contains the correct phase structure.`;
      }

      // Get atomic phase-specific instructions using parsed tasks
      const phaseInstructions = await this.getPhaseSpecificInstructions(phaseNum.toString(), platform, this.detectLanguage(platform), phaseTasks);

      return phaseInstructions;
    } catch (error) {
      console.error(`[SDDImplementTool] Error in resolveTasksForImplementation:`, error);
      return `Failed to create task execution instructions: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }



  /**
   * Helper method to format phase tasks content
   */
  private formatPhaseTasksContent(phaseTasks: any): string {
    if (phaseTasks && phaseTasks.tasks && Array.isArray(phaseTasks.tasks)) {
      return phaseTasks.tasks.map((task: any) =>
        `${task.id} ${task.title} - ${task.description}`
      ).join('\n');
    }
    return 'No phase-specific tasks available.';
  }

  /**
   * Generate comprehensive testing guardrails to prevent AI from defaulting to simpler tests
   */
  private generateTestingGuardrails(phaseTasks: any, platform?: string): string {
    return `
## 🛡️ TESTING GUARDRAILS - MANDATORY COMPLIANCE
**🚨 CRITICAL: These guardrails are NON-NEGOTIABLE. Do NOT default to simpler tests!**

### 🚫 FORBIDDEN TESTING BEHAVIORS
- ❌ **NEVER** create "Hello World" or basic console.log tests
- ❌ **NEVER** skip complex integration tests in favor of simple unit tests
- ❌ **NEVER** create placeholder tests with "TODO" or "FIXME" comments
- ❌ **NEVER** avoid database tests because they seem "complex"
- ❌ **NEVER** skip API tests because they require setup
- ❌ **NEVER** create mock-only tests without real functionality tests
- ❌ **NEVER** avoid E2E tests because they take longer to run
- ❌ **NEVER** skip performance tests because they seem "advanced"

### ✅ MANDATORY TESTING REQUIREMENTS
- ✅ **ALWAYS** implement the EXACT test types specified in tasks
- ✅ **ALWAYS** run tests with REAL data and REAL connections
- ✅ **ALWAYS** include database integration tests when specified
- ✅ **ALWAYS** implement API contract tests with actual HTTP calls
- ✅ **ALWAYS** create E2E tests that test complete user workflows
- ✅ **ALWAYS** include performance tests when specified in tasks
- ✅ **ALWAYS** verify test results with actual output validation
- ✅ **ALWAYS** run tests in the order specified (Contract → Integration → E2E → Unit)

### 🚀 COMPLEX TEST EXECUTION STRATEGY
**When you encounter complex tests, follow this strategy:**

1. **📋 Break Down Complex Tests**: Split large tests into smaller, manageable parts
2. **🔍 Start with Setup**: Focus on test environment setup first
3. **🧪 Implement Incrementally**: Build tests step by step, not all at once
4. **✅ Validate Each Step**: Run tests after each small change
5. **🔄 Iterate and Improve**: Refine tests based on results
**🚨 REMEMBER: Complex tests are NOT optional - they are MANDATORY for this phase!**
`;
  }

  // Design task list removed: all work is represented as regular TASK-XXX items
  private generateDesignTaskInstructions(phaseTasks: any, platform?: string): string { return ''; }

  /**
   * Generate design guardrails to prevent AI from creating simple, plain designs
   */
  private generateDesignGuardrails(phaseTasks: any, platform?: string): string {
    return `
## 🎨 DESIGN GUARDRAILS - MANDATORY COMPLIANCE
**🚨 CRITICAL: These guardrails are NON-NEGOTIABLE. Do NOT create simple, plain designs!**

### 🚫 FORBIDDEN DESIGN PATTERNS (NEVER CREATE THESE)
- ❌ **Basic white backgrounds** with simple black text
- ❌ **Plain buttons** without styling, shadows, or hover effects
- ❌ **Minimal layouts** without visual hierarchy or spacing
- ❌ **Simple forms** without proper styling, validation, or visual feedback
- ❌ **Basic navigation** without modern patterns, icons, or styling
- ❌ **Plain cards** without shadows, borders, or visual depth
- ❌ **Simple lists** without proper spacing, typography, or visual elements
- ❌ **Basic modals** without proper styling, animations, or backdrop effects

### ✅ MANDATORY MODERN DESIGN REQUIREMENTS
- ✅ **SOPHISTICATED COLOR SCHEMES**: Use modern color palettes with proper contrast
- ✅ **PROFESSIONAL TYPOGRAPHY**: Implement proper font hierarchy and spacing
- ✅ **VISUAL DEPTH**: Use shadows, gradients, and layering for depth
- ✅ **INTERACTIVE ELEMENTS**: Add hover states, animations, and micro-interactions
- ✅ **RESPONSIVE DESIGN**: Implement mobile-first responsive layouts
- ✅ **MODERN COMPONENTS**: Use card-based layouts, modern buttons, styled forms
- ✅ **VISUAL HIERARCHY**: Clear information architecture with proper spacing
- ✅ **ACCESSIBILITY**: WCAG compliant design with proper contrast ratios

### 🚀 DESIGN CONFIDENCE BOOSTERS
**When creating UI components, follow these confidence boosters:**

1. **🎨 START WITH MODERN PATTERNS**: Begin with sophisticated design patterns
2. **🌈 USE RICH COLOR PALETTES**: Implement modern color schemes (not just black/white)
3. **✨ ADD VISUAL ENHANCEMENTS**: Include shadows, gradients, and visual effects
4. **🎭 IMPLEMENT INTERACTIONS**: Add hover states, transitions, and animations
5. **📱 DESIGN MOBILE-FIRST**: Create responsive, mobile-optimized layouts
6. **🎯 FOCUS ON USER EXPERIENCE**: Prioritize usability and visual appeal

### 🎯 DESIGN SYSTEM ENFORCEMENT
**ALWAYS implement these design system elements:**
- **Component Library**: Reusable, styled components with consistent design
- **Design Tokens**: Consistent colors, spacing, typography, and effects
- **Style Guide**: Comprehensive styling guidelines and patterns
- **Visual Consistency**: Maintain consistent design language throughout

**🚨 REMEMBER: Modern, sophisticated design is MANDATORY - basic designs are FORBIDDEN!**
`;
  }

  /**
   * Helper method to generate dynamic task-based instructions
   */
  private generateTaskBasedInstructions(phaseTasks: any, testType: string, testCommands?: string, platform?: string): string {
    if (!phaseTasks || !phaseTasks.tasks || !Array.isArray(phaseTasks.tasks)) {
      return '';
    }

    // Find tasks related to the test type
    const relevantTasks = phaseTasks.tasks.filter((task: any) => {
      // Design-only filter removed; all tasks are normal TASK-XXX now
      return task.tddPhase?.toLowerCase().includes(testType.toLowerCase()) ||
             task.subPhase?.toLowerCase().includes(testType.toLowerCase()) ||
             task.title?.toLowerCase().includes(testType.toLowerCase());
    });

    if (relevantTasks.length === 0) {
      return '';
    }

    const taskNumbers = relevantTasks.map((task: any) => task.id).join(', ');
    const taskDescriptions = relevantTasks.map((task: any) =>
      `${task.id} ${task.title} - ${task.description}`
    ).join('\n');

    return `
### ${testType} Tests (${taskNumbers})
${taskDescriptions}
${testCommands ? `\n${'='.repeat(60)}\n🧪 ${testType.toUpperCase()} TEST COMMANDS\n${'='.repeat(60)}\n${testCommands}\n${'='.repeat(60)}\n` : ''}
`;
  }

  /**
   * Create AI instructions for task execution
   */
  private async getPhaseSpecificInstructions(phase: string, platform?: string, language?: string, phaseTasks?: any): Promise<string> {
    switch (phase) {
      case "1":
        return await this.getPhase1Instructions(platform, language, phaseTasks); // Foundations & Data
      case "2":
        return await this.getPhase2Instructions(platform, language, phaseTasks); // Application & Core Integration
      case "3":
        return await this.getPhase3Instructions(platform, language, phaseTasks); // API-First, Platform & Smoke
      case "4":
        return await this.getPhase4Instructions(platform, language, phaseTasks); // Full Integration & Verification
      default:
        return await this.getPhase1Instructions(platform, language, phaseTasks); // Default to Phase 1
    }
  }

  private async getPhase1Instructions(platform?: string, language?: string, phaseTasks?: any): Promise<string> {
    const contractTestCommands = this.getPlatformTestCommands(platform, 'contract');
    const platformSpecificRequirements = this.getPlatformSpecificRequirements(platform);

    // Format phase tasks content using helper method
    const phaseTasksContent = this.formatPhaseTasksContent(phaseTasks);
  

    return `
# PHASE 1: FOUNDATIONS & DATA (ATOMIC)
**AUTOMATIC TOOL CALL:** /sdd_implement phase=1 (ALREADY TRIGGERED)

🚨 CRITICAL: Execute the implementation directly using only the information provided below.

## 📋 PHASE 1 TODO SUMMARY (25 ITEMS TOTAL)
## 🚨 MANDATORY FIRST STEP: CREATE PHASE TODO LIST for following Tasks. Put task numbers to the left of the task title.
${this.generatePreTaskInstructions(phaseTasks, platform, language, '1')}
${phaseTasksContent}
${platformSpecificRequirements}

### Phase-Specific Requirements
- **Contract-First**: Generate API contracts before implementation
- **Test-First**: Write tests before any code following TDD sequence
- **Database-First**: Set up data layer before application
- **Model-First**: Define data structures before implementation

${this.generateTestingGuardrails(phaseTasks, platform)}

${this.generateDesignGuardrails(phaseTasks, platform)}

## 🚨 MANDATORY SECOND STEP: EXECUTE TASKS IN ORDER
**Follow the exact task sequence below. Each task builds on the previous ones.**

${this.getContinuousExecutionPolicy()}

${this.generateTaskBasedInstructions(phaseTasks, 'Contract', contractTestCommands, platform)}

${this.generateTaskBasedInstructions(phaseTasks, 'Integration', undefined, platform)}

${this.generateTaskBasedInstructions(phaseTasks, 'Database', undefined, platform)}

${this.generateTaskBasedInstructions(phaseTasks, 'Model', undefined, platform)}

${this.generateTaskBasedInstructions(phaseTasks, 'Unit', undefined, platform)}

## Success Criteria
- All dependencies installed and verified
- API contracts generated, validated, and verified
- Contract tests implemented, run, and verified
- Integration scenarios defined, executed, and verified
- Database configured, initialized, schema designed, and migrations applied
- Data models developed, linted, verified, and tested
- **All tests executed and verified to work correctly**
- **All testing frameworks verified to be working correctly**

${this.getPhaseCompletionRequirements(1, 'Application & Core Integration')}
    `;
  }

  private async getPhase2Instructions(platform?: string, language?: string, phaseTasks?: any): Promise<string> {
    const databaseTestCommands = this.getPlatformTestCommands(platform, 'database');
    const platformSpecificRequirements = this.getPlatformSpecificRequirements(platform);

    // Format phase tasks content using helper method
    const phaseTasksContent = this.formatPhaseTasksContent(phaseTasks);

    return `
# PHASE 2: APPLICATION & CORE INTEGRATION (ATOMIC)
**AUTOMATIC TOOL CALL:** sdd_implement phase="2" (ALREADY TRIGGERED)

🚨 CRITICAL: Execute the implementation directly using only the information provided below.

## 📋 PHASE 2 TODO SUMMARY (20 ITEMS TOTAL)

## 🚨 MANDATORY FIRST STEP: CREATE PHASE TODO LIST for following Tasks. Put task numbers to the left of the task title.
${this.generatePreTaskInstructions(phaseTasks, platform, language, '2')}
${phaseTasksContent}
${platformSpecificRequirements}

### Phase-Specific Requirements
- **Library-First**: Implement core library before application layer
- **API Client**: Configure API client for UI-API integration
- **Application Layer**: Create user-facing functionality
- **Integration Testing**: Run comprehensive integration tests

${this.generateTestingGuardrails(phaseTasks, platform)}

${this.generateDesignGuardrails(phaseTasks, platform)}

## 🚨 MANDATORY SECOND STEP: EXECUTE TASKS IN ORDER
**Follow the exact task sequence below. Each task builds on the previous ones.**

${this.getContinuousExecutionPolicy()}

${this.generateTaskBasedInstructions(phaseTasks, 'Library', databaseTestCommands, platform)}

${this.generateTaskBasedInstructions(phaseTasks, 'Application', undefined, platform)}

${this.generateTaskBasedInstructions(phaseTasks, 'Integration', undefined, platform)}

${this.generateTaskBasedInstructions(phaseTasks, 'API Client', undefined, platform)}

**AFTER ALL IMPLEMENTATION, YOU MUST COMPLETE VERIFICATION:**

## Success Criteria
- Core library implemented and tested
- API client configured and verified
- Application layer implemented and tested
- **Integration tests executed and verified to work correctly**
- **Integration testing framework verified to be working correctly**
- Library integration tests passing
- Application layer tests passing

${this.getPhaseCompletionRequirements(2, 'API-First, Platform & Smoke')}
    `;
  }

  private async getPhase3Instructions(platform?: string, language?: string, phaseTasks?: any): Promise<string> {
    const e2eTestCommands = this.getPlatformTestCommands(platform, 'e2e');
    const platformSpecificRequirements = this.getPlatformSpecificRequirements(platform);

    // Format phase tasks content using helper method
    const phaseTasksContent = this.formatPhaseTasksContent(phaseTasks);

    return `
# PHASE 3: API-FIRST, PLATFORM & SMOKE (ATOMIC)
**AUTOMATIC TOOL CALL:** sdd_implement phase="3" (ALREADY TRIGGERED)

🚨 CRITICAL: Execute the implementation directly using only the information provided below.
## 📋 PHASE 3 TODO SUMMARY (15 ITEMS TOTAL)
## 🚨 MANDATORY FIRST STEP: CREATE PHASE TODO LIST for following Tasks. Put task numbers to the left of the task title.
${this.generatePreTaskInstructions(phaseTasks, platform, language, '3')}
${phaseTasksContent}
${platformSpecificRequirements}
### Phase-Specific Requirements
- **API-First**: Design and implement comprehensive API with contract enforcement
- **Platform-Specific**: Setup platform environment and execute platform-specific tests
- **Performance**: Optimize platform performance and verify metrics
- **SMOKE Testing**: Execute comprehensive SMOKE test suite

${this.generateTestingGuardrails(phaseTasks, platform)}

${this.generateDesignGuardrails(phaseTasks, platform)}

## 🚨 MANDATORY SECOND STEP: EXECUTE TASKS IN ORDER
**Follow the exact task sequence below. Each task builds on the previous ones.**

${this.getContinuousExecutionPolicy()}

${this.generateTaskBasedInstructions(phaseTasks, 'API', e2eTestCommands, platform)}

${this.generateTaskBasedInstructions(phaseTasks, 'Platform', undefined, platform)}

${this.generateTaskBasedInstructions(phaseTasks, 'SMOKE', undefined, platform)}

${this.generateTaskBasedInstructions(phaseTasks, 'Performance', undefined, platform)}

**AFTER ALL IMPLEMENTATION, YOU MUST COMPLETE VERIFICATION:**

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

${this.getPhaseCompletionRequirements(3, 'Full Integration & Verification')}
    `;
  }

  private async getPhase4Instructions(platform?: string, language?: string, phaseTasks?: any): Promise<string> {
    // Format phase tasks content using helper method
    const phaseTasksContent = this.formatPhaseTasksContent(phaseTasks);

    return `
# PHASE 4: FULL INTEGRATION & VERIFICATION (ATOMIC)
**AUTOMATIC TOOL CALL:** sdd_implement phase="4" (ALREADY TRIGGERED)

🚨 CRITICAL: Execute the implementation directly using only the information provided below.

## 📋 PHASE 4 TODO SUMMARY (12 ITEMS TOTAL)
## 🚨 MANDATORY FIRST STEP: CREATE PHASE TODO LIST for following Tasks. Put task numbers to the left of the task title.
${this.generatePreTaskInstructions(phaseTasks, platform, language, '4')}
${phaseTasksContent}
### Implementation Requirements

### Phase-Specific Requirements
- **Documentation-First**: Generate comprehensive API documentation
- **Full Testing**: Execute complete test suite with all test types
- **Coverage Verification**: Verify test coverage and performance metrics
- **Release Preparation**: Update documentation and prepare release notes
- **Final Review**: Complete comprehensive project review and sign-off

${this.generateTestingGuardrails(phaseTasks, platform)}

${this.generateDesignGuardrails(phaseTasks, platform)}

## 🚨 MANDATORY SECOND STEP: EXECUTE TASKS IN ORDER
**Follow the exact task sequence below. Each task builds on the previous ones.**

${this.getContinuousExecutionPolicy()}

${this.generateTaskBasedInstructions(phaseTasks, 'Documentation', undefined, platform)}

${this.generateTaskBasedInstructions(phaseTasks, 'Full Testing', this.getPlatformTestCommands(platform, 'unit'), platform)}

${this.generateTaskBasedInstructions(phaseTasks, 'Coverage', undefined, platform)}

${this.generateTaskBasedInstructions(phaseTasks, 'Release', undefined, platform)}

${this.generateTaskBasedInstructions(phaseTasks, 'Final Review', undefined, platform)}

**AFTER ALL IMPLEMENTATION, YOU MUST COMPLETE VERIFICATION:**

## Success Criteria
- API documentation generated and verified
- **FULL test suite executed and verified to work correctly**
- **Coverage and performance verified to meet requirements**
- Documentation and release notes updated
- **Final review completed and project signed off**
- All test frameworks verified and working correctly

${this.getPhaseCompletionRequirements(4)}
    `;
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
   * Generate platform and language specific instructions
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
   * Get core instructions
   */
  private async resolveFeatureId(inputFeatureId?: string): Promise<string> {
    if (inputFeatureId && typeof inputFeatureId === 'string' && inputFeatureId.trim()) {
      // Validate that the feature exists in database
      const feature = await this.db.get_feature_robust(inputFeatureId.trim());
      if (!feature) {
        throw new Error(`Feature '${inputFeatureId.trim()}' not found in database.`);
      }
      return inputFeatureId.trim();
    }

    // If no input or null, get the most recent feature
    const allFeatures = await this.db.get_all_features_robust();
    if (!allFeatures.length) {
      throw new Error('No features found. Please create a feature first using sdd_specify command.');
    }

    // Find a feature that has specification and plan (tasks are now in tasks.md file)
    for (const feature of allFeatures) {
      try {
        const hasSpec = await this.db.get_specification_robust(feature.id);
        const hasPlan = await this.db.get_plan_robust(feature.id);

        if (hasSpec && hasPlan) {
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
   * Error helper method
   */
  private error(message: string): any {
    return {
      success: false,
      error: message
    };
  }

  /**
   * Generate continuous execution policy text
   */
  private getContinuousExecutionPolicy(): string {
    return `
🚨 CRITICAL: CONTINUOUS EXECUTION REQUIRED
- Execute ALL tasks in this phase WITHOUT STOPPING
- Do NOT pause between tasks - continue immediately to the next task
- Do NOT ask for permission - just proceed to the next task
- Complete the ENTIRE phase in one continuous session
- Only stop when ALL tasks are complete and verified`;
  }

  /**
   * Generate phase completion requirements text
   */
  private getPhaseCompletionRequirements(phaseNumber: number, nextPhaseDescription?: string): string {
    const isLastPhase = phaseNumber === 4;
    const nextPhaseText = isLastPhase 
      ? "Do NOT ask for permission - project is complete"
      : `Do NOT ask for permission to proceed to Phase ${phaseNumber + 1}`;
    
    const completionText = isLastPhase
      ? "**PROJECT COMPLETE - READY FOR PRODUCTION**"
      : `Ready for Phase ${phaseNumber + 1} (${nextPhaseDescription})`;

    return `
🚨 CRITICAL: PHASE COMPLETION REQUIREMENTS
- ALL tasks in Phase ${phaseNumber} must be completed before stopping
- Do NOT stop until ALL success criteria are met
- ${nextPhaseText}
- Complete the ENTIRE phase in one continuous session
- ${completionText}`;
  }


  private getTaskContinuousExecutionPolicy(): string {
    return `
**🚨 CRITICAL: CONTINUOUS EXECUTION POLICY**
- Complete ALL tasks WITHOUT STOPPING
- Do NOT pause between tasks - continue immediately to the next task
- Do NOT ask for permission - just proceed to the next task
- Complete ALL tasks before proceeding to next phase
- Only stop when ALL tasks are complete and verified`;
  }

 
  private getPhaseDesignPreTask(phase?: string): any { return null; }

  /**
   * Generate pre-task instructions for mandatory preparatory steps
   */
  private generatePreTaskInstructions(phaseTasks: any, platform?: string, language?: string, phase?: string): string {
    const basePreTasks: any[] = [];

    const designPreTask = this.getPhaseDesignPreTask(phase);
    const preTasks = [...basePreTasks];

    return `
**🚨 CRITICAL: Begin implementation with continuous, uninterrupted execution:**

${preTasks.map(task =>
      `${task.id} ${task.title} - ${task.description}`
    ).join('\n')}

${this.getTaskContinuousExecutionPolicy()}

         **⚠️ WARNING: Do NOT pause between tasks; complete the entire phase before stopping!**

         **⏱️ TIMEOUT TROUBLESHOOTING:**
         - If 'timeout' command fails, try: \`./timeout-helper.sh 60s 'npm test'\`
         - If timeout helper fails, use: \`npm test & sleep 60 && pkill -f npm\`
         - All test commands include timeouts to prevent AI hanging

         **🚨 NO STUBS POLICY:**
         - NEVER return 501, 404, or placeholder responses
         - IMPLEMENT actual business logic in all API routes
         - CONNECT routes → services → database with real data flow
         - MAKE contract tests pass with real responses (200, 201, 400, etc.)
         - NO "TODO" or "Not Implemented" responses allowed`;
  }

}
