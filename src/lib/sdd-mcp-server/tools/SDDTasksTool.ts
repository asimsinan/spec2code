/**
 * SDD Tasks Tool - Generates comprehensive task breakdown
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { PlatformDetectionEngine} from '../utils/PlatformDetectionEngine.js';
import { ProjectEstimator } from '../utils/ProjectEstimator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class SDDTasksTool {

  private basePath: string;
  private platformDetector: PlatformDetectionEngine;
  private projectEstimator: ProjectEstimator;

  constructor(basePath: string = process.cwd()) {
    this.basePath = path.resolve(basePath);
    this.platformDetector = new PlatformDetectionEngine();
    this.projectEstimator = new ProjectEstimator();
  }

  getToolDefinition(): Tool {
    return {
      name: 'sdd_tasks',
      description: 'Generate task breakdown from spec.md and plan.md files. Generates all 4 phase files sequentially. Call with no parameters to start with phase 1, then call again with phase=2, then phase=3, then phase=4 to generate all phases.',
      inputSchema: {
        type: 'object',
        properties: {
          phase: {
            type: 'number',
            description: 'Phase number (2-4) for continuation. Omit for phase 1. Used to generate subsequent phases after phase 1.',
            enum: [2, 3, 4]
          }
        },
        required: []
      }
    };
  }

  async execute(input: any): Promise<any> {       
    try {
      // Get phase number from input for continuation calls (like finalize pattern)
      const requestedPhase = input?.phase || 1; // Default to phase 1 if not specified
      
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

      // Get original universal tasks template from file
      const universalTasksTemplate = this.loadTasksTemplate();
      if (!universalTasksTemplate) {
        return this.error('Tasks template not found.');
      }
      
      // Filter template to only include current phase
      const phaseKey = `phase${requestedPhase}`;
      const phaseTemplate = this.filterTemplateForPhase(universalTasksTemplate, phaseKey, requestedPhase);
      
      // Get platform detection results using raw markdown content
      const platformDetection = await this.platformDetector.detectPlatform(
        { content: specContent }, 
        { content: planContent }
      );

      // Determine which phase to generate
      const phaseToGenerate = requestedPhase || 1; // Default to phase 1 if not specified

      const phaseInfo = this.getPhaseInfo(phaseToGenerate);
      
      // Get minimal project analysis needed for phase estimates
      const scope = this.projectEstimator.analyzeProjectScope(specContent);
      const timeEstimate = this.projectEstimator.generateTimeEstimate(specContent);
      const aiTimeEstimate = this.projectEstimator.generateAITimeEstimate(specContent);
      
      // Calculate phase-specific PERT estimates (days for human, hours for AI)
      const humanPhasePERT = this.projectEstimator.calculatePhasePERTEstimates(timeEstimate.totalDuration, phaseToGenerate, false);
      const aiPhasePERT = this.projectEstimator.calculatePhasePERTEstimates(aiTimeEstimate.totalDuration, phaseToGenerate, true);
      
      // Format durations for display
      const humanPhaseDuration = this.projectEstimator.calculatePhaseDuration(timeEstimate.totalDuration, phaseToGenerate);
      const aiPhaseDuration = aiPhasePERT.weightedAverage <= 8 ? `${aiPhasePERT.weightedAverage} hours` : `${Math.ceil(aiPhasePERT.weightedAverage / 8)} days`;
      
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
- **Phase**: ${phaseInfo.title}
- **Tasks**: ${phaseInfo.taskCount} tasks (${phaseInfo.taskRange})
- **Detection Confidence**: ${platformDetection.confidence}%
- **Detected From**: ${platformDetection.detectedFrom.join(', ')}

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
${JSON.stringify(phaseTemplate, null, 2)}

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

**REGENERATE BASED ON PLATFORM & PROJECT:**
1. **TASK TITLES**: Keep "[TASK-XXX]" prefix with square brackets, regenerate the rest based on platform and project
   - Example: "[TASK-001] CONFIGURE NextJS E-commerce Platform Project Structure"

2. **DESCRIPTIONS**: Generate project-specific, detailed descriptions
   - Include platform-specific technologies, frameworks, and project domain details
   - Reference the specification and plan data for project-specific requirements

3. **ACCEPTANCE CRITERIA**: Generate measurable, project-specific criteria
   - Make them specific to the detected platform and project domain

4. **DURATION ESTIMATES**: Generate realistic estimates based on task complexity
   - Setup tasks: 15-30min, Implementation tasks: 30-60min, Complex tasks: 60-120min

5. **LOC ESTIMATES**: Generate realistic code estimates
   - Simple tasks: 50-100 LOC, Medium tasks: 100-300 LOC, Complex tasks: 300-500 LOC

6. **VERIFICATION TYPES**: Generate platform-appropriate verification with anti-evasion rules
   - Web: "component_verification", "api_verification", "build_verification", "test_execution_verification", "coverage_verification"
   - Mobile: "screen_verification", "native_verification", "app_verification", "test_execution_verification", "coverage_verification"
   - Backend: "api_verification", "database_verification", "service_verification", "test_execution_verification", "coverage_verification"
   - **MANDATORY**: All verification types must include test execution proof and coverage validation

7. **ACTIONS**: Generate appropriate actions
   - "SHOW", "COMPILE", "TEST", "VERIFY", "EXECUTE"
   - **NEVER**: "SUDO", "CHOWN", "CHMOD" with elevated permissions
   - **TESTING ACTIONS**: "EXECUTE_TESTS", "VERIFY_COVERAGE", "RUN_INTEGRATION_TESTS", "RUN_E2E_TESTS"

8. **COMMANDS**: Generate platform-specific commands with testing intelligence
   - NextJS: "npm run build", "npm run dev", "npm test -- --coverage --coverageThreshold='{\"global\":{\"branches\":85,\"functions\":85,\"lines\":85,\"statements\":85}}'"
   - React Native: "npx react-native run-android", "npx react-native run-ios", "npm test -- --coverage --coverageThreshold='{\"global\":{\"branches\":85,\"functions\":85,\"lines\":85,\"statements\":85}}'"
   - Backend: "npm start", "npm test -- --coverage --coverageThreshold='{\"global\":{\"branches\":85,\"functions\":85,\"lines\":85,\"statements\":85}}'", "node server.js"
   - **PERMISSION-SAFE**: Only user-level commands, NO sudo/root commands
   - **TESTING COMMANDS**: Include real environment testing commands (TestContainers, real databases)
   - **COVERAGE COMMANDS**: Include coverage verification commands with 85% threshold

9. **EXPECTED STATES**: Generate platform-specific success criteria
   - Include platform name and project domain in success messages

10. **PROOF KEYWORDS**: Generate relevant keywords
    - Include platform, framework, and project domain keywords

**PLATFORM-SPECIFIC GUIDELINES**:
- Platform: ${platformDetection.platform} using ${platformDetection.framework}
- Generate content appropriate for this platform and framework
- Include platform-specific testing commands and verification methods

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
- **Commands**: [List all commands from task.verification.commands array, each on a new line with bullet point]
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
6. **WEB PROJECTS**: ${phaseToGenerate === 1 ? 'TASK-002 must setup CSS framework' : phaseToGenerate === 3 ? 'TASK-037 must verify, TASK-044 must create all routes, TASK-041 must implement modern UI' : 'Follow platform-specific requirements'}
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
}`;

        const outputData = {
          success: true,
          nextStep: successMessage
        };
        return outputData;
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
        taskCount: 18,
        taskRange: 'TASK-001 to TASK-018',
        taskNumbers: ['001', '002', '003', '004', '005', '006', '007', '008', '009', '010', '011', '012', '013', '014', '015', '016', '017', '018']
      },
      2: {
        filename: 'specs/phase2-tasks.md',
        title: 'Core Implementation',
        description: 'Core implementation includes business logic, service layer, controllers, and integration testing. Focus on GREEN phase implementation and REFACTOR phase.',
        taskCount: 18,
        taskRange: 'TASK-019 to TASK-036',
        taskNumbers: ['019', '020', '021', '022', '023', '024', '025', '026', '027', '028', '029', '030', '031', '032', '033', '034', '035', '036']
      },
      3: {
        filename: 'specs/phase3-tasks.md',
        title: 'UI Development',
        description: 'UI development includes platform setup, design system, app structure, components, API service layer, and UI integration. Focus on modern, sophisticated UI design.',
        taskCount: 18,
        taskRange: 'TASK-037 to TASK-054',
        taskNumbers: ['037', '038', '039', '040', '041', '042', '043', '044', '045', '046', '047', '048', '049', '050', '051', '052', '053', '054']
      },
      4: {
        filename: 'specs/phase4-tasks.md',
        title: 'Testing, Documentation & Deployment',
        description: 'Final phase includes comprehensive testing, documentation, performance/security refactoring, production build, deployment, and final verification.',
        taskCount: 18,
        taskRange: 'TASK-055 to TASK-072',
        taskNumbers: ['055', '056', '057', '058', '059', '060', '061', '062', '063', '064', '065', '066', '067', '068', '069', '070', '071', '072']
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
   * Error response helper
   */
  private error(message: string): any {
        return {
      success: false,
      error: message
    };
  }
}

