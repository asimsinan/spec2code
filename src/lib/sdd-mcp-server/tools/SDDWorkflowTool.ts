/**
 * SDD Workflow Tool - Internal Tool Chainer
 * Inspired by MCP Tool Chainer, but chains tools within our SDD MCP server
 * Automatically executes: sdd_specify → sdd_plan → sdd_tasks → sdd_implement
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';


// Direct imports of all tools we need to chain
import { SDDSpecifyTool } from './SDDSpecifyTool.js';
import { SDDPlanTool } from './SDDPlanTool.js';
import { SDDTasksTool } from './SDDTasksTool.js';
import { SDDImplementTool } from './SDDImplementTool.js';
import { SDDArchitecturalValidator } from './SDDArchitecturalValidator.js';

export class SDDWorkflowTool {
  private projectRoot: string;
  private architecturalValidator: SDDArchitecturalValidator;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.architecturalValidator = new SDDArchitecturalValidator(projectRoot);
  }

  getToolDefinition(): Tool {
    return {
      name: 'sdd_workflow',
      description: `🚀 FULL SDD WORKFLOW EXECUTION (EXTERNAL CHAINING): Automatically executes complete SDD workflow from specification to implementation. This tool CALLS OTHER SDD TOOLS sequentially: sdd_specify → sdd_plan → sdd_tasks → sdd_implement. Single tool call handles entire project development.`,
      inputSchema: {
        type: 'object',
        properties: {
          description: {
            type: 'string',
            description: 'Feature description to build (e.g., "Build a user authentication system with login/register/password reset")'
          },
          start_phase: {
            type: 'number',
            description: 'Optional: Start from specific phase (1-4). Defaults to 1 (full workflow)',
            minimum: 1,
            maximum: 4,
            default: 1
          },
          auto_continue: {
            type: 'boolean',
            description: 'Automatically continue through all phases without stopping',
            default: true
          }
        },
        required: ['description']
      }
    };
  }

  async execute(input: any): Promise<any> {
    const { description, start_phase = 1, auto_continue = true } = input;
    const results = {
      success: false,
      completed_phases: [],
      errors: [],
      progress: {
        current_phase: start_phase,
        total_phases: 4,
        completed_tasks: 0,
        total_tasks: 33
      }
    };

    try {
      // Phase 1: Specification
      if (start_phase <= 1) {
        const specResult = await this.callInternalTool('sdd_specify', { description });

        if (!specResult.success) {
          results.errors.push({ phase: 1, error: specResult.error || 'Specification failed' });
          return { ...results, success: false, error: results.errors[0].error };
        }

        results.completed_phases.push(1);
        results.progress.current_phase = 2;
      }

      // Phase 2: Planning
      if (start_phase <= 2) {
        const planResult = await this.callInternalTool('sdd_plan', {});

        if (!planResult.success) {
          results.errors.push({ phase: 2, error: planResult.error || 'Planning failed' });
          return { ...results, success: false, error: results.errors[0].error };
        }

        results.completed_phases.push(2);
        results.progress.current_phase = 3;
      }

      // Phase 3: Task Breakdown (All 4 phases)
      if (start_phase <= 3) {
        for (let phase = 1; phase <= 4; phase++) {
          const tasksResult = await this.callInternalTool('sdd_tasks', { phase });

          if (!tasksResult.success) {
            results.errors.push({
              phase: 3,
              sub_phase: phase,
              error: tasksResult.error || `Task generation failed for phase ${phase}`
            });
            return { ...results, success: false, error: results.errors[0].error };
          }
        }

        results.completed_phases.push(3);
        results.progress.current_phase = 4;
      }

      // Phase 4: Implementation (All 4 phases)
      if (start_phase <= 4) {
        for (let phase = 1; phase <= 4; phase++) {
          const phaseInfo = this.getPhaseInfo(phase);
      

          // Execute each task individually in the phase
          for (let task = 1; task <= phaseInfo.taskCount; task++) {
           
            const taskResult = await this.callInternalTool('sdd_implement', {
              phase,
              task: task.toString().padStart(2, '0'),
              complete: true
            });

            if (!taskResult.success) {
              results.errors.push({
                phase: 4,
                sub_phase: phase,
                task,
                error: taskResult.error || `Task ${task} failed in phase ${phase}`
              });
              return { ...results, success: false, error: results.errors[0].error };
            }

            results.progress.completed_tasks += 1;
         
          }

          // 🛡️ CRITICAL: Validate architecture before marking phase complete
          // This prevents tunnel vision issues like missing API layers
          // Validate ALL phases to ensure complete architectural compliance
         const validationResult = await this.architecturalValidator.execute({ phase, strict_mode: true });

          if (!validationResult.can_proceed) {
            results.errors.push({
              phase: 4,
              sub_phase: phase,
              error: `Phase ${phase} architecture validation failed: ${validationResult.critical_gaps.length} critical gaps found`,
              validation_report: validationResult.report
            });
            return {
              ...results,
              success: false,
              error: `🚨 ARCHITECTURAL VALIDATION FAILED: Phase ${phase} has critical gaps that must be addressed`,
              validation_report: validationResult.report,
              critical_gaps: validationResult.critical_gaps
            };
          }

          
        }

        results.completed_phases.push(4);
      }

      // Success!
      results.success = true;
      results.progress.completed_tasks = 33;

      const successMessage = `
🎉 COMPLETE SDD WORKFLOW EXECUTION SUCCESSFUL!

✅ **Workflow Completed:**
- 📋 Specification: Generated detailed requirements
- 📝 Planning: Created comprehensive implementation plan
- 📋 Task Breakdown: Generated all 33 tasks across 4 phases
- ⚡ Implementation: Executed all tasks per phase (Phase 1: 9, Phase 2: 8, Phase 3: 9, Phase 4: 7)

✅ **Project Status:**
- Phases Completed: ${results.completed_phases.length}/4
- Tasks Completed: ${results.progress.completed_tasks}/33
- Feature: "${description}"

✅ **Deliverables Created:**
- specs/spec.md - Feature specification
- specs/plan.md - Implementation plan
- specs/phase[1-4]-tasks.md - Detailed task breakdowns
- Complete working implementation in project directory

🚀 **Ready for deployment and testing!**
      `;

      return {
        success: true,
        message: `${successMessage}

📈 WORKFLOW EXECUTION RESULTS:
WORKFLOW_RESULTS: ${JSON.stringify(results, null, 2)}
DESCRIPTION: ${description}
COMPLETED_PHASES: ${JSON.stringify(results.completed_phases)}
TOTAL_TASKS_COMPLETED: ${results.progress.completed_tasks}

🎉 SDD WORKFLOW COMPLETED SUCCESSFULLY!`
      };

    } catch (error) {
      results.errors.push({
        phase: results.progress.current_phase,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        ...results,
        success: false,
        error: results.errors[0].error,
        message: `❌ SDD Workflow failed at Phase ${results.progress.current_phase}: ${results.errors[0].error}`
      };
    }
  }

  /**
   * Get phase information based on phase number
   */
  private getPhaseInfo(phase: number): any {
    const phases = {
      1: { taskCount: 9 },
      2: { taskCount: 8 },
      3: { taskCount: 9 },
      4: { taskCount: 7 }
    };

    return phases[phase as keyof typeof phases] || phases[1];
  }

  /**
   * Call another tool internally within the same MCP server
   * This is the key innovation - internal tool chaining!
   */
  private async callInternalTool(toolName: string, args: any): Promise<any> {
    try {
      let toolInstance: any;

      // Create tool instance based on name
      switch (toolName) {
        case 'sdd_specify':
          toolInstance = new SDDSpecifyTool(this.projectRoot);
          break;
        case 'sdd_plan':
          toolInstance = new SDDPlanTool(this.projectRoot);
          break;
        case 'sdd_tasks':
          toolInstance = new SDDTasksTool(this.projectRoot);
          break;
        case 'sdd_implement':
          toolInstance = new SDDImplementTool(this.projectRoot);
          break;
        default:
          throw new Error(`Tool ${toolName} not found`);
      }

      // Execute the tool
      const result = await toolInstance.execute(args);

      return result;

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
