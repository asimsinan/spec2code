/**
 * SDD Tasks Tool - Generates comprehensive task breakdown
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { ProjectEstimator } from '../utils/ProjectEstimator.js';
import { TaskComplexityAnalyzer } from '../utils/TaskComplexityAnalyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class SDDTasksTool {

  private basePath: string;
  private projectEstimator: ProjectEstimator;


  constructor(basePath: string = process.cwd()) {
    this.basePath = path.resolve(basePath);
    this.projectEstimator = new ProjectEstimator();
  }

  getToolDefinition(): Tool {
    return {
      name: 'sdd_tasks',
      description: `🚀 AUTOMATIC PHASE GENERATION (INTERNAL CHAINING): Creates all 4 phase task files (33 tasks total) sequentially within ONE tool call. Call "/sdd_tasks" once → generates Phase 1 (9 tasks) → automatically continues to Phase 2 (8 tasks) → Phase 3 (9 tasks) → Phase 4 (7 tasks). ZERO manual intervention required. This tool chains internally - it does NOT call other SDD tools.`,
      inputSchema: {
        type: 'object',
        properties: {
          phase: {
            type: 'number',
            description: 'Optional: Specific phase number (1-4). If omitted, automatically determines next phase to generate. Tool provides continuation metadata for automatic sequential generation.',
            enum: [1, 2, 3, 4]
          }
        },
        required: []
      }
    };
  }

  async execute(input: any): Promise<any> {
    try {
      // Get phase number from input for continuation calls
      const requestedPhase = input?.phase; // No default - will determine next phase automatically
      
      // Read spec.md file
      const specPath = path.join(this.basePath, 'specs', 'spec.md');
      if (!fs.existsSync(specPath)) {
        return this.error('spec.md not found. Please create a specification first using sdd_specify tool.');
      }
      const specContent = fs.readFileSync(specPath, 'utf-8');
      
      // Read plan.md file
      const planPath = path.join(this.basePath, 'specs', 'plan.md');
      if (!fs.existsSync(planPath)) {
        return this.error('plan.md not found. Please create a plan first using sdd_plan tool.');
      }
      const planContent = fs.readFileSync(planPath, 'utf-8');

      // Determine which phase to generate next
      let phaseToGenerate: number;
      if (requestedPhase !== undefined) {
        // Explicit phase requested
        phaseToGenerate = requestedPhase;
      } else {
        // Find next phase that doesn't exist yet
        for (let phase = 1; phase <= 4; phase++) {
          const phaseFile = path.join(this.basePath, 'specs', `phase${phase}-tasks.md`);
          if (!fs.existsSync(phaseFile)) {
            phaseToGenerate = phase;
            break;
          }
        }
        // If all phases exist, default to phase 1 (allow regeneration)
        if (!phaseToGenerate) {
          phaseToGenerate = 1;
        }
      }

      // Get original universal tasks template from file
      const universalTasksTemplate = this.loadTasksTemplate();
      if (!universalTasksTemplate) {
        return this.error('Tasks template not found.');
      }
      
      // Extract platform from plan.md metadata (authoritative source)
      // plan.md should always have platform info since it's generated from spec
      let platformDetection = this.extractPlatformFromPlanMetadata(planContent);
      
      if (!platformDetection) {
        // Fallback to spec metadata if plan doesn't have it (shouldn't happen normally)
        platformDetection = this.extractPlatformFromSpecMetadata(specContent);
        if (platformDetection) {
          console.warn(`[SDDTasksTool] Platform not found in plan.md, using spec.md metadata as fallback`);
        } else {
          // Error if platform is missing from both plan.md and spec.md
          return this.error(
            'Platform information not found in plan.md or spec.md metadata. ' +
            'Please ensure plan.md contains platform information in the Metadata section. ' +
            'Run sdd_plan tool to regenerate plan.md if needed.'
          );
        }
      }
      
      // Extract architecture pattern from spec (prioritize metadata)
      const architecturePattern = this.extractArchitectureFromSpec(specContent);

      // Filter template to only include current phase
      const phaseKey = `phase${phaseToGenerate}`;
      const phaseTemplate = this.filterTemplateForPhase(universalTasksTemplate, phaseKey, phaseToGenerate);

      // Adapt tasks for architecture pattern (especially Phase 2)
      const adaptedPhaseTemplate = this.adaptTasksForArchitecture(phaseTemplate, architecturePattern, phaseToGenerate, platformDetection);

      // Apply platform-specific filtering to commands
      const filteredPhaseTemplate = this.filterCommandsByPlatform(adaptedPhaseTemplate, platformDetection);

      // Analyze task template complexity for duration estimation guidance
      let taskComplexitySummary = '';
      try {
        if (filteredPhaseTemplate?.tasks && Array.isArray(filteredPhaseTemplate.tasks) && filteredPhaseTemplate.tasks.length > 0) {
          const complexityAnalyzer = new TaskComplexityAnalyzer();
          const complexityAnalysis = complexityAnalyzer.analyzeTasks(filteredPhaseTemplate.tasks);
          
          // Format complexity summary for AI prompt
          const avgComplexity = Math.round(complexityAnalysis.averageComplexity);
          const complexityLevel = avgComplexity < 30 ? 'low' : avgComplexity < 60 ? 'medium' : 'high';
          const avgMinutes = Math.round(complexityAnalysis.totalEstimatedMinutes / filteredPhaseTemplate.tasks.length);
          
          taskComplexitySummary = `
**TASK COMPLEXITY ANALYSIS (Template-Based):**
- **Average Complexity Score**: ${avgComplexity}/100 (${complexityLevel})
- **Average Minutes per Task**: ~${avgMinutes} minutes
- **Task Type Breakdown**: ${Object.entries(complexityAnalysis.taskTypeBreakdown).map(([type, count]) => `${count} ${type}`).join(', ')}
- **Complexity Distribution**: ${complexityAnalysis.complexityDistribution.low} low, ${complexityAnalysis.complexityDistribution.medium} medium, ${complexityAnalysis.complexityDistribution.high} high
- **Total Estimated Minutes**: ${Math.round(complexityAnalysis.totalEstimatedMinutes)} minutes (~${Math.round(complexityAnalysis.totalEstimatedMinutes / 60)} hours)
`;
        }
      } catch (error) {
        console.warn('[SDDTasksTool] Failed to analyze task complexity:', error);
        // Continue without complexity summary
      }

      // phaseToGenerate is already determined above

      const phaseInfo = this.getPhaseInfo(phaseToGenerate);

      // Get minimal project analysis needed for phase estimates
      const scope = this.projectEstimator.analyzeProjectScope(specContent);
      const timeEstimate = this.projectEstimator.generateTimeEstimate(specContent);
      const aiTimeEstimate = this.projectEstimator.generateAITimeEstimate(specContent);

      // Calculate phase-specific PERT estimates (days for human, hours for AI)
      // Note: Tasks not yet generated, so we use defaults (task-level analysis available post-generation)
      const humanPhasePERT = await this.projectEstimator.calculatePhasePERTEstimates(timeEstimate.totalDuration, phaseToGenerate, false);
      const aiPhasePERT = await this.projectEstimator.calculatePhasePERTEstimates(aiTimeEstimate.totalDuration, phaseToGenerate, true);

      // Format durations for display using PERT weighted averages (consistent with PERT methodology)
      // Human estimates are in days, format as "X days" or "X weeks" or "X months"
      const humanPhaseDurationDays = humanPhasePERT.weightedAverage;
      const humanPhaseDuration = humanPhaseDurationDays < 7 
        ? `${humanPhaseDurationDays} day${humanPhaseDurationDays !== 1 ? 's' : ''}`
        : humanPhaseDurationDays < 30
        ? `${Math.ceil(humanPhaseDurationDays / 7)} week${Math.ceil(humanPhaseDurationDays / 7) !== 1 ? 's' : ''}`
        : `${Math.ceil(humanPhaseDurationDays / 30)} month${Math.ceil(humanPhaseDurationDays / 30) !== 1 ? 's' : ''}`;
      
      // AI estimates are in hours (AI is faster)
      const aiPhaseDuration = aiPhasePERT.weightedAverage <= 8 
        ? `${aiPhasePERT.weightedAverage} hour${aiPhasePERT.weightedAverage !== 1 ? 's' : ''}` 
        : `${Math.ceil(aiPhasePERT.weightedAverage / 8)} day${Math.ceil(aiPhasePERT.weightedAverage / 8) !== 1 ? 's' : ''}`;

      // Create simplified project context for phase
      const phaseEstimates = {
        totalDuration: timeEstimate.totalDuration,
        complexityLevel: timeEstimate.complexityLevel,
        scope: scope.size,
        featuresCount: scope.features,
        pagesCount: scope.pages,
        integrationsCount: scope.integrations,
        humanPhaseDuration: humanPhaseDuration,
        aiPhaseDuration: aiPhaseDuration,
        // PERT values for human estimates
        humanOptimistic: humanPhasePERT.optimistic,
        humanMostLikely: humanPhasePERT.mostLikely,
        humanPessimistic: humanPhasePERT.pessimistic,
        humanWeightedAverage: humanPhasePERT.weightedAverage,
        humanConfidenceIntervals: humanPhasePERT.confidenceIntervals,
        // PERT values for AI estimates (convert to hours, AI is faster)
        aiOptimistic: aiPhasePERT.optimistic,
        aiMostLikely: aiPhasePERT.mostLikely,
        aiPessimistic: aiPhasePERT.pessimistic,
        aiWeightedAverage: aiPhasePERT.weightedAverage,
        aiConfidenceIntervals: aiPhasePERT.confidenceIntervals
      };

      // Create success message for the specific phase
      const successMessage = `🚨🚨🚨 CRITICAL: YOU ARE GENERATING ONLY 1 PHASE, NOT 4! 🚨🚨🚨

📋 TASK: Create ${phaseInfo.filename} file in specs/ directory for ${phaseInfo.title}.

This call generates ONLY ${phaseInfo.taskCount} tasks (${phaseInfo.taskRange}) for Phase ${phaseToGenerate}.

- ONLY create ${phaseInfo.filename} in this tool call!

${phaseInfo.description}

Using AI-driven template data provided below:

📊 PHASE ${phaseToGenerate} DETAILS:
- **Platform**: ${platformDetection.platform} (${platformDetection.framework} + ${platformDetection.language})
- **Architecture Pattern**: ${architecturePattern}
- **Phase**: ${phaseInfo.title}
- **Tasks**: ${phaseInfo.taskCount} tasks (${phaseInfo.taskRange})
- **Detection Confidence**: ${platformDetection.confidence}%
- **Detected From**: ${platformDetection.detectedFrom.join(', ')}

${this.generateArchitectureGuidance(architecturePattern, phaseToGenerate)}

💡 PHASE ${phaseToGenerate} TASK ESTIMATES:

**Phase ${phaseToGenerate} Tasks Overview:**
- **Phase Title**: ${phaseInfo.title}
- **Tasks in Phase**: ${phaseInfo.taskCount} tasks
- **Task Range**: ${phaseInfo.taskRange}

**For This Phase (${phaseInfo.taskCount} tasks):**
- **Estimated Phase Duration**: ~${phaseEstimates.humanPhaseDuration} for human development
- **AI Time**: ~${phaseEstimates.aiPhaseDuration} for all ${phaseInfo.taskCount} tasks
- **Focus**: ${phaseInfo.description}

📋 PHASE ${phaseToGenerate} TEMPLATE (${phaseInfo.taskCount} tasks for THIS PHASE ONLY):
${JSON.stringify(filteredPhaseTemplate, null, 2)}

⚠️ THIS TEMPLATE CONTAINS ONLY ${phaseInfo.taskCount} TASKS (${phaseInfo.taskRange}) FOR PHASE ${phaseToGenerate}!
- These are the ONLY tasks you should generate
- Do NOT add tasks from other phases
- Generate these ${phaseInfo.taskCount} tasks ONLY

📋 FULL SPECIFICATION (spec.md):

${specContent}


📋 FULL IMPLEMENTATION PLAN (plan.md):

${planContent}


⚠️ **EXTRACT NECESSARY DATA**: The AI MUST read the full markdown files above and extract:
- Platform from spec.md and plan.md
- Key technologies and stack information
- Project structure and requirements
- Implementation phases and tasks structure

🚨 CRITICAL: GENERATE ONLY PHASE ${phaseToGenerate} (${phaseInfo.taskRange}):

You are generating ONE markdown file for this tool call:
- File: specs/${phaseInfo.filename} 
- Phase: ${phaseInfo.title}
- Tasks: ${phaseInfo.taskCount} tasks (${phaseInfo.taskRange})
- This is NOT all 4 phases - ONLY this phase!

📋 PHASE-SPECIFIC INSTRUCTIONS:

**YOU ARE ONLY GENERATING ${phaseInfo.taskCount} TASKS FOR THIS SINGLE FILE**: The phase template contains ${phaseInfo.taskCount} tasks (${phaseInfo.taskRange}) for Phase ${phaseToGenerate} ONLY.
- ONLY create ${phaseInfo.filename} with ${phaseInfo.taskCount} tasks

**REGENERATE CONTENT** based on the detected platform (${platformDetection.platform}) and specification, plan context:

**KEEP UNCHANGED:**
- Task numbers for this phase (${phaseInfo.taskRange})
- Task IDs and dependencies
- Parallelizable flags
- Overall structure and format

**REGENERATE FOLLOWING 10 sections BASED ON PROJECT and ITS PLATFORM:**
1. **TASK TITLES**: Keep "[TASK-XXX]" prefix with square brackets, regenerate the rest based on platform and project
   - Example: "[TASK-001] CONFIGURE NextJS E-commerce Platform Project Structure"

2. **DESCRIPTIONS**: Regenerate project-specific, detailed descriptions
   - Include platform-specific technologies, frameworks, and project domain details
   - Reference the specification and plan data for project-specific requirements

3. **ACCEPTANCE CRITERIA**: Regenerate measurable, project-specific criteria
   - Make them specific to the detected platform and project domain

4. **DURATION ESTIMATES**: Regenerate realistic estimates based on task complexity${taskComplexitySummary ? taskComplexitySummary : `
   - Use phase-specific defaults: Phase 1 (~30 min/task), Phase 2 (~55 min/task), Phase 3 (~45 min/task), Phase 4 (~25 min/task)
   - Adjust based on description length, requirements count, and acceptance criteria
   - Consider task type: Setup tasks are quicker, Implementation tasks take longer, Integration tasks vary`}

5. **LOC ESTIMATES**: Regenerate realistic code estimates

6. **VERIFICATION TYPES**: Regenerate platform-appropriate verification with anti-evasion rules
   - Web: "component_verification", "api_verification", "build_verification", "test_execution_verification", "coverage_verification"
   - Mobile: "screen_verification", "native_verification", "app_verification", "test_execution_verification", "coverage_verification"
   - Backend: "api_verification", "database_verification", "service_verification", "test_execution_verification", "coverage_verification"
   - **MANDATORY**: All verification types must include test execution proof and coverage validation

7. **ACTIONS**: Regenerate appropriate actions
   - "SHOW", "COMPILE", "TEST", "VERIFY", "EXECUTE"
   - **NEVER**: "SUDO", "CHOWN", "CHMOD" with elevated permissions
   - **TESTING ACTIONS**: "EXECUTE_TESTS", "VERIFY_COVERAGE", "RUN_INTEGRATION_TESTS", "RUN_E2E_TESTS"

8. **COMMANDS**: Regenerate ONLY platform and language-specific commands - STRICTLY FILTER by detected platform and language
   - **CRITICAL**: ONLY include commands for the DETECTED PLATFORM
   - **FORBIDDEN**: DO NOT include commands from other platforms
   - **VALIDATION**: Each command must be executable on the detected platform and language
   - **TypeScript Projects**: If using TypeScript, ensure Jest is configured for .ts files (add @types/jest, ts-jest preset, jest.config.js with TypeScript support)
   - NextJS/Web ONLY: "npm run build", "npm run dev", "npm test -- --coverage --coverageThreshold='{\"global\":{\"branches\":85,\"functions\":85,\"lines\":85,\"statements\":85}}'"
   - React Native ONLY: "npx react-native run-android", "npx react-native run-ios", "npm test -- --coverage --coverageThreshold='{\"global\":{\"branches\":85,\"functions\":85,\"lines\":85,\"statements\":85}}'"
   - Backend ONLY: "npm start", "npm test -- --coverage --coverageThreshold='{\"global\":{\"branches\":85,\"functions\":85,\"lines\":85,\"statements\":85}}'", "node server.js"
   - Desktop ONLY: "npm run build", "npm run dist", "npm test -- --coverage"
   - Python ONLY: "python -m pytest", "python -m mypy", "python app.py"
   - .NET ONLY: "dotnet build", "dotnet test", "dotnet run"
   - **PERMISSION-SAFE**: Only user-level commands, NO sudo/root commands
   - **TESTING COMMANDS**: Include real environment testing commands (TestContainers, real databases)
   - **COVERAGE COMMANDS**: Include coverage verification commands with 85% threshold
   - **ECHO COMMAND SAFETY (CRITICAL)**:
     * **AVOID CHAINING**: DO NOT create echo commands with more than 3 && operators in a single line
     * **NO EMOJIS IN ECHO**: DO NOT use emojis (✅, 📊, 🎯, etc.) inside echo quoted strings - they cause encoding issues
     * **SHORT COMMANDS**: Keep echo commands under 200 characters - long lines cause shell timeouts
     * **SEPARATE COMMANDS**: Instead of chaining many commands with &&, use separate command lines
     * **SIMPLE TEXT**: Use plain ASCII text in echo messages, avoid special Unicode characters
     * **QUOTE SAFETY**: Ensure all quotes are properly closed - no trailing extra quotes (e.g., echo "text!"" is INVALID)
     * **EXAMPLE GOOD**: echo "TASK-005 Verification:" or echo "API Integration Files:" (separate commands)
     * **EXAMPLE BAD**: cd X && echo "✅ TASK-005:" && echo "📊 Files:" && echo "..." (too many &&, emojis)

9. **EXPECTED STATES**: Regenerate platform-specific success criteria
   - Include platform name and project domain in success messages

10. **PROOF KEYWORDS**: Regenerate relevant keywords
    - Include platform, framework, and project domain keywords

**PLATFORM-SPECIFIC GUIDELINES**:
- **CRITICAL**: DETECTED PLATFORM = ${platformDetection.platform} using ${platformDetection.framework}
- **MANDATORY**: ALL content must be specific to ${platformDetection.platform}
- **FORBIDDEN**: Any mention or commands for other platforms (web/mobile/desktop/backend/python/dotnet/etc.)
- **VALIDATION**: If platform is mobile, only React Native/Expo commands allowed
- **VALIDATION**: If platform is web, only npm/Node.js commands allowed
- **VALIDATION**: If platform is backend, only appropriate backend commands allowed
- Generate content appropriate for this platform and framework
- Include platform-specific testing commands and verification methods
- **PENALTY**: Platform violations will cause task regeneration

**PROJECT DOMAIN**: Use the specification and plan data to make all content specific to the project domain

📝 MARKDOWN STRUCTURE FOR ${phaseInfo.filename}:
The file should follow this structure:

# 📋 ${phaseInfo.title}

## 📊 Metadata
- **Generated**: ${new Date().toISOString().split('T')[0]}
- **Platform**: ${platformDetection.platform}
- **Phase**: Phase ${phaseToGenerate}
- **Tasks**: ${phaseInfo.taskCount} tasks (${phaseInfo.taskRange})
- **Status**: in_progress

## 💡 Phase ${phaseToGenerate} Task Estimates

### Phase Overview
- **Phase**: Phase ${phaseToGenerate} - ${phaseInfo.title}
- **Tasks**: ${phaseInfo.taskCount} tasks (${phaseInfo.taskRange})
- **Estimated Duration**: ~${phaseEstimates.humanPhaseDuration} (human development)
- **AI Time**: ~${phaseEstimates.aiPhaseDuration} for all ${phaseInfo.taskCount} tasks
- **Focus**: ${phaseInfo.description}

### 📋 Implementation Tasks

[For each task in the provided phase template tasks array:]
### [task.id] [task.title]

#### Task Details
- **TDD Phase**: [task.tddPhase]
- **Sub Phase**: [task.subPhase]
- **Dependencies**: [task.dependencies.join(', ') if task.dependencies else 'None']
- **Parallelizable**: [task.parallelizable]

#### Description
[task.description]

#### Requirements
[task.requirements if exists, else generate from spec]

#### Acceptance Criteria
[task.acceptanceCriteria]

#### Estimates
- **Duration**: [task.estimatedDuration]
- **Lines of Code**: [task.estimatedLOC]

#### Verification
- **Type**: [task.verification.type]
- **Action**: [task.verification.action]
**Commands**:
[List all commands from task.verification.commands array verbatim, each on its own line without any markdown formatting, bullet points, or list markers. These are executable shell commands that must be copyable as-is]

⚠️ **ECHO COMMAND SAFETY RULES (MANDATORY WHEN GENERATING VERIFICATION COMMANDS)**:
- **MAXIMUM 3 && OPERATORS**: Do NOT chain more than 3 commands with && in a single line
- **NO EMOJIS**: Never include emojis (✅, 📊, 🎯, etc.) in echo command quoted strings
- **MAX 200 CHARACTERS**: Keep each command line under 200 characters to avoid timeouts
- **SEPARATE ECHO COMMANDS**: Generate separate echo commands instead of chaining many with &&
- **ASCII TEXT ONLY**: Use plain ASCII characters in echo messages, avoid Unicode/special characters
- **PROPER QUOTES**: Ensure quotes are properly closed with no trailing extra quotes
- **GOOD FORMAT**: One echo per line: echo "TASK-005 Verification:" (separate commands)
- **BAD FORMAT**: cd X && echo "✅ TASK-005:" && echo "📊 Files:" && echo "..." (too many &&, emojis, long line)

- **Expected State**: [task.verification.expectedState]
- **Mandatory**: [task.verification.mandatory]
- **Proof Required**: [task.verification.proofRequired if exists]

**Post-Verification Instructions**:
- On Success: [task.verification.postVerificationInstructions.onSuccess]
- On Failure: [task.verification.postVerificationInstructions.onFailure]
- Enforcement: [task.verification.postVerificationInstructions.enforcement]
- No Pause: [task.verification.postVerificationInstructions.noPause]
- Next Task: [task.verification.postVerificationInstructions.nextTask]

---

🎯 CRITICAL INSTRUCTIONS - GENERATE ${phaseInfo.taskCount} TASKS FOR THIS PHASE ONLY:

1. **ONLY THIS PHASE**: Generate ${phaseInfo.taskCount} tasks (${phaseInfo.taskRange}) for ${phaseInfo.filename} - NOT all 4 phases
2. **PHASE TEMPLATE**: Use the phase template which contains only ${phaseInfo.taskCount} tasks for this phase
3. **COMPLETE ${phaseInfo.taskCount} TASKS**: Generate all ${phaseInfo.taskCount} tasks with full details - do not stop early
4. **REALISTIC ESTIMATES**: Generate appropriate duration and LOC estimates based on task complexity
5. **PLATFORM-SPECIFIC**: Generate commands, tests, and verification appropriate for ${platformDetection.platform}/${platformDetection.framework}
6. **WEB PROJECTS**: ${phaseToGenerate === 1 ? 'TASK-002 must setup CSS framework' : phaseToGenerate === 3 ? 'TASK-001 must verify platform setup, TASK-008 must create all routes, TASK-004 must implement modern UI' : 'Follow platform-specific requirements'}
7. **TESTING**: Include platform-appropriate test commands with 85% coverage minimum

🚨 CRITICAL: Generate ALL ${phaseInfo.taskCount} tasks (${phaseInfo.taskRange}) for this phase.

Include these fields for EACH task:
- Task ID: TASK-[task number]
- Title: [Descriptive title based on platform and project]
- Description: [Detailed description]
- Requirements: [Specific requirements from spec]
- Acceptance Criteria: [Measurable criteria]
- Duration Estimate: [Realistic time estimate]
- LOC Estimate: [Lines of code estimate]
- Verification: [Commands, expected state, proof requirements]
- Dependencies: [Other task IDs if applicable]

8. CRITICAL: After creating the ${phaseInfo.filename} file, you MUST call sdd_tasks tool again with phase=${phaseToGenerate + 1} to generate the next phase file. Do not call the tool before you create the file. If phase is 4, do not call the tool again and stop.

Make a TOOL CALL with these EXACT parameters:
{
  "phase": ${phaseToGenerate + 1}
}
`;

        // Determine continuation action
        const hasMorePhases = phaseToGenerate < 4;

        const continuationAction = hasMorePhases ? {
          type: "automatic_continuation",
          next_tool_call: {
            name: "sdd_tasks",
            arguments: {
              phase: phaseToGenerate + 1
            }
          },
          reason: `Proceed to Phase ${phaseToGenerate + 1} after completing Phase ${phaseToGenerate}`
        } : null;

        return {
          success: true,
          nextStep: `${successMessage}

📊 PHASE GENERATION CONTEXT:
PHASE: ${phaseToGenerate}
PHASE_COMPLETED: Phase ${phaseToGenerate}
CONTINUATION_ACTION: ${continuationAction}
AUTO_PROGRESS: ${hasMorePhases}
PROGRESS_MESSAGE: ${hasMorePhases
  ? `Phase ${phaseToGenerate} ready for generation. Will automatically continue to Phase ${phaseToGenerate + 1}.`
  : `All 4 phases ready for generation.`}

INSTRUCTION: ${hasMorePhases
  ? `GENERATE Phase ${phaseToGenerate} (${phaseInfo.filename}) NOW. When complete, system will automatically proceed to Phase ${phaseToGenerate + 1}.`
  : `GENERATE Phase ${phaseToGenerate} (${phaseInfo.filename}) NOW. This is the final phase.`}

🎯 NEXT STEP: Generate the phase-${phaseToGenerate}-tasks.md file with all tasks for Phase ${phaseToGenerate}.`
        };
    } catch (error) {
      console.error('[sdd_tasks] ERROR:', error);
      return this.error(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }

  /**
   * Load tasks template from file
   */
  private loadTasksTemplate(): any {
    const templatesPath = path.join(__dirname, '..', 'templates', 'tasks.json');
    if (!fs.existsSync(templatesPath)) {
      throw new Error('Tasks template not found at: ' + templatesPath);
    }
    const templateContent = fs.readFileSync(templatesPath, 'utf-8');
    const template = JSON.parse(templateContent);
    const templateData = template.template_data; // Extract template_data from the JSON structure
    
    // Set current date if metadata.generated exists
    const currentDate = new Date().toISOString().split('T')[0];
    if (templateData.metadata && templateData.metadata.generated === '{{CURRENT_DATE}}') {
      templateData.metadata.generated = currentDate;
      }
    
    return templateData;
  }


  /**
   * Get phase information based on phase number
   */
  private getPhaseInfo(phase: number): any {
    const phases = {
      1: {
        filename: 'specs/phase1-tasks.md',
        title: 'Project Setup & Foundations',
        description: 'Setup tasks include project structure, dependencies, environment, API specifications, and database schema. Testing includes RED phase with failing tests.',
        taskCount: 9,
        taskRange: 'TASK-001 to TASK-009',
        taskNumbers: ['001', '002', '003', '004', '005', '006', '007', '008', '009']
      },
      2: {
        filename: 'specs/phase2-tasks.md',
        title: 'Core Implementation',
        description: 'Core implementation includes business logic, service layer, controllers, and integration testing. Focus on GREEN phase implementation and REFACTOR phase.',
        taskCount: 8,
        taskRange: 'TASK-001 to TASK-008',
        taskNumbers: ['001', '002', '003', '004', '005', '006', '007', '008']
      },
      3: {
        filename: 'specs/phase3-tasks.md',
        title: 'UI Development',
        description: 'UI development includes platform setup, design system, app structure, components, API service layer, and UI integration. Focus on modern, sophisticated UI design.',
        taskCount: 9,
        taskRange: 'TASK-001 to TASK-009',
        taskNumbers: ['001', '002', '003', '004', '005', '006', '007', '008', '009']
      },
      4: {
        filename: 'specs/phase4-tasks.md',
        title: 'Testing, Documentation & Deployment',
        description: 'Final phase includes comprehensive testing, documentation, performance/security refactoring, production build, deployment, and final verification.',
        taskCount: 7,
        taskRange: 'TASK-001 to TASK-007',
        taskNumbers: ['001', '002', '003', '004', '005', '006', '007']
      }
    };
    
    return phases[phase as keyof typeof phases] || phases[1];
  }

  /**
   * Filter template to include only the specific phase tasks
   */
  private filterTemplateForPhase(template: any, phaseKey: string, phaseNumber: number): any {
    if (!template.taskPhases || !template.taskPhases[phaseKey]) {
      return { tasks: [] }; // Return empty if phase not found
    }

    const phaseData = template.taskPhases[phaseKey];
    const phaseInfo = this.getPhaseInfo(phaseNumber);

    // Return only the current phase's tasks
    return {
      phase: phaseNumber,
      phaseTitle: phaseInfo.title,
      phaseDescription: phaseInfo.description,
      taskCount: phaseInfo.taskCount,
      taskRange: phaseInfo.taskRange,
      tasks: phaseData.tasks || []
    };
  }

  /**
   * Filter commands to only include those relevant to the detected platform
   */
  private filterCommandsByPlatform(phaseTemplate: any, platformDetection: any): any {
    const platform = platformDetection.platform || 'web';
    const framework = platformDetection.framework || '';

    // Create a copy to avoid modifying the original
    const filteredTemplate = JSON.parse(JSON.stringify(phaseTemplate));

    if (!filteredTemplate.tasks || !Array.isArray(filteredTemplate.tasks)) {
      return filteredTemplate;
    }

    // Replace command placeholders with platform-specific commands
    filteredTemplate.tasks = filteredTemplate.tasks.map((task: any) => {
      if (task.verification && task.verification.commands && Array.isArray(task.verification.commands)) {
        task.verification.commands = task.verification.commands.map((command: string) => {
          return this.replaceCommandPlaceholders(command, platform, framework);
        });
      }
      return task;
    });

    return filteredTemplate;
  }

  /**
   * Replace command placeholders with platform-specific commands
   */
  private replaceCommandPlaceholders(command: string, platform: string, _framework: string): string {
    const replacements: { [key: string]: { [key: string]: string } } = {
      '{{CREATE_APP_COMMAND}}': {
        'web': 'npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes',
        'mobile': 'npx create-expo-app@latest . --template blank --yes',
        'backend': 'echo "Backend app creation not automated - set up manually"',
        'desktop': 'npx create-electron-app@latest . --yes',
        'ai': 'echo "AI app creation not automated - set up manually"'
      },
      '{{BUILD_COMMAND}}': {
        'web': 'npm run build',
        'mobile': 'npx expo run:ios --no-build-cache',
        'backend': 'python -m py_compile src/**/*.py',
        'desktop': 'npm run build',
        'ai': 'npm run build'
      },
      '{{TEST_COMMAND}}': {
        'web': 'npm test',
        'mobile': 'npm test',
        'backend': 'python -m pytest tests/',
        'desktop': 'npm test',
        'ai': 'npm test'
      },
      '{{TEST_COVERAGE_COMMAND}}': {
        'web': 'npm run test:coverage',
        'mobile': 'npm run test:coverage',
        'backend': 'python -m pytest --cov=src tests/',
        'desktop': 'npm run test:coverage',
        'ai': 'npm run test:coverage'
      },
      '{{PRODUCTION_BUILD_COMMAND}}': {
        'web': 'npm run build --prod',
        'mobile': 'npx expo build:ios --type archive',
        'backend': 'python -m py_compile src/**/*.py',
        'desktop': 'npm run build --prod',
        'ai': 'npm run build --prod'
      },
      '{{PERFORMANCE_BENCHMARK_COMMAND}}': {
        'web': 'npm run benchmark',
        'mobile': 'npx expo run:ios --no-build-cache && echo "Performance benchmark completed"',
        'backend': 'python -m timeit -s "import sys; sys.path.insert(0, \'src\')" -r 10 "main()"',
        'desktop': 'npm run benchmark',
        'ai': 'npm run benchmark'
      },
      '{{DIRECTORY_LIST_COMMAND}}': {
        'web': 'find . -type d -name "src" -o -name "tests" -o -name "docs" -o -name "config" | sort',
        'mobile': 'find . -type d -name "src" -o -name "tests" -o -name "docs" -o -name "config" | sort',
        'backend': 'find . -type d -name "src" -o -name "tests" -o -name "docs" -o -name "config" | sort',
        'desktop': 'find . -type d -name "src" -o -name "tests" -o -name "docs" -o -name "config" | sort',
        'ai': 'find . -type d -name "src" -o -name "tests" -o -name "docs" -o -name "config" | sort'
      },
      '{{FILE_STRUCTURE_COMMAND}}': {
        'web': 'tree -L 3 || ls -la',
        'mobile': 'tree -L 3 || ls -la',
        'backend': 'tree -L 3 || ls -la',
        'desktop': 'tree -L 3 || ls -la',
        'ai': 'tree -L 3 || ls -la'
      },
      '{{PLATFORM_VERSION_COMMAND}}': {
        'web': 'node --version && npm --version',
        'mobile': 'node --version && npm --version && npx expo --version',
        'backend': 'python --version && pip --version',
        'desktop': 'node --version && npm --version',
        'ai': 'node --version && npm --version'
      },
      '{{DEPENDENCY_INSTALL_COMMAND}}': {
        'web': 'npm install',
        'mobile': 'npm install',
        'backend': 'pip install -r requirements.txt',
        'desktop': 'npm install',
        'ai': 'npm install'
      },
      '{{DEPENDENCY_LIST_COMMAND}}': {
        'web': 'npm list --depth=0',
        'mobile': 'npm list --depth=0',
        'backend': 'pip list',
        'desktop': 'npm list --depth=0',
        'ai': 'npm list --depth=0'
      },
      '{{TEST_PROCESS_NAME}}': {
        'web': 'npm',
        'mobile': 'npm',
        'backend': 'python',
        'desktop': 'npm',
        'ai': 'npm'
      },
      '{{START_SERVER_COMMAND}}': {
        'web': 'npm start',
        'mobile': 'npx expo start',
        'backend': 'python app.py',
        'desktop': 'npm start',
        'ai': 'npm start'
      }
    };

    // Replace all placeholders in the command
    let replacedCommand = command;
    for (const [placeholder, platformMap] of Object.entries(replacements)) {
      if (replacedCommand.includes(placeholder)) {
        const replacement = platformMap[platform] || platformMap['web']; // fallback to web if platform not found
        replacedCommand = replacedCommand.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
      }
    }

    return replacedCommand;
  }

  /**
   * Check if a command is relevant for the detected platform
   */
  private isCommandRelevantForPlatform(command: string, platform: string, framework: string): boolean {
    const cmd = command.toLowerCase().trim();

    // Always include commands that work across platforms (like generic setup commands)
    if (cmd.includes('find ') || cmd.includes('tree') || cmd.includes('ls') ||
        cmd.includes('node --version') || cmd.includes('npm --version') ||
        cmd.includes('show ') || cmd.includes('list ') || cmd.includes('confirm ')) {
      return true;
    }

    // Platform-specific filtering
    switch (platform) {
      case 'mobile':
        // Only React Native/Expo commands for mobile
        return cmd.includes('react-native') || cmd.includes('expo') ||
               cmd.includes('npx react-native') || cmd.includes('npx expo') ||
               (!cmd.includes('python') && !cmd.includes('dotnet') && !cmd.includes('mvn'));

      case 'web':
        // Only web/npm commands, no mobile/native commands
        return !cmd.includes('react-native') && !cmd.includes('expo') &&
               !cmd.includes('python') && !cmd.includes('dotnet') && !cmd.includes('mvn') &&
               !cmd.includes('android') && !cmd.includes('ios');

      case 'backend':
        // Backend commands, may include some Python/.NET if specified
        if (framework.includes('python') || cmd.includes('python')) {
          return cmd.includes('python') || cmd.includes('pip') || cmd.includes('pytest');
        }
        if (framework.includes('dotnet') || cmd.includes('dotnet')) {
          return cmd.includes('dotnet');
        }
        // Default to Node.js backend commands
        return !cmd.includes('python') && !cmd.includes('mvn') && !cmd.includes('react-native');

      case 'desktop':
        // Desktop/Electron commands
        return cmd.includes('electron') || cmd.includes('npm') || cmd.includes('build');

      default:
        // For unknown platforms, be permissive but filter out obvious mismatches
        return !cmd.includes('react-native') || platform === 'mobile';
    }
  }

  /**
   * Success response helper
   */
  private success(message: string, data?: any): any {
    return {
      success: true,
      nextStep: message,
      ...data
    };
  }

  /**
   * Extract platform from plan.md metadata (PRIMARY SOURCE - authoritative)
   * plan.md should always have platform info since it's generated from spec
   */
  private extractPlatformFromPlanMetadata(planContent: string): any | null {
    // Extract metadata section from plan.md
    const planMetadataMatch = planContent.match(/##\s*.*Metadata\n([\s\S]*?)(?=\n## |$)/i);
    if (!planMetadataMatch) {
      return null;
    }
    
    const metadataContent = planMetadataMatch[1];
    
    // Try different metadata formats
    // Format 1: - **Platform**: value
    let platformMatch = metadataContent.match(/-?\s*\*\*Platform\*\*[:\s]*([^\n]+)/i);
    // Format 2: Platform: value (no bold)
    if (!platformMatch) {
      platformMatch = metadataContent.match(/Platform[:\s]*([^\n]+)/i);
    }
    // Format 3: "platform": "value" (JSON-like)
    if (!platformMatch) {
      platformMatch = metadataContent.match(/["']platform["'][:\s]*["']([^"']+)["']/i);
    }
    
    if (!platformMatch) {
      return null;
    }
    
    const platform = platformMatch[1].trim().toLowerCase();
    
    // Extract framework and language from metadata
    let frameworkMatch = metadataContent.match(/-?\s*\*\*Framework\*\*[:\s]*([^\n]+)/i);
    if (!frameworkMatch) {
      frameworkMatch = metadataContent.match(/Framework[:\s]*([^\n]+)/i);
    }
    if (!frameworkMatch) {
      frameworkMatch = metadataContent.match(/["']framework["'][:\s]*["']([^"']+)["']/i);
    }
    
    let languageMatch = metadataContent.match(/-?\s*\*\*Language\*\*[:\s]*([^\n]+)/i);
    if (!languageMatch) {
      languageMatch = metadataContent.match(/Language[:\s]*([^\n]+)/i);
    }
    if (!languageMatch) {
      languageMatch = metadataContent.match(/["']language["'][:\s]*["']([^"']+)["']/i);
    }
    
    // Also check Technical Context section for platform details
    const techContextMatch = planContent.match(/##\s*.*Technical\s*Context[\s\S]*?Target\s*Platform[:\s]*([^\n]+)/i);
    if (techContextMatch && !platformMatch) {
      platformMatch = techContextMatch;
    }
    
    let framework = frameworkMatch ? frameworkMatch[1].trim().toLowerCase() : '';
    let language = languageMatch ? languageMatch[1].trim().toLowerCase() : '';
    
    // Map platform to detection engine format
    let mappedPlatform: string = platform;
    let mappedFramework: string = framework;
    let mappedLanguage: string = language;
    
    // Platform mapping logic
    if (platform.includes('ios') || platform.includes('swift')) {
      mappedPlatform = 'mobile';
      mappedFramework = framework || (platform.includes('swiftui') ? 'ios-native' : 'ios-native');
      mappedLanguage = language || 'swift';
    } else if (platform.includes('android')) {
      mappedPlatform = 'mobile';
      mappedFramework = framework || 'android-native';
      mappedLanguage = language || 'kotlin';
    } else if (platform.includes('react-native')) {
      mappedPlatform = 'mobile';
      mappedFramework = 'react-native';
      mappedLanguage = language || 'typescript';
    } else if (platform.includes('web') || platform.includes('next') || platform.includes('react')) {
      mappedPlatform = 'web';
      mappedFramework = framework || (platform.includes('next') ? 'nextjs' : 'react');
      mappedLanguage = language || 'typescript';
    } else if (platform.includes('backend') || platform.includes('server')) {
      mappedPlatform = 'backend';
      mappedFramework = framework || 'nodejs-express';
      mappedLanguage = language || 'typescript';
    } else if (platform.includes('desktop')) {
      mappedPlatform = 'desktop';
      mappedFramework = framework || 'electron';
      mappedLanguage = language || 'typescript';
    }
    
    // If framework/language still not found, try to infer from platform name
    if (!mappedFramework && platform) {
      if (platform.includes('next')) mappedFramework = 'nextjs';
      else if (platform.includes('express')) mappedFramework = 'nodejs-express';
      else if (platform.includes('django')) mappedFramework = 'python-django';
      else if (platform.includes('spring')) mappedFramework = 'java-spring';
    }
    
    return {
      platform: mappedPlatform as any,
      framework: mappedFramework as any,
      language: mappedLanguage as any,
      confidence: 98, // Very high confidence for plan.md (authoritative source)
      detectedFrom: ['plan-metadata'],
      topCandidates: [{ platform: mappedFramework, score: 98 }],
      detectionMethods: ['plan-metadata'],
      confidenceRange: { min: 95, max: 100 }
    };
  }

  /**
   * Extract platform from spec.md metadata (fallback only)
   */
  private extractPlatformFromSpecMetadata(specContent: string): any | null {
    const specMetadataMatch = specContent.match(/##\s*.*Metadata\n([\s\S]*?)(?=\n## |$)/i);
    if (!specMetadataMatch) {
      return null;
    }
    
    const metadataContent = specMetadataMatch[1];
    
    // Extract platform from metadata
    const platformMatch = metadataContent.match(/-?\s*\*\*Platform\*\*[:\s]*([^\n]+)/i);
    const frameworkMatch = metadataContent.match(/-?\s*\*\*Framework\*\*[:\s]*([^\n]+)/i);
    const languageMatch = metadataContent.match(/-?\s*\*\*Language\*\*[:\s]*([^\n]+)/i);
    
    if (!platformMatch) {
      return null;
    }
    
    const platform = platformMatch[1].trim().toLowerCase();
    let framework = frameworkMatch ? frameworkMatch[1].trim().toLowerCase() : '';
    let language = languageMatch ? languageMatch[1].trim().toLowerCase() : '';
    
    // Map platform to detection engine format (same logic as plan)
    let mappedPlatform: string = platform;
    let mappedFramework: string = framework;
    let mappedLanguage: string = language;
    
    if (platform.includes('ios') || platform.includes('swift')) {
      mappedPlatform = 'mobile';
      mappedFramework = framework || (platform.includes('swiftui') ? 'ios-native' : 'ios-native');
      mappedLanguage = language || 'swift';
    } else if (platform.includes('android')) {
      mappedPlatform = 'mobile';
      mappedFramework = framework || 'android-native';
      mappedLanguage = language || 'kotlin';
    } else if (platform.includes('react-native')) {
      mappedPlatform = 'mobile';
      mappedFramework = 'react-native';
      mappedLanguage = language || 'typescript';
    } else if (platform.includes('web') || platform.includes('next') || platform.includes('react')) {
      mappedPlatform = 'web';
      mappedFramework = framework || (platform.includes('next') ? 'nextjs' : 'react');
      mappedLanguage = language || 'typescript';
    }
    
    return {
      platform: mappedPlatform as any,
      framework: mappedFramework as any,
      language: mappedLanguage as any,
      confidence: 95,
      detectedFrom: ['spec-metadata'],
      topCandidates: [{ platform: mappedFramework, score: 95 }],
      detectionMethods: ['metadata'],
      confidenceRange: { min: 90, max: 100 }
    };
  }

  /**
   * Extract architecture pattern from spec content
   */
  private extractArchitectureFromSpec(specContent: string): string {
    // PRIORITY 1: Check metadata section for architecture pattern (most reliable)
    const metadataMatch = specContent.match(/##\s*.*Metadata\n([\s\S]*?)(?=\n## |$)/i);
    if (metadataMatch) {
      const metadataContent = metadataMatch[1];
      const archPatternMatch = metadataContent.match(/-?\s*\*\*Architecture\s*Pattern\*\*[:\s]*([^\n]+)/i);
      if (archPatternMatch) {
        const pattern = archPatternMatch[1].trim().toLowerCase();
     
        return pattern;
      }
    }

    // PRIORITY 2: Check architecture section
    const archSectionMatch = specContent.match(/##\s+Architecture[\s\S]*?###\s+Pattern\s*\n([a-z-]+)/i);
    if (archSectionMatch) {
      const pattern = archSectionMatch[1].toLowerCase();

      return pattern;
    }

    // PRIORITY 3: Check for keywords (fallback)
    const content = specContent.toLowerCase();
    if (content.includes('firebase')) {
    
      return 'baas-firebase';
    }
    if (content.includes('supabase')) {
  
      return 'baas-supabase';
    }
    if (content.includes('amplify') || content.includes('appsync')) {

      return 'baas-amplify';
    }
    if (content.includes('serverless') || content.includes('lambda')) {
   
      return 'serverless';
    }
    if (content.includes('express') || content.includes('fastapi') || content.includes('rest api')) {
      // Check if also has BaaS
      if (content.includes('firebase') || content.includes('supabase')) {
        
        return 'hybrid';
      }
 
      return 'traditional-backend';
    }
    return 'traditional-backend'; // Default
  }

  /**
   * Adapt tasks for architecture pattern
   * Especially important for Phase 2 (BaaS vs Traditional Backend)
   */
  private adaptTasksForArchitecture(
    phaseTemplate: any,
    architecturePattern: string,
    phaseNum: number,
    platformDetection: any
  ): any {
    // Only adapt Phase 2 for now (most critical difference)
    if (phaseNum === 2 && architecturePattern === 'baas-firebase') {
      return this.adaptPhase2ForFirebase(phaseTemplate, platformDetection);
    }

    // Return unchanged for other phases or patterns
    return phaseTemplate;
  }

  /**
   * Generate architecture-specific guidance for task generation
   */
  private generateArchitectureGuidance(architecturePattern: string, phaseNum: number): string {
    if (architecturePattern === 'baas-firebase') {
      if (phaseNum === 2) {
        return `🏗️ **ARCHITECTURE ADAPTATION: Firebase BaaS Detected**

⚠️ **CRITICAL**: Phase 2 tasks have been ADAPTED for Firebase BaaS architecture:
- **TASK-001**: Firebase SDK Integration (replaces Business Logic Layer)
- **TASK-002**: Client-Side Service Layer with Firebase SDK (replaces server-side Service Layer)
- **TASK-003**: Client-Side Controllers as React Native Components with Firebase Hooks (replaces server-side Controller Layer)

**ARCHITECTURE IMPLICATIONS**:
- Services are CLIENT-SIDE (React Native services using Firebase SDK)
- Controllers are CLIENT-SIDE components (React Native components act as controllers)
- Database operations via Firestore SDK (client-side)
- Security via Firebase Security Rules (configured in Firebase console, not code)
- NO server-side API layer required

**TASK GENERATION REQUIREMENTS**:
- Generate tasks that reference Firebase SDK, not server-side APIs
- Use client-side service patterns (services that use Firebase SDK directly)
- Use component patterns (React Native components with Firebase hooks)
- Include Firebase Security Rules configuration tasks
- Reference Firestore, Firebase Auth, Firebase Storage operations`;
      }
      return `🏗️ **ARCHITECTURE: Firebase BaaS Detected**
- Services are CLIENT-SIDE (using Firebase SDK)
- Controllers are CLIENT-SIDE components
- Database operations via Firestore SDK
- Security via Firebase Security Rules`;
    }

    if (architecturePattern === 'baas-supabase') {
      return `🏗️ **ARCHITECTURE: Supabase BaaS Detected**
- Services are CLIENT-SIDE (using Supabase client)
- Controllers are CLIENT-SIDE components
- Database operations via PostgREST (client-side)
- Security via Row Level Security (RLS) policies`;
    }

    if (architecturePattern === 'serverless') {
      return `🏗️ **ARCHITECTURE: Serverless Detected**
- Backend logic in serverless functions (Lambda, Cloud Functions)
- Services may be client-side or serverless
- Controllers are API Gateway endpoints or client-side`;
    }

    if (architecturePattern === 'hybrid') {
      return `🏗️ **ARCHITECTURE: Hybrid Detected**
- Mixed architecture patterns (e.g., BaaS + custom API)
- Adapt tasks based on which pattern applies to each task`;
    }

    // Traditional backend (default)
    return `🏗️ **ARCHITECTURE: Traditional Backend Detected**
- Services are SERVER-SIDE (Express/FastAPI/ASP.NET services)
- Controllers are SERVER-SIDE (REST API controllers)
- Database operations via server-side ORM/query builders
- Security via middleware/authentication libraries`;
  }

  /**
   * Adapt Phase 2 tasks for Firebase BaaS architecture
   */
  private adaptPhase2ForFirebase(phaseTemplate: any, platformDetection: any): any {
    if (!phaseTemplate.tasks || !Array.isArray(phaseTemplate.tasks)) {
      return phaseTemplate;
    }

    const adaptedTasks = phaseTemplate.tasks.map((task: any, index: number) => {
      // Transform TASK-001: Business Logic Layer → Firebase SDK Integration
      if (task.id === 'TASK-001') {
        return {
          ...task,
          title: '[TASK-001] INTEGRATE Firebase SDK: Configuration + Connection + Verification',
          description: `🚨 CRITICAL FIREBASE SDK INTEGRATION 🚨: INSTALL Firebase SDK dependencies (firebase package) AND CONFIGURE Firebase project connection using Firebase config file AND SETUP Firebase initialization in application entry point AND VERIFY Firebase connection with test read/write operation. EXECUTE installation and CONFIRM Firebase SDK is properly integrated. SHOW Firebase config file, initialization code, and successful connection verification. MANDATORY: Complete ALL Firebase SDK setup components - installation, configuration, initialization, and verification!`,
          acceptanceCriteria: 'Firebase SDK installed + Firebase config file created + Firebase initialization code added + connection verification test passes + Firebase project properly connected. Verify ALL 5 requirements before marking complete!',
          verification: {
            ...task.verification,
            commands: [
              'npm list firebase',
              'show Firebase config file location',
              'show Firebase initialization code',
              'run Firebase connection test',
              'verify Firebase connection successful',
              'CRITICAL: Verify ALL requirements from description are implemented (Firebase SDK setup)'
            ],
            expectedState: 'Firebase SDK integrated and connection verified successfully. MANDATORY: All requirements from description must be verified.'
          }
        };
      }

      // Transform TASK-002: Service Layer → Client-Side Service Layer with Firebase SDK
      if (task.id === 'TASK-002') {
        return {
          ...task,
          title: '[TASK-002] IMPLEMENT Client-Side Service Layer: Firebase SDK Integration + Tests + RED + GREEN + REFACTOR',
          description: `🚨 CRITICAL CLIENT-SIDE SERVICE LAYER IMPLEMENTATION 🚨: CREATE comprehensive tests for client-side service layer using Firebase SDK including Firestore operations, Authentication, and Storage operations. EXECUTE tests and CONFIRM they fail with RED status. IMPLEMENT client-side service layer with Firebase SDK integration including Firestore read/write operations, Authentication methods, and Storage upload/download. REFACTOR WITHOUT changing behavior: improve service boundaries, consolidate duplicate Firebase operations, simplify complex methods, and ensure proper separation of concerns. EXECUTE tests after refactoring and SHOW GREEN status. CONFIRM all client-side service layer functionality works correctly with Firebase SDK.`,
          acceptanceCriteria: 'Client-side service test files created + Firestore operations tested + Authentication covered + Storage operations included + tests fail as expected (RED) + client-side services implemented + Firestore operations working + Authentication functional + Storage operations operational + all tests pass (GREEN) + service boundaries improved + duplicate operations consolidated + complex methods simplified + proper separation of concerns + all tests still pass + service layer functionality verified. Verify ALL 16 requirements before marking complete!',
          verification: {
            ...task.verification,
            commands: [
              'show client-side service test files',
              'count test cases',
              'verify test coverage',
              'confirm tests fail initially',
              'run client-side service tests',
              'show RED status',
              'verify test failures',
              'confirm no test errors',
              'run client-side service tests after implementation',
              'show GREEN status',
              'verify Firestore operations',
              'confirm Authentication methods',
              'run all existing tests to confirm they still pass after refactoring',
              'show improved service boundaries',
              'show consolidated Firebase operations',
              'show simplified methods',
              'confirm separation of concerns',
              'run client-side service tests after refactoring',
              'show GREEN status',
              'verify all functionality',
              'confirm refactoring success',
              'CRITICAL: Verify ALL requirements from description are implemented'
            ],
            expectedState: 'Complete client-side service layer implemented with Firebase SDK, full TDD cycle, refactored, and verified. MANDATORY: All requirements from description must be verified.'
          }
        };
      }

      // Transform TASK-003: Controller Layer → Client-Side Controllers (React Native Components)
      if (task.id === 'TASK-003') {
        return {
          ...task,
          title: '[TASK-003] IMPLEMENT Client-Side Controllers: React Native Components with Firebase Hooks + Tests + RED + GREEN + REFACTOR',
          description: `🚨 CRITICAL CLIENT-SIDE CONTROLLER LAYER IMPLEMENTATION 🚨: CREATE comprehensive tests for client-side controller layer (React Native components) including component rendering, Firebase hook integration, and user interactions. EXECUTE tests and CONFIRM they fail with RED status. IMPLEMENT client-side controller components (React Native components) with Firebase hooks integration including data fetching, user interactions, and state management. REFACTOR WITHOUT changing behavior: improve component structure, consolidate duplicate logic, simplify complex components, and ensure proper integration with Firebase services. EXECUTE tests after refactoring and SHOW GREEN status. CONFIRM all controller components work correctly with Firebase SDK integration.`,
          acceptanceCriteria: 'Component test files created + rendering tested + Firebase hooks covered + user interactions included + tests fail as expected (RED) + components implemented + rendering working + Firebase hooks functional + user interactions operational + all tests pass (GREEN) + component structure improved + duplicate logic consolidated + complex components simplified + proper Firebase service integration + all tests still pass + controller functionality verified. Verify ALL 16 requirements before marking complete!',
          verification: {
            ...task.verification,
            commands: [
              'show component test files',
              'count test cases',
              'verify test coverage',
              'confirm tests fail initially',
              'run component tests',
              'show RED status',
              'verify test failures',
              'confirm no test errors',
              'run component tests after implementation',
              'show GREEN status',
              'verify component rendering',
              'confirm Firebase hooks integration',
              'run all existing tests to confirm they still pass after refactoring',
              'show improved component structure',
              'show consolidated logic',
              'show simplified components',
              'confirm Firebase service integration',
              'run component tests after refactoring',
              'show GREEN status',
              'verify all functionality',
              'confirm refactoring success',
              'CRITICAL: Verify ALL requirements from description are implemented'
            ],
            expectedState: 'Complete client-side controller layer (components) implemented with Firebase hooks, full TDD cycle, refactored, and verified. MANDATORY: All requirements from description must be verified.'
          }
        };
      }

      // Add new task TASK-004: Firebase Security Rules (if not exists, insert after TASK-003)
      // For now, we'll keep existing tasks but adapt them. Security Rules can be added later.

      // Return other tasks as-is (they might be adapted further if needed)
      return task;
    });

    return {
      ...phaseTemplate,
      tasks: adaptedTasks
    };
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

