/**
 * Markdown Task Parser for SDD Tasks
 * Robust parser that extracts phase-specific tasks from tasks.md file
 */

export interface Task {
  id: string;
  title: string;
  tddPhase?: string;
  subPhase?: string;
  dependencies: string[];
  description: string;
  requirements?: string;
  acceptanceCriteria?: string;
  estimatedLOC?: string;
  estimatedDuration?: string;
  verification: any;
  status?: string;
  constitutionalCompliance?: string;
  parallelizable?: boolean;
}

export interface PhaseTasks {
  title: string;
  description: string;
  tasks: Task[];
}

export class MarkdownTaskParser {
  /**
   * Parse tasks.md file and extract tasks for a specific phase
   */
  static parsePhaseTasks(markdownContent: string, phaseNumber: number): PhaseTasks | null {
    try {
      const lines = markdownContent.split('\n');
      const phaseSection = this.findPhaseSection(lines, phaseNumber);
      
      if (!phaseSection) {
        return null;
      }

      const tasks = this.extractTasksFromPhase(lines, phaseSection.startLine, phaseSection.endLine);
      
      return {
        title: phaseSection.title,
        description: phaseSection.description,
        tasks: tasks
      };
    } catch (error) {
      console.error('[MarkdownTaskParser] Error parsing phase tasks:', error);
      return null;
    }
  }

  /**
   * Find the section for a specific phase
   */
  private static findPhaseSection(lines: string[], phaseNumber: number): { startLine: number; endLine: number; title: string; description: string } | null {
    let phaseStartLine = -1;
    let phaseEndLine = lines.length;
    let phaseTitle = '';
    let phaseDescription = '';

    // Look for phase header (## Phase X: ...)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this is our target phase (supports both ## and ### formats)
      if (line.match(new RegExp(`^#{2,3} Phase ${phaseNumber}:`))) {
        phaseStartLine = i;
        phaseTitle = line.replace(/^#{2,3} /, '').trim();
        
        // Get description from next non-empty line
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].trim() && !lines[j].startsWith('###')) {
            phaseDescription = lines[j].trim();
            break;
          }
        }
        break;
      }
    }

    if (phaseStartLine === -1) {
      return null;
    }

    // Find the end of this phase (next ### header or end of file)
    for (let i = phaseStartLine + 1; i < lines.length; i++) {
      if (lines[i].match(/^#{2,3} Phase \d+:/) && !lines[i].match(new RegExp(`^#{2,3} Phase ${phaseNumber}:`))) {
        phaseEndLine = i;
        break;
      }
    }

    return {
      startLine: phaseStartLine,
      endLine: phaseEndLine,
      title: phaseTitle,
      description: phaseDescription
    };
  }

  /**
   * Extract tasks from a phase section
   */
  private static extractTasksFromPhase(lines: string[], startLine: number, endLine: number): Task[] {
    const tasks: Task[] = [];
    let currentTask: Partial<Task> | null = null;

    for (let i = startLine; i < endLine; i++) {
      const line = lines[i];

      // Check for task header (supports both ### and #### formats)
      const taskMatch = line.match(/^#{3,4} (TASK-\d+): (.+)$/);
      if (taskMatch) {
        // Save previous task if exists
        if (currentTask && currentTask.id) {
          tasks.push(currentTask as Task);
        }

        // Start new task
        currentTask = {
          id: taskMatch[1],
          title: taskMatch[2],
          dependencies: [],
          verification: null
        };
        continue;
      }

      // Parse task properties (handle both formats)
      if (currentTask) {
        if (line.startsWith('- **Description**:')) {
          currentTask.description = line.replace('- **Description**:', '').trim();
        } else if (line.startsWith('- **Requirements**:')) {
          currentTask.requirements = line.replace('- **Requirements**:', '').trim();
        } else if (line.startsWith('- **Dependencies**:')) {
          const deps = line.replace('- **Dependencies**:', '').trim();
          currentTask.dependencies = deps === 'None' ? [] : deps.split(',').map(d => d.trim());
        } else if (line.startsWith('- **Verification**:')) {
          currentTask.verification = line.replace('- **Verification**:', '').trim();
        } else if (line.startsWith('- **Status**:')) {
          currentTask.status = line.replace('- **Status**:', '').trim();
        } else if (line.startsWith('**TDD Phase**:')) {
          currentTask.tddPhase = line.replace('**TDD Phase**:', '').trim();
        } else if (line.startsWith('**Sub Phase**:')) {
          currentTask.subPhase = line.replace('**Sub Phase**:', '').trim();
        } else if (line.startsWith('**Estimated LOC**:')) {
          currentTask.estimatedLOC = line.replace('**Estimated LOC**:', '').trim();
        } else if (line.startsWith('**Estimated Duration**:')) {
          currentTask.estimatedDuration = line.replace('**Estimated Duration**:', '').trim();
        } else if (line.startsWith('**Description**:')) {
          // Get description from next line
          if (i + 1 < lines.length) {
            currentTask.description = lines[i + 1].trim();
            i++; // Skip the description line
          }
        } else if (line.startsWith('**Acceptance Criteria**:')) {
          // Get acceptance criteria from next line
          if (i + 1 < lines.length) {
            currentTask.acceptanceCriteria = lines[i + 1].trim();
            i++; // Skip the acceptance criteria line
          }
        } else if (line.startsWith('**Verification**:')) {
          // Parse verification section
          currentTask.verification = this.parseVerificationSection(lines, i);
        } else if (line.startsWith('**Constitutional Compliance**:')) {
          currentTask.constitutionalCompliance = line.replace('**Constitutional Compliance**:', '').trim();
        } else if (line.startsWith('**Parallelizable**:')) {
          const parallelizable = line.replace('**Parallelizable**:', '').trim();
          currentTask.parallelizable = parallelizable === 'Yes';
        }
      }
    }

    // Add the last task
    if (currentTask && currentTask.id) {
      tasks.push(currentTask as Task);
    }

    return tasks;
  }

  /**
   * Parse verification section
   */
  private static parseVerificationSection(lines: string[], startIndex: number): any {
    const verification: any = {};
    let i = startIndex + 1;

    while (i < lines.length && !lines[i].startsWith('**') && !lines[i].startsWith('---')) {
      const line = lines[i].trim();
      
      if (line.startsWith('- Type:')) {
        verification.type = line.replace('- Type:', '').trim();
      } else if (line.startsWith('- Action:')) {
        verification.action = line.replace('- Action:', '').trim();
      } else if (line.startsWith('- Expected State:')) {
        verification.expectedState = line.replace('- Expected State:', '').trim();
      } else if (line.startsWith('- Commands:')) {
        verification.commands = [];
        i++; // Move to next line
        while (i < lines.length && lines[i].startsWith('  `') && lines[i].endsWith('`')) {
          const cmd = lines[i].replace(/^  `|`$/g, '').trim();
          verification.commands.push(cmd);
          i++;
        }
        i--; // Adjust for the loop increment
      } else if (line.startsWith('- ')) {
        // Generic verification field
        const key = line.replace('- ', '').split(':')[0].trim();
        const value = line.split(':').slice(1).join(':').trim();
        verification[key] = value;
      }
      
      i++;
    }

    return Object.keys(verification).length > 0 ? verification : null;
  }

  /**
   * Get all phases from markdown content
   */
  static getAllPhases(markdownContent: string): { phase: number; title: string }[] {
    const phases: { phase: number; title: string }[] = [];
    const lines = markdownContent.split('\n');

    for (const line of lines) {
      const match = line.match(/^## Phase (\d+): (.+)$/);
      if (match) {
        phases.push({
          phase: parseInt(match[1]),
          title: match[2]
        });
      }
    }

    return phases;
  }
}
