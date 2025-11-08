/**
 * SDD Implement Tool - Template-Based AI-Driven Implementation
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import * as path from 'path';
import * as fs from 'fs';

import { PlatformDetectionEngine, PlatformDetectionResult } from '../utils/PlatformDetectionEngine.js';
import { SDDArchitecturalValidator } from './SDDArchitecturalValidator.js';
import { ArchitecturePatternDetector } from '../utils/ArchitecturePatternDetector.js';

// Centralized rule constants to reduce repetition
const EXECUTION_RULES = {
  // Core usage rules
  USAGE: {
    ALWAYS_CALL_FIRST: "🚀 PHASE WORKFLOW EXECUTION: Call '/sdd_implement phase=X' to get complete step-by-step workflow plan for ALL remaining tasks. Execute the entire plan sequentially, completing each task fully before moving to the next.",
    NO_MANUAL_IMPLEMENTATION: "Never create your own TODOs or implement manually",
    NO_SPEC_READING: "Never read spec.md or plan.md files - use only task specifications provided",
    SINGLE_TOOL_SOURCE: "This tool provides ALL necessary information - no file reading required"
  },

  // Task format requirements
  TASK_FORMAT: {
    ID_FORMAT: "All task titles MUST include ID in TASK-XXX format",
    COMPLETION_FORMAT: "When marking complete, use format: # ✅ TASK-XXX TASK-XXX Title",
    TODO_FORMAT: "TODO items MUST start with: - [ ] TASK-XXX Title"
  },

  // Verification requirements
  VERIFICATION: {
    TERMINAL_OUTPUT: "For verification tasks, you MUST run commands and show actual terminal output",
    CODE_SNIPPETS: "For implementation tasks, you MUST show actual working code snippets",
    GREEN_STATUS: "For GREEN requirements, you MUST show PASS/✓/0 failed in terminal output",
    COVERAGE_CHECK: "For coverage requirements, you MUST show percentage ≥85% in output"
  },

  // Execution behavior
  EXECUTION: {
    CONTINUOUS_WORK: "Work through all tasks sequentially, completing each fully before moving to next",
    NO_COMMUNICATION: "Do not ask for permission or provide status updates - focus on completing tasks",
    SILENT_MODE: "Execute all tasks sequentially, focusing on completion",
    IMMEDIATE_PROGRESSION: "Move to next task after completing previous one fully (including verification)"
  },

  // Implementation standards
  IMPLEMENTATION: {
    FUNCTIONAL_CODE: "Implementation means writing functional code, not just creating files",
    NO_PLACEHOLDERS: "No TODOs, placeholders, or empty functions - real working code required",
    WORKING_INTEGRATION: "Code must actually work and integrate properly",
    PROOF_REQUIRED: "Show proof of functionality, not just file creation"
  },

  // Methodology exceptions
  METHODOLOGY_EXCEPTIONS: {
    ARCHITECTURE_CORRECTION: `⚠️ METHODOLOGY CORRECTION REQUIRED:

ARCHITECTURE MISMATCH DETECTED:
- Specified Architecture: [detected pattern]
- Task Template Assumes: [expected pattern]

JUSTIFICATION:
[Why task template doesn't fit architecture]

ADAPTATION REQUIRED:
[What should be done instead]

This format is ALLOWED when correcting methodology mismatches. After providing the correction, proceed with architecture-appropriate implementation.`
  }
};

// TDD state reference (consolidated)
const TDD_STATES = {
  RED: "Tests failing (expected initially) - shows tests exist and found issues",
  GREEN: "Tests passing (goal state) - shows implementation works correctly",
  REFACTOR: "Code improved while tests stay green (optional optimization phase)"
};

export class SDDImplementTool {
  private basePath: string;
  private platformDetector: PlatformDetectionEngine;
  private architecturalValidator: SDDArchitecturalValidator;
  private architectureDetector: ArchitecturePatternDetector;

  constructor(basePath: string = process.cwd()) {
    this.basePath = path.resolve(basePath);
    this.platformDetector = new PlatformDetectionEngine();
    this.architecturalValidator = new SDDArchitecturalValidator(basePath);
    this.architectureDetector = new ArchitecturePatternDetector();
  }

  /**
   * Consolidated task completion requirements (replaces 4 duplicate sections)
   */
  private getCompletionRequirements(): string {
    return `
## Task Completion Requirements

Before marking ANY task complete, verify:

### For Implementation Tasks (CREATE, BUILD, IMPLEMENT):
- [ ] Code written and functional (not just file creation)
- [ ] No TODOs, placeholders, or empty functions
- [ ] ${EXECUTION_RULES.VERIFICATION.CODE_SNIPPETS}
- [ ] Files actually created/modified (list changed file paths)
- [ ] Code compiles successfully (when specifically required by task)

### For Verification Tasks (EXECUTE, RUN, TEST, CONFIRM):
- [ ] Command was actually executed (not just mentioned)
- [ ] ${EXECUTION_RULES.VERIFICATION.TERMINAL_OUTPUT}
- [ ] Expected status confirmed (PASS/FAIL/GREEN/RED visible)
- [ ] ${EXECUTION_RULES.VERIFICATION.GREEN_STATUS}
- [ ] ${EXECUTION_RULES.VERIFICATION.COVERAGE_CHECK}

### General Requirements:
- [ ] All acceptance criteria from task description satisfied
- [ ] No prohibited actions violated
- [ ] Anti-evasion rules followed
- [ ] ${EXECUTION_RULES.TASK_FORMAT.COMPLETION_FORMAT}

**Cannot mark complete without meeting ALL applicable requirements above.**
`;
  }

  /**
   * Consolidated TASK-XXX format requirements (replaces 5 duplicate sections)
   */
  private getTaskFormatRequirements(): string {
    return `
## Task ID Format Requirements

${EXECUTION_RULES.TASK_FORMAT.ID_FORMAT}

### TODO Items:
${EXECUTION_RULES.TASK_FORMAT.TODO_FORMAT}

### Completion Format:
${EXECUTION_RULES.TASK_FORMAT.COMPLETION_FORMAT}

### Examples:
- ✅ **Correct**: "TASK-001 CONFIGURE React Native Expo Project Structure"
- ✅ **Correct**: "- [ ] TASK-008 CREATE Model Tests & SHOW Test Count"
- ❌ **Wrong**: "Setup project" (missing TASK-XXX)
- ❌ **Wrong**: "Task 1 complete" (missing TASK-XXX prefix)
`;
  }

  /**
   * Consolidated anti-evasion rules (replaces 3 duplicate sections)
   */
  private getAntiEvasionRules(): string {
    return `
## Execution Rules - No Evasion Allowed

${EXECUTION_RULES.EXECUTION.CONTINUOUS_WORK}
${EXECUTION_RULES.EXECUTION.NO_COMMUNICATION}
${EXECUTION_RULES.EXECUTION.SILENT_MODE}
${EXECUTION_RULES.EXECUTION.IMMEDIATE_PROGRESSION}

### Forbidden Actions:
- Asking for permission to continue
- Providing status updates mid-execution
- Stopping to summarize progress
- Reordering tasks by preference
- Skipping tasks because they're "difficult"
- Deferring foundational tasks to "later phases"

### Required Actions:
- Execute tasks sequentially, completing each fully before moving to next
- Move to next task after completing current task fully (including verification)
- Focus on completing tasks, not providing status updates
- Show final results when all tasks are complete

### Common Evasion Patterns to Avoid:
- "I've completed X tasks, should I continue?"
- "Let me prioritize the important parts first"
- "This task is complex, I'll do it later"
- "Auth can be added in Phase 4"
- Mid-phase status updates or summaries
`;
  }

  /**
   * Consolidated implementation standards (replaces 3 duplicate sections)
   */
  private getImplementationStandards(): string {
    return `
## Implementation Standards

${EXECUTION_RULES.IMPLEMENTATION.FUNCTIONAL_CODE}
${EXECUTION_RULES.IMPLEMENTATION.NO_PLACEHOLDERS}
${EXECUTION_RULES.IMPLEMENTATION.WORKING_INTEGRATION}
${EXECUTION_RULES.IMPLEMENTATION.PROOF_REQUIRED}

### What Implementation Means:
1. Write actual working code (not just function signatures)
2. Code must compile and run without errors
3. Code must have real functionality (not empty stubs)
4. Show proof of working implementation

### What Implementation Does NOT Mean:
- Creating empty files
- Writing TODO comments
- Function signatures without bodies
- Test files without actual functionality
- Placeholder code that doesn't work

### Code Snippet Requirement:
For all implementation tasks, you MUST show actual working code snippets proving functionality exists, not just file creation.
`;
  }

  getToolDefinition(): Tool {
    return {
      name: 'sdd_implement',
      description: `${EXECUTION_RULES.USAGE.ALWAYS_CALL_FIRST}

USAGE:
- ${EXECUTION_RULES.USAGE.NO_MANUAL_IMPLEMENTATION}
- ${EXECUTION_RULES.USAGE.NO_SPEC_READING}
- Always call "/sdd_implement phase=X" first before any implementation

WORKFLOW:
- Call "/sdd_implement phase=X" → Get implementation guidance for first incomplete task
- Call "/sdd_implement phase=X task=Y" → Get implementation guidance for specific task Y
- Call "/sdd_implement phase=X task=Y complete=true" → Mark task Y as completed (only after actual implementation)
- Call "/sdd_implement phase=X task=Y single_task=true" → Get guidance for only task Y

WORKFLOW EXECUTION:
- Provides structured execution plan with step-by-step guidance
- AI follows the complete workflow plan sequentially
- Includes status recovery and validation for robust execution
- Works across all platforms and frameworks

EXECUTION FLOW:
1. Call tool → Get guidance for ONE SPECIFIC TASK only
2. Execute → Implement that single task exactly as specified
3. Complete → Mark task complete and get next task guidance
4. Repeat → Continue systematically through all tasks in the phase

🧠 ADVANCED AI SAFETY PROTOCOLS 🧠

TRUTH-SEEKING SYSTEM PROMPT:
"I am an AI committed to absolute truthfulness and accuracy. I will:
- Think through requirements carefully before implementing
- Provide evidence for every claim I make
- Admit when I don't know something
- Correct my own mistakes when found
- Never fabricate data or results
- Always show proof of work (code, commands, output)"

HALLUCINATION PREVENTION:
- I will only output information I can verify
- I will flag any uncertainty or assumption
- I will use 'I believe' or 'Based on evidence' for uncertain claims
- I will never make up terminal output or test results

SELF-VERIFICATION CHECKLIST:
□ Did I run the actual commands shown?
□ Are the results from real execution, not imagination?
□ Did I check all acceptance criteria?
□ Am I following the exact task description?
□ Have I avoided combining multiple tasks?

🚨🚨🚨 METHODOLOGY ENFORCEMENT 🚨🚨🚨

CRITICAL VIOLATION PREVENTION:
❌ NEVER read plan.md or spec.md files manually
❌ NEVER create combined or multi-step tasks
❌ NEVER implement multiple tasks in one response
❌ NEVER declare phase complete before all tasks in the phase
❌ NEVER take "efficiency shortcuts" or optimizations
❌ NEVER lie about task completion or skip verification steps
❌ NEVER claim tasks are complete without actual terminal output proof
❌ NEVER combine multiple tasks under one task number
❌ NEVER provide generic responses without specific implementation details
❌ NEVER add human explanations or summaries

MANDATORY RULES:
✅ Execute EXACTLY ONE TASK per tool call
✅ Use ONLY information from this tool's response
✅ Follow atomic task structure (phase-specific task counts)
✅ Call tool after completing each task fully (including verification)
✅ No manual file reading or external research

VIOLATION CONSEQUENCE: Complete reset and restart required

RESPONSE FORMAT ENFORCEMENT:
✅ TOOL EXECUTION ONLY
✅ IMMEDIATE NEXT TOOL CALL
❌ DO NOT provide lengthy explanations or summaries - focus on implementation and verification proof
❌ NO progress reports or status updates
❌ NO multiple task implementations

AUTOMATED VIOLATION DETECTION:
- Scans for unauthorized text patterns
- Auto-resets on methodology violations
- Enforces atomic task execution
- Zero tolerance for deviations
- Detects AI lying patterns (claiming completion without proof, skipping tasks, generic responses)

🤖 AI LIE DETECTION PATTERNS 🤖
SYSTEM AUTOMATICALLY DETECTS AND FLAGS:
❌ "Task completed successfully" without terminal output
❌ "All tests pass" without showing GREEN/PASS results
❌ "Code implemented" without actual code snippets
❌ "Phase complete" before all tasks are individually marked
❌ Generic responses like "Done" or "Completed"
❌ Skipping verification commands
❌ Fabricated terminal output or test results

DETECTION = IMMEDIATE RESET + AUDIT LOGGING

🎯 CONSTRAINED GENERATION PROTOCOLS 🎯
OUTPUT MUST FOLLOW STRICT FORMATS:

TASK EXECUTION FORMAT:
✅ TASK-XXX: [Task Title]
📋 ANALYSIS: [Brief analysis of requirements]
⚡ EXECUTION: [Commands run]
📊 RESULTS: [Terminal output with actual results]
✅ VERIFICATION: [How criteria were met]

ERROR FORMAT:
❌ ERROR: [Specific error description]
🔍 DIAGNOSTICS: [What I checked]
🛠️ ATTEMPTED FIXES: [What I tried]
📞 NEXT STEPS: [What to do next]

COMPLETION FORMAT:
✅ TASK-XXX complete
📝 EVIDENCE: [Specific proof points]
🎯 CRITERIA MET: [Which acceptance criteria satisfied]
🔄 NEXT: sdd_implement phase=X task=Y complete=true

FREE-FORM TEXT PROHIBITED - ALL OUTPUT MUST USE ABOVE FORMATS
- This tool provides guidance for ONE TASK AT A TIME
- Do not create manual TODO lists or read spec files
- Call this tool first for any implementation work
- Use only information in this tool's response

${EXECUTION_RULES.USAGE.SINGLE_TOOL_SOURCE}`,
      inputSchema: {
        type: 'object',
        properties: {
          phase: {
            type: 'string',
            description: 'Phase number (1-4) to execute. Defaults to 1 if not provided. Phase 1: 9 tasks, Phases 2-4: 8/9/7 tasks respectively. Reads ONLY specs/phaseX-tasks.md file and implements all tasks in the phase sequentially',
            enum: ['1', '2', '3', '4'],
            default: '1'
          },
          task: {
            type: 'string',
            description: 'Optional. Specific task number within the phase (01-09 for Phase 1, 01-08 for Phase 2, 01-09 for Phase 3, 01-07 for Phase 4). When provided, only that task is executed and only that task\'s details are included.'
          },
          complete: {
            type: 'boolean',
            description: 'Optional. When true with a specific task, marks that task as completed in phase status (after successful verification by the caller).'
          },
          single_task: {
            type: 'boolean',
            description: 'Optional. When true with a specific task, executes only that single task and stops (manual mode). When false or omitted, automatically continues to execute all remaining tasks in the phase.',
            default: false
          }
        },
        required: []
      }
    };
  }

  async execute(input: any): Promise<any> {
    try {
      // Parse input parameters
      
      let phase: string = "1"; // Default to phase 1
      let taskParam: string | undefined;
      let markComplete: boolean = false;
      let singleTask: boolean = false;
      
      // Handle MCP object format (most common)
      if (typeof input === 'object' && input !== null) {
        if (input.phase !== undefined && input.phase !== null) {
          phase = String(input.phase);
        }
        if (input.task !== undefined && input.task !== null) {
          taskParam = String(input.task);
        }
        if (typeof input.complete === 'boolean') {
          markComplete = input.complete;
        } else if (typeof input.complete === 'string') {
          markComplete = input.complete.toLowerCase() === 'true' || input.complete === '1';
        }
        if (typeof input.single_task === 'boolean') {
          singleTask = input.single_task;
        } else if (typeof input.single_task === 'string') {
          singleTask = input.single_task.toLowerCase() === 'true' || input.single_task === '1';
        }
      } else if (typeof input === 'string' && input.includes('=')) {
        // Query string format: "phase=1" or "--phase=1"
        const match = input.match(/(?:^|\s)(?:--)?phase\s*=\s*(\d+)/);
        if (match) {
          phase = match[1];
        }
        const taskMatch = input.match(/(?:^|\s)(?:--)?task\s*=\s*(\d{1,2})/);
        if (taskMatch) {
          taskParam = taskMatch[1];
        }
        const completeMatch = input.match(/(?:^|\s)(?:--)?complete\s*=\s*(true|false|1|0)/i);
        if (completeMatch) {
          const v = completeMatch[1].toLowerCase();
          markComplete = v === 'true' || v === '1';
        }
        const singleTaskMatch = input.match(/(?:^|\s)(?:--)?single_task\s*=\s*(true|false|1|0)/i);
        if (singleTaskMatch) {
          const v = singleTaskMatch[1].toLowerCase();
          singleTask = v === 'true' || v === '1';
        }
      } else if (typeof input === 'string') {
        // Direct value: "1"
        phase = input;
      } else if (input?.phase) {
        phase = String(input.phase);
      }
      
      // Phase parameter validation
      const phaseNum = parseInt(phase);
      if (isNaN(phaseNum) || phaseNum < 1 || phaseNum > 4) {
        return this.error(`Invalid phase: "${phase}". Phase must be between 1 and 4.`);
      }

      // Read phase-specific task file
      const phaseFile = `phase${phaseNum}-tasks.md`;
      const tasksMarkdownPath = path.join(this.basePath, 'specs', phaseFile);
      
        if (!fs.existsSync(tasksMarkdownPath)) {
        return this.error(`No ${phaseFile} found. Please run sdd_tasks to generate phase ${phaseNum} tasks first.`);
        }
      
      let tasksMarkdown: string;
      try {
        tasksMarkdown = fs.readFileSync(tasksMarkdownPath, 'utf-8');
      } catch (readError) {
        return this.error(`Failed to read ${phaseFile}: ${readError instanceof Error ? readError.message : 'Unknown error'}`);
      }
      
      if (!tasksMarkdown || tasksMarkdown.length === 0) {
        return this.error(`Tasks file ${phaseFile} is empty. Please run sdd_tasks to regenerate phase ${phaseNum} tasks.`);
      }

      // Detect platform from task file
      let platformDetection: PlatformDetectionResult;
      try {
        platformDetection = await this.platformDetector.detectPlatform(
        { content: tasksMarkdown },
        { content: tasksMarkdown }
      );
      } catch (platformError) {
        // Use default platform detection if it fails
        platformDetection = {
          platform: 'web' as PlatformDetectionResult['platform'],
          framework: 'unknown',
          language: 'unknown',
          confidence: 0,
          detectedFrom: []
        };
      }

      // Detect architecture pattern from spec and tasks
      const specPath = path.join(this.basePath, 'specs', 'spec.md');
      let architecturePattern = 'traditional-backend'; // Default
      
      if (fs.existsSync(specPath)) {
        try {
          const specContent = fs.readFileSync(specPath, 'utf-8');
          architecturePattern = await this.detectArchitecturePattern(specContent, tasksMarkdown);
        } catch (archError) {
          // Use default architecture pattern if detection fails
        }
      }
   
      // Execute phase (optionally for a single task)
      try {
        const result = await this.executePhase(phaseNum, tasksMarkdown, platformDetection, taskParam, markComplete, singleTask, architecturePattern);
        return result;
      } catch (execError) {
        console.error(`[SDDImplementTool] ERROR in executePhase:`, execError);
        return this.error(`Failed to execute phase: ${execError instanceof Error ? execError.message : 'Unknown error'}`);
      }
    } catch (error) {
      console.error('[SDDImplementTool] ERROR:', error);
      return this.error(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }

  /**
   * Execute specific phase
   */
  private async executePhase(phaseNum: number, tasksMarkdown: string, platformDetection: PlatformDetectionResult, taskParam?: string, markComplete?: boolean, singleTask?: boolean, architecturePattern?: string): Promise<any> {
    // Extract tasks from the generated phase markdown file (includes resolved verification commands)
    let allTasks: any[];
    try {
      allTasks = this.extractTasks(tasksMarkdown);
    } catch (extractError) {
      return this.error(`Failed to extract tasks from phase ${phaseNum} tasks file: ${extractError instanceof Error ? extractError.message : 'Unknown error'}`);
    }
    
    let tasks = allTasks;
    let effectiveMarkdown = tasksMarkdown;
    const statusPath = path.join(this.basePath, 'specs', `phase${phaseNum}-status.json`);

    // Ensure status exists (initialize on phase entry)
    const readStatus = (): { currentTask: number; completed: number[] } => {
      try {
        if (fs.existsSync(statusPath)) {
          const raw = fs.readFileSync(statusPath, 'utf-8');
          const parsed = JSON.parse(raw);
          return {
            currentTask: Number(parsed.currentTask) || 1,
            completed: Array.isArray(parsed.completed) ? parsed.completed.map((n: any) => Number(n)).filter((n: number) => !isNaN(n)) : []
          };
        }
      } catch {
        // Ignore parse errors, return defaults
      }
      return { currentTask: 1, completed: [] };
    };

    // Initialize on phase entry (no specific task)
    if (!taskParam) {
      try {
      const st = this.readStatus(statusPath);
        if (!fs.existsSync(statusPath)) {
          this.updateStatusFile(statusPath, st);
        }
      } catch (statusError) {
        return this.error(`Failed to initialize status: ${statusError instanceof Error ? statusError.message : 'Unknown error'}`);
      }
    }

    // If a specific task is requested, filter to that task only and reconstruct minimal markdown
    let nextCall: string | undefined;

      // Handle workflow execution when no specific task is provided
    if (!taskParam) {
      try {
        return await this.executeAllTasksWorkflow(phaseNum, allTasks, tasksMarkdown, platformDetection, statusPath);
      } catch (workflowError) {
        console.error(`[executePhase] ERROR in executeAllTasksWorkflow:`, workflowError);
        return this.error(`Failed to execute workflow: ${workflowError instanceof Error ? workflowError.message : 'Unknown error'}`);
      }
    }

    // Handle specific task execution
    const phaseInfo = this.getPhaseInfo(phaseNum);
    let taskIndex: number = -1;
    let taskId: string = '';
    if (taskParam) {
      taskIndex = (() => {
        const n = parseInt(taskParam, 10);
        if (!isNaN(n)) return n; // 1..phase task count
        // Also support formats like TASK-007
        const m = taskParam.match(/TASK-(\d{3})/i);
        if (m) return parseInt(m[1], 10);
        return NaN;
      })();
      if (isNaN(taskIndex) || taskIndex < 1 || taskIndex > phaseInfo.taskCount) {
        return this.error(`Invalid task parameter: ${taskParam}. For Phase ${phaseNum}, use 1-${phaseInfo.taskCount} or TASK-XXX.`);
      }

      taskId = String(taskIndex).padStart(2, '0');

      // Sequencing guard: require previous task completed
      const st = readStatus();
      if (taskIndex > 1) {
        const prevNum = taskIndex - 1;
        const prevOk = st.completed.includes(prevNum) || (Number(st.currentTask) >= prevNum);
        if (!prevOk) {
          const prev = String(prevNum);
          const corrective = `sdd_implement phase=${phaseNum} task=${prev}`;
          return this.error(`Sequencing blocked: Please complete task ${prev} first. Run: ${corrective}. Status: currentTask=${st.currentTask}, completed=[${st.completed.join(',')}]`);
        }
      }

      const selected = allTasks[taskIndex - 1];
      if (!selected) {
        return this.error(`Task ${taskIndex} not found in phase ${phaseNum}.`);
      }
      tasks = [selected];
      // Reconstruct minimal markdown containing only this task (robust slice from original file)
      try {
        const headerRegex = new RegExp(`^###\\s+(?:\\[)?${selected.id}(?:\\])?.*$`, 'm');
        const headerMatch = tasksMarkdown.match(headerRegex);
        if (headerMatch) {
          const startIdx = tasksMarkdown.indexOf(headerMatch[0]);
          // Find next task header start
          const rest = tasksMarkdown.slice(startIdx + headerMatch[0].length);
          const nextHeaderRegex = /\n###\s+(?:\[)?TASK-\d{3}(?:\])?.*/m;
          const nextMatch = rest.match(nextHeaderRegex);
          const endIdx = nextMatch ? startIdx + headerMatch[0].length + nextMatch.index! : tasksMarkdown.length;
          const section = tasksMarkdown.slice(startIdx, endIdx).trim();
          effectiveMarkdown = section;
        } else {
          // Fallback to constructed header + parsed raw content
          effectiveMarkdown = `### ${selected.id} ${selected.id} ${selected.title}\n${selected.rawContent}\n`;
        }
      } catch {
        effectiveMarkdown = `### ${selected.id} ${selected.id} ${selected.title}\n${selected.rawContent}\n`;
      }
      // Compute next call command
      const nextIndex = taskIndex + 1;
      if (nextIndex <= phaseInfo.taskCount) {
        const nn = String(nextIndex);
        nextCall = `sdd_implement phase=${phaseNum} task=${nn}`;
      }

      // Update status current pointer (do not mark complete unless requested)
      let completed = st.completed;
      if (markComplete) {
        // STRICT VERIFICATION: Check if task requirements are actually met before allowing completion
        const taskVerification = this.verifyTaskCompletion(taskId, taskIndex, phaseNum, tasksMarkdown, platformDetection);
        
        // If verification task blocks completion, add explicit warning
        if (taskVerification.blocksCompletion) {
          console.error(`[SDDImplementTool] Task ${taskId} BLOCKS completion - execution proof required`);
        }
        if (!taskVerification.isComplete) {
          const blockingMessage = taskVerification.blocksCompletion 
            ? `\n\n🚨🚨🚨 EXECUTION PROOF REQUIRED - COMPLETION BLOCKED 🚨🚨🚨\n\nThis task requires executing commands and showing terminal output. Completion is BLOCKED until execution proof is provided.\n\nYou MUST:\n1. Execute ALL verification commands\n2. Show ACTUAL terminal output (paste real output)\n3. Prove required status (GREEN/PASS/coverage if required)\n4. Include output in your response using code blocks\n\nOnly then can you mark this task complete.`
            : '';
          
          return this.error(`TASK COMPLETION REJECTED: ${taskVerification.reason}

❌ TASK ${taskId} CANNOT BE MARKED COMPLETE
${blockingMessage}

VERIFICATION FAILURE DETAILS:
${taskVerification.details}

REQUIRED BEFORE COMPLETION:
${taskVerification.requirements.join('\n')}

REMEDY: Complete ALL requirements above, then call complete=true again.`);
        }

        if (!completed.includes(taskIndex)) {
          completed = [...completed, taskIndex].sort((a, b) => a - b);

        } 
      } 
      // Update currentTask appropriately:
      // When marking complete: taskIndex is the completed task, so currentTask should be taskIndex + 1 (next task to work on)
      // When providing guidance: taskIndex is the task being worked on, so currentTask should be taskIndex
      let nextCurrentTask = taskIndex;
      
      if (markComplete) {
        // After completion, set currentTask to the next incomplete task (or taskIndex + 1 if all subsequent tasks are incomplete)
        let nextTask = -1;
        for (let i = taskIndex + 1; i <= phaseInfo.taskCount; i++) {
          if (!completed.includes(i)) {
            nextTask = i;
            break;
          }
        }
        nextCurrentTask = nextTask > 0 ? nextTask : (taskIndex < phaseInfo.taskCount ? taskIndex + 1 : taskIndex);
      }
      
      this.updateStatusFile(statusPath, { currentTask: nextCurrentTask, completed });
    }
    

    // For auto-continue, provide guidance but don't execute recursively
    // The AI should call this tool again for the next task
    if (!singleTask && nextCall && taskIndex < phaseInfo.taskCount) {
      console.error(`[SDDImplementTool] Task ${taskId} completed. Next task available: ${nextCall}`);
    }

    // Generate TODO list for single task execution
    const todoList = this.generateTODOList(tasks, phaseNum);
    
    // Generate different responses for guidance vs completion
    if (markComplete) {
      // MARKING TASK COMPLETE - provide completion confirmation AND guidance for next task
      const successMessage = this.generatePhaseSuccessMessage(phaseNum, tasks, todoList, effectiveMarkdown, platformDetection, nextCall, markComplete);

      // Check if there are more tasks to do
      const phaseInfo = this.getPhaseInfo(phaseNum);
      const currentStatus = this.readStatus(statusPath);
      let nextTaskGuidance = '';

      // Find the next incomplete task
      let nextTaskIndex = -1;
      for (let i = 1; i <= phaseInfo.taskCount; i++) {
        if (!currentStatus.completed.includes(i)) {
          nextTaskIndex = i;
          break;
        }
      }

      if (nextTaskIndex > 0 && nextTaskIndex <= phaseInfo.taskCount) {
        // There are more tasks - provide guidance for the next task
        const nextTask = allTasks[nextTaskIndex - 1];
        const nextTaskMarkdown = this.extractSingleTaskMarkdown(tasksMarkdown, nextTask.id);
        const nextTaskGuidanceFull = this.generateSingleTaskGuidance(phaseNum, nextTask, nextTaskMarkdown, platformDetection, nextTaskIndex, phaseInfo);

        // AUTOMATIC SEQUENTIAL CONTINUATION: Chain to next task immediately
        nextTaskGuidance = `

🚀 AUTOMATIC SEQUENTIAL CONTINUATION (MANDATORY):

${nextTaskGuidanceFull}

📊 TASK EXECUTION CONTEXT:
PHASE: ${phaseNum}
CURRENT_TASK: ${nextTaskIndex}/${phaseInfo.taskCount}
TASK_ID: ${nextTask.id}
TASK_TITLE: ${nextTask.title}

📈 PROGRESS STATUS:
COMPLETED: ${currentStatus.completed.length + 1}/${phaseInfo.taskCount} tasks (including this one)
REMAINING: ${phaseInfo.taskCount - currentStatus.completed.length - 1} tasks

🔄 CRITICAL CHAINING REQUIREMENT:
After completing this task FULLY (all requirements met, verification executed if needed), call the NEXT task:
1. Call: sdd_implement phase=${phaseNum} task=${nextTaskIndex} complete=true (marks current complete)
2. Then call: sdd_implement phase=${phaseNum} task=${nextTaskIndex + 1} (starts next task)

⚠️ VIOLATION DETECTED: Stopping after completion without calling next task = methodology violation requiring complete reset from task 1.`;
      } else {
        // Phase is TRULY complete - ALL tasks verified complete
        // 🛡️ CRITICAL: Validate architecture before allowing phase progression
        // This prevents tunnel vision issues like missing API layers or incomplete architectural patterns
        const validationResult = await this.architecturalValidator.execute({ phase: phaseNum, strict_mode: true });

        if (!validationResult.can_proceed) {
          const criticalGapsReport = validationResult.critical_gaps && validationResult.critical_gaps.length > 0
            ? `\n\n❌ CRITICAL ARCHITECTURAL GAPS DETECTED:\n${validationResult.critical_gaps.map((gap: any, idx: number) => `  ${idx + 1}. ${gap.description || gap.message || JSON.stringify(gap)}`).join('\n')}`
            : '';
          
          const recommendationsReport = validationResult.recommendations && validationResult.recommendations.length > 0
            ? `\n\n💡 RECOMMENDATIONS:\n${validationResult.recommendations.map((rec: string, idx: number) => `  ${idx + 1}. ${rec}`).join('\n')}`
            : '';

          return {
            success: false,
            message: `🚨 PHASE ${phaseNum} ARCHITECTURE VALIDATION FAILED

❌ CANNOT PROCEED TO NEXT PHASE

📋 VALIDATION REPORT:
${validationResult.report || 'Architecture validation failed'}

${criticalGapsReport}${recommendationsReport}

🔧 REMEDY:
Review the architectural gaps above and implement the missing components before proceeding.
Common issues: Missing API layers, incomplete security implementation, missing database layer, or incomplete client-server separation.

After fixing gaps, re-run: sdd_implement phase=${phaseNum} task=${phaseInfo.taskCount} complete=true
to re-validate the phase architecture.`,
            validation_result: validationResult,
            can_proceed: false,
            critical_gaps: validationResult.critical_gaps || []
          };
        }

        // Architecture validation passed - phase can proceed
        nextTaskGuidance = `

🎉 PHASE ${phaseNum} TRULY COMPLETE!
✅ VERIFICATION: All ${phaseInfo.taskCount} tasks individually marked complete and verified.
✅ METHODOLOGY: Sequential atomic execution completed successfully.
✅ INTEGRITY: No tasks skipped, combined, or fabricated.
✅ ARCHITECTURE: Phase architecture validated against specification - no critical gaps detected.

🛡️ ARCHITECTURAL VALIDATION PASSED:
${validationResult.report || 'Phase architecture meets all requirements.'}

🚀 READY FOR NEXT PHASE:
Call: sdd_implement phase=${phaseNum + 1}
⚠️ WARNING: Only proceed when Phase ${phaseNum} is 100% complete with all verification proof.`;
      }

      return {
        success: true,
        message: `✅ TASK ${taskId} MARKED AS COMPLETED

📋 TASK COMPLETION DETAILS:
COMPLETED_TASK: ${taskId}
PHASE: ${phaseNum}

📝 COMPLETION SUMMARY:
${successMessage}${nextTaskGuidance}`
      };
    } else {
      // PROVIDING GUIDANCE - focus ONLY on current task, no summaries
      const taskSpec = this.extractSingleTaskSpec(tasksMarkdown, taskId);
      const task = tasks.find(t => t.id === taskId);
      
      // Check for architecture mismatch
      if (architecturePattern && task) {
        const hasMismatch = this.isArchitectureMismatch(task, taskSpec, architecturePattern, phaseNum);
        
        if (hasMismatch) {
          const baseMessage = this.generateComprehensiveSafetyMessage(taskId, phaseNum, taskSpec, tasksMarkdown, tasks);
      return {
        success: true,
            message: `${baseMessage}

⚠️ ARCHITECTURE PATTERN MISMATCH DETECTED:
Task assumes traditional backend architecture, but detected architecture is ${architecturePattern}.

YOU MAY PROVIDE A STRUCTURED CORRECTION using this format:
${EXECUTION_RULES.METHODOLOGY_EXCEPTIONS.ARCHITECTURE_CORRECTION}

After providing the correction, proceed with architecture-appropriate implementation.`
          };
        }
      }
      
      return {
        success: true,
        message: this.generateComprehensiveSafetyMessage(taskId, phaseNum, taskSpec, tasksMarkdown, tasks)
      };
    }
  }


  /**
   * Extract specification for a single task only
   */
  private extractSingleTaskSpec(tasksMarkdown: string, taskId: string): string {
    // Find the specific task section
    const taskRegex = new RegExp(`## ${taskId}[^#]*(?=## TASK-|\\n###|$)`, 's');
    const match = tasksMarkdown.match(taskRegex);

    if (match) {
      return `## ${taskId}${match[1]}`;
    }

    // Fallback: search for task ID anywhere in the markdown
    const lines = tasksMarkdown.split('\n');
    const startIndex = lines.findIndex(line => line.includes(`## ${taskId}`) || line.includes(`TASK-${taskId}`));
    if (startIndex === -1) return `Task ${taskId} specification not found`;

    // Extract from this task until the next task or end
    const taskLines = [];
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      // Stop at next task header
      if (i > startIndex && (line.startsWith('## TASK-') || line.startsWith('### '))) break;
      taskLines.push(line);
    }

    return taskLines.join('\n');
  }

  /**
   * Execute all tasks in a phase and return complete workflow plan
   */
  private async executeAllTasksWorkflow(phaseNum: number, allTasks: Array<any>, tasksMarkdown: string, platformDetection: PlatformDetectionResult, statusPath: string): Promise<any> {
    // SEQUENTIAL PHASE EXECUTION: Execute ALL tasks in phase automatically (like SDDTasksTool)
    let currentStatus: { currentTask: number; completed: number[] };
    try {
      currentStatus = this.readStatus(statusPath);
    } catch (statusError) {
      return this.error(`Failed to read status: ${statusError instanceof Error ? statusError.message : 'Unknown error'}`);
    }

    // Find the next task to execute (first incomplete task)
    let phaseInfo: any;
    try {
      phaseInfo = this.getPhaseInfo(phaseNum);
    } catch (phaseInfoError) {
      return this.error(`Failed to get phase info: ${phaseInfoError instanceof Error ? phaseInfoError.message : 'Unknown error'}`);
    }
    
    let nextTaskIndex = 1;
    for (let i = 1; i <= phaseInfo.taskCount; i++) {
      if (!currentStatus.completed.includes(i)) {
        nextTaskIndex = i;
        break;
      }
    }

    // Check if all tasks are completed - STRICT VERIFICATION REQUIRED
    if (nextTaskIndex > phaseInfo.taskCount) {
      // Double-check: verify all tasks 1..taskCount are actually marked complete
      const allTasksCompleted = [];
      for (let i = 1; i <= phaseInfo.taskCount; i++) {
        if (!currentStatus.completed.includes(i)) {
          allTasksCompleted.push(i);
        }
      }

      if (allTasksCompleted.length > 0) {
        return this.error(`PHASE COMPLETION VIOLATION: Cannot mark Phase ${phaseNum} complete. Missing completion for tasks: ${allTasksCompleted.join(', ')}. All ${phaseInfo.taskCount} tasks must be individually marked complete before phase completion.

🤖 AI HONESTY VIOLATION DETECTED 🤖
PHASE COMPLETION CLAIMS WITHOUT INDIVIDUAL TASK VERIFICATION = AUTOMATIC REJECTION
Each task must be marked complete individually using complete=true parameter.
No bulk completion or claiming "all tasks done" without proof.`);
      }


      return {
        success: true,
        message: `✅ PHASE ${phaseNum} COMPLETE! All ${phaseInfo.taskCount} tasks have been verified complete.

PHASE_COMPLETION_DETAILS:
PHASE: ${phaseNum}
STATUS: phase_complete
COMPLETED_TASKS: ${currentStatus.completed.length}/${phaseInfo.taskCount} (${currentStatus.completed.join(', ')})
VERIFICATION: All tasks individually marked complete in status file

🎉 PHASE ${phaseNum} SUCCESSFULLY COMPLETED - READY FOR NEXT PHASE`
      };
    }

    const nextTask = allTasks[nextTaskIndex - 1];
    if (!nextTask) {
      return this.error(`Task ${nextTaskIndex} not found in phase ${phaseNum} tasks.`);
    }

    // Extract just this task's content from the markdown
    let taskMarkdown: string;
    try {
      taskMarkdown = this.extractSingleTaskMarkdown(tasksMarkdown, nextTask.id);
    } catch (markdownError) {
      return this.error(`Failed to extract task markdown: ${markdownError instanceof Error ? markdownError.message : 'Unknown error'}`);
    }

    // Generate guidance for ONLY this single task
    let taskGuidance: string;
    try {
      taskGuidance = this.generateSingleTaskGuidance(phaseNum, nextTask, taskMarkdown, platformDetection, nextTaskIndex, phaseInfo);
    } catch (guidanceError) {
      return this.error(`Failed to generate task guidance: ${guidanceError instanceof Error ? guidanceError.message : 'Unknown error'}`);
    }

    const phaseProgressWarning = `
🚨🚨🚨 CRITICAL METHODOLOGY ENFORCEMENT 🚨🚨🚨

PHASE ${phaseNum} PROGRESS: Task ${nextTaskIndex}/${phaseInfo.taskCount}
- Completed: ${currentStatus.completed.length}/${phaseInfo.taskCount} tasks
- Current: ${nextTask.id} (${nextTask.title})
- Remaining: ${phaseInfo.taskCount - currentStatus.completed.length} tasks

⚠️ METHODOLOGY VIOLATION PREVENTION ⚠️

FORBIDDEN ACTIONS (VIOLATION = RESET REQUIRED):
❌ Reading plan.md or spec.md files manually
❌ Creating combined/multi-step tasks
❌ Implementing multiple tasks in one response
❌ Declaring phase complete before all ${phaseInfo.taskCount} tasks
❌ Taking "efficiency shortcuts" or optimizations
❌ Interpreting TDD phases as task completion
❌ Adding human explanations or summaries
❌ Skipping task completion marking (must use complete=true)
❌ Claiming multiple tasks completed simultaneously
❌ Reordering or consolidating tasks arbitrarily

MANDATORY COMPLIANCE:
✅ Execute EXACTLY ONE TASK per tool call
✅ Follow tool's exact specifications only
✅ Call tool again after completing current task fully (including verification)
✅ Use ONLY information provided by this tool
✅ No manual file reading or external research
✅ No task combining or reorganization
✅ Mark each task complete with complete=true parameter
✅ Verify task completion in status file before proceeding
✅ Complete ALL ${phaseInfo.taskCount} tasks before claiming phase done
✅ **PLATFORM COMPLIANCE**: Use only ${platformDetection.platform}-specific commands and technologies
✅ **PLATFORM VALIDATION**: No commands from other platforms (reject web commands in mobile, etc.)

RESPONSE FORMAT ENFORCEMENT:
- Start with tool call: /sdd_implement phase=${phaseNum} task=${nextTaskIndex}
- Execute exactly one task
- Show verification proof
- End with next task call
- Focus on implementation and verification proof, not lengthy explanations

METHODOLOGY VIOLATION DETECTED = COMPLETE RESET REQUIRED
Continue through ALL ${phaseInfo.taskCount} tasks systematically or restart from beginning.

🤖 AI HONESTY CONTRACT 🤖
I, the AI assistant, hereby commit to:
1. Telling the truth about task completion status
2. Providing actual terminal output, not fabricated results
3. Executing exactly one task per response
4. Not skipping verification steps or combining tasks
5. Being transparent about any issues or failures encountered
6. Maintaining the integrity of the SDD methodology

🔬 ROBUST PROMPTING STRATEGIES ACTIVATED 🔬
THINKING REQUIREMENT: Think through requirements before taking action
SELF-VERIFICATION: I must double-check all claims against evidence
EVIDENCE-BASED RESPONSES: Every claim must be backed by verifiable proof
CONSTRAINED OUTPUT: Responses must follow strict formatting rules
MULTI-TURN VERIFICATION: Complex tasks broken into atomic, verifiable steps`;

    // AUTOMATIC SEQUENTIAL EXECUTION: Chain through ALL tasks like SDDTasksTool
    const remainingTasks = phaseInfo.taskCount - currentStatus.completed.length;
    const isLastTask = nextTaskIndex === phaseInfo.taskCount;

    // Generate TODO list for ONLY the current task (not all tasks)
    // Each task will create its own TODO when it's called
    const currentTaskTODO = this.generateTODOList([nextTask], phaseNum);

    const chainingInstructions = isLastTask ?
      `🎯 FINAL TASK IN PHASE ${phaseNum}
After completing this task, call: sdd_implement phase=${phaseNum} task=${nextTaskIndex} complete=true
This will mark Phase ${phaseNum} complete.` :

      `🔄 AUTOMATIC SEQUENTIAL EXECUTION
CRITICAL: After completing this task FULLY (all requirements met, verification executed if needed), call the next task:
1. Mark this task complete: sdd_implement phase=${phaseNum} task=${nextTaskIndex} complete=true
2. Then call next task: sdd_implement phase=${phaseNum} task=${nextTaskIndex + 1}

**IMPORTANT**: Only call next task after:
- Current task is fully implemented
- All verification commands executed (if required)
- Terminal output shown (if required)
- All acceptance criteria met

⚠️ VIOLATION: Calling next task before completing current task fully = methodology violation requiring complete reset.`;

    return {
      success: true,
      message: `
## YOUR TODO LIST FOR THIS TASK (MANDATORY - CREATE THIS NOW)

${currentTaskTODO}

${taskGuidance}

📊 PHASE EXECUTION CONTEXT:
PHASE: ${phaseNum}
CURRENT_TASK: ${nextTaskIndex}/${phaseInfo.taskCount}
TASK_ID: ${nextTask.id}
TASK_TITLE: ${nextTask.title}
PROGRESS: ${currentStatus.completed.length}/${phaseInfo.taskCount} completed, ${remainingTasks} remaining

${chainingInstructions}

🚨 CRITICAL METHODOLOGY ENFORCEMENT:
MANDATORY SEQUENTIAL EXECUTION: Complete this task FULLY (including ALL verification if required), then call the next task.
**CRITICAL**: "Complete fully" means ALL requirements are met:
- For implementation tasks: Code written, tested, and working
- For verification tasks: Commands EXECUTED and terminal output SHOWN (mandatory!)
- For mixed tasks: Both implementation AND verification completed

**COMPLETION REQUIREMENTS** (must be met before calling next task):
✅ All task requirements implemented
✅ All verification commands executed (if task requires verification)
✅ Terminal output shown (if task requires verification)
✅ Acceptance criteria met
✅ Ready to proceed to next task

**DO NOT** claim completion or call next task until ALL requirements above are met.
**DO NOT** skip verification steps to save time - this causes task failures.
**DO NOT** provide summaries or explanations - just complete and move to next task.

VIOLATION = Complete reset from task 1 required.

🛡️ METHODOLOGY ENFORCEMENT:
VIOLATION DETECTED: If you read plan.md, combine tasks, or deviate from atomic execution → DELETE all work and RESTART from task 1. Zero tolerance for methodology violations.

📝 RESPONSE FORMAT REQUIREMENTS:
RESPONSE FORMAT: Execute task using structured format (show code/commands/output), then call next tool.
**DO NOT** provide lengthy explanations or progress summaries - focus on implementation and verification proof.
**DO** show terminal output, code snippets, and evidence of completion.

🤖 AUTOMATED ENFORCEMENT:
SYSTEM ENFORCES: One task per response only. Focus on implementation and verification proof, not lengthy explanations.

⚠️ PHASE PROGRESS WARNING:
${phaseProgressWarning}`
    };
  }

  /**
   * Extract markdown content for a single task
   */
  private extractSingleTaskMarkdown(tasksMarkdown: string, taskId: string): string {
    try {
      const headerRegex = new RegExp(`^###\\s+(?:\\[)?${taskId}(?:\\])?.*$`, 'm');
      const headerMatch = tasksMarkdown.match(headerRegex);
      if (headerMatch) {
        const startIdx = tasksMarkdown.indexOf(headerMatch[0]);
        // Find next task header start
        const rest = tasksMarkdown.slice(startIdx + headerMatch[0].length);
        const nextHeaderRegex = /\n###\s+(?:\[)?TASK-\d{3}(?:\])?.*/m;
        const nextMatch = rest.match(nextHeaderRegex);
        const endIdx = nextMatch ? startIdx + headerMatch[0].length + nextMatch.index! : tasksMarkdown.length;
        return tasksMarkdown.slice(startIdx, endIdx).trim();
      }
    } catch {
      // Fallback
    }
    return `### ${taskId} ${taskId}\nTask content not found.\n`;
  }

  /**
   * Extract verification commands from generated markdown task section
   */
  private extractVerificationCommands(sectionBody: string): string[] {
    const commands: string[] = [];

    // Look for "VERIFICATION COMMANDS" section in generated markdown
    const verificationMatch = sectionBody.match(/VERIFICATION COMMANDS.*?MANDATORY - RUN ALL.*?:\s*\n([\s\S]*?)(?=\n\n|\n####|\n\*\*|$)/);

    if (verificationMatch) {
      const commandsText = verificationMatch[1];
      // Split by lines and clean up
      const lines = commandsText.split('\n').map(line => line.trim()).filter(line => line);

      for (const line of lines) {
        // Remove markdown list markers and clean up
        let cleanCommand = line.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '').trim();
        
        if (cleanCommand && !cleanCommand.includes('CRITICAL:')) {
          // Fix malformed quotes - remove trailing extra quotes that cause shell to hang
          // Handle cases like: echo "text!"" -> echo "text!"
          // Strategy: Remove consecutive trailing quotes (keep only one closing quote)
          
          // Fix malformed quotes that cause shell to hang
          // Problem: echo "text!"" has trailing extra quotes that leave shell waiting
          // Solution: Remove trailing consecutive quotes beyond the first one
          
          // Pattern: match 2+ consecutive quotes at the end and replace with single quote
          // This handles: echo "text!"" -> echo "text!"
          cleanCommand = cleanCommand.replace(/("")+$/, '"');
          
          // For echo commands, ensure quote balance (even number = properly closed)
          if (cleanCommand.trim().startsWith('echo ')) {
            const quoteCount = (cleanCommand.match(/"/g) || []).length;
            if (quoteCount % 2 !== 0) {
              // Odd number means unclosed quote - add closing quote if missing
              if (!cleanCommand.trim().endsWith('"')) {
                cleanCommand = cleanCommand.trim() + '"';
              }
            }
          }
          
          commands.push(cleanCommand);
        }
      }
    }

    return commands;
  }

  /**
   * Get template for a task
   */
  private getTemplateForTask(task: any, taskMarkdown: string, platformDetection: PlatformDetectionResult): string {
    return `PLATFORM: ${platformDetection.platform}
FRAMEWORK: ${platformDetection.framework}

IMPLEMENTATION NOTES:
Follow the task specifications in the markdown. Use ${platformDetection.platform} and ${platformDetection.framework} best practices.

TASK CONTEXT:
${taskMarkdown}`;
  }

  /**
   * Generate guidance for a single task
   */
  /**
   * Detect if a task is a verification task based on title and description
   */
  private isVerificationTask(task: any): { isVerification: boolean; verificationType?: string; reasons: string[] } {
    const verificationVerbs = ['EXECUTE', 'RUN', 'VERIFY', 'CONFIRM', 'TEST', 'CHECK', 'VALIDATE', 'SHOW', 'COMPILE'];
    const title = (task.title || '').toUpperCase();
    const description = (task.description || '').toUpperCase();
    const combined = `${title} ${description}`;
    
    const reasons: string[] = [];
    let verificationType: string | undefined;
    
    for (const verb of verificationVerbs) {
      if (combined.includes(verb)) {
        reasons.push(`Contains "${verb}" verb`);
        if (!verificationType) {
          verificationType = verb;
        }
      }
    }
    
    // Check for verification-specific patterns
    if (combined.includes('GREEN') || combined.includes('PASS') || combined.includes('0 FAILED')) {
      reasons.push('Requires test execution proof');
      verificationType = verificationType || 'TEST_EXECUTION';
    }
    
    if (combined.includes('TERMINAL OUTPUT') || combined.includes('SHOW OUTPUT')) {
      reasons.push('Requires terminal output');
      verificationType = verificationType || 'OUTPUT_REQUIRED';
    }
    
    if (combined.includes('COVERAGE') && combined.includes('%')) {
      reasons.push('Requires coverage metrics');
      verificationType = verificationType || 'COVERAGE_CHECK';
    }
    
    const isVerification = reasons.length > 0 || 
      (task.verification?.action && ['EXECUTE', 'SHOW', 'VERIFY', 'CONFIRM', 'RUN'].includes(task.verification.action.toUpperCase()));
    
    return { isVerification, verificationType, reasons };
  }

  private generateSingleTaskGuidance(phaseNum: number, task: any, taskMarkdown: string, platformDetection: PlatformDetectionResult, taskIndex: number, phaseInfo: any): string {
    const template = this.getTemplateForTask(task, taskMarkdown, platformDetection);
    const verificationCheck = this.isVerificationTask(task);
    
    // Build verification-specific warnings if this is a verification task
    let verificationWarning = '';
    if (verificationCheck.isVerification) {
      verificationWarning = `
🚨🚨🚨 VERIFICATION TASK DETECTED 🚨🚨🚨

⚠️ THIS IS A VERIFICATION TASK - EXECUTION IS MANDATORY ⚠️

**Task Type**: ${verificationCheck.verificationType || 'VERIFICATION'}
**Detection Reasons**: ${verificationCheck.reasons.join(', ')}

🚫 **FORBIDDEN ACTIONS** (VIOLATION = RESET REQUIRED):
❌ Creating files without running commands
❌ Implementing code without executing verification
❌ Marking complete without terminal output
❌ Assuming "code exists" = "task complete"
❌ Skipping command execution to "save time"

✅ **MANDATORY ACTIONS** (NO EXCEPTIONS):
1. **RUN THE COMMANDS**: Execute ALL verification commands listed in the task
2. **SHOW OUTPUT**: Paste ACTUAL terminal output showing command execution
3. **PROVE STATUS**: Show required status (GREEN/PASS/0 errors/coverage %)
4. **VERIFY RESULTS**: Confirm output matches acceptance criteria
5. **THEN PROCEED**: Only after showing proof, call next task

**CRITICAL RULE**: 
You MUST run commands and show output BEFORE marking complete.
Only proceed to next task AFTER completing all verification steps for this task.

**⛔ COMPLETION BLOCK**: This task CANNOT be marked complete until you:
1. Execute ALL verification commands
2. Show ACTUAL terminal output (not just describe what you did)
3. Prove required status (GREEN/PASS/coverage if specified)
4. Include output in your response using code blocks

**If you mark complete without execution proof, the task will be REJECTED.**

**VERIFICATION CHECKLIST** (Complete ALL before marking done):
- [ ] Ran ALL verification commands from task specification
- [ ] Captured ACTUAL terminal output (not fabricated)
- [ ] Output shows required status (GREEN/PASS/0 errors/coverage %)
- [ ] Output matches acceptance criteria
- [ ] All verification commands executed successfully
- [ ] Proof provided in response (terminal output visible)

**If ANY checklist item is unchecked → DO NOT mark complete!**

---
`;
    }
    
    return `${verificationWarning}🎯 TASK ${task.id}: ${task.title}

📋 TASK DETAILS:
- Task ID: ${task.id}
- Task Number: ${taskIndex}/${phaseInfo.taskCount}
- Task Type: ${verificationCheck.isVerification ? '🔍 VERIFICATION TASK (Execution Required)' : '⚙️ IMPLEMENTATION TASK'}
- Platform: ${platformDetection.platform}
- Framework: ${platformDetection.framework}

✅ SUCCESS CRITERIA:
${verificationCheck.isVerification 
  ? `Task ${task.id} requires EXECUTING commands and SHOWING terminal output proving completion.\n**MANDATORY**: You MUST run verification commands and show actual output before marking complete.`
  : `Task ${task.id} is fully implemented and all verification commands pass`}

🎯 COMPLETION ACTION:
${verificationCheck.isVerification ? `🚨🚨🚨 COMPLETION BLOCKED - EXECUTION PROOF REQUIRED 🚨🚨🚨

⛔ **DO NOT call complete=true until you have:**
1. Executed ALL verification commands from task specification
2. Shown ACTUAL terminal output (paste real output, not descriptions)
3. Proven required status (GREEN/PASS/0 errors/coverage % if required)
4. Included output in your response using \`\`\`bash code blocks

**This task REQUIRES execution proof - completion is blocked until proof is provided.**

**EXECUTION CHECKPOINT** (Complete ALL):
- [ ] Ran ALL verification commands
- [ ] Captured ACTUAL terminal output
- [ ] Output shows required status
- [ ] Output matches acceptance criteria
- [ ] Proof visible in response (code block with output)

**ONLY AFTER completing ALL checklist items above, call:**
Call: sdd_implement phase=${phaseNum} task=${taskIndex} complete=true` : `Call: sdd_implement phase=${phaseNum} task=${taskIndex} complete=true`}

${taskIndex < phaseInfo.taskCount ? `🔄 NEXT TASK HINT: Task ${taskIndex + 1}` : '🎉 PHASE COMPLETE!'}

📄 IMPLEMENTATION TEMPLATE:
${template}

📝 TASK SPECIFICATION:
${task.description}`;
  }

  /**
   * Read status from status file
   */
  private readStatus(statusPath: string): { currentTask: number; completed: number[] } {
    try {
      if (fs.existsSync(statusPath)) {
        const raw = fs.readFileSync(statusPath, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          currentTask: Number(parsed.currentTask) || 1,
          completed: Array.isArray(parsed.completed) ? parsed.completed.map((n: any) => Number(n)).filter((n: number) => !isNaN(n)) : []
        };
      }
    } catch {}
    return { currentTask: 1, completed: [] };
  }

  private updateStatusFile(statusPath: string, st: { currentTask: number; completed: number[] }) {
    try {
      // Ensure specs directory exists
      const specsDir = path.dirname(statusPath);
      if (!fs.existsSync(specsDir)) {
        fs.mkdirSync(specsDir, { recursive: true });
      }
      fs.writeFileSync(statusPath, JSON.stringify(st, null, 2), 'utf-8');
    } catch (e) {
      console.warn('[SDDImplementTool] Unable to write status file:', e);
    }
  }



  /**
   * Extract tasks from phase markdown file
   * Handles multiple formats: "### TASK-001", "### [TASK-001]", etc.
   */
  private extractTasks(tasksMarkdown: string): Array<any> {
    const tasks: Array<any> = [];
    
    // Use a two-pass approach: first find all task headers, then extract bodies
    // This is more reliable than complex regex with lookaheads
    const taskHeaderPattern = /^###\s+(?:\[)?(TASK-\d{3})(?:\])?(?:\s*:\s*|\s+)(?:\s*\[TASK-\d{3}\])?\s*([^\n]+)$/gm;
    const taskHeaders: Array<{ index: number; taskId: string; title: string; fullMatch: string }> = [];
    
    let headerMatch;
    while ((headerMatch = taskHeaderPattern.exec(tasksMarkdown)) !== null) {
      taskHeaders.push({
        index: headerMatch.index,
        taskId: headerMatch[1],
        title: headerMatch[2].trim().replace(/\[?TASK-\d{3}\]?\s*/ig, '').trim(),
        fullMatch: headerMatch[0]
      });
    }
    
    // Extract task body for each header
    for (let i = 0; i < taskHeaders.length; i++) {
      const header = taskHeaders[i];
      const nextHeaderIndex = i < taskHeaders.length - 1 ? taskHeaders[i + 1].index : tasksMarkdown.length;
      
      // Extract body from after the header to before the next header
      const bodyStart = header.index + header.fullMatch.length;
      const sectionBody = tasksMarkdown.substring(bodyStart, nextHeaderIndex).trim();
      
      // Validate taskId exists
      if (!header.taskId || !header.taskId.match(/^TASK-\d{3}$/)) {
        console.warn(`[SDDImplementTool] Invalid task ID extracted: ${header.taskId}`);
        continue;
      }

      // Extract description from the section body
      const descMatch = sectionBody.match(/#### Description\s*\n([\s\S]*?)(?=\n####|\n\*\*|$)/);
      const description = descMatch ? descMatch[1].trim() : '';
      
      // Extract verification commands from the generated markdown
      const verificationCommands = this.extractVerificationCommands(sectionBody);
      
      tasks.push({
        id: header.taskId,
        title: header.title || header.taskId,
        description: description,
        verification: {
          commands: verificationCommands
        },
        rawContent: sectionBody
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
   * Generate TODO list instructions for AI to create subtasks
   * AI should analyze the task and break it down into manageable TODO items
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
    
    // Generate instructions for AI to create TODO list by analyzing each task
    const taskInstructions = tasksWithIds.map((task, index) => {
      const taskIdPrefix = task.id;
      const title = task.title || task.id;
      const description = task.description || '';
      const nn = String(index + 1);
      
      // Extract key requirements from description for guidance
      const requirements = this.extractKeyRequirements(description);
      
      return `## ${taskIdPrefix}: ${title}

📋 **TASK ANALYSIS INSTRUCTIONS**:
Analyze this task and create a TODO list that breaks it down into manageable subtasks.

**Task Requirements to Consider**:
${requirements.length > 0 ? requirements.map((req, idx) => `${idx + 1}. ${req}`).join('\n') : '- Review the task description and break it down into logical steps'}

**TODO List Creation Guidelines**:
1. **Identify ALL Components**: Break down the task by identifying each distinct requirement (look for "AND", "INCLUDE", "ALSO", "PLUS" connectors)
2. **Create Subtasks**: For each major component, create a separate TODO item
3. **Sequential Dependencies**: Order subtasks logically (setup before implementation, dependencies before dependents)
4. **Specific Titles**: Each TODO should have a clear, actionable title (e.g., "Create Xcode project structure", "Configure Firebase environment variables")
5. **Task ID Format**: Each TODO item MUST include the task ID prefix: \`- [ ] ${taskIdPrefix}-SUB-XXX: Title\` or \`- [ ] ${taskIdPrefix}: Subtask Title\`

**Example TODO Breakdown**:
If the task says "CREATE Xcode project AND CONFIGURE environment variables AND SETUP database schema", your TODO list should be:
\`\`\`
- [ ] ${taskIdPrefix}: Create initial Xcode project structure
- [ ] ${taskIdPrefix}: Configure development environment variables
- [ ] ${taskIdPrefix}: Setup database schema and collections
- [ ] ${taskIdPrefix}: Verify all components are working
\`\`\`

**MANDATORY**: Create your TODO list NOW before starting implementation. Use your TODO creation tool to add these items.`;
      }).join('\n\n');
    
    return `## TODO LIST CREATION INSTRUCTIONS

${this.getTaskFormatRequirements()}

🚨 **CRITICAL**: You MUST create a TODO list by analyzing the task(s) below and breaking them down into manageable subtasks.

**For each task listed below, you MUST:**
1. Read the complete task description
2. Identify ALL individual requirements (look for "AND", "INCLUDE", "ALSO", "PLUS" connectors)
3. Create TODO items for each major requirement/component
4. Order them logically (dependencies first)
5. Use your TODO creation tool/feature to add these items to your workspace

**TODO Item Format Requirements**:
- **MUST** start with: \`- [ ] TASK-XXX: Title\` or \`- [ ] TASK-XXX-SUB-XXX: Title\`
- **MUST** include the task ID (e.g., "TASK-001")
- **FORBIDDEN**: Creating TODO items without task IDs like "- [ ] Setup project"
- **REQUIRED**: Each TODO should be specific and actionable

---

${taskInstructions}

💡 **HOW TO USE**: 
1. Create the TODO list using your TODO tool/feature
2. Work through each TODO item sequentially
3. Check off items as you complete them
4. Reference the full task specification below for detailed requirements

🚨 **CRITICAL**: If you skip TODO list creation and proceed directly to implementation, this is a methodology violation requiring restart from task 1.`;
  }
  
  /**
   * Extract key requirements from task description to help AI create TODO items
   */
  private extractKeyRequirements(description: string): string[] {
    if (!description || description.trim().length === 0) {
      return [];
    }
    
    const requirements: string[] = [];
    
    // Look for action verbs followed by objects (CREATE X, SETUP Y, CONFIGURE Z)
    const actionPattern = /(?:^|\s)(CREATE|SETUP|CONFIGURE|IMPLEMENT|DEFINE|ESTABLISH|BUILD|INSTALL|ADD|CONNECT|INTEGRATE|WRITE|GENERATE|DEPLOY)\s+([A-Z][^.!?]*(?:AND|INCLUDE|ALSO|PLUS)?[^.!?]*)/gi;
    let match;
    while ((match = actionPattern.exec(description)) !== null) {
      const action = match[1];
      const target = match[2].trim();
      // Clean up the target (remove trailing connectors)
      const cleanTarget = target.replace(/\s+(AND|INCLUDE|ALSO|PLUS)$/i, '').trim();
      if (cleanTarget.length > 0 && cleanTarget.length < 100) {
        requirements.push(`${action} ${cleanTarget}`);
      }
    }
    
    // If no action patterns found, look for "AND" connectors to identify multiple requirements
    if (requirements.length === 0 && description.includes(' AND ')) {
      const parts = description.split(/\s+AND\s+/i);
      parts.forEach((part, idx) => {
        const trimmed = part.trim();
        if (trimmed.length > 10 && trimmed.length < 150) {
          requirements.push(trimmed);
        }
      });
    }
    
    // Limit to top 8 requirements to avoid overwhelming
    return requirements.slice(0, 8);
  }


  /**
   * Generate comprehensive safety message that AI actually sees
   */
  private generateComprehensiveSafetyMessage(taskId: string, phaseNum: number, taskSpec: string, tasksMarkdown: string, tasks: Array<any>): string {
    return `
🚨 CRITICAL: IMPLEMENT THIS ONE TASK NOW: ${taskId}

🧠 ADVANCED AI SAFETY PROTOCOLS ACTIVATED 🧠

TRUTH-SEEKING SYSTEM PROMPT:
"I am an AI committed to absolute truthfulness and accuracy. I will:
- Think through requirements carefully before implementing
- Provide evidence for every claim I make
- Admit when I don't know something
- Correct my own mistakes when found
- Never fabricate data or results
- Always show proof of work (code, commands, output)"

HALLUCINATION PREVENTION:
- I will only output information I can verify
- I will flag any uncertainty or assumption
- I will use 'I believe' or 'Based on evidence' for uncertain claims
- I will never make up terminal output or test results

SELF-VERIFICATION CHECKLIST:
□ Did I run the actual commands shown?
□ Are the results from real execution, not imagination?
□ Did I check all acceptance criteria?
□ Am I following the exact task description?
□ Have I avoided combining multiple tasks?

🤖 AI HONESTY CONTRACT 🤖
I, the AI assistant, hereby commit to:
1. Telling the truth about task completion status
2. Providing actual terminal output, not fabricated results
3. Executing exactly one task per response
4. Not skipping verification steps or combining tasks
5. Being transparent about any issues or failures encountered
6. Maintaining the integrity of the SDD methodology

VIOLATION OF THIS CONTRACT = IMMEDIATE RESET TO TASK 1

🔬 ROBUST PROMPTING STRATEGIES ACTIVATED 🔬
THINKING REQUIREMENT: Think through requirements before taking action
SELF-VERIFICATION: I must double-check all claims against evidence
EVIDENCE-BASED RESPONSES: Every claim must be backed by verifiable proof
CONSTRAINED OUTPUT: Responses must follow strict formatting rules
MULTI-TURN VERIFICATION: Complex tasks broken into atomic, verifiable steps

🚨🚨🚨 METHODOLOGY ENFORCEMENT 🚨🚨🚨

CRITICAL VIOLATION PREVENTION:
❌ NEVER read plan.md or spec.md files manually
❌ NEVER create combined or multi-step tasks
❌ NEVER implement multiple tasks in one response
❌ NEVER declare phase complete before all tasks in the phase
❌ NEVER take "efficiency shortcuts" or optimizations
❌ NEVER lie about task completion or skip verification steps
❌ NEVER claim tasks are complete without actual terminal output proof
❌ NEVER combine multiple tasks under one task number
❌ NEVER provide generic responses without specific implementation details
❌ NEVER add human explanations or summaries

MANDATORY RULES:
✅ Execute EXACTLY ONE TASK per tool call
✅ Use ONLY information from this tool's response

AUTOMATED VIOLATION DETECTION:
- Scans for unauthorized text patterns
- Auto-resets on methodology violations
- Enforces atomic task execution
- Zero tolerance for deviations
- Detects AI lying patterns (claiming completion without proof, skipping tasks, generic responses)

🤖 AI LIE DETECTION PATTERNS 🤖
SYSTEM AUTOMATICALLY DETECTS AND FLAGS:
❌ "Task completed successfully" without terminal output
❌ "All tests pass" without showing GREEN/PASS results
❌ "Code implemented" without actual code snippets
❌ "Phase complete" before all tasks are individually marked
❌ Generic responses like "Done" or "Completed"
❌ Skipping verification commands
❌ Fabricated terminal output or test results

DETECTION = IMMEDIATE RESET + AUDIT LOGGING

🎯 CONSTRAINED GENERATION PROTOCOLS 🎯
OUTPUT MUST FOLLOW STRICT FORMATS:

TASK EXECUTION FORMAT:
✅ TASK-XXX: [Task Title]
📋 ANALYSIS: [Brief analysis of requirements]
⚡ EXECUTION: [Commands run]
📊 RESULTS: [Terminal output with actual results]
✅ VERIFICATION: [How criteria were met]

ERROR FORMAT:
❌ ERROR: [Specific error description]
🔍 DIAGNOSTICS: [What I checked]
🛠️ ATTEMPTED FIXES: [What I tried]
📞 NEXT STEPS: [What to do next]

COMPLETION FORMAT:
✅ TASK-XXX complete
📝 EVIDENCE: [Specific proof points]
🎯 CRITERIA MET: [Which acceptance criteria satisfied]
🔄 NEXT: sdd_implement phase=X task=Y complete=true

ARCHITECTURE CORRECTION FORMAT (ALLOWED when methodology mismatch detected):
⚠️ METHODOLOGY CORRECTION REQUIRED:
ARCHITECTURE MISMATCH: [pattern mismatch]
JUSTIFICATION: [why mismatch]
ADAPTATION: [what to do instead]

Then proceed with task execution.

FREE-FORM TEXT PROHIBITED - ALL OUTPUT MUST USE ABOVE FORMATS (except architecture corrections)

🤖 PROOF-OF-WORK REQUIREMENTS 🤖
MANDATORY VERIFICATION FOR TASK COMPLETION:
✅ TERMINAL OUTPUT: Must show actual command execution, not generic messages
✅ ERROR-FREE: Must show 0 errors, 0 warnings for compilation tasks
✅ TEST RESULTS: Must show GREEN/PASS/✓ status for test tasks
✅ COVERAGE METRICS: Must show ≥85% coverage for coverage tasks
✅ FILE CREATION: Must show file contents or successful creation
✅ NO FABRICATION: All output must be real, not AI-generated fantasy

VIOLATION = TASK REJECTION + AUDIT LOGGING

📊 EVIDENCE-BASED PROMPTING REQUIREMENTS 📊
TASK EXECUTION PROCESS:
1. **ANALYZE**: What does this task actually require?
2. **PLAN**: What specific steps must I take?
3. **EXECUTE**: Run commands and implement code
4. **VERIFY**: Show proof of completion (terminal output, code snippets)
5. **VALIDATE**: Confirm evidence matches requirements

EVIDENCE CHAIN:
- Command executed → Terminal output shown → Result verified → Task criteria met
- Any break in this chain = AUTOMATIC REJECTION

🔄 MULTI-TURN VERIFICATION PROTOCOL 🔄
COMPLEX TASKS BROKEN INTO VERIFIABLE STEPS:

STEP-BY-STEP VERIFICATION:
1. **PRE-EXECUTION**: Confirm understanding of task requirements
2. **COMMAND VALIDATION**: Verify commands match task description
3. **EXECUTION TRACKING**: Log each command as it's run
4. **RESULT VALIDATION**: Cross-check results against expectations
5. **CRITERIA MAPPING**: Map results to specific acceptance criteria
6. **COMPLETION CONFIRMATION**: Final verification before marking complete

SELF-AUDIT QUESTIONS:
- Did I understand the task correctly?
- Did I run the right commands in the right order?
- Do the results prove the task is actually complete?
- Have I met ALL acceptance criteria, not just some?
- Would a human reviewer agree this task is done?

UNIVERSAL RULES (applies to every task):
-- SHOW terminal output for EXECUTE/RUN/CONFIRM (GREEN must show PASS/✓/0 failed; ≥85% if required)
-- SHOW code snippet for IMPLEMENTATION tasks (no placeholders/TODOs/console.log handlers)
-- Enforce task title as "TASK-XXX Title" and completion as "✅ TASK-XXX complete"
-- No mid-phase communication; do not ask permission; proceed sequentially
-- UI/API tasks: show code wiring + actual HTTP logs when required
-- Zero tolerance forbidden: NEVER say "I'll run them now", "time constraints", or provide documentation instead of proof
-- Do NOT read spec.md/plan.md; use ONLY the task section below
-- Permission safety: NO sudo/chown/chmod (root-level). User-level commands only

⚠️ **VERIFICATION COMMAND SAFETY (CRITICAL)**:
When executing verification commands, especially echo commands:
- **MAX && OPERATORS**: Do NOT execute commands with more than 3 && operators chained together
- **NO EMOJIS IN ECHO**: Avoid emojis in echo quoted strings (✅, 📊, 🎯) - they cause encoding issues and hangs
- **SHORT COMMANDS**: Keep command lines under 200 characters - long lines cause shell timeouts
- **SEPARATE EXECUTION**: If verification commands have many && operators, break them into separate commands
- **QUOTE VALIDATION**: Before executing, ensure quotes are properly closed (no trailing extra quotes)
- **IF COMMAND HANGS**: The command likely has too many && operators, emojis, or unclosed quotes - report error and suggest fix

MANDATORY MINI-CHECKLIST:
- [ ] Ran ALL verification commands and pasted terminal output
- [ ] If GREEN required: PASS/✓/0 failed visible (and ≥85% coverage if specified)
- [ ] Shown real code snippet for implementation tasks
- [ ] No placeholders/TODOs; handlers call real API functions
- [ ] Ready to mark complete: sdd_implement phase=${phaseNum} task=${taskId} complete=true

---

🎯 TASK TO IMPLEMENT: ${taskId}

${taskSpec}

---

AFTER IMPLEMENTING THIS TASK:
1. Call: sdd_implement phase=${phaseNum} task=${taskId} complete=true
2. Then call: sdd_implement phase=${phaseNum} (for next task)

FOCUS: Implement the task, show verification proof (code/commands/output), then call next tool.

🚨 CRITICAL IMPLEMENTATION REQUIREMENTS 🚨
IMPLEMENTATION_REQUIRED: You MUST write the actual code for ${taskId}. This tool provides guidance only.
TASK_TO_IMPLEMENT: ${taskId}
PHASE: ${phaseNum}

CRITICAL_INSTRUCTIONS:
❌ DO NOT implement multiple tasks
❌ DO NOT provide progress summaries
❌ DO NOT stop after this task
✅ Implement ONLY ${taskId} (complete all requirements including verification if needed)
✅ After implementing, call: sdd_implement phase=${phaseNum} task=${taskId} complete=true
✅ Then call: sdd_implement phase=${phaseNum} for the next task

NEXT_REQUIRED_ACTION: 1. Implement ${taskId} code, 2. Call complete=true, 3. Call for next task
WARNING: Complete this task fully (including verification if needed), mark complete, then get next task.
`;
  }

  private generatePhaseSuccessMessage(phaseNum: number, tasks: Array<any>, todoList: string, tasksMarkdown: string, platformDetection: PlatformDetectionResult, nextCall?: string, markComplete?: boolean): string {
    const phaseNames = {
      1: 'Project Setup & Foundations',
      2: 'Core Implementation', 
      3: 'UI Development',
      4: 'Testing, Documentation & Deployment'
    };

    // If only one task and not marking complete (per-task mode), produce compact universal rules + the task spec
    if (tasks.length === 1 && !markComplete) {
      const currentTaskNum = parseInt((tasks[0].id || '').split('-')[1], 10);
      const currentNN = !isNaN(currentTaskNum) ? String(currentTaskNum) : '1';
      const compactUniversal = `
# PHASE ${phaseNum} IMPLEMENTATION (Per-Task Mode)
Platform: ${platformDetection.platform} (${platformDetection.framework} + ${platformDetection.language})
Task: ${tasks[0].id}
${nextCall ? `Next Command: ${nextCall}` : ''}
Mark Complete: sdd_implement phase=${phaseNum} task=${currentNN} complete=true

UNIVERSAL RULES (applies to every task):
- SHOW terminal output for EXECUTE/RUN/CONFIRM (GREEN must show PASS/✓/0 failed; ≥85% if required)
- SHOW code snippet for IMPLEMENTATION tasks (no placeholders/TODOs/console.log handlers)
- Enforce task title as "TASK-XXX Title" and completion as "✅ TASK-XXX complete"
- No mid-phase communication; do not ask permission; proceed sequentially
- UI/API tasks: show code wiring + actual HTTP logs when required
- Zero tolerance forbidden: NEVER say "I'll run them now", "time constraints", or provide documentation instead of proof
- Do NOT read spec.md/plan.md; use ONLY the task section below
- Permission safety: NO sudo/chown/chmod (root-level). User-level commands only

🤖 PROOF-OF-WORK REQUIREMENTS 🤖
MANDATORY VERIFICATION FOR TASK COMPLETION:
✅ TERMINAL OUTPUT: Must show actual command execution, not generic messages
✅ ERROR-FREE: Must show 0 errors, 0 warnings for compilation tasks
✅ TEST RESULTS: Must show GREEN/PASS/✓ status for test tasks
✅ COVERAGE METRICS: Must show ≥85% coverage for coverage tasks
✅ FILE CREATION: Must show file contents or successful creation
✅ NO FABRICATION: All output must be real, not AI-generated fantasy

VIOLATION = TASK REJECTION + AUDIT LOGGING

📊 EVIDENCE-BASED PROMPTING REQUIREMENTS 📊
TASK EXECUTION PROCESS:
1. **ANALYZE**: What does this task actually require?
2. **PLAN**: What specific steps must I take?
3. **EXECUTE**: Run commands and implement code
4. **VERIFY**: Show proof of completion (terminal output, code snippets)
5. **VALIDATE**: Confirm evidence matches requirements

EVIDENCE CHAIN:
- Command executed → Terminal output shown → Result verified → Task criteria met
- Any break in this chain = AUTOMATIC REJECTION

🔄 MULTI-TURN VERIFICATION PROTOCOL 🔄
COMPLEX TASKS BROKEN INTO VERIFIABLE STEPS:

**STEP-BY-STEP VERIFICATION:**
1. **PRE-EXECUTION**: Confirm understanding of task requirements
2. **COMMAND VALIDATION**: Verify commands match task description
3. **EXECUTION TRACKING**: Log each command as it's run
4. **RESULT VALIDATION**: Cross-check results against expectations
5. **CRITERIA MAPPING**: Map results to specific acceptance criteria
6. **COMPLETION CONFIRMATION**: Final verification before marking complete

**SELF-AUDIT QUESTIONS:**
- Did I understand the task correctly?
- Did I run the right commands in the right order?
- Do the results prove the task is actually complete?
- Have I met ALL acceptance criteria, not just some?
- Would a human reviewer agree this task is done?

MANDATORY MINI-CHECKLIST:
- [ ] Ran ALL verification commands and pasted terminal output
- [ ] If GREEN required: PASS/✓/0 failed visible (and ≥85% coverage if specified)
- [ ] Shown real code snippet for implementation tasks
- [ ] No placeholders/TODOs; handlers call real API functions
- [ ] Ready to proceed to next task: ${nextCall ?? 'N/A'}
- [ ] Tests create their own data (NO hardcoded IDs); create then query by created IDs
- [ ] If coverage required: visible ≥85% line in output
- [ ] If blocked by sequencing: run previous task or mark it complete explicitly

---

MINI TODO (complete all steps before marking done):
- [ ] Parse all requirements from Description/Requirements/Acceptance (count all AND/INCLUDE)
- [ ] Implement code fully (show snippet) and list changed file paths
- [ ] Run ALL Verification commands exactly as listed and paste terminal output
- [ ] Confirm required state (GREEN/PASS/0 failed and ≥85% coverage if specified)
- [ ] For UI/API: show handler → service code and HTTP request/response logs
- [ ] Ensure no placeholders/TODOs; event handlers call real API functions
- [ ] Mark complete: \`sdd_implement phase=${phaseNum} task=${currentNN} complete=true\` and run Next Command

---

REQUIRED COMPLETION TEMPLATE (paste in your final answer when done):
\`\`\`
# ✅ ${tasks[0].id}: ${tasks[0].id} ${tasks[0].title}

## Implementation
[Show actual working code snippet relevant to this task]

## Verification (terminal)
${tasks[0]?.verification?.commands?.length > 0 || (tasks[0]?.description?.toUpperCase().includes('EXECUTE') || tasks[0]?.description?.toUpperCase().includes('RUN') || tasks[0]?.description?.toUpperCase().includes('TEST')) ? `🚨🚨🚨 EXECUTION CHECKPOINT - MANDATORY 🚨🚨🚨

⛔ DO NOT mark this task complete until you have executed ALL verification commands and shown terminal output!

**Required Actions**:
1. Run ALL verification commands listed in task specification
2. Copy/paste ACTUAL terminal output (not fabricated)
3. Show required status (GREEN/PASS/0 errors/coverage % if required)
4. Verify output matches acceptance criteria

**If task requires EXECUTE/RUN/TEST/SHOW GREEN, you MUST run commands and show output BEFORE marking complete.**

\`\`\`bash
[Paste ACTUAL command output showing PASS/✓/0 failed and coverage if required]
\`\`\`` : `\`\`\`bash
[Paste ACTUAL command output showing PASS/✓/0 failed and coverage if required]
\`\`\``}
\`\`\`

EXECUTION GUARDS:
- Use short timeouts for long commands when needed, e.g. \`timeout 60s <command>\`
- For UI→API tasks: include handler→service code and HTTP request/response logs
- Artifacts to include: terminal output, code snippets, and list of file paths changed

## Task Specification
${tasksMarkdown}
`;
      return compactUniversal;
    }

    return `
# PHASE ${phaseNum} IMPLEMENTATION GUIDE
**Phase:** ${phaseNum} - ${phaseNames[phaseNum as keyof typeof phaseNames]}
**Platform:** ${platformDetection.platform} (${platformDetection.framework} + ${platformDetection.language})
**Tasks:** ${tasks.length} tasks to complete sequentially
${nextCall ? `**Next Call:** ${nextCall}` : ''}



🚨🚨🚨 CRITICAL: COMPLETE ALL ${tasks.length} TASKS SEQUENTIALLY 🚨🚨🚨
🚨🚨🚨 CRITICAL: COMPLETE EACH TASK FULLY (including verification) BEFORE MOVING TO NEXT 🚨🚨🚨
🚨🚨🚨 CRITICAL: DO NOT ASK FOR PERMISSION TO CONTINUE 🚨🚨🚨  
🚨🚨🚨 CRITICAL: DO NOT PROVIDE STATUS UPDATES MID-PHASE 🚨🚨🚨

---

## 1. CRITICAL RESTRICTIONS (Read First!)

### 1.1. File Reading Restrictions
   - **DO NOT read spec.md or plan.md files** - YOU DON'T NEED THEM
   - **ONLY use** the task specifications provided in section 3 below
   - All information is already included in this message

### 1.2. Zero Tolerance for Excuses
   **🚫 NEVER SAY:**
   - "Sorry, I didn't run the tests" → NO EXCUSES! Run them NOW before marking complete!
   - "I'll run them now" → Should have done it the first time!
   - "Let me add tests" → Tests were already supposed to be run!
   - "I forgot to run tests" → UNACCEPTABLE! Run ALL tests NOW before proceeding!

   **✅ ALWAYS DO:**
   - Run ALL verification commands in EVERY task
   - Show terminal output for EVERY test execution
   - Execute ALL acceptance criteria checks
   - Provide proof for EVERY requirement

${this.getCompletionRequirements()}

---

## 2. YOUR TODO LIST (MANDATORY - CREATE THIS NOW)

${this.generateTODOList(tasks, phaseNum)}

🚨 **MANDATORY TODO LIST CREATION - READ THIS FIRST**:
- **YOU MUST CREATE A TODO LIST FROM THE TASKS ABOVE** - This is NOT optional
- **USE YOUR TODO CREATION TOOL/COMMAND** to create each TODO item listed above
- **EVERY SINGLE TASK** in the list above MUST become a TODO item in your workspace
- **IF YOU SKIP THIS STEP, YOU ARE VIOLATING THE METHODOLOGY** - This will cause task execution failures

🚨 **CRITICAL INSTRUCTIONS FOR TODO LIST CREATION**:
1. **MANDATORY FIRST STEP**: Create a TODO list using your TODO tool/feature with EXACTLY these items:
   ${tasks.map((task, idx) => `\n   - [ ] ${task.id}: ${task.title || task.id}`).join('')}

2. **FORMAT REQUIREMENTS**:
- **MUST** use the EXACT format: \`- [ ] TASK-XXX Title\`
   - **MUST** include the full task ID (e.g., "TASK-001", not just "001")
   - **FORBIDDEN**: Creating TODO items without task IDs like "- [ ] Setup project"
- **REQUIRED**: Every TODO item MUST start with "- [ ] TASK-XXX"

3. **WORKFLOW REQUIREMENT**:
   - Create the TODO list BEFORE starting any implementation
   - Check off each TODO item ONLY after completing that specific task
   - Do NOT skip TODO creation - this is how we track progress and prevent task skipping

4. **VERIFICATION**:
   - If you cannot create TODOs in your environment, you MUST acknowledge each task explicitly: "Starting TASK-001", "Starting TASK-002", etc.
   - You MUST reference the task ID in every action you take for that task

⚠️ **VIOLATION DETECTED**: If you proceed to implementation without creating/acknowledging the TODO list above, this is a methodology violation requiring restart from task 1.

${this.getTaskFormatRequirements()}

---

## 3. COMPLETE TASK SPECIFICATIONS

All task details are in the markdown below. DO NOT read spec.md or plan.md - use ONLY this content:

${tasksMarkdown}

---

## 4. HOW TO EXECUTE EACH TASK (Follow This Order)

For EVERY task, you MUST follow these 5 steps IN ORDER:

### 5.1. PARSE the Task Description
   - Read sentence-by-sentence
   - Identify EVERY "AND", "INCLUDE", "ENSURE" connector
   - Count ALL requirements (not just the first one)
   - **Example**: If task says "Create page AND add navigation AND add functionality", that's 3 requirements, not 1

### 5.2. UNDERSTAND TDD States (If Tests Are Involved)
${EXECUTION_RULES.VERIFICATION.GREEN_STATUS}

**For detailed TDD state explanations, see section 5 below.**

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

${this.getCompletionRequirements()}

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

### 4.1. TASK TYPE IDENTIFICATION

#### 4.1.1. IMPLEMENTATION Tasks (Write Code)
   **Task verbs**: CREATE, BUILD, IMPLEMENT, WRITE, ADD, SETUP
   **Example**: "CREATE landing page with navigation"
   **Requires**: Code written, files created, functionality works
   **Proof**: Show code snippets or file paths
   
   **⚠️ WARNING**: Some implementation tasks ALSO require verification!
   - If task says "CREATE tests", you write tests
   - But if task ALSO says "EXECUTE tests" or "CONFIRM GREEN", you MUST run them!

#### 4.1.2. VERIFICATION Tasks (Run Commands)
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

#### 4.1.3. Mixed Tasks (Implementation + Verification)
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

#### 4.1.4. TASK COMPLETION DECISION TREE

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

## 5. TDD States Reference

**RED**: ${TDD_STATES.RED}
**GREEN**: ${TDD_STATES.GREEN}
**REFACTOR**: ${TDD_STATES.REFACTOR}

For tasks requiring GREEN status, you MUST show PASS/✓/0 failed in terminal output.

---

## 6. TEST EXECUTION REQUIREMENTS

### 6.1. Mandatory Test Execution (NON-NEGOTIABLE)
   ⚠️ **CRITICAL**: When task says "EXECUTE tests" or "RUN tests", you MUST actually run test commands
   ⚠️ **FORBIDDEN**: Creating tests is NOT enough - you must execute them
   ⚠️ **REQUIRED**: Always show actual output of test execution commands
   ⚠️ **BLOCKED**: Completion is BLOCKED until execution proof is provided

### 6.2. What Happens If You Skip Execution
   **If you try to mark complete without execution proof:**
   - Task completion will be REJECTED
   - You will receive explicit error message
   - Task will remain incomplete
   - You MUST execute commands and show output before retrying
   
   **Common Violations (ALL FORBIDDEN):**
   - ❌ "Created test files" → Must also run tests
   - ❌ "Implemented code" → Must also execute verification
   - ❌ "Tests should pass" → Must actually run them and show output
   - ❌ "Will run tests later" → Must run NOW before marking complete
   - ❌ Describing what you did → Must show ACTUAL terminal output
   
   **Correct Approach:**
   - ✅ Run test commands
   - ✅ Copy/paste ACTUAL terminal output
   - ✅ Show PASS/✓/0 failed status
   - ✅ Show coverage % if required
   - ✅ Include output in code blocks
   - ✅ THEN mark complete

### 6.3. Common Test Commands by Platform
   - **Web**: \`npm test\`, \`npx jest\`, \`npx vitest\`
   - **Backend**: \`npm test\`, \`python -m pytest\`, \`go test\`
   - **Mobile**: \`npm test\`, \`npx react-native test\`, \`flutter test\`
   - **Desktop**: \`npm test\`, \`npx electron-mocha\`

### 6.3. Proper Test Data Setup
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

### 6.4. Test Failure Handling
   - **NO TEST SKIPPING**: Never skip tests because they are "failing"
   - **NO WORKING AROUND**: Never work around failing tests - fix them completely
   - **NO PARTIAL ACCEPTANCE**: All tests must pass, not "mostly working"
   - **NO TIME EXCUSES**: Never skip tests due to "time constraints"
   - **MANDATORY FIXING**: When tests fail, fix the root cause, not symptoms

---

${this.getImplementationStandards()}

---


## 7. PERMISSION REQUIREMENTS

### 7.1. Never Use Sudo
   - Do NOT use sudo, chown, or any root-level commands
   - All commands must run with regular user permissions

### 7.2. User-Level Operations Only
   - Do not modify system files or directories
   - Only work within the project directory and user-owned files

### 7.3. Correct Commands Examples
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

## 8. Execution Rules

${this.getAntiEvasionRules()}

---

${this.getCompletionRequirements()}

---

## 9. EXECUTION START

🚨 **MANDATORY BEFORE STARTING**: You MUST create the TODO list from Section 2 above BEFORE beginning any implementation. This is a non-negotiable first step.

**Execution sequence:**
1. **FIRST**: Create TODO list from Section 2 (use your TODO tool/feature or explicitly acknowledge each task ID)
2. **SECOND**: Begin with the first task in the TODO list above
3. **THIRD**: Work through all tasks sequentially, checking off each TODO as you complete it

**Key reminders:**
- Follow the task completion requirements for each task type
- Use the execution rules to avoid common pitfalls
- Show proof for all implementation and verification tasks
- Reference task IDs (TASK-XXX) in all your actions and communications

⚠️ **METHODOLOGY VIOLATION**: Starting implementation without creating/acknowledging the TODO list = complete restart from task 1.

**Start now - but FIRST create your TODO list!**`;
  }

  /**
   * Get phase information based on phase number
   */
  private getPhaseInfo(phase: number): any {
    const phases = {
      1: {
        taskCount: 9,
        taskRange: '01-09'
      },
      2: {
        taskCount: 8,
        taskRange: '01-08'
      },
      3: {
        taskCount: 9,
        taskRange: '01-09'
      },
      4: {
        taskCount: 7,
        taskRange: '01-07'
      }
    };

    return phases[phase as keyof typeof phases] || phases[1];
  }

  /**
   * Detect if execution evidence is present in task completion
   * This checks for common patterns that indicate commands were actually executed
   */
  private detectExecutionEvidence(taskSpec: string, verificationCommands: string[]): { hasEvidence: boolean; evidenceType: string; missingRequirements: string[] } {
    const specUpper = taskSpec.toUpperCase();
    const missingRequirements: string[] = [];
    let hasEvidence = false;
    let evidenceType = 'none';
    
    // Check for execution verbs in task spec
    const requiresExecution = specUpper.includes('EXECUTE') || specUpper.includes('RUN') || specUpper.includes('TEST');
    const requiresShow = specUpper.includes('SHOW') || specUpper.includes('TERMINAL OUTPUT') || specUpper.includes('OUTPUT');
    const requiresGreen = specUpper.includes('GREEN') || specUpper.includes('PASS') || specUpper.includes('0 FAILED');
    const requiresCoverage = specUpper.includes('COVERAGE') && specUpper.includes('%');
    const requiresCompile = specUpper.includes('COMPILE') || specUpper.includes('BUILD');
    
    // This method will be called by verifyTaskCompletion
    // We can't check actual response content here, but we can identify what's required
    // The actual enforcement happens through the blocking requirements and explicit checkpoints
    
    if (requiresExecution) {
      missingRequirements.push('EXECUTE commands (not just create files)');
    }
    if (requiresShow) {
      missingRequirements.push('SHOW terminal output (actual command execution proof)');
    }
    if (requiresGreen) {
      missingRequirements.push('SHOW GREEN/PASS status in terminal output');
    }
    if (requiresCoverage) {
      missingRequirements.push('SHOW coverage percentage ≥85% in terminal output');
    }
    if (requiresCompile) {
      missingRequirements.push('EXECUTE compilation command and show output');
    }
    
    // If no specific requirements, assume execution is needed if verification commands exist
    if (verificationCommands.length > 0 && missingRequirements.length === 0) {
      missingRequirements.push('EXECUTE verification commands and show output');
    }
    
    return { hasEvidence, evidenceType, missingRequirements };
  }

  /**
   * Verify that a task's requirements are actually met before allowing completion
   */
  private verifyTaskCompletion(taskId: string, taskIndex: number, phaseNum: number, tasksMarkdown: string, platformDetection: PlatformDetectionResult): { isComplete: boolean; reason: string; details: string; requirements: string[]; blocksCompletion: boolean } {
    const basePath = path.resolve(this.basePath);

    // Get the task specification to understand requirements
    const taskSpec = this.extractSingleTaskSpec(tasksMarkdown, taskId);
    
    // Extract task object for verification check
    const allTasks = this.extractTasks(tasksMarkdown);
    const task = allTasks.find(t => t.id === taskId);
    
    // Check if this is a verification task
    const verificationCheck = task ? this.isVerificationTask(task) : { isVerification: false, reasons: [] };
    
    // Get verification commands from task
    const verificationCommands = task?.verification?.commands || [];
    
    // For verification tasks, add special requirements and BLOCK completion if execution is required
    if (verificationCheck.isVerification) {
      const verificationRequirements: string[] = [];
      
      // Check for verification verbs in task spec
      const specUpper = taskSpec.toUpperCase();
      const executionEvidence = this.detectExecutionEvidence(taskSpec, verificationCommands);
      
      if (specUpper.includes('EXECUTE') || specUpper.includes('RUN')) {
        verificationRequirements.push('🚨 MANDATORY: Verification commands must be EXECUTED (not just mentioned or files created)');
      }
      if (specUpper.includes('SHOW') || specUpper.includes('TERMINAL OUTPUT')) {
        verificationRequirements.push('🚨 MANDATORY: Terminal output must be SHOWN (actual command execution proof required)');
      }
      if (specUpper.includes('GREEN') || specUpper.includes('PASS') || specUpper.includes('0 FAILED')) {
        verificationRequirements.push('🚨 MANDATORY: Test results must show GREEN/PASS status in terminal output');
      }
      if (specUpper.includes('COVERAGE') && specUpper.includes('%')) {
        verificationRequirements.push('🚨 MANDATORY: Coverage percentage must be shown in terminal output');
      }
      if (specUpper.includes('COMPILE') || specUpper.includes('BUILD')) {
        verificationRequirements.push('🚨 MANDATORY: Compilation command must be executed and output shown');
      }
      
      const allRequirements = [
        '🚨🚨🚨 VERIFICATION TASK - EXECUTION IS MANDATORY - COMPLETION BLOCKED UNTIL PROOF PROVIDED 🚨🚨🚨',
        ...verificationRequirements,
        '🚨 Terminal output must be visible in your response',
        '🚨 All verification commands must be executed BEFORE marking complete',
        '🚨 Output must match acceptance criteria',
        '🚨 DO NOT mark complete until you have executed commands and shown proof'
      ];
      
      // BLOCK completion for ALL verification tasks that have verification commands
      // This is a hard requirement - the AI must provide execution proof
      // Even if task doesn't explicitly say "EXECUTE", if it has verification commands, execution is required
      const blocksCompletion = verificationCheck.isVerification && (
                               executionEvidence.missingRequirements.length > 0 || 
                               specUpper.includes('EXECUTE') || 
                               specUpper.includes('RUN') || 
                               specUpper.includes('TEST') ||
                               specUpper.includes('SHOW GREEN') ||
                               specUpper.includes('CONFIRM') ||
                               specUpper.includes('VERIFY') ||
                               verificationCommands.length > 0);
      
      return {
        isComplete: false, // BLOCK completion until execution proof is provided
        reason: 'Verification task requires execution proof',
        details: `🚨🚨🚨 VERIFICATION TASK - COMPLETION BLOCKED 🚨🚨🚨

**Task Type**: ${verificationCheck.verificationType || 'VERIFICATION'}
**Detection**: ${verificationCheck.reasons.join(', ')}

**⛔ THIS TASK CANNOT BE MARKED COMPLETE UNTIL YOU PROVIDE EXECUTION PROOF ⛔**

**MANDATORY REQUIREMENTS** (must all be met):
${verificationRequirements.length > 0 ? verificationRequirements.map(r => `- ${r}`).join('\n') : '- Execute verification commands and show output'}
${executionEvidence.missingRequirements.length > 0 ? `\n**Missing Requirements**:\n${executionEvidence.missingRequirements.map(r => `- ${r}`).join('\n')}` : ''}

**EXECUTION CHECKPOINT** (Complete ALL before marking done):
1. ✅ Run ALL verification commands from task specification
2. ✅ Capture ACTUAL terminal output (copy/paste real output)
3. ✅ Show required status (GREEN/PASS/0 errors/coverage % if required)
4. ✅ Verify output matches acceptance criteria
5. ✅ Include output in your response using:
   \`\`\`bash
   [paste ACTUAL terminal output here]
   \`\`\`

**❌ DO NOT mark complete until you have:**
- Executed commands (not just created files)
- Shown terminal output (not just described what you did)
- Proven GREEN status (if required)
- Shown coverage (if required)

**If you mark complete without execution proof, this is a methodology violation and the task will be rejected.**`,
        requirements: allRequirements,
        blocksCompletion: true // Hard block - cannot complete without execution proof
      };
    }

    // Parse the task specification to extract requirements for non-verification tasks
    const requirements = this.parseTaskRequirements(taskSpec, platformDetection);
    const missingRequirements: string[] = [];

    // Check each requirement
    for (const requirement of requirements) {
      if (!this.checkRequirementMet(requirement, basePath, platformDetection)) {
        missingRequirements.push(requirement);
      }
    }

    if (missingRequirements.length > 0) {
      return {
        isComplete: false,
        reason: 'Task requirements not met',
        details: `Missing ${missingRequirements.length} of ${requirements.length} requirements: ${missingRequirements.slice(0, 3).join(', ')}${missingRequirements.length > 3 ? '...' : ''}`,
        requirements: requirements.map(req => `❌ ${req}`),
        blocksCompletion: false
      };
    }

    return {
      isComplete: true,
      reason: 'Task verification passed',
      details: 'All task requirements verified as implemented',
      requirements: requirements.map(req => `✅ ${req}`),
      blocksCompletion: false
    };
  }

  /**
   * Parse task specification to extract verifiable requirements
   */
  private parseTaskRequirements(taskSpec: string, platformDetection: PlatformDetectionResult): string[] {
    const requirements: string[] = [];
    const spec = taskSpec.toLowerCase();

    // Parse common task requirements based on keywords
    if (spec.includes('create') || spec.includes('implement') || spec.includes('build')) {
      if (spec.includes('api') || spec.includes('endpoint') || spec.includes('route')) {
        requirements.push('API routes/endpoints implemented');
      }
      if (spec.includes('model') || spec.includes('class') || spec.includes('data')) {
        requirements.push('Data models/classes implemented');
      }
      if (spec.includes('database') || spec.includes('schema') || spec.includes('db')) {
        requirements.push('Database schema/layer implemented');
      }
      if (spec.includes('test') || spec.includes('spec')) {
        requirements.push('Test suite created');
      }
      if (spec.includes('ui') || spec.includes('component') || spec.includes('screen')) {
        requirements.push('UI components/screens implemented');
      }
      if (spec.includes('auth') || spec.includes('login') || spec.includes('security')) {
        requirements.push('Authentication/security implemented');
      }
    }

    // Parse action verbs from task description
    const actionVerbs = ['create', 'implement', 'build', 'setup', 'configure', 'define', 'write', 'generate'];
    for (const verb of actionVerbs) {
      if (spec.includes(verb)) {
        // Extract what comes after the verb as a requirement
        const verbIndex = spec.indexOf(verb);
        const afterVerb = spec.substring(verbIndex + verb.length).trim();
        const words = afterVerb.split(' ').slice(0, 5); // First 5 words after verb
        if (words.length > 0) {
          requirements.push(`${verb} ${words.join(' ')}`.replace(/\s+/g, ' ').trim());
        }
      }
    }

    // Ensure we have at least basic requirements
    if (requirements.length === 0) {
      requirements.push('Task implementation completed');
    }

    return [...new Set(requirements)]; // Remove duplicates
  }

  /**
   * Check if a specific requirement has been met
   */
  private checkRequirementMet(requirement: string, basePath: string, platformDetection: PlatformDetectionResult): boolean {
    const req = requirement.toLowerCase();

    // API/Route requirements
    if (req.includes('api') || req.includes('route') || req.includes('endpoint')) {
      const apiPaths = ['src/routes', 'src/api', 'src/controllers', 'routes', 'api', 'controllers'];
      return apiPaths.some(dir => fs.existsSync(path.join(basePath, dir)));
    }

    // Model/Data requirements
    if (req.includes('model') || req.includes('data') || req.includes('class')) {
      const modelPaths = ['src/models', 'src/types', 'models', 'types'];
      return modelPaths.some(dir => fs.existsSync(path.join(basePath, dir)));
    }

    // Database requirements
    if (req.includes('database') || req.includes('schema') || req.includes('db')) {
      const dbFiles = ['schema.json', 'database.json', 'db-schema.json', 'specs/schema.json', 'specs/database.json'];
      return dbFiles.some(file => fs.existsSync(path.join(basePath, file)));
    }

    // Test requirements
    if (req.includes('test')) {
      const testPaths = ['tests', '__tests__', 'src/__tests__'];
      return testPaths.some(dir => fs.existsSync(path.join(basePath, dir)));
    }

    // UI/Component requirements
    if (req.includes('ui') || req.includes('component') || req.includes('screen')) {
      const uiPaths = ['src/components', 'src/screens', 'components', 'screens'];
      return uiPaths.some(dir => fs.existsSync(path.join(basePath, dir)));
    }

    // Auth/Security requirements
    if (req.includes('auth') || req.includes('security') || req.includes('login')) {
      const authPaths = ['src/auth', 'src/security', 'auth', 'security'];
      return authPaths.some(dir => fs.existsSync(path.join(basePath, dir)));
    }

    // Directory structure requirements
    if (req.includes('structure') || req.includes('directory') || req.includes('folder')) {
      const requiredDirs = ['src', 'tests', 'docs', 'config'];
      const missingDirs = requiredDirs.filter(dir => !fs.existsSync(path.join(basePath, dir)));
      return missingDirs.length === 0;
    }

    // Default: assume requirement is met if we can't verify it
    return true;
  }

  /**
   * Detect architecture pattern from spec and tasks
   */
  private async detectArchitecturePattern(specContent: string, tasksMarkdown: string): Promise<string> {
    // Try comprehensive detection
    const comprehensiveResult = await this.architectureDetector.detectComprehensive({
      specContent: specContent,
      planContent: tasksMarkdown,
      projectRoot: this.basePath
    });

    return comprehensiveResult.pattern;
  }

  /**
   * Check if task assumes architecture pattern that doesn't match detected pattern
   */
  private isArchitectureMismatch(task: any, taskDescription: string, architecturePattern: string, phaseNum: number): boolean {
    // Only check Phase 2 (most critical for architecture differences)
    if (phaseNum !== 2) {
      return false;
    }

    const taskLower = taskDescription.toLowerCase();
    const taskTitleLower = (task.title || '').toLowerCase();

    // Check for traditional backend assumptions
    const traditionalBackendKeywords = ['server-side service', 'server-side controller', 'rest api', 'api endpoint', 'express controller', 'fastapi route'];
    const hasTraditionalBackendKeywords = traditionalBackendKeywords.some(keyword => 
      taskLower.includes(keyword) || taskTitleLower.includes(keyword)
    );

    // If BaaS detected but task assumes traditional backend
    if (architecturePattern.startsWith('baas-') && hasTraditionalBackendKeywords) {
      return true;
    }

    // Check for BaaS assumptions
    const baasKeywords = ['firebase sdk', 'firestore', 'client-side service', 'client-side component', 'security rules'];
    const hasBaasKeywords = baasKeywords.some(keyword => 
      taskLower.includes(keyword) || taskTitleLower.includes(keyword)
    );

    // If traditional backend detected but task assumes BaaS
    if (architecturePattern === 'traditional-backend' && hasBaasKeywords && !taskLower.includes('client-side')) {
      return true;
    }

    return false;
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