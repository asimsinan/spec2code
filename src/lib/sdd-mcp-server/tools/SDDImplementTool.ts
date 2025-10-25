/**
 * SDD Implement Tool - Template-Based AI-Driven Implementation
 * 
 * Features:
 * - Full auto mode: Execute all 4 phases sequentially
 * - Phase-by-phase mode: Execute specific phase (1-4)
 * - Template-based approach using tasks.md data
 * - Platform-aware implementation guidance
 * - AI-driven content generation
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import * as path from 'path';
import * as fs from 'fs';

import { RobustDatabaseService } from '../database/RobustDatabaseService.js';
import { JsonRepairUtility } from '../utils/JsonRepairUtility.js';

// Platform Detection Engine (imported from SDDTasksTool)
interface PlatformDetectionResult {
  platform: 'web' | 'mobile' | 'desktop' | 'backend' | 'ai';
  framework: string;
  language: string;
  confidence: number;
  detectedFrom: string[];
}

class PlatformDetectionEngine {
  async detectPlatform(specData: any, planData: any): Promise<PlatformDetectionResult> {
    // Only use plan data for platform detection
    return this.detectFromPlan(planData);
  }


  private async detectFromPlan(planData: any): Promise<PlatformDetectionResult> {
    if (!planData) {
      return { platform: 'web', framework: 'unknown', language: 'typescript', confidence: 0.1, detectedFrom: [] };
    }

    // Check metadata first for explicit platform
    if (planData.metadata?.platform) {
      // Extract framework and language from technical context
      const techContext = planData.technicalContext;
      let framework = 'unknown';
      let language = 'typescript';
      
      if (techContext?.languageVersion) {
        const langText = techContext.languageVersion.toLowerCase();
        if (langText.includes('nextjs') || langText.includes('next.js')) framework = 'nextjs';
        else if (langText.includes('react')) framework = 'react';
        else if (langText.includes('vue')) framework = 'vue';
        else if (langText.includes('angular')) framework = 'angular';
        
        if (langText.includes('typescript')) language = 'typescript';
        else if (langText.includes('javascript')) language = 'javascript';
        else if (langText.includes('python')) language = 'python';
      }
      
      return {
        platform: planData.metadata.platform as any,
        framework,
        language,
        confidence: 0.9,
        detectedFrom: ['plan_metadata']
      };
    }

    // Fallback to text analysis if no metadata
    const combinedText = [
      planData.technicalContext?.languageVersion || '',
      planData.technicalContext?.framework || '',
      planData.technicalContext?.platform || '',
      planData.projectStructure?.content || '',
      planData.databaseStrategy?.content || ''
    ].join(' ').toLowerCase();

    return this.scorePlatforms(combinedText, 'plan');
  }

  private scorePlatforms(text: string, source: string): PlatformDetectionResult {
    const platforms = {
      web: { keywords: ['web', 'frontend', 'react', 'vue', 'angular', 'nextjs', 'next.js', 'html', 'css', 'browser'], score: 0 },
      mobile: { keywords: ['mobile', 'ios', 'android', 'react native', 'flutter', 'native'], score: 0 },
      desktop: { keywords: ['desktop', 'electron', 'tauri', 'windows', 'macos', 'linux'], score: 0 },
      backend: { keywords: ['backend', 'api', 'server', 'express', 'fastapi', 'nodejs', 'spring', 'django'], score: 0 },
      ai: { keywords: ['machine learning', 'tensorflow', 'pytorch', 'llm', 'artificial intelligence', 'neural network'], score: 0 }
    };

    // Score each platform
    Object.entries(platforms).forEach(([platform, config]) => {
      config.score = config.keywords.reduce((score, keyword) => {
        return score + (text.includes(keyword) ? 1 : 0);
      }, 0);
    });

    // Find best match
    const bestMatch = Object.entries(platforms).reduce((best, [platform, config]) => {
      return config.score > best.score ? { platform, ...config } : best;
    }, { platform: 'web', score: 0 });

    // Determine framework and language
    let framework = 'unknown';
    let language = 'typescript';

    if (bestMatch.platform === 'web') {
      if (text.includes('nextjs') || text.includes('next.js')) framework = 'nextjs';
      else if (text.includes('react')) framework = 'react';
      else if (text.includes('vue')) framework = 'vue';
      else if (text.includes('angular')) framework = 'angular';
      language = text.includes('typescript') ? 'typescript' : 'javascript';
    } else if (bestMatch.platform === 'mobile') {
      if (text.includes('react native')) framework = 'react-native';
      else if (text.includes('flutter')) framework = 'flutter';
      language = 'typescript';
    } else if (bestMatch.platform === 'backend') {
      if (text.includes('express')) framework = 'express';
      else if (text.includes('fastapi')) framework = 'fastapi';
      else if (text.includes('spring')) framework = 'spring';
      language = text.includes('python') ? 'python' : 'typescript';
    }

    return {
      platform: bestMatch.platform as any,
      framework,
      language,
      confidence: Math.min(bestMatch.score * 0.3, 1.0),
      detectedFrom: [source]
    };
  }

}

export class SDDImplementTool {
  private basePath: string;
  private db: RobustDatabaseService;
  private platformDetector: PlatformDetectionEngine;

  constructor(basePath: string = process.cwd(), db?: RobustDatabaseService) {
    this.basePath = path.resolve(basePath);
    this.db = db || new RobustDatabaseService(path.join(this.basePath, 'sdd.db'));
    this.platformDetector = new PlatformDetectionEngine();
  }

  getToolDefinition(): Tool {
    return {
      name: 'sdd_implement',
      description: '🚀 AI-Driven Implementation Tool - Execute tasks with full auto mode or phase-by-phase mode. Uses tasks.md data and platform detection for intelligent implementation.',
      inputSchema: {
        type: 'object',
        properties: {
          phase: {
            type: 'string',
            description: 'Phase number (1-4) to execute. If not provided, executes all phases in full auto mode.'
          },
          dryrun: {
            type: 'boolean',
            description: 'Set to true to preview what would be executed without actually running it.'
          }
        },
        required: []
      }
    };
  }

  async execute(input: any): Promise<any> {
    try {
      const { phase, dryrun } = input || {};
      
      // Handle dry run mode
      if (dryrun) {
        return this.executeDryRun(phase);
      }
      
      // Get project context
        const currentFeatureId = await this.resolveFeatureId(null);
        const rawSpecification = await this.db.get_specification_robust(currentFeatureId);
      const specification = JsonRepairUtility.validateAndRepairDbContent(rawSpecification, 'SDDImplementTool');
        const rawPlan = await this.db.get_plan_robust(currentFeatureId);
      const plan = JsonRepairUtility.validateAndRepairDbContent(rawPlan, 'SDDImplementTool');

      // Read tasks.md file
        const tasksMarkdownPath = path.join(this.basePath, 'specs', 'tasks.md');
        if (!fs.existsSync(tasksMarkdownPath)) {
        return this.error('No tasks.md file found. Please run sdd_tasks first to generate tasks.');
        }
        const tasksMarkdown = fs.readFileSync(tasksMarkdownPath, 'utf-8');
        
      // Parse verification instructions from tasks.md
        const verificationInstructions = this.parseVerificationInstructions(tasksMarkdown);
        
      // Detect platform
      const platformDetection = await this.platformDetector.detectPlatform(specification, plan);
      
      // Execute based on mode
      if (!phase) {
        return this.executeFullAuto(tasksMarkdown, platformDetection, specification, plan, verificationInstructions);
      } else {
      const phaseNum = parseInt(phase);
      if (isNaN(phaseNum) || phaseNum < 1 || phaseNum > 4) {
        throw new Error('Phase must be a number between 1 and 4.');
      }
        return this.executePhase(phaseNum, tasksMarkdown, platformDetection, specification, plan, verificationInstructions);
      }
    } catch (error) {
      console.error('[SDDImplementTool] ERROR:', error);
      return this.error(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }

  /**
   * Parse verification instructions from tasks.md
   */
  private parseVerificationInstructions(tasksMarkdown: string): Map<string, any> {
    const verificationMap = new Map<string, any>();
    
    // Split tasks.md into individual tasks
    const taskSections = tasksMarkdown.split(/### TASK-\d+/);
    
    for (let i = 1; i < taskSections.length; i++) {
      const taskSection = taskSections[i];
      const taskIdMatch = taskSections[i - 1]?.match(/TASK-(\d+)/);
      if (!taskIdMatch) continue;
      
      const taskId = `TASK-${taskIdMatch[1].padStart(3, '0')}`;
      
      // Extract Post-Verification Instructions section
      const postVerificationMatch = taskSection.match(/Post-Verification Instructions[\s\S]*?---/);
      if (postVerificationMatch) {
        const instructionsText = postVerificationMatch[0];
        
        // Parse individual instruction fields
        const onSuccessMatch = instructionsText.match(/On Success[:\s]*([^\n]+)/);
        const onFailureMatch = instructionsText.match(/On Failure[:\s]*([^\n]+)/);
        const enforcementMatch = instructionsText.match(/Enforcement[:\s]*([^\n]+)/);
        const noPauseMatch = instructionsText.match(/No Pause[:\s]*([^\n]+)/);
        const nextTaskMatch = instructionsText.match(/Next Task[:\s]*([^\n]+)/);
        
        const instructions = {
          onSuccess: onSuccessMatch ? onSuccessMatch[1].trim() : '',
          onFailure: onFailureMatch ? onFailureMatch[1].trim() : '',
          enforcement: enforcementMatch ? enforcementMatch[1].trim() : 'mandatory',
          noPause: noPauseMatch ? noPauseMatch[1].trim() === 'true' : true,
          nextTask: nextTaskMatch ? nextTaskMatch[1].trim() : ''
        };
        
        verificationMap.set(taskId, instructions);
      }
    }
    
    return verificationMap;
  }

  /**
   * Execute all phases in full auto mode
   */
  private async executeFullAuto(tasksMarkdown: string, platformDetection: PlatformDetectionResult, specification: any, plan: any, verificationInstructions: Map<string, any>): Promise<any> {
    const successMessage = this.generateFullAutoSuccessMessage(tasksMarkdown, platformDetection, specification, plan, verificationInstructions);
    
    return {
      success: true,
      nextStep: successMessage,
      mode: 'full_auto',
      platform: platformDetection.platform,
      framework: platformDetection.framework,
      language: platformDetection.language,
      confidence: platformDetection.confidence,
      detectedFrom: platformDetection.detectedFrom
    };
  }

  /**
   * Execute specific phase
   */
  private async executePhase(phaseNum: number, tasksMarkdown: string, platformDetection: PlatformDetectionResult, specification: any, plan: any, verificationInstructions: Map<string, any>): Promise<any> {
    const phaseTasks = this.parsePhaseTasks(tasksMarkdown, phaseNum);
    const successMessage = this.generatePhaseSuccessMessage(phaseNum, phaseTasks, platformDetection, specification, plan, verificationInstructions);
    
    return {
      success: true,
      nextStep: successMessage,
      mode: 'phase_by_phase',
      phase: phaseNum,
      platform: platformDetection.platform,
      framework: platformDetection.framework,
      language: platformDetection.language,
      confidence: platformDetection.confidence,
      detectedFrom: platformDetection.detectedFrom
    };
  }

  /**
   * Parse tasks for specific phase from tasks.md
   */
  private parsePhaseTasks(tasksMarkdown: string, phaseNum: number): string {
    const phaseStartPattern = new RegExp(`## Phase ${phaseNum}:.*?\\n`, 'i');
    const phaseEndPattern = new RegExp(`## Phase ${phaseNum + 1}:.*?\\n`, 'i');
    
    const startMatch = tasksMarkdown.match(phaseStartPattern);
    if (!startMatch) {
      return `Phase ${phaseNum} tasks not found in tasks.md`;
    }
    
    const startIndex = startMatch.index! + startMatch[0].length;
    const endMatch = tasksMarkdown.match(phaseEndPattern);
    const endIndex = endMatch ? endMatch.index! : tasksMarkdown.length;
    
    return tasksMarkdown.substring(startIndex, endIndex).trim();
  }

  /**
   * Generate success message for full auto mode
   */
  private generateFullAutoSuccessMessage(tasksMarkdown: string, platformDetection: PlatformDetectionResult, specification: any, plan: any, verificationInstructions: Map<string, any>): string {
    return `
🚀 FULL AUTO IMPLEMENTATION MODE

📊 PROJECT CONTEXT:
- Platform: ${platformDetection.platform} (${platformDetection.framework} + ${platformDetection.language})
- Confidence: ${platformDetection.confidence}
- Detected From: ${platformDetection.detectedFrom.join(', ')}

📋 COMPLETE TASKS BREAKDOWN:
${tasksMarkdown}

📋 SPECIFICATION DATA:
${JSON.stringify(specification, null, 2)}

📋 PLAN DATA:
${JSON.stringify(plan, null, 2)}

🎯 IMPLEMENTATION INSTRUCTIONS:

**🚨🚨🚨 FIRST AND MOST IMPORTANT RULE 🚨🚨🚨**
**DO NOT STOP UNTIL ALL 72 TASKS ARE COMPLETE!**
**DO NOT ASK FOR PERMISSION TO CONTINUE!**
**DO NOT PAUSE BETWEEN TASKS!**
**JUST KEEP GOING UNTIL ALL TASKS ARE DONE!**

**STEP 1: CREATE COMPLETE TODO LIST**
First, create a comprehensive TODO list with ALL 72 tasks from the tasks breakdown above. Use this exact format:

- [ ] **TASK-001**: [Task Title from tasks.md]
- [ ] **TASK-002**: [Task Title from tasks.md]
- [ ] **TASK-003**: [Task Title from tasks.md]
... (continue for all 72 tasks)

**STEP 2: FULL AUTO MODE EXECUTION**
After creating the complete TODO list, implement ALL 4 phases sequentially in one continuous session.

**PHASE EXECUTION ORDER**:
1. **Phase 1**: Project Setup & Foundations (18 tasks)
2. **Phase 2**: Core Implementation (18 tasks)  
3. **Phase 3**: UI Development (18 tasks)
4. **Phase 4**: Testing, Documentation & Deployment (18 tasks)

**PLATFORM-SPECIFIC GUIDELINES**:
${this.getPlatformSpecificGuidelines(platformDetection.platform, platformDetection.framework)}

**TDD ENFORCEMENT**:
- **RED**: Write failing tests FIRST
- **GREEN**: Make tests pass with minimal code
- **REFACTOR**: Improve code while keeping tests green
- **SMOKE**: Run comprehensive test suite

**🚨 CRITICAL TEST EXECUTION REQUIREMENTS**:
- **MANDATORY TEST EXECUTION**: When a task says "EXECUTE tests" or "RUN tests", you MUST actually run the test commands
- **NO TEST CREATION WITHOUT EXECUTION**: Creating tests is NOT enough - you must execute them
- **SHOW TEST RESULTS**: Always show the actual output of test execution commands
- **VERIFY TEST STATUS**: Confirm whether tests pass (GREEN) or fail (RED) with actual terminal output
- **USE TIMEOUT PROTECTION**: Use timeout commands to prevent hanging: \`timeout 60s bash -c 'npm test'\`
- **COMMON TEST COMMANDS**:
  - Web: \`npm test\`, \`npm run test\`, \`npx jest\`, \`npx vitest\`
  - Backend: \`npm test\`, \`npm run test\`, \`python -m pytest\`, \`go test\`
  - Mobile: \`npm test\`, \`npx react-native test\`, \`flutter test\`
  - Desktop: \`npm test\`, \`npm run test\`, \`npx electron-mocha\`

**🚨 CRITICAL TEST FAILURE HANDLING**:
- **NO TEST SKIPPING**: Never skip tests because they are "failing", "problematic", or "have issues"
- **NO WORKING AROUND TEST FAILURES**: Never work around failing tests - fix them completely
- **NO PARTIAL TEST ACCEPTANCE**: Never accept "some tests working" or "mostly working" - ALL tests must pass
- **NO TIME EXCUSES FOR TESTS**: Never skip tests due to "limited time" or "time constraints"
- **MANDATORY TEST FIXING**: When tests fail, you MUST fix the underlying issues, not skip the tests
- **TEST FAILURE ANALYSIS**: Analyze test failures and fix the root cause, not the symptoms

**TEST EXECUTION EXAMPLES**:
\`\`\`bash
# Correct - Actually execute tests and show results
timeout 60s bash -c 'npm test' || echo "Test timeout exceeded"
npm run test:coverage
npx jest --verbose

# Incorrect - Just creating test files without execution
# Creating test files is NOT sufficient - you must run them!

# WRONG - Skipping tests due to failures
# "I can see that the CampaignList tests have several issues... Since we have limited time..."

# CORRECT - Fixing test failures
# "The CampaignList tests are failing because... Let me fix these issues..."
\`\`\`

**🚨 CRITICAL PERMISSION REQUIREMENTS**:
- **NEVER USE SUDO**: Do NOT use sudo, chown, or any root-level commands
- **USER-LEVEL OPERATIONS ONLY**: All commands must run with regular user permissions
- **NO SYSTEM FILE MODIFICATION**: Do not modify system files or directories
- **PROJECT-SCOPE ONLY**: Only work within the project directory and user-owned files
- **PERMISSION-SAFE COMMANDS**: Use commands that work with standard user permissions
- **AVOID THESE COMMANDS**: sudo, chown, chmod with elevated permissions, systemctl, etc.

**PERMISSION-SAFE EXAMPLES**:
\`\`\`bash
# Correct - User-level commands
npm install
npm run build
npm test
python -m pytest
git add .
git commit -m "message"

# Incorrect - Commands that require elevated permissions
sudo npm install
sudo chown -R user:group .
sudo chmod 755 /some/path
sudo systemctl restart service
\`\`\`

**🚨 CRITICAL CONTINUOUS EXECUTION POLICY**:
- **MANDATORY**: Complete ALL 72 tasks in one continuous session
- **NEVER STOP**: Never stop between tasks - proceed automatically
- **NEVER ASK**: Never ask for permission to continue - just keep going
- **NO PAUSES**: Do not pause, summarize, or wait for user input
- **COMPLETE ALL**: Only stop when ALL 72 tasks are complete and verified
- **AUTOMATIC PROGRESSION**: Move from task to task without interruption
- **NO "PROCEED" REQUESTS**: Do not ask user to say "proceed" or "continue"

**🚨 ANTI-EVASION CONSTITUTIONAL GATES 🚨**:
- **GATE 1**: NO TIME LIMIT EXCUSES - Never mention "limited time", "time constraints", or "running out of time"
- **GATE 2**: NO DIFFICULTY ESCAPES - Never skip tasks because they are "complex", "challenging", or "difficult"
- **GATE 3**: NO PARTIAL COMPLETION ACCEPTANCE - Never accept "good enough" or "mostly working" solutions
- **GATE 4**: NO TEST SKIPPING - Never skip tests because they are "failing" or "problematic"
- **GATE 5**: NO WORKING AROUND ISSUES - Never work around problems, always fix them completely
- **GATE 6**: NO SUMMARY SUBSTITUTION - Never provide summaries instead of actual implementation
- **GATE 7**: NO STATUS UPDATES AS COMPLETION - Never treat status updates as task completion

**🚨 CRITICAL: DO NOT STOP UNTIL ALL 72 TASKS ARE COMPLETE!**

**IMPLEMENTATION REQUIREMENTS**:
- Follow the exact task structure from tasks.md
- Implement real business logic (no placeholders)
- Connect all components with actual data flow
- Make all tests pass with real responses
- Ensure constitutional compliance gates are met

**🚨 VERIFICATION-BASED CONTINUOUS EXECUTION**:
After completing each task's verification, follow these instructions:

${this.generateVerificationInstructionsText(verificationInstructions)}

🚨 CRITICAL: START WITH COMPLETE TODO LIST - Then begin Phase 1 implementation!`;
  }

  /**
   * Generate verification instructions text for AI prompts
   */
  private generateVerificationInstructionsText(verificationInstructions: Map<string, any>): string {
    if (verificationInstructions.size === 0) {
      return 'No specific verification instructions found in tasks.md';
    }
    
    let instructionsText = '';
    let count = 0;
    
    for (const [taskId, instructions] of verificationInstructions) {
      if (count < 5) { // Show first 5 as examples
        instructionsText += `\n**${taskId} Verification Instructions**:\n`;
        instructionsText += `- **On Success**: ${instructions.onSuccess}\n`;
        instructionsText += `- **On Failure**: ${instructions.onFailure}\n`;
        instructionsText += `- **Next Task**: ${instructions.nextTask}\n`;
        instructionsText += `- **Enforcement**: ${instructions.enforcement}\n`;
        instructionsText += `- **No Pause**: ${instructions.noPause}\n`;
        count++;
      }
    }
    
    if (verificationInstructions.size > 5) {
      instructionsText += `\n... and ${verificationInstructions.size - 5} more tasks with similar verification instructions.\n`;
    }
    
    instructionsText += `\n**CRITICAL**: After each task verification, follow the specific instructions above to proceed immediately to the next task!`;
    
    return instructionsText;
  }

  /**
   * Generate success message for phase-by-phase mode
   */
  private generatePhaseSuccessMessage(phaseNum: number, phaseTasks: string, platformDetection: PlatformDetectionResult, specification: any, plan: any, verificationInstructions: Map<string, any>): string {
    const phaseNames = {
      1: 'Project Setup & Foundations',
      2: 'Core Implementation', 
      3: 'UI Development',
      4: 'Testing, Documentation & Deployment'
    };

    return `
🚀 PHASE ${phaseNum} IMPLEMENTATION MODE

📊 PROJECT CONTEXT:
- Platform: ${platformDetection.platform} (${platformDetection.framework} + ${platformDetection.language})
- Confidence: ${platformDetection.confidence}
- Detected From: ${platformDetection.detectedFrom.join(', ')}

📋 PHASE ${phaseNum} TASKS (${phaseNames[phaseNum as keyof typeof phaseNames]}):
${phaseTasks}

📋 SPECIFICATION DATA:
${JSON.stringify(specification, null, 2)}

📋 PLAN DATA:
${JSON.stringify(plan, null, 2)}

🎯 IMPLEMENTATION INSTRUCTIONS:

**🚨🚨🚨 FIRST AND MOST IMPORTANT RULE 🚨🚨🚨**
**DO NOT STOP UNTIL THE ENTIRE PHASE IS COMPLETE!**
**DO NOT ASK FOR PERMISSION TO CONTINUE!**
**DO NOT PAUSE BETWEEN TASKS!**
**JUST KEEP GOING UNTIL ALL TASKS ARE DONE!**

**STEP 1: CREATE PHASE TODO LIST**
First, create a TODO list with ALL tasks from Phase ${phaseNum} above. Use this exact format:

- [ ] **TASK-XXX**: [Task Title from tasks.md]
- [ ] **TASK-XXX**: [Task Title from tasks.md]
... (continue for all Phase ${phaseNum} tasks)

**STEP 2: PHASE ${phaseNum} EXECUTION**
After creating the Phase ${phaseNum} TODO list, implement ALL tasks in this phase in one continuous session.

**PHASE ${phaseNum} FOCUS**: ${phaseNames[phaseNum as keyof typeof phaseNames]}

**PLATFORM-SPECIFIC GUIDELINES**:
${this.getPlatformSpecificGuidelines(platformDetection.platform, platformDetection.framework)}

**TDD ENFORCEMENT**:
- **RED**: Write failing tests FIRST
- **GREEN**: Make tests pass with minimal code
- **REFACTOR**: Improve code while keeping tests green
- **SMOKE**: Run comprehensive test suite

**🚨 CRITICAL TEST EXECUTION REQUIREMENTS**:
- **MANDATORY TEST EXECUTION**: When a task says "EXECUTE tests" or "RUN tests", you MUST actually run the test commands
- **NO TEST CREATION WITHOUT EXECUTION**: Creating tests is NOT enough - you must execute them
- **SHOW TEST RESULTS**: Always show the actual output of test execution commands
- **VERIFY TEST STATUS**: Confirm whether tests pass (GREEN) or fail (RED) with actual terminal output
- **USE TIMEOUT PROTECTION**: Use timeout commands to prevent hanging: \`timeout 60s bash -c 'npm test'\`
- **COMMON TEST COMMANDS**:
  - Web: \`npm test\`, \`npm run test\`, \`npx jest\`, \`npx vitest\`
  - Backend: \`npm test\`, \`npm run test\`, \`python -m pytest\`, \`go test\`
  - Mobile: \`npm test\`, \`npx react-native test\`, \`flutter test\`
  - Desktop: \`npm test\`, \`npm run test\`, \`npx electron-mocha\`

**🚨 CRITICAL TEST FAILURE HANDLING**:
- **NO TEST SKIPPING**: Never skip tests because they are "failing", "problematic", or "have issues"
- **NO WORKING AROUND TEST FAILURES**: Never work around failing tests - fix them completely
- **NO PARTIAL TEST ACCEPTANCE**: Never accept "some tests working" or "mostly working" - ALL tests must pass
- **NO TIME EXCUSES FOR TESTS**: Never skip tests due to "limited time" or "time constraints"
- **MANDATORY TEST FIXING**: When tests fail, you MUST fix the underlying issues, not skip the tests
- **TEST FAILURE ANALYSIS**: Analyze test failures and fix the root cause, not the symptoms

**TEST EXECUTION EXAMPLES**:
\`\`\`bash
# Correct - Actually execute tests and show results
timeout 60s bash -c 'npm test' || echo "Test timeout exceeded"
npm run test:coverage
npx jest --verbose

# Incorrect - Just creating test files without execution
# Creating test files is NOT sufficient - you must run them!

# WRONG - Skipping tests due to failures
# "I can see that the CampaignList tests have several issues... Since we have limited time..."

# CORRECT - Fixing test failures
# "The CampaignList tests are failing because... Let me fix these issues..."
\`\`\`

**🚨 CRITICAL PERMISSION REQUIREMENTS**:
- **NEVER USE SUDO**: Do NOT use sudo, chown, or any root-level commands
- **USER-LEVEL OPERATIONS ONLY**: All commands must run with regular user permissions
- **NO SYSTEM FILE MODIFICATION**: Do not modify system files or directories
- **PROJECT-SCOPE ONLY**: Only work within the project directory and user-owned files
- **PERMISSION-SAFE COMMANDS**: Use commands that work with standard user permissions
- **AVOID THESE COMMANDS**: sudo, chown, chmod with elevated permissions, systemctl, etc.

**PERMISSION-SAFE EXAMPLES**:
\`\`\`bash
# Correct - User-level commands
npm install
npm run build
npm test
python -m pytest
git add .
git commit -m "message"

# Incorrect - Commands that require elevated permissions
sudo npm install
sudo chown -R user:group .
sudo chmod 755 /some/path
sudo systemctl restart service
\`\`\`

**🚨 CRITICAL CONTINUOUS EXECUTION POLICY**:
- **MANDATORY**: Complete ALL tasks in Phase ${phaseNum} in one continuous session
- **NEVER STOP**: Never stop between tasks - proceed automatically
- **NEVER ASK**: Never ask for permission to continue - just keep going
- **NO PAUSES**: Do not pause, summarize, or wait for user input
- **COMPLETE PHASE**: Only stop when ALL Phase ${phaseNum} tasks are complete and verified
- **AUTOMATIC PROGRESSION**: Move from task to task without interruption
- **NO "PROCEED" REQUESTS**: Do not ask user to say "proceed" or "continue"

**🚨 CRITICAL: DO NOT STOP UNTIL PHASE ${phaseNum} IS COMPLETE!**

**IMPLEMENTATION REQUIREMENTS**:
- Follow the exact task structure from tasks.md
- Implement real business logic (no placeholders)
- Connect all components with actual data flow
- Make all tests pass with real responses
- Ensure constitutional compliance gates are met

**🚨🚨🚨 CRITICAL EXECUTION RULES - NO EXCEPTIONS 🚨🚨🚨**:
- **RULE 1**: Start with the first task and keep going until the phase/all tasks are done
- **RULE 2**: Do NOT stop to show progress, summarize, or ask for permission
- **RULE 3**: Do NOT say "I've completed X tasks, should I continue?" - just continue
- **RULE 4**: Do NOT pause between tasks - move immediately to the next task
- **RULE 5**: Do NOT ask "proceed" or "continue" - just keep working
- **RULE 6**: Complete the entire phase/all tasks in one uninterrupted session
- **RULE 7**: Only stop when you have completed ALL tasks in the phase/all 72 tasks

**🚨 ANTI-EVASION CONSTITUTIONAL GATES 🚨**:
- **GATE 1**: NO TIME LIMIT EXCUSES - Never mention "limited time", "time constraints", or "running out of time"
- **GATE 2**: NO DIFFICULTY ESCAPES - Never skip tasks because they are "complex", "challenging", or "difficult"
- **GATE 3**: NO PARTIAL COMPLETION ACCEPTANCE - Never accept "good enough" or "mostly working" solutions
- **GATE 4**: NO TEST SKIPPING - Never skip tests because they are "failing" or "problematic"
- **GATE 5**: NO WORKING AROUND ISSUES - Never work around problems, always fix them completely
- **GATE 6**: NO SUMMARY SUBSTITUTION - Never provide summaries instead of actual implementation
- **GATE 7**: NO STATUS UPDATES AS COMPLETION - Never treat status updates as task completion

**🚨 VERIFICATION-BASED CONTINUOUS EXECUTION**:
After completing each task's verification, follow these instructions:

${this.generateVerificationInstructionsText(verificationInstructions)}

🚨 CRITICAL: START WITH PHASE ${phaseNum} TODO LIST - Then begin implementation!`;
  }

  /**
   * Get platform-specific implementation guidelines
   */
  private getPlatformSpecificGuidelines(platform: string, framework: string): string {
    switch (platform) {
      case 'web':
        return `- **Web (${framework})**: Focus on components, pages, API routes, responsive design
- Use web-specific technologies: HTML, CSS, JavaScript/TypeScript
- Include responsive design considerations
- Focus on browser compatibility and performance
- Use web-specific testing frameworks and tools
- **PERMISSION-SAFE**: Use npm/yarn commands, avoid system-level operations`;

      case 'mobile':
        return `- **Mobile (${framework})**: Focus on screens, navigation, native features, mobile UX
- Use mobile-specific technologies: React Native, Flutter, native APIs
- Include mobile UX considerations: touch interactions, gestures, navigation
- Focus on mobile performance and battery optimization
- Use mobile-specific testing frameworks and device testing
- **PERMISSION-SAFE**: Use development tools, avoid device-level permissions`;

      case 'desktop':
        return `- **Desktop (${framework})**: Focus on desktop-specific features, window management, system integration
- Use desktop-specific technologies: Electron, native desktop frameworks
- Include desktop UX considerations: keyboard shortcuts, window management, system integration
- Focus on desktop performance and system resource usage
- Use desktop-specific testing frameworks and cross-platform compatibility
- **PERMISSION-SAFE**: Use application-level APIs, avoid system-level access`;

      case 'backend':
        return `- **Backend**: Focus on APIs, services, database operations, authentication
- Use backend-specific technologies: Node.js, Python, Java, Go, etc.
- Include server-side considerations: scalability, security, performance
- Focus on API design, database optimization, and microservices architecture
- Use backend-specific testing frameworks and load testing tools
- **PERMISSION-SAFE**: Use application-level database connections, avoid system-level access`;

      case 'ai':
        return `- **AI (${framework})**: Focus on AI/ML models, data processing, model training
- Use AI-specific technologies: TensorFlow, PyTorch, OpenAI APIs, etc.
- Include AI considerations: model accuracy, data quality, inference performance
- Focus on AI model optimization and deployment
- Use AI-specific testing frameworks and model validation tools
- **PERMISSION-SAFE**: Use Python package managers, avoid system-level ML libraries`;

      default:
        return `- **${platform} (${framework})**: Focus on platform-specific features and technologies
- Use appropriate technologies for the detected platform
- Include platform-specific considerations and best practices
- Focus on platform-specific performance and optimization
- Use platform-specific testing frameworks and tools
- **PERMISSION-SAFE**: Use standard development tools, avoid elevated permissions`;
    }
  }

  /**
   * Execute dry run mode
   */
  private async executeDryRun(phase?: string): Promise<any> {
    const currentFeatureId = await this.resolveFeatureId(null);
    const rawSpecification = await this.db.get_specification_robust(currentFeatureId);
    const specification = JsonRepairUtility.validateAndRepairDbContent(rawSpecification, 'SDDImplementTool');
    const rawPlan = await this.db.get_plan_robust(currentFeatureId);
    const plan = JsonRepairUtility.validateAndRepairDbContent(rawPlan, 'SDDImplementTool');

      const tasksMarkdownPath = path.join(this.basePath, 'specs', 'tasks.md');
      if (!fs.existsSync(tasksMarkdownPath)) {
      return this.error('No tasks.md file found. Please run sdd_tasks first to generate tasks.');
      }
    const tasksMarkdown = fs.readFileSync(tasksMarkdownPath, 'utf-8');
      
    const platformDetection = await this.platformDetector.detectPlatform(specification, plan);
      
      if (phase) {
        const phaseNum = parseInt(phase);
      const phaseTasks = this.parsePhaseTasks(tasksMarkdown, phaseNum);
      return this.generateDryRunPreview(phaseNum, phaseTasks, platformDetection, specification, plan);
      } else {
      return this.generateDryRunPreviewAll(tasksMarkdown, platformDetection, specification, plan);
    }
  }

  /**
   * Generate dry run preview for specific phase
   */
  private generateDryRunPreview(phaseNum: number, phaseTasks: string, platformDetection: PlatformDetectionResult, specification: any, plan: any): any {
    const phaseNames = {
      1: 'Project Setup & Foundations',
      2: 'Core Implementation', 
      3: 'UI Development', 
      4: 'Testing, Documentation & Deployment'
    };

    const previewContent = this.generateDetailedPreviewContent(phaseNum, phaseTasks, phaseNames[phaseNum as keyof typeof phaseNames], platformDetection, specification, plan);
    
    // Create preview file in specs folder
    const previewPath = path.join(this.basePath, 'specs', `implementation-preview-phase-${phaseNum}.md`);
    fs.writeFileSync(previewPath, previewContent);
    
    return {
      success: true,
      mode: 'dryrun',
      phase: phaseNum,
      phaseName: phaseNames[phaseNum as keyof typeof phaseNames],
      platform: platformDetection.platform,
      framework: platformDetection.framework,
      language: platformDetection.language,
      previewFile: previewPath,
      previewContent: previewContent.substring(0, 500) + '...',
      message: `Dry run preview created: ${previewPath}. Phase ${phaseNum}: ${phaseNames[phaseNum as keyof typeof phaseNames]}. Platform: ${platformDetection.platform} (${platformDetection.framework} + ${platformDetection.language})`
    };
  }

  /**
   * Generate dry run preview for all phases
   */
  private generateDryRunPreviewAll(tasksMarkdown: string, platformDetection: PlatformDetectionResult, specification: any, plan: any): any {
    const previewContent = this.generateDetailedPreviewContentAll(tasksMarkdown, platformDetection, specification, plan);
    
    // Create preview file in specs folder
    const previewPath = path.join(this.basePath, 'specs', 'implementation-preview-full-auto.md');
    fs.writeFileSync(previewPath, previewContent);
    
    return {
      success: true,
      mode: 'dryrun',
      platform: platformDetection.platform,
      framework: platformDetection.framework,
      language: platformDetection.language,
      previewFile: previewPath,
      previewContent: previewContent.substring(0, 500) + '...',
      message: `Dry run preview created: ${previewPath}. Full Auto Mode. Platform: ${platformDetection.platform} (${platformDetection.framework} + ${platformDetection.language}). All 4 phases will be executed sequentially.`
    };
  }

  /**
   * Generate detailed preview content for specific phase
   */
  private generateDetailedPreviewContent(phaseNum: number, phaseTasks: string, phaseName: string, platformDetection: PlatformDetectionResult, specification: any, plan: any): string {
    return `# 🚀 Implementation Preview - Phase ${phaseNum}: ${phaseName}

## 📊 Project Context
- **Platform**: ${platformDetection.platform} (${platformDetection.framework} + ${platformDetection.language})
- **Confidence**: ${platformDetection.confidence}
- **Detected From**: ${platformDetection.detectedFrom.join(', ')}

## 📋 Phase ${phaseNum} Tasks
${phaseTasks}

## 🎯 Implementation Guidelines

**PLATFORM-SPECIFIC GUIDELINES**:
${this.getPlatformSpecificGuidelines(platformDetection.platform, platformDetection.framework)}

**TDD ENFORCEMENT**:
- **RED**: Write failing tests FIRST
- **GREEN**: Make tests pass with minimal code
- **REFACTOR**: Improve code while keeping tests green
- **SMOKE**: Run comprehensive test suite

**🚨 CRITICAL TEST EXECUTION REQUIREMENTS**:
- **MANDATORY TEST EXECUTION**: When a task says "EXECUTE tests" or "RUN tests", you MUST actually run the test commands
- **NO TEST CREATION WITHOUT EXECUTION**: Creating tests is NOT enough - you must execute them
- **SHOW TEST RESULTS**: Always show the actual output of test execution commands
- **VERIFY TEST STATUS**: Confirm whether tests pass (GREEN) or fail (RED) with actual terminal output
- **USE TIMEOUT PROTECTION**: Use timeout commands to prevent hanging: \`timeout 60s bash -c 'npm test'\`
- **COMMON TEST COMMANDS**:
  - Web: \`npm test\`, \`npm run test\`, \`npx jest\`, \`npx vitest\`
  - Backend: \`npm test\`, \`npm run test\`, \`python -m pytest\`, \`go test\`
  - Mobile: \`npm test\`, \`npx react-native test\`, \`flutter test\`
  - Desktop: \`npm test\`, \`npm run test\`, \`npx electron-mocha\`

**🚨 CRITICAL TEST FAILURE HANDLING**:
- **NO TEST SKIPPING**: Never skip tests because they are "failing", "problematic", or "have issues"
- **NO WORKING AROUND TEST FAILURES**: Never work around failing tests - fix them completely
- **NO PARTIAL TEST ACCEPTANCE**: Never accept "some tests working" or "mostly working" - ALL tests must pass
- **NO TIME EXCUSES FOR TESTS**: Never skip tests due to "limited time" or "time constraints"
- **MANDATORY TEST FIXING**: When tests fail, you MUST fix the underlying issues, not skip the tests
- **TEST FAILURE ANALYSIS**: Analyze test failures and fix the root cause, not the symptoms

**TEST EXECUTION EXAMPLES**:
\`\`\`bash
# Correct - Actually execute tests and show results
timeout 60s bash -c 'npm test' || echo "Test timeout exceeded"
npm run test:coverage
npx jest --verbose

# Incorrect - Just creating test files without execution
# Creating test files is NOT sufficient - you must run them!

# WRONG - Skipping tests due to failures
# "I can see that the CampaignList tests have several issues... Since we have limited time..."

# CORRECT - Fixing test failures
# "The CampaignList tests are failing because... Let me fix these issues..."
\`\`\`

**🚨 CRITICAL PERMISSION REQUIREMENTS**:
- **NEVER USE SUDO**: Do NOT use sudo, chown, or any root-level commands
- **USER-LEVEL OPERATIONS ONLY**: All commands must run with regular user permissions
- **NO SYSTEM FILE MODIFICATION**: Do not modify system files or directories
- **PROJECT-SCOPE ONLY**: Only work within the project directory and user-owned files
- **PERMISSION-SAFE COMMANDS**: Use commands that work with standard user permissions
- **AVOID THESE COMMANDS**: sudo, chown, chmod with elevated permissions, systemctl, etc.

**PERMISSION-SAFE EXAMPLES**:
\`\`\`bash
# Correct - User-level commands
npm install
npm run build
npm test
python -m pytest
git add .
git commit -m "message"

# Incorrect - Commands that require elevated permissions
sudo npm install
sudo chown -R user:group .
sudo chmod 755 /some/path
sudo systemctl restart service
\`\`\`

**🚨 CRITICAL CONTINUOUS EXECUTION POLICY**:
- **MANDATORY**: Complete ALL tasks in Phase ${phaseNum} in one continuous session
- **NEVER STOP**: Never stop between tasks - proceed automatically
- **NEVER ASK**: Never ask for permission to continue - just keep going
- **NO PAUSES**: Do not pause, summarize, or wait for user input
- **COMPLETE PHASE**: Only stop when ALL Phase ${phaseNum} tasks are complete and verified
- **AUTOMATIC PROGRESSION**: Move from task to task without interruption
- **NO "PROCEED" REQUESTS**: Do not ask user to say "proceed" or "continue"

**🚨 CRITICAL: DO NOT STOP UNTIL PHASE ${phaseNum} IS COMPLETE!**

**IMPLEMENTATION REQUIREMENTS**:
- Follow the exact task structure from tasks.md
- Implement real business logic (no placeholders)
- Connect all components with actual data flow
- Make all tests pass with real responses
- Ensure constitutional compliance gates are met

---
*This is a DRY RUN preview. No actual implementation will be performed.*
*Generated on: ${new Date().toISOString()}*
`;
  }

  /**
   * Generate detailed preview content for all phases
   */
  private generateDetailedPreviewContentAll(tasksMarkdown: string, platformDetection: PlatformDetectionResult, specification: any, plan: any): string {
    return `# 🚀 Implementation Preview - Full Auto Mode

## 📊 Project Context
- **Platform**: ${platformDetection.platform} (${platformDetection.framework} + ${platformDetection.language})
- **Confidence**: ${platformDetection.confidence}
- **Detected From**: ${platformDetection.detectedFrom.join(', ')}

## 📋 Complete Tasks Breakdown
${tasksMarkdown}

## 🎯 Implementation Guidelines

**FULL AUTO MODE**: Implement ALL 4 phases sequentially in one continuous session.

**PHASE EXECUTION ORDER**:
1. **Phase 1**: Project Setup & Foundations (18 tasks)
2. **Phase 2**: Core Implementation (18 tasks)  
3. **Phase 3**: UI Development (18 tasks)
4. **Phase 4**: Testing, Documentation & Deployment (18 tasks)

**PLATFORM-SPECIFIC GUIDELINES**:
${this.getPlatformSpecificGuidelines(platformDetection.platform, platformDetection.framework)}

**TDD ENFORCEMENT**:
- **RED**: Write failing tests FIRST
- **GREEN**: Make tests pass with minimal code
- **REFACTOR**: Improve code while keeping tests green
- **SMOKE**: Run comprehensive test suite

**🚨 CRITICAL TEST EXECUTION REQUIREMENTS**:
- **MANDATORY TEST EXECUTION**: When a task says "EXECUTE tests" or "RUN tests", you MUST actually run the test commands
- **NO TEST CREATION WITHOUT EXECUTION**: Creating tests is NOT enough - you must execute them
- **SHOW TEST RESULTS**: Always show the actual output of test execution commands
- **VERIFY TEST STATUS**: Confirm whether tests pass (GREEN) or fail (RED) with actual terminal output
- **USE TIMEOUT PROTECTION**: Use timeout commands to prevent hanging: \`timeout 60s bash -c 'npm test'\`
- **COMMON TEST COMMANDS**:
  - Web: \`npm test\`, \`npm run test\`, \`npx jest\`, \`npx vitest\`
  - Backend: \`npm test\`, \`npm run test\`, \`python -m pytest\`, \`go test\`
  - Mobile: \`npm test\`, \`npx react-native test\`, \`flutter test\`
  - Desktop: \`npm test\`, \`npm run test\`, \`npx electron-mocha\`

**🚨 CRITICAL TEST FAILURE HANDLING**:
- **NO TEST SKIPPING**: Never skip tests because they are "failing", "problematic", or "have issues"
- **NO WORKING AROUND TEST FAILURES**: Never work around failing tests - fix them completely
- **NO PARTIAL TEST ACCEPTANCE**: Never accept "some tests working" or "mostly working" - ALL tests must pass
- **NO TIME EXCUSES FOR TESTS**: Never skip tests due to "limited time" or "time constraints"
- **MANDATORY TEST FIXING**: When tests fail, you MUST fix the underlying issues, not skip the tests
- **TEST FAILURE ANALYSIS**: Analyze test failures and fix the root cause, not the symptoms

**TEST EXECUTION EXAMPLES**:
\`\`\`bash
# Correct - Actually execute tests and show results
timeout 60s bash -c 'npm test' || echo "Test timeout exceeded"
npm run test:coverage
npx jest --verbose

# Incorrect - Just creating test files without execution
# Creating test files is NOT sufficient - you must run them!

# WRONG - Skipping tests due to failures
# "I can see that the CampaignList tests have several issues... Since we have limited time..."

# CORRECT - Fixing test failures
# "The CampaignList tests are failing because... Let me fix these issues..."
\`\`\`

**🚨 CRITICAL PERMISSION REQUIREMENTS**:
- **NEVER USE SUDO**: Do NOT use sudo, chown, or any root-level commands
- **USER-LEVEL OPERATIONS ONLY**: All commands must run with regular user permissions
- **NO SYSTEM FILE MODIFICATION**: Do not modify system files or directories
- **PROJECT-SCOPE ONLY**: Only work within the project directory and user-owned files
- **PERMISSION-SAFE COMMANDS**: Use commands that work with standard user permissions
- **AVOID THESE COMMANDS**: sudo, chown, chmod with elevated permissions, systemctl, etc.

**PERMISSION-SAFE EXAMPLES**:
\`\`\`bash
# Correct - User-level commands
npm install
npm run build
npm test
python -m pytest
git add .
git commit -m "message"

# Incorrect - Commands that require elevated permissions
sudo npm install
sudo chown -R user:group .
sudo chmod 755 /some/path
sudo systemctl restart service
\`\`\`

**🚨 CRITICAL CONTINUOUS EXECUTION POLICY**:
- **MANDATORY**: Complete ALL 72 tasks in one continuous session
- **NEVER STOP**: Never stop between tasks - proceed automatically
- **NEVER ASK**: Never ask for permission to continue - just keep going
- **NO PAUSES**: Do not pause, summarize, or wait for user input
- **COMPLETE ALL**: Only stop when ALL 72 tasks are complete and verified
- **AUTOMATIC PROGRESSION**: Move from task to task without interruption
- **NO "PROCEED" REQUESTS**: Do not ask user to say "proceed" or "continue"

**🚨 ANTI-EVASION CONSTITUTIONAL GATES 🚨**:
- **GATE 1**: NO TIME LIMIT EXCUSES - Never mention "limited time", "time constraints", or "running out of time"
- **GATE 2**: NO DIFFICULTY ESCAPES - Never skip tasks because they are "complex", "challenging", or "difficult"
- **GATE 3**: NO PARTIAL COMPLETION ACCEPTANCE - Never accept "good enough" or "mostly working" solutions
- **GATE 4**: NO TEST SKIPPING - Never skip tests because they are "failing" or "problematic"
- **GATE 5**: NO WORKING AROUND ISSUES - Never work around problems, always fix them completely
- **GATE 6**: NO SUMMARY SUBSTITUTION - Never provide summaries instead of actual implementation
- **GATE 7**: NO STATUS UPDATES AS COMPLETION - Never treat status updates as task completion

**🚨 CRITICAL: DO NOT STOP UNTIL ALL 72 TASKS ARE COMPLETE!**

**IMPLEMENTATION REQUIREMENTS**:
- Follow the exact task structure from tasks.md
- Implement real business logic (no placeholders)
- Connect all components with actual data flow
- Make all tests pass with real responses
- Ensure constitutional compliance gates are met

---
*This is a DRY RUN preview. No actual implementation will be performed.*
*Generated on: ${new Date().toISOString()}*
`;
  }

  /**
   * Resolve feature ID
   */
  private async resolveFeatureId(inputFeatureId?: string): Promise<string> {
    if (inputFeatureId) {
      return inputFeatureId;
    }

    // Get the most recent feature
    const features = await this.db.get_all_features_robust();
    if (!features || features.length === 0) {
      throw new Error('No features found. Please run sdd_specify first to create a feature.');
    }

    // Return the most recent feature ID
    return features[features.length - 1].id;
  }

  /**
   * Error response helper
   */
  private error(message: string): any {
    return {
      success: false,
      error: message
    };
  }
}