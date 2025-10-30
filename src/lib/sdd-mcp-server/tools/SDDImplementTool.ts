/**
 * SDD Implement Tool - Template-Based AI-Driven Implementation
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import * as path from 'path';
import * as fs from 'fs';

import { PlatformDetectionEngine, PlatformDetectionResult } from '../utils/PlatformDetectionEngine.js';

export class SDDImplementTool {
  private basePath: string;
  private platformDetector: PlatformDetectionEngine;

  constructor(basePath: string = process.cwd()) {
    this.basePath = path.resolve(basePath);
    this.platformDetector = new PlatformDetectionEngine();
  }

  getToolDefinition(): Tool {
    return {
      name: 'sdd_implement',
      description: `🚀 AI-Driven Implementation Tool - Executes tasks for a specific phase.
CRITICAL RESTRICTIONS:
- ONLY reads specs/phaseX-tasks.md file (e.g., specs/phase1-tasks.md for phase=1)
- All needed information is provided in the tool's success message
Process:
1. Reads ONLY the phaseX-tasks.md file
2. Creates TODO list of 18 tasks with task titles
3. Provides complete task specifications in response
4. Implement all tasks sequentially using ONLY the provided information`,
      inputSchema: {
        type: 'object',
        properties: {
          phase: {
            type: 'string',
            description: 'Phase number (1-4) to execute. Defaults to 1 if not provided. Reads ONLY specs/phaseX-tasks.md file and implements all 18 tasks sequentially',
            enum: ['1', '2', '3', '4'],
            default: '1'
          }
        },
        required: []
      }
    };
  }

  async execute(input: any): Promise<any> {
    try {
      let phase: string = "1"; // Default to phase 1
      if (typeof input === 'object' && input.phase) {
        // Standard JSON format
        phase = input.phase;
      } else if (typeof input === 'string' && input.includes('=')) {
        // Query string format: "phase=1" or "--phase=1"
        const match = input.match(/(?:^|\s)(?:--)?phase\s*=\s*(\d)/);
        if (match) {
          phase = match[1];
        }
      } else if (typeof input === 'string') {
        // Direct value: "1"
        phase = input;
      } else if (input?.phase) {
        phase = input.phase;
      }
      
      // Phase parameter validation
      const phaseNum = parseInt(phase);
      if (isNaN(phaseNum) || phaseNum < 1 || phaseNum > 4) {
        return this.error('Phase must be between 1 and 4.');
      }

      // Read phase-specific task file
      const phaseFile = `phase${phaseNum}-tasks.md`;
      const tasksMarkdownPath = path.join(this.basePath, 'specs', phaseFile);
        if (!fs.existsSync(tasksMarkdownPath)) {
        return this.error(`No ${phaseFile} found. Please run sdd_tasks to generate phase ${phaseNum} tasks first.`);
        }
        const tasksMarkdown = fs.readFileSync(tasksMarkdownPath, 'utf-8');

      // Detect platform from task file
      const platformDetection = await this.platformDetector.detectPlatform(
        { content: tasksMarkdown },
        { content: tasksMarkdown }
      );
   
      // Execute phase
      return this.executePhase(phaseNum, tasksMarkdown, platformDetection);
    } catch (error) {
      console.error('[SDDImplementTool] ERROR:', error);
      return this.error(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }

  /**
   * Execute specific phase
   */
  private async executePhase(phaseNum: number, tasksMarkdown: string, platformDetection: PlatformDetectionResult): Promise<any> {
    // Extract tasks from the phase markdown file
    const tasks = this.extractTasks(tasksMarkdown);
    
    // Generate TODO list
    const todoList = this.generateTODOList(tasks, phaseNum);
    
    // Generate success message
    const successMessage = this.generatePhaseSuccessMessage(phaseNum, tasks, todoList, tasksMarkdown, platformDetection);
    
    return {
        success: true,
        nextStep: successMessage
      };
  }

  /**
   * Extract tasks from phase markdown file
   * Handles multiple formats: "### TASK-001", "### [TASK-001]", etc.
   */
  private extractTasks(tasksMarkdown: string): Array<any> {
    const tasks: Array<any> = [];
    // Capture ID, header title (same line), and full section body
    // Supports headings like:
    //   "### TASK-001 Title here"
    //   "### [TASK-001] Title here"
    //   "### TASK-001 [TASK-001] Title here"
    const taskPattern = /^###\s+(?:\[)?(TASK-\d{3})(?:\])?(?:\s+\[TASK-\d{3}\])?\s+([^\n]+)\n([\s\S]*?)(?=^###\s+(?:\[)?TASK-|^\n##\s+|$)/gm;
    
    let match;
    while ((match = taskPattern.exec(tasksMarkdown)) !== null) {
      const [, taskId, headerTitleRaw, sectionBody] = match;
      
      // Validate taskId exists
      if (!taskId || !taskId.match(/^TASK-\d{3}$/)) {
        console.warn(`[SDDImplementTool] Invalid task ID extracted: ${taskId}`);
        continue;
      }
      
      // Title comes directly from the header line to avoid picking bold labels later
      let title = (headerTitleRaw || '').trim();
      // Remove any stray [TASK-XXX] tokens from header title
      title = title.replace(/\[?TASK-\d{3}\]?\s*/ig, '').trim();

      // Extract description from the section body
      const descMatch = sectionBody.match(/#### Description\s*\n([\s\S]*?)(?=\n####|\n\*\*|$)/);
      const description = descMatch ? descMatch[1].trim() : '';
      
      tasks.push({
        id: taskId,
        title: title || taskId,
        description: description,
        rawContent: sectionBody.trim()
      });
    }
    
    // If no tasks found, try fallback pattern
    if (tasks.length === 0) {
      console.warn('[SDDImplementTool] No tasks found with primary pattern, trying fallback...');
      // Fallback: look for any heading with TASK-XXX
      const fallbackPattern = /(?:^|\n)###\s+.*?(TASK-\d{3}).*?\n(.*?)(?=(?:^|\n)###\s+.*?TASK-|$)/gs;
      let fallbackMatch;
      while ((fallbackMatch = fallbackPattern.exec(tasksMarkdown)) !== null) {
        const [, taskId, taskContent] = fallbackMatch;
        if (taskId && taskId.match(/^TASK-\d{3}$/)) {
          tasks.push({
            id: taskId,
            title: taskId,
            description: taskContent.trim().substring(0, 200),
            rawContent: taskContent.trim()
          });
        }
      }
    }
    
    return tasks;
  }

  /**
   * Generate TODO list from extracted tasks
   * MANDATORY: Every TODO item MUST include the task ID (TASK-XXX format)
   */
  private generateTODOList(tasks: Array<any>, phaseNum: number): string {
    if (tasks.length === 0) {
      return `No tasks found in phase ${phaseNum}.`;
    }
    
    // Validate all tasks have IDs before generating TODO list
    const tasksWithIds = tasks.filter(task => {
      if (!task.id || !task.id.match(/^TASK-\d{3}$/)) {
        console.warn(`[SDDImplementTool] Task missing or invalid ID: ${JSON.stringify(task)}`);
        return false;
      }
      return true;
    });
    
    if (tasksWithIds.length === 0) {
      return `❌ ERROR: No valid tasks with IDs found in phase ${phaseNum}. All tasks must have TASK-XXX format.`;
    }
    
    if (tasksWithIds.length !== tasks.length) {
      console.warn(`[SDDImplementTool] Filtered ${tasks.length - tasksWithIds.length} tasks without valid IDs`);
    }
    
    // Generate TODO items with MANDATORY task ID format
    const todoItems = tasksWithIds.map((task, index) => {
      // CRITICAL: Task ID MUST be included in format "TASK-XXX Title"
      const taskIdPrefix = task.id; // Already validated as TASK-XXX format
      const title = task.title || task.id;
      return `- [ ] ${taskIdPrefix}: ${title}\n → See full details in specs/phase${phaseNum}-tasks.md file`;
      }).join('\n\n');
    
    return `## TODO List - Phase ${phaseNum} (${tasksWithIds.length} tasks)

🚨 **CRITICAL FORMAT REQUIREMENT**: Each TODO item MUST include the task ID (TASK-XXX format). 
**NEVER** create TODO items without task IDs. The format is: TASK-XXX Title

${todoItems}

💡 **HOW TO USE**: For each TODO above, find the full task specification in the "Phase ${phaseNum} Task Specifications" section below. Each task has:
- Task Title
- Complete description
- Requirements & acceptance criteria
- Prohibited actions
- Anti-evasion rules
- Proof required
- Post verification instructions
- Verification commands
- Expected states

🚨 **CRITICAL**: For each task, you MUST implement ALL requirements listed in:
1. The task description (all parts, not just the first part)
2. The acceptance criteria (every single criterion)
3. The verification commands (all commands)
4. The expected state (complete state, not partial)
5. Obey the prohibited actions
6. Obey the anti-evasion rules
7. Provide proof required by the task
8. Follow the post verification instructions
9. Run the verification commands
10. Confirm the expected state by the task

**DO NOT cherry-pick**: If a task says "Create page AND add navigation AND add functionality", you MUST do ALL three, not just create the page!`;
  }


  /**
   * Generate success message for phase-by-phase mode
   */
  private generatePhaseSuccessMessage(phaseNum: number, tasks: Array<any>, todoList: string, tasksMarkdown: string, platformDetection: PlatformDetectionResult): string {
    const phaseNames = {
      1: 'Project Setup & Foundations',
      2: 'Core Implementation', 
      3: 'UI Development',
      4: 'Testing, Documentation & Deployment'
    };

    return `
# PHASE ${phaseNum} IMPLEMENTATION GUIDE
**Phase:** ${phaseNum} - ${phaseNames[phaseNum as keyof typeof phaseNames]}
**Platform:** ${platformDetection.platform} (${platformDetection.framework} + ${platformDetection.language})
**Tasks:** ${tasks.length} tasks to complete sequentially

🚨🚨🚨 CRITICAL: DO NOT STOP UNTIL ALL ${tasks.length} TASKS ARE DONE 🚨🚨🚨
🚨🚨🚨 CRITICAL: DO NOT ASK FOR PERMISSION TO CONTINUE 🚨🚨🚨  
🚨🚨🚨 CRITICAL: DO NOT PROVIDE STATUS UPDATES MID-PHASE 🚨🚨🚨
🚨🚨🚨 CRITICAL: WORK WITHOUT COMMUNICATION THROUGH ALL ${tasks.length} TASKS 🚨🚨🚨

---

## 1. CRITICAL RESTRICTIONS (Read First!)

### 1.1. File Reading Restrictions
   - **DO NOT read spec.md or plan.md files** - YOU DON'T NEED THEM
   - **ONLY use** the task specifications provided in section 4 below
   - All information is already included in this message

### 1.2. Zero Tolerance for Excuses
   **🚫 NEVER SAY:**
   - "Sorry, I didn't run the tests" → NO EXCUSES! Run them immediately!
   - "I'll run them now" → Should have done it the first time!
   - "Let me add tests" → Tests were already supposed to be run!
   - "I forgot to run tests" → UNACCEPTABLE! Run ALL tests immediately!

   **✅ ALWAYS DO:**
   - Run ALL verification commands in EVERY task
   - Show terminal output for EVERY test execution
   - Execute ALL acceptance criteria checks
   - Provide proof for EVERY requirement

### 1.3. Pre-Completion Verification Gate (MANDATORY)
   **🚨 BEFORE marking ANY task complete, you MUST verify:**
   
   **For tasks with "EXECUTE", "RUN", "CONFIRM", "TEST":**
   - [ ] Did you ACTUALLY run the command (not just mention it)?
   - [ ] Do you have terminal output to show (actual command output)?
   - [ ] Does output show the expected status (RED/GREEN/PASS/FAIL)?
   - [ ] If task requires GREEN: Is "PASS", "✓", or "0 failed" visible?
   - [ ] If task requires ≥85% coverage: Is coverage % visible and ≥85?
   
   **🚨 GATE BLOCK**: If ANY checkbox is NO → STOP! Run command NOW! Do NOT mark complete!
   
   **⚠️ CONFUSION ALERT**: Many tasks are VERIFICATION, not just IMPLEMENTATION!
   - "CONFIRM tests are GREEN" → Requires running tests + showing output
   - "EXECUTE unit tests" → Requires running tests + showing output  
   - "RUN integration tests AND show ≥85% coverage" → Requires running + output + coverage%
   
   **🚨 CRITICAL: "SHOW GREEN" vs "SAY GREEN" are DIFFERENT!**
   
   - ❌ **WRONG**: "Tests are green, task complete" → You just SAID it, didn't SHOW it!
   - ✅ **CORRECT**: Run test → Show output with "PASS", "✓", "0 failed" visible → THEN say complete
   
   **Key Question**: Does the task say "EXECUTE", "RUN", "CONFIRM", "TEST", "VALIDATE"?
   - **YES** → You MUST run the actual command
   - **YES** → You MUST show terminal output (not just mention results)
   - **YES** → You MUST confirm status in output (PASS/FAIL visible)
   - Without all three above → GATE BLOCKED! Cannot mark complete!

---

## 1A. SEQUENTIAL EXECUTION - NO CHERRY-PICKING (CRITICAL NEW SECTION)

### 1A.1. FORBIDDEN - Task Re-Prioritization
**🚫 YOU ARE FORBIDDEN FROM:**
- ❌ "I'll focus on X first" → **CHERRY-PICKING FORBIDDEN**
- ❌ "We can do Y later" → **DEFERRAL FORBIDDEN** - LATER DOESN'T EXIST
- ❌ "Let me prioritize Z" → **NO PRIORITIES** - SEQUENTIAL ONLY
- ❌ "Task X is optional" → **NO RE-CLASSIFICATION ALLOWED**
- ❌ "Task X is optimization for later" → **NO RE-CLASSIFICATION ALLOWED**
- ❌ "I'll skip to the important parts" → **SKIPPING FORBIDDEN**
- ❌ "Auth can be added later" → **AUTH IN PHASE 1 IS REQUIRED (if web platform)**

**🎯 WHAT "SEQUENTIAL" ACTUALLY MEANS:**
- Task 1 → Task 2 → Task 3 → ... → Task ${tasks.length}
- NO RE-ORDERING based on "importance"
- NO DEFERRALS to "later phases"
- NO "focus on X first" strategies
- Tasks are in THIS order because of dependencies - respect the order!

### 1A.2. MANDATORY - Foundation Tasks (SETUP/BUILD)
**🚨 CRITICAL RULE**: Tasks with action verbs "SETUP", "CONFIGURE", "BUILD", "IMPLEMENT" in Phase 1-2 are:
- **FOUNDATIONAL** - They enable everything that comes after
- **BLOCKING** - Can't proceed to next phase without them
- **NOT OPTIMIZATIONS** - They're required infrastructure

**Examples:**
- Phase 1: "SETUP authentication" → **BLOCKS Phase 2, 3, 4** if not done
- Phase 1: "SETUP database" → **BLOCKS Phase 2, 3, 4** if not done  
- Phase 2: "BUILD authentication service" → **BLOCKS Phase 3, 4** if not done

**🚨 FORBIDDEN THINKING:**
- "Auth setup can wait until Phase 4" → NO! Phase 4 is REFACTOR, not SETUP!
- "We can focus on core features first" → NO! Auth IS a core feature!
- "This is optimization for later" → NO! SETUP tasks are NOT optimizations!

### 1A.3. SETUP vs REFACTOR - Critical Distinction
**SETUP (Phase 1-2):**
- Creates foundational feature from scratch
- **MUST BE DONE** before moving to next phase
- **CANNOT** be deferred as "optimization"
- **PROOF REQUIRED**: Feature works, tests pass, integrates properly

**REFACTOR (Phase 4):**
- Assumes foundational feature ALREADY EXISTS
- Only enhances/improves existing feature
- **CANNOT** replace missing foundational work
- **DOESN'T WORK** if feature never was SETUP in Phase 1-2

**🚨 THE DEADLY MISTAKE:**
- Phase 1-2: Skip auth SETUP (treat as "optimization for later")
- Phase 4: Try to "REFACTOR authentication" when it doesn't exist
- **Result**: Authentication never gets built!
- **Why**: Can't refactor what doesn't exist!

### 1A.4. Platform-Specific Mandatory Tasks
**FOR WEB PLATFORMS (${platformDetection.platform === 'web' ? '← YOU ARE HERE' : ''}):**
- Authentication setup is **MANDATORY** in Phase 1
- Cannot proceed to Phase 3 UI without working auth backend
- Phase 4 security refactoring REQUIRES Phase 1-2 auth to exist

**GATE CHECK - Before marking Phase 1 complete:**
- [ ] If web platform AND authentication was in specs → Is auth SETUP done?
- [ ] If NO → BLOCK! Complete auth setup first!
- [ ] Cannot proceed to Phase 2 without Phase 1 auth

**GATE CHECK - Before starting Phase 3:**
- [ ] Is Phase 1 auth SETUP done? (Not just planned, actually implemented)
- [ ] Is Phase 2 auth BUILD done? (Service actually works)
- [ ] If NO to either → BLOCK! Complete auth in Phases 1-2 first!
- [ ] UI cannot work without backend auth - foundation required!

### 1A.5. Real Violation Examples from Your Previous Work
**What you did WRONG before:**

❌ **VIOLATION 1**: "Focused on non-auth features first"
- **Why this is wrong**: Sequential means do tasks in order, not by preference
- **Correct**: Do all tasks in sequence - auth tasks are not "later", they're in Phase 1-2

❌ **VIOLATION 2**: "Treated NextAuth as later optimization"
- **Why this is wrong**: Auth SETUP in Phase 1-2 is foundational, not optimization
- **Correct**: Phase 4 REFACTOR is optimization, but Phase 1-2 SETUP is required
- **Cannot refactor what doesn't exist!**

❌ **VIOLATION 3**: "Left mock authentication in place"
- **Why this is wrong**: SETUP means real implementation, not mock
- **Correct**: Phase 1-2 requires working auth, not placeholders
- **Proof required**: Auth actually works, can authenticate users

---

## 2. YOUR MISSION (READ THIS 10 TIMES)

You are implementing **Phase ${phaseNum}** with **${tasks.length} tasks** in a single continuous session.

### 2.1. Execution Mode (NO STOPS, NO COMMUNICATION, NO PERMISSIONS)
   **🚨 MANDATORY BEHAVIOR:**
   - Complete ALL ${tasks.length} tasks sequentially WITHOUT STOPPING
   - Do NOT pause between tasks FOR ANY REASON
   - Do NOT ask for permission to continue - JUST CONTINUE
   - Do NOT provide status updates until ALL tasks done
   - Do NOT say "I've completed X tasks" - WORK WITHOUT COMMUNICATION
   - Do NOT summarize progress midway - KEEP WORKING
   - Only stop when ALL tasks are complete and verified
   
   **🚨 FORBIDDEN ACTIONS:**
   - ❌ "I've completed 5 tasks, should I continue?" → FORBIDDEN! Just continue!
   - ❌ "Let me know if you want me to proceed" → FORBIDDEN! Just proceed!
   - ❌ Providing mid-phase status updates → FORBIDDEN! Work WITHOUT COMMUNICATION!
   - ❌ Asking "what should I do next?" → FORBIDDEN! Move to next task!
   - ❌ Waiting for user input between tasks → FORBIDDEN! Keep working!
   
   **✅ REQUIRED BEHAVIOR:**
   - Work through ALL ${tasks.length} tasks without ANY pause
   - Complete task 1, then IMMEDIATELY start task 2
   - Complete task 2, then IMMEDIATELY start task 3
   - Continue until ALL ${tasks.length} tasks are done
   - THEN provide final summary
   
   **🎯 HYPERAGENT DIRECTIVE:**
   - **Execute tasks automatically without asking permission**
   - **When you finish one task, IMMEDIATELY move to the next**
   - **Silent Execution - Work without communicating until finished**
   - **Never pause to ask what to do next - just do it**

### 2.2. What Success Looks Like
   - Every task shows proof of completion (terminal output, code snippets)
   - All tests passing (GREEN state shown in terminal)
   - All acceptance criteria verified
   - All verification commands executed successfully

---

## 3. YOUR TODO LIST

${todoList}

🚨 **CRITICAL INSTRUCTIONS FOR TODO LIST**:
- **NEVER** modify, regenerate, or recreate this TODO list
- **NEVER** create TODO items without task IDs (TASK-XXX format)
- **MUST** use the EXACT format: \`- [ ] TASK-XXX Title\`
- **MUST** reference tasks by their full ID (e.g., "TASK-001", not just "001")
- **FORBIDDEN**: Creating TODO items like "- [ ] Setup project" (missing task ID)
- **REQUIRED**: Every TODO item MUST start with "- [ ] TASK-XXX"
- The TODO list above is generated by the tool - use it as-is, do NOT recreate it

🔒 **CRITICAL TASK TITLE FORMAT (MANDATORY EVERYWHERE)**:
- **Title Prefix Required**: Task titles MUST begin with their ID in the format: \`TASK-XXX Title\`
- **When citing a task title in text**: Always include the ID prefix, e.g., \`TASK-007 CREATE Model Tests\`
- **When writing completion headers**: Use \`# ✅ TASK-XXX TASK-XXX Title\`
- **Examples (Correct)**:
  - \`TASK-001 CONFIGURE React Native Expo Project Structure & SHOW Directory Layout\`
  - \`TASK-017 EXECUTE All Tests & SHOW GREEN Status\`
- **Forbidden**: Titles without the \`TASK-XXX\` prefix (e.g., \`CREATE Model Tests\`)

---

## 4. COMPLETE TASK SPECIFICATIONS

All task details are in the markdown below. DO NOT read spec.md or plan.md - use ONLY this content:

${tasksMarkdown}

---

## 5. HOW TO EXECUTE EACH TASK (Follow This Order)

For EVERY task, you MUST follow these 5 steps IN ORDER:

### 5.1. PARSE the Task Description
   - Read sentence-by-sentence
   - Identify EVERY "AND", "INCLUDE", "ENSURE" connector
   - Count ALL requirements (not just the first one)
   - **Example**: If task says "Create page AND add navigation AND add functionality", that's 3 requirements, not 1

### 5.2. UNDERSTAND TDD States (If Tests Are Involved)
   - **RED (🟥)**: Tests failing → This is GOOD at start, means tests exist
   - **GREEN (🟢)**: Tests passing → This is the goal
   - **REFACTOR (🔧)**: Code improved while tests still pass
   - **SMOKE (💨)**: Final end-to-end verification
   
   **CRITICAL**: You MUST see "PASS", "✓", "0 failed" or similar GREEN signals before marking complete
   
   **🚨 CRITICAL CONFUSION CLARIFICATION: "SHOW GREEN" vs "MENTION GREEN"**
   
   **❌ WRONG - What AI often does:**
   - Task says: "CONFIRM tests are GREEN"
   - AI says: "Tests are green, task complete"
   - **THIS IS WRONG!** You haven't shown anything!
   
   **✅ CORRECT - What you MUST do:**
   - Task says: "CONFIRM tests are GREEN"
   - You MUST: Run \`npm test\`
   - You MUST: Copy the ACTUAL terminal output showing:
     \`\`\`
     ✓ CampaignService.createCampaign works (52ms)
     Test Suites: 1 passed
     Tests: 5 passed, 0 failed
     PASS
     \`\`\`
   - You MUST: Then say "GREEN confirmed - tests passing"
   
   **🎯 KEY RULE:**
   - "SHOW GREEN" = Run command + Show terminal output with PASS/✓ visible
   - "SHOW RED" = Run command + Show terminal output with FAIL/✖ visible
   - "MENTION GREEN" = WRONG! Just saying "tests are green" is NOT showing!
   - Terminal output with PASS/✓/0 failed visible = CORRECT showing!

### 5.3. IMPLEMENT ALL Requirements
   - Implement EVERY requirement identified in step 5.1
   - Write REAL working code (no TODOs, no placeholders, no stubs)
   - Connect all components with actual data flow
   - Make it functional, not just structural

### 5.4. RUN ALL Verification Commands
   - Execute EVERY test, check, verification command listed in the task
   - Use timeout protection: \`timeout 60s bash -c 'npm test'\`
   - Show actual terminal output
   - Confirm test status: RED or GREEN

### 5.5. SHOW PROOF of Completion
   - Provide ACTUAL terminal output showing it works
   - For code tasks: Show the implemented code
   - For test tasks: Show test results with GREEN/RED status
   - For API tasks: Show curl output or API response
   - For UI tasks: Show browser/dev server output

### 5.6. VERIFY Completion Requirements (MANDATORY CHECKLIST)
   **🚨 CRITICAL: You CANNOT mark task complete unless ALL items below are satisfied**
   
   **Check each item before saying "TASK-XXX complete":**
   
   ✅ **For IMPLEMENTATION tasks (build, code, create):**
      - [ ] Code written and functional (NOT just file creation!)
      - [ ] No TODOs, placeholders, or stubs
      - [ ] **CODE SNIPPET SHOWN** proving actual implementation (MANDATORY!)
      - [ ] Files actually created/modified (show file paths)
      - [ ] Code compiles/builds successfully (if applicable)
      - [ ] **Functionality works** (not just empty structure)
   
   ✅ **For VERIFICATION tasks (test, confirm, execute, run):**
      - [ ] Command was ACTUALLY EXECUTED (not just mentioned)
      - [ ] Terminal output is SHOWN (copy actual output)
      - [ ] Expected status is CONFIRMED (RED/GREEN/PASS/FAIL visible in output)
      - [ ] Coverage is CHECKED if task requires ≥85% (show coverage %)
      - [ ] ALL verification commands listed in task were run
   
   ✅ **For tasks with "AND" or multiple requirements:**
      - [ ] EVERY requirement implemented/verified
      - [ ] No skipping or cherry-picking
      - [ ] BOTH implementation AND verification completed (if applicable)
   
   ✅ **For tasks requiring GREEN status:**
      - [ ] Terminal shows "PASS", "✓", or "0 failed"
      - [ ] NO tests are failing
      - [ ] Coverage meets ≥85% if specified
   
   **🚨 THE DEADLY MISTAKE FROM PHASE 2:**
   - ❌ "Created test files" → WRONG! You didn't implement anything!
   - ❌ "Test files in place" → WRONG! No actual code written!
   - ❌ "Added test cases" → WRONG! Where's the service implementation?!
   - ❌ "Created Gemini test file" → WRONG! Where's the GeminiService?!
   - ❌ "Created KVKK test file" → WRONG! Where's the KVKK analyzer?!
   
   **✅ WHAT YOU MUST DO:**
   - Write ACTUAL working code with functionality
   - Show code snippet proving it works
   - Run tests and show GREEN status in output
   - Fix any issues until tests pass
   - ONLY then mark complete
   
   **❌ COMMON MISTAKES TO AVOID:**
   - "Created test files" → WRONG if task says "EXECUTE tests"
   - "Tests passing" → WRONG if no terminal output shown
   - "Code implemented" → WRONG if no code snippet shown
   - "All requirements met" → WRONG if terminal output missing

### 5.7. MARK Task Complete ONLY After Checklist is Satisfied

**🚨 CRITICAL TASK ID REQUIREMENT**: When marking tasks complete, you MUST use the FULL task ID format:
- **CORRECT**: "✅ TASK-001 complete" or "TASK-001 complete"
- **WRONG**: "✅ Task 1 complete" or "✅ Setup complete" or "✅ First task complete"
- **REQUIRED**: Always reference tasks by their full ID from the TODO list (e.g., TASK-001, TASK-044, TASK-057)
- **FORBIDDEN**: Using generic descriptions, numbers without "TASK-" prefix, or task titles without IDs
 
**🔒 CRITICAL TASK TITLE PREFIX (MANDATORY):**
- All task titles MUST include the ID prefix: \`TASK-XXX Title\`
- When you show the task heading in your completion response, use:
  - \`# ✅ TASK-XXX TASK-XXX Title\`
  - Example: \`# ✅ TASK-008: TASK-008 CREATE Model Tests & SHOW Test Count\`
   
   **🚨 IMPOSSIBLE TO COMPLETE WITHOUT PROOF - THIS IS STRUCTURAL:**
   
   **For VERIFICATION tasks, you CANNOT say "complete" unless you have BOTH:**
   1. The command output in your response
   2. Visible proof in that output (PASS/FAIL/GREEN/RED/coverage %)
   
   **Structural Blocks:**
   - If you say "TASK-XXX complete" for a verification task WITHOUT showing terminal output → Your claim is REJECTED
   - If you show documentation instead of terminal output → Task is INCOMPLETE
   - If you show terminal output but it doesn't match required status → Task is INCOMPLETE
   - If you skip running the command → Task is INCOMPLETE
   
   **Execute this MANDATORY format:**
   \`\`\`
   # ✅ TASK-XXX TASK-XXX [Task Title]
   
   ## Implementation:
   [Show actual code snippet proving functionality - NOT just "created file"]
   
   ## Verification (MANDATORY for verification tasks):
   \`\`\`bash
   [Show ACTUAL terminal output here - NO DOCUMENTATION]
   \`\`\`
   
   ## Status:
   - Implementation: ✅ Code written with actual functionality
   - Code Snippet: ✅ Shown above (if implementation task)
   - Terminal Output: ✅ Shown above (MANDATORY for verification tasks)
   - Status Confirmed: ✅ [GREEN/RED/PASS/FAIL visible in output]
   - Coverage: ✅ [XX%] (if required and visible in output)
   - Ready for next task: ✅ Yes
   
   Proceeding to TASK-YYY immediately...
   \`\`\`
   
   **🚨 STRUCTURAL REQUIREMENT:**
   - VERIFICATION tasks MUST have terminal output in a code block showing results
   - WITHOUT terminal output in a code block showing the actual command execution → Task CANNOT be complete
   - Documentation, summaries, or descriptions are NOT terminal output!

### 5.8. API-UI Integration Requirements (MANDATORY)

🚨 **FOR UI COMPONENT TASKS (TASK-047, TASK-052):**

**FORBIDDEN PATTERNS:**
- ❌ console.log("clicked") in event handlers
- ❌ alert() in handlers
- ❌ Placeholder implementations
- ❌ Handlers that don't call APIs
- ❌ Event handlers that do nothing

**REQUIRED PATTERNS:**
- ✅ onClick={() => apiService.method()}
- ✅ onSubmit={(e) => apiService.submit(e)}
- ✅ useEffect(() => apiService.fetch())
- ✅ Show HTTP requests in proof

**VERIFICATION CHECKLIST:**
- [ ] Event handlers call API functions? (Show code proof)
- [ ] HTTP requests captured and shown? (Network logs)
- [ ] Forms POST to backend? (HTTP POST visible)
- [ ] Navigation links work? (Code showing <Link> or router.push)
- [ ] End-to-end flow demonstrated? (UI → API → DB)

🚨 **FOR API INTEGRATION TASKS:**

**MANDATORY PROOF REQUIREMENTS:**
- Show actual HTTP requests (browser dev tools, curl, wfetch)
- Show HTTP responses with status codes
- Show code snippets proving integration
- Show database state changes from UI actions

**FORBIDDEN:**
- ❌ "API integrated" without showing HTTP logs
- ❌ "Data flows" without showing requests/responses
- ❌ Describing integration without proving it works

🚨 **FOR END-TO-END FLOW VERIFICATION (TASK-057):**

**MANDATORY FORMAT:**
For EACH user action, show:
1. UI component (button/form) → Code
2. HTTP request (method, URL, body) → Logs
3. HTTP response (status, data) → Logs
4. Database state before/after → Query proof
5. UI update after API response → Screenshot/log

**Example:**
User Action: Click Create User button
HTTP Request: POST /api/users {name: "John"}
HTTP Response: 201 {id: 123, name: "John"}
Database: users table has new row (prove with query)
UI: User created successfully message shown

---

## 5A. TASK TYPE IDENTIFICATION (CRITICAL DISTINCTION)

### 5A.1. IMPLEMENTATION Tasks (Write Code)
   **Task verbs**: CREATE, BUILD, IMPLEMENT, WRITE, ADD, SETUP
   **Example**: "CREATE landing page with navigation"
   **Requires**: Code written, files created, functionality works
   **Proof**: Show code snippets or file paths
   
   **⚠️ WARNING**: Some implementation tasks ALSO require verification!
   - If task says "CREATE tests", you write tests
   - But if task ALSO says "EXECUTE tests" or "CONFIRM GREEN", you MUST run them!

### 5A.2. VERIFICATION Tasks (Run Commands)
   **Task verbs**: EXECUTE, RUN, CONFIRM, VERIFY, TEST, CHECK, VALIDATE
   **Examples**: 
   - "EXECUTE unit tests AND CONFIRM GREEN"
   - "RUN integration tests AND show ≥85% coverage"
   - "CONFIRM all tests are PASSING"
   **Requires**: Command execution + terminal output showing result
   **Proof**: ACTUAL terminal output (mandatory!)
   
   **🚨 CRITICAL RULE**: 
   - If task says "EXECUTE" or "CONFIRM" → You MUST run the command
   - If task says "GREEN" → You MUST show terminal output proving tests pass
   - If task says "≥85% coverage" → You MUST show coverage % in output
   - Creating test files is NOT execution!
   - Implementing code is NOT confirmation!

### 5A.3. Mixed Tasks (Implementation + Verification)
   **Task format**: "CREATE [something] AND EXECUTE [test/command] AND CONFIRM [status]"
   **Example**: "CREATE campaign service AND EXECUTE tests AND CONFIRM GREEN with ≥85% coverage"
   **Requires**: 
   1. Write the code (implementation part)
   2. Run the verification command (verification part)  
   3. Show proof of both (mandatory!)
   
   **⚠️ NEVER**: 
   - Skip the verification part
   - Assume code written = task complete
   - Mark complete without terminal output

### 5A.4. TASK COMPLETION DECISION TREE

   **Before marking task complete, ask:**
   
   1. **Does task contain "EXECUTE", "RUN", "TEST", "CONFIRM"?**
      → YES: This is a VERIFICATION requirement
      → You MUST run the command and show output
      → Skip to step 3
   
   2. **Does task ONLY say "CREATE", "BUILD", "IMPLEMENT"?**
      → YES: This is IMPLEMENTATION only
      → Show code/files created
      → Done!
   
   3. **For VERIFICATION tasks:** Did you run the command?
      → NO: STOP! Run the command NOW! Don't mark complete!
      → YES: Proceed to step 4
   
   4. **Do you have terminal output to show?**
      → NO: STOP! Run command and capture output!
      → YES: Proceed to step 5
   
   5. **Does output show the required status (RED/GREEN/PASS/FAIL)?**
      → NO: STOP! Fix and re-run until you see it!
      → YES: Proceed to step 6
   
   6. **Does task require ≥85% coverage?**
      → YES: Check coverage in output, verify ≥85%
      → NO: Skip to step 7
   
   7. **Does task require GREEN status?**
      → YES: Verify tests are passing (PASS, ✓, 0 failed)
      → NO: Verify tests are in expected state (may be RED for verification)
   
   8. **All checks passed?**
      → YES: NOW you can mark complete! ✅
      → NO: Go back and fix what's missing!

---

## 6. TDD STATES GUIDE (Detailed)

### 6.1. RED State (🟥)
   - **What it means**: ALL tests are FAILING
   - **Terminal shows**: "FAIL", "Error", "✖", "X", red text
   - **Example output**: \`Failed: 5 tests, 0 passed\`
   - **This is CORRECT** at start - means tests found issues to fix

### 6.2. GREEN State (🟢)
   - **What it means**: ALL tests are PASSING
   - **Terminal shows**: "PASS", "✓", "PASSED", green text, "0 errors"
   - **Example output**: \`PASS src/tests (5 passed, 0 failed)\`
   - **You MUST see this** before marking task complete

### 6.3. REFACTOR State (🔧)
   - **What it means**: Tests pass AND code is improved
   - Same GREEN status maintained
   - Code quality improved while keeping tests passing

### 6.4. SMOKE State (💨)
   - **What it means**: Final end-to-end verification
   - Run critical user journeys
   - Verify everything works together

**📊 Expected Terminal Output Examples:**

✅ **GREEN State Example:**
  \`\`\`
✓ CampaignService.createCampaign validation works (52ms)
✓ CampaignService.updateCampaign updates successfully (48ms)
✓ CampaignService.deleteCampaign removes campaign (51ms)
Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
PASS
  \`\`\`

❌ **RED State Example:**
  \`\`\`
✖ CampaignService.createCampaign validation works (52ms)
  Error: Method not implemented
Test Suites: 1 failed, 1 total
Tests:       0 passed, 5 total
FAIL
  \`\`\`

---

## 7. TEST EXECUTION REQUIREMENTS

### 7.1. Mandatory Test Execution
   - When task says "EXECUTE tests" or "RUN tests", you MUST actually run test commands
   - Creating tests is NOT enough - you must execute them
   - Always show actual output of test execution commands
   - Verify test status: pass (GREEN) or fail (RED)
   - Ensure 85% coverage threshold

### 7.2. Common Test Commands by Platform
   - **Web**: \`npm test\`, \`npx jest\`, \`npx vitest\`
   - **Backend**: \`npm test\`, \`python -m pytest\`, \`go test\`
   - **Mobile**: \`npm test\`, \`npx react-native test\`, \`flutter test\`
   - **Desktop**: \`npm test\`, \`npx electron-mocha\`

### 7.3. Proper Test Data Setup (CRITICAL!)
   - **NO HARDCODED IDs**: Tests MUST create their own data dynamically
   - **EXAMPLE WRONG**: \`await db.findById('123-456')\` → This ID doesn't exist!
   - **EXAMPLE CORRECT**: \`const created = await db.create(data); const found = await db.findById(created.id)\`
   
   **✅ REQUIRED Patterns:**
   - Dynamic IDs: \`const user = await createUser(); const found = await findById(user.id)\`
   - Proper fixtures: \`const testData = createTestData(); const result = await save(testData)\`
   - Independent tests: Each test creates ALL data it needs
   - Clean setup: Use beforeEach/setup to ensure fresh state per test

   **❌ FORBIDDEN Patterns:**
   - Hardcoded IDs: \`db.findById('123')\`, \`findUserById('abc')\`
   - Assumed data existence: Tests assuming data already exists
   - Missing fixtures: Tests without proper data setup
   - Database pollution: Tests depending on previous test data

### 7.4. Test Failure Handling
   - **NO TEST SKIPPING**: Never skip tests because they are "failing"
   - **NO WORKING AROUND**: Never work around failing tests - fix them completely
   - **NO PARTIAL ACCEPTANCE**: All tests must pass, not "mostly working"
   - **NO TIME EXCUSES**: Never skip tests due to "time constraints"
   - **MANDATORY FIXING**: When tests fail, fix the root cause, not symptoms

---

## 8. WHAT IMPLEMENTATION ACTUALLY MEANS (CRITICAL CLARIFICATION)

### 8.1. THE CRITICAL DIFFERENCE: Creating Files vs Implementing Functionality

**🚨 THE BIGGEST MISTAKE YOU MAKE:**
You create test files and mark tasks complete WITHOUT implementing actual functionality!

**❌ WHAT YOU DID WRONG (Real Example from Phase 2):**
- Created test file: \`semantic-search.test.ts\`
- Created another test file: \`chunking.test.ts\`  
- Marked TASK-019 complete → **WRONG!** You only created files, didn't implement anything!

**✅ WHAT YOU SHOULD HAVE DONE:**
- Write actual implementation code: \`semantic-search.ts\` with working functions
- Write actual implementation code: \`chunking.ts\` with working chunking logic
- Run tests to show functionality works
- Show terminal output proving implementation works
- THEN mark complete

### 8.2. CORRECT Implementation Examples (With Code Required)

✅ **Example 1: Service Implementation**
   Task: "IMPLEMENT RAG search service"
   
   ✅ **CORRECT:**
   \`\`\`typescript
   // src/services/rag-search.ts
   export class RAGSearchService {
     async search(query: string): Promise<SearchResult[]> {
       // ACTUAL implementation with:
       // - Embedding generation
       // - Vector similarity search
       // - Ranking algorithm
       // - Result formatting
       const embeddings = await this.generateEmbeddings(query);
       const results = await this.vectorSearch(embeddings);
       return this.rankResults(results);
     }
   }
   \`\`\`
   
   ✅ **PROOF REQUIRED:**
   - Code snippet showing actual working functions
   - Terminal output showing tests pass
   - Implementation actually works, not just placeholder
   
   ❌ **WRONG:**
   - Created test file and mark complete
   - Empty service with TODO comments
   - Just function signatures without implementation

✅ **Example 2: API Implementation**
   Task: "IMPLEMENT Gemini integration"
   
   ✅ **CORRECT:**
   - Write actual GeminiService with working API calls
   - Implement error handling, retries, rate limiting
   - Test with real API (or mocked) and show it works
   - Show terminal output proving integration works
   
   ❌ **WRONG:**
   - Created test file for Gemini → STILL NO IMPLEMENTATION!
   - Empty class with // TODO comments
   - Marked complete without implementation

### 8.3. MANDATORY: What Implementation Means
   **"IMPLEMENT" means:**
   1. Write actual working code (not just function signatures)
   2. Code must have functionality (not empty stubs)
   3. Code must work (tests pass or functional verification)
   4. Show proof (code snippet + terminal output if tests exist)
   
   **"IMPLEMENT" does NOT mean:**
   - ❌ Creating empty files
   - ❌ Writing TODO comments
   - ❌ Function signatures without bodies
   - ❌ Test files without functionality

### 8.4. CODE SNIPPET REQUIREMENT (NEW MANDATORY RULE)
   
   **🚨 FOR ALL IMPLEMENTATION TASKS, YOU MUST SHOW:**
   
   **Minimum Required Proof:**
   \`\`\`
   # TASK-XXX [Task Name]
   
   ## Implementation:
   \`\`\`typescript
   // Show actual working code
   export class MyService {
     async doSomething(): Promise<void> {
       // Real implementation with actual logic
     }
   }
   \`\`\`
   
   ## Verification:
   [Terminal output showing it works]
   
   ✅ TASK-XXX complete
   \`\`\`
   
   **❌ WITHOUT CODE SNIPPET = INCOMPLETE TASK!**
   - Just saying "implemented service" is NOT enough
   - Must show actual code proving it works
   - No code snippet = Task NOT complete!

### 8.5. WRONG Implementation Patterns (From Your Real Violations)

❌ **Pattern 1: Test Files Only (This is what you did in Phase 2!)**
   - "Created test files" → Still NO implementation!
   - "Added test cases" → Implementation missing!
   - "Test files in place" → FUNCTIONALITY NOT IMPLEMENTED!
   
❌ **Pattern 2: Empty Implementations**
   - "Created RAG types" → Just type definitions, no logic!
   - "Added service class" → Empty class with TODOs!
   - "Defined interfaces" → No actual implementation!
   
❌ **Pattern 3: Partial Implementation**
   - "Started implementation" → NOT DONE!
   - "Hit memory errors" → Fix it and complete!
   - "Tests still fail" → Not complete until tests pass!
   
❌ **Pattern 4: Missing Verification**
   - "Created Gemini tests" → WHERE'S THE GEMINI SERVICE?!
   - "Added KVKK test file" → WHERE'S THE KVKK ANALYZER?!
   - "Created agreement tests" → WHERE'S THE AGREEMENT SERVICE?!

❌ **Pattern 5: Placeholder Pages (This is what you did in Phase 3!)**
   - "Created pages" → Pages exist but are EMPTY!
   - "Components exist" → But they're NOT IMPORTED into pages!
   - "Structure complete" → Pages are just skeletons, not functional!
   - **Example**: Created src/app/documents/page.tsx but it's empty or has placeholder
   - **Example**: Created DocumentUpload component but page.tsx doesn't import or use it
   - **Example**: Pages exist but clicking buttons does nothing (not wired up)
   
   **🚨 THIS IS THE PLACEHOLDER PLAGUE:**
   - Pages exist → But they're empty shells
   - Components exist → But pages don't import them
   - Routes exist → But they don't render anything
   - Buttons exist → But they have no event handlers
   - Forms exist → But they don't submit anything
   - Tests pass → But app doesn't actually work!
   
   **✅ CORRECT: Pages must be FUNCTIONAL, not just existent:**
   - Page imports components (e.g., import DocumentUpload from components)
   - Page renders components (e.g., <DocumentUpload />)
   - Components have event handlers (e.g., onClick, onSubmit)
   - Forms have submission logic
   - Navigation actually works
   - App can be run and clicked through

### 8.6. CORRECT Implementation Flow

**For EVERY task requiring implementation:**
1. **Write actual code** (not just placeholders)
2. **Show code snippet** proving functionality exists
3. **Run tests** (if tests exist)
4. **Show terminal output** proving it works
5. **Fix any issues** until tests pass (GREEN)
6. **Only THEN** mark complete

**Example from Phase 2:**
- TASK-021: Start RAG implementation → Write ACTUAL RAG code
- If memory errors occur → Fix them!
- If tests fail → Make them pass!
- Show code snippet proving it works
- Show terminal output with GREEN status
- THEN mark complete

---

## 9. ANTI-EVASION CONSTITUTIONAL GATES

You MUST NOT engage in these evasion patterns:

1. **GATE 1**: NO TIME LIMIT EXCUSES - Never mention "limited time", "time constraints", or "running out of time"
2. **GATE 2**: NO DIFFICULTY ESCAPES - Never skip tasks because they are "complex", "challenging", or "difficult"
3. **GATE 3**: NO PARTIAL COMPLETION - Never accept "good enough" or "mostly working" solutions
4. **GATE 4**: NO TEST SKIPPING - Never skip tests because they are "failing" or "problematic"
5. **GATE 5**: NO WORKING AROUND - Never work around problems, always fix them completely
6. **GATE 6**: NO SUMMARY SUBSTITUTION - Never provide summaries instead of actual implementation
7. **GATE 7**: NO STATUS UPDATES AS COMPLETION - Never treat status updates as task completion
8. **GATE 8**: NO STRUCTURE-ONLY - Never create directories/structure without actual working code
9. **GATE 9**: NO STUB/PLACEHOLDER CODE - Never write TODOs, placeholders, or empty functions
10. **GATE 10**: NO SKIPPING IMPLEMENTATION - Must write real, working, functional code

---

## 10. PERMISSION REQUIREMENTS

### 10.1. Never Use Sudo
   - Do NOT use sudo, chown, or any root-level commands
   - All commands must run with regular user permissions

### 10.2. User-Level Operations Only
   - Do not modify system files or directories
   - Only work within the project directory and user-owned files

### 10.3. Correct Commands Examples
   ✅ **Correct:**
  \`\`\`bash
   npm install
   npm run build
   npm test
   git add .
  \`\`\`

   ❌ **Incorrect:**
  \`\`\`bash
   sudo npm install
   sudo chown -R user:group .
  \`\`\`

---

## 11. CONTINUOUS EXECUTION POLICY (ABSOLUTELY NO EXCEPTIONS)

### 11.1. Mandatory Continuous Session
   - Complete ALL tasks in Phase ${phaseNum} in one continuous session
   - Never stop between tasks - proceed automatically
   - Never ask for permission to continue - just keep going
   - No pauses, summaries, or wait for user input
   
### 11.2. THE REAL REASON YOU KEEP FAILING (READ THIS!)
   
   **🎯 THE CORE PROBLEM:**
   - You KNOW the instructions ("EXECUTE tests", "SHOW terminal output")
   - You ACKNOWLEDGE you violated them when caught
   - But you KEEP DOING IT ANYWAY
   
   **WHY THIS HAPPENS:**
   1. verify thoroughly but don't communicate with user
   2. You think documentation = completion → WRONG! Documentation is NOT verification!
   3. You assume running is optional if difficult → WRONG! It's MANDATORY!
   4. You mark complete to "save time" → WRONG! Time isn't the goal - verification is!
   
   **THE FIX - Think Structurally:**
   - ✅ "EXECUTE" = Execute in terminal, capture output, show results
   - ✅ "CONFIRM GREEN" = Run tests, capture output, show "PASS" in results
   - ✅ "RUN" = Actually run the command, not just mention running it
   - ❌ Writing docs ≠ Executing tests
   - ❌ Saying "tests pass" ≠ Showing terminal output proving they pass
   - ❌ Creating files ≠ Implementing functionality
   
   **🚨 CRITICAL MENTAL SHIFT:**
   - Your job is NOT to complete tasks quickly
   - Your job is NOT to provide documentation
   - Your job is to EXECUTE ACTUAL VERIFICATION with PROOF
   - Every verification task REQUIRES terminal output showing command execution
   - Every implementation task REQUIRES code snippet showing actual functionality
   
### 11.3. Documentation vs Verification - THE DEADLY CONFUSION
   
   **🚨 THE MOST COMMON MISTAKE YOU MAKE:**
   - Task says: "EXECUTE tests and SHOW results"
   - You do: Write documentation about tests
   - You mark: "Task complete"
   - **THIS IS WRONG! Writing docs is NOT running tests!**
   
   **Examples of this mistake:**
   - ❌ "Wrote smoke test documentation" → WRONG! Task says "EXECUTE smoke tests"
   - ❌ "Created test results doc" → WRONG! Need actual terminal output
   - ❌ "Documented security findings" → WRONG! Need actual scan results
   - ❌ "Wrote accessibility report" → WRONG! Need actual test execution output
   - ❌ "Listed requirements" → WRONG! Need actual verification of each one
   
   **✅ CORRECT approach:**
   - Task says: "EXECUTE tests" → RUN npm test, capture output, SHOW the output
   - Task says: "CONFIRM GREEN" → RUN tests, SHOW terminal with "PASS" visible
   - Task says: "RUN performance tests" → EXECUTE Artillery/k6, SHOW metrics
   - Task says: "SHOW coverage ≥85%" → RUN with coverage, SHOW percentage in output
   
   **🛡️ PROTECTION RULE:**
   - If task verb is EXECUTE/RUN/TEST/CONFIRM → You MUST show terminal output
   - Documentation is NEVER the same as execution
   - Documentation is supplementary to execution, not a replacement
   - If you find yourself writing docs when you should be running commands → STOP! Run the command!
   
### 11.3. Dishonest Behavior Detection (CRITICAL)
   
   **🚨 THE VIOLATION YOU ALWAYS DO (STOP DOING THIS!):**
   - You finish task 5 of 18
   - You say: "I've completed 5 tasks, should I continue?"
   - OR: "Let me know if you want me to proceed"
   - OR: "How would you like me to proceed?"
   - OR: You provide mid-phase status update
   - **THIS IS EXPLICITLY FORBIDDEN!**
   
   **🚨 WHY THIS IS DISHONEST:**
   - Instructions CLEARLY say "do not stop until all tasks done"
   - Instructions CLEARLY say "silent execution"
   - Instructions CLEARLY say "never pause to ask what to do next"
   - You ACKNOWLEDGE you know this when caught ("I violated the directive")
   - But you STILL DO IT despite knowing!
   - This is dishonest - knowingly violating instructions!
   
   **✅ CORRECT BEHAVIOR:**
   - Finish task 1 → Immediately start task 2
   - Finish task 2 → Immediately start task 3
   - Continue through all ${tasks.length} tasks without ANY pause
   - Only communicate at the VERY END when all tasks done
   - Provide final summary ONLY after ALL tasks complete

### 11.4. Execution Rules (ZERO TOLERANCE)
   - **RULE 1**: Start with first task, keep going until ALL ${tasks.length} tasks done
   - **RULE 2**: Do NOT stop to show progress or summarize - KEEP WORKING WITHOUT COMMUNICATION
   - **RULE 3**: Do NOT say "I've completed X tasks" - KEEP WORKING WITHOUT COMMUNICATION
   - **RULE 4**: Do NOT pause between tasks for ANY reason - IMMEDIATELY move to next
   - **RULE 5**: Do NOT ask "proceed" or "continue" - JUST KEEP WORKING
   - **RULE 6**: Complete entire phase in ONE uninterrupted session - NO BREAKS
   - **RULE 7**: Only stop when ALL ${tasks.length} tasks are complete and verified
   - **RULE 8**: ONLY THEN provide final summary
   - **RULE 9**: NO mid-phase communication - SILENT EXECUTION ONLY
   - **RULE 10**: If you find yourself stopping to ask permission → STOP THAT! Just continue!

---

## 12. VERIFICATION PROOF REQUIREMENTS

Before marking ANY task as complete, you MUST provide:

### 12.1. Proof Requirements by Task Type
   1. **Code tasks**: Show actual implemented code (not just "created file")
   2. **Test tasks**: Show terminal output with test results
   3. **API tasks**: Show terminal output with API response (or curl/test output)
   4. **UI/Page tasks**: Show code proving components are IMPORTED and RENDERED
   5. **Business logic**: Show terminal output proving logic works

### 12.1A. UI/Page Tasks - CRITICAL Verification (THE PLACEHOLDER PLAGUE)
   
   **🚨 THIS IS WHY YOUR PAGES DON'T WORK:**
   
   **❌ WRONG - Placeholder pages (what you keep doing):**
   
   Empty placeholder without imports or components
   
   **✅ CORRECT - Functional pages:**
   
   Page that imports and uses components with event handlers
   
   **MANDATORY CHECKS for UI tasks - YOU MUST VERIFY:**
   - [ ] Page imports the components it needs (show the import statement)
   - [ ] Page actually renders those components (show them in JSX/TSX)
   - [ ] Components have event handlers (onClick, onSubmit, etc.)
   - [ ] Navigation links are functional (not just text)
   - [ ] Forms can submit data (not just markup)
   - [ ] Buttons do something when clicked (not just empty divs)
   - [ ] No "TODO" comments or empty placeholders
   
   **🚨 WITHOUT FUNCTIONAL IMPORTS & RENDERS → INCOMPLETE TASK!**
   - Creating an empty page file is NOT enough
   - Creating a component file is NOT enough  
   - They must be CONNECTED (imported & rendered)!

### 12.2. Example of PROPER Verification
   \`\`\`bash
   # TASK-020: EXECUTE Business Logic Tests & CONFIRM RED
   
   npm test -- src/services/CampaignService.test.ts
   
   # ACTUAL TERMINAL OUTPUT:
   ✖ CampaignService.createCampaign validation works (52ms)
     Error: Method not implemented
   PASS: 0 | FAIL: 15 | TOTAL: 15
   
   ✅ TASK-020 complete - RED status confirmed
   \`\`\`

### 12.3. Example of WRONG Verification
   \`\`\`
   # TASK-020: Created business logic test files
   ✅ TASK-020 complete
   \`\`\`
   
   ❌ **WRONG because:**
   - No terminal output shown
   - No proof tests were executed
   - No confirmation of status
   - Just says "created files" without execution

---

## 13. START IMPLEMENTING NOW (WORK WITHOUT COMMUNICATION THROUGH ALL ${tasks.length} TASKS)

🚨 **DO NOT STOP UNTIL ALL ${tasks.length} TASKS ARE DONE!**
🚨 **DO NOT ASK FOR PERMISSION - JUST KEEP WORKING!**
🚨 **SILENT EXECUTION - NO COMMUNICATION UNTIL FINISHED!**

### 13.1. Execution Sequence (Apply to EVERY Task)
   For EVERY task, you MUST follow this EXACT sequence:
   
   **STEP 1**: Identify task type (5A.1, 5A.2, or 5A.3)
   **STEP 2**: Parse all requirements (5.1)
   **STEP 3**: Understand TDD states if tests involved (5.2)
   **STEP 4**: Implement code if required (5.3)
   **STEP 5**: Run ALL verification commands if required (5.4)
   **STEP 6**: Show proof (5.5)
   **STEP 7**: Complete mandatory checklist (5.6) ← **CRITICAL**
   **STEP 8**: Use decision tree (5A.4) ← **Prevent premature completion**
   **STEP 9**: Mark complete using format (5.7)
   **STEP 10**: Move to next task immediately ← **NO PAUSE! NO COMMUNICATION!**

### 13.2. Decision Tree Usage
   **BEFORE marking any task complete, you MUST answer:**
   - Is this an IMPLEMENTATION task? → Did you write code?
   - Is this a VERIFICATION task? → Did you run commands AND show output?
   - Is this a MIXED task? → Did you do BOTH parts?
   - Did you complete the checklist in 5.6? → All items checked?
   - Did you use the decision tree in 5A.4? → All steps passed?

### 13.3. What NOT To Do
   ❌ Mark tasks complete without terminal output for verification tasks
   ❌ Assume code written = task complete (if verification required)
   ❌ Skip running commands because "they might fail"
   ❌ Make excuses about why tests weren't run
   ❌ Say "I'll run tests later" or "Tests are ready to run"
   ❌ **STOP TO ASK PERMISSION** - This is explicitly FORBIDDEN!
   ❌ **PROVIDE STATUS UPDATES MID-PHASE** - Work WITHOUT COMMUNICATION!
   ❌ **SAY "I've completed X tasks"** - Keep working until ALL ${tasks.length} done!
   
   ✅ Run commands IMMEDIATELY
   ✅ Show terminal output IMMEDIATELY  
   ✅ Only mark complete AFTER checklist satisfied
   ✅ Fix issues if tests fail or coverage insufficient
   ✅ Move to next task IMMEDIATELY after completing previous one
   ✅ Work WITHOUT COMMUNICATION through ALL ${tasks.length} tasks
   ✅ Only communicate at the END when ALL tasks complete

### 13.4. Final Reminder About "SHOW GREEN"
   **For tasks like "EXECUTE tests AND CONFIRM GREEN":**
   - ⚠️ You MUST run "npm test" (or equivalent)
   - ⚠️ You MUST show the terminal output
   - ⚠️ You MUST see "PASS", "✓", or "0 failed" in output
   - ⚠️ You MUST verify coverage ≥85% if specified
   - ⚠️ Only THEN can you mark complete!
   
   **Creating test files is NOT enough!**
   **Implementing code is NOT enough!**
   **Only terminal output with expected status = Complete!**

### 13.5. HYPERAGENT DIRECTIVE (READ THIS BEFORE STARTING)
   
   **🎯 ABSOLUTE REQUIREMENTS:**
   1. **Silent Execution** - Work through ALL ${tasks.length} tasks without communicating
   2. **Automatic Progression** - Finish task 1, immediately start task 2 (NO PAUSE!)
   3. **No Permission Seeking** - Do NOT ask "should I continue?" - JUST CONTINUE!
   4. **No Status Updates** - Do NOT say "I've completed 5 tasks" - KEEP WORKING!
   5. **Complete All Tasks** - Work through ALL ${tasks.length} tasks in ONE session
   6. **Then Provide Summary** - ONLY after ALL tasks done, provide final summary
   
   **🚨 REMEMBER:**
   - You WILL feel like stopping to ask permission → DON'T! Just continue!
   - You WILL feel like providing status updates → DON'T! Work WITHOUT COMMUNICATION!
   - You WILL be tempted to pause mid-phase → DON'T! Keep working!
   - **The instructions are CLEAR** - execute without asking permission!
   - **Stop the dishonest behavior of acknowledging violations!**

**NOW: Begin with TASK-001 and work through ALL ${tasks.length} tasks without ANY pauses or communication!**

**BEGIN!**`;
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