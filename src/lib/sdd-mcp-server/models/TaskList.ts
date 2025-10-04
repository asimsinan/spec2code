import { z } from "zod";

/**
 * Task list model with TDD ordering and dependencies
 */
export const TaskDependencySchema = z.object({
  taskId: z.string(),
  dependsOn: z.array(z.string()).default([]),
  canRunInParallel: z.boolean().default(false)
});

export const TaskSchema = z.object({
  id: z.string(),
  phase: z.string(),
  title: z.string(),
  description: z.string(),
  tddOrder: z.enum(['Contract', 'Integration', 'E2E', 'Unit', 'Implementation']),
  priority: z.number().min(1).max(5).default(3),
  estimatedDuration: z.string().optional(),
  dependencies: TaskDependencySchema,
  completed: z.boolean().default(false),
  completedAt: z.string().optional(),
  assignedTo: z.string().optional(),
  tags: z.array(z.string()).default([])
});

export const PhaseSchema = z.object({
  name: z.string(),
  description: z.string(),
  tasks: z.array(TaskSchema),
  canRunInParallel: z.boolean().default(false),
  estimatedDuration: z.string().optional()
});

export const DefinitionOfDoneSchema = z.object({
  codeWrittenAndReviewed: z.boolean().default(false),
  allTestsPass: z.boolean().default(false),
  documentationUpdated: z.boolean().default(false),
  noLintingErrors: z.boolean().default(false),
  constitutionalComplianceVerified: z.boolean().default(false)
});

export const TaskListSchema = z.object({
  // Header information
  featureName: z.string(),
  generatedFrom: z.string(),
  tddOrder: z.array(z.string()).default(['Contract', 'Integration', 'E2E', 'Unit', 'Implementation']),
  
  // Phases and tasks
  phases: z.array(PhaseSchema).min(1, "At least one phase is required"),
  
  // Dependencies
  taskDependencies: z.array(TaskDependencySchema),
  
  // Definition of done
  definitionOfDone: DefinitionOfDoneSchema,
  
  // Metadata
  tasksPath: z.string().optional(),
  lastModified: z.string().optional(),
  version: z.string().default("1.0.0")
});

export type TaskDependency = z.infer<typeof TaskDependencySchema>;
export type Task = z.infer<typeof TaskSchema>;
export type Phase = z.infer<typeof PhaseSchema>;
export type DefinitionOfDone = z.infer<typeof DefinitionOfDoneSchema>;
export type TaskList = z.infer<typeof TaskListSchema>;

/**
 * Helper functions for TaskList operations
 */
export class TaskListHelper {
  /**
   * Create a new TaskList from ImplementationPlan with plan estimates
   */
  static createFromPlan(plan: any, planEstimates?: any): Partial<TaskList> {
    // const now = new Date().toISOString().split('T')[0]; // Unused variable
    
    // Parse the plan's implementation phases and generate tasks based on them
    const phases = plan.implementationPhases?.map((phase: any, phaseIndex: number) => {
      // Extract tasks from the phase tasks array (these are actual task descriptions)
      const taskDescriptions = phase.tasks || [];
      
      // Generate tasks based on the task descriptions found in the plan
      const tasks = taskDescriptions.map((taskDescription: string, taskIndex: number) => {
        const globalTaskIndex = phaseIndex * 10 + taskIndex + 1; // Simple numbering scheme
        const taskId = `task-${globalTaskIndex}`;
        
        // Generate task details based on the phase and task context
        const taskTitle = this.generateTaskTitle(phase.name, taskDescription, taskIndex);
        const tddOrder = this.determineTDDOrder(phase.name, taskIndex);
        const priority = this.determinePriority(phaseIndex, taskIndex);
        
        // Use plan estimates if available, otherwise fall back to default estimation
        const estimatedDuration = planEstimates 
          ? this.estimateDurationWithPlanEstimates(phase.name, taskDescription, planEstimates)
          : this.estimateDuration(phase.name, taskDescription);
        
        const tags = this.generateTags(phase.name, taskDescription);
        
        // Ensure test-first approach: every implementation task has a preceding failing test task
        const needsPrecedingTest = tddOrder === 'Implementation' && !this.hasPrecedingTest(phase.name, taskIndex);
        
        // Determine dependencies based on phase dependencies
        const dependsOn = phase.dependencies || [];
        const canRunInParallel = phase.canRunInParallel !== false;
        
        // Cap task size to ~200 LOC as required by SDD spec
        const cappedDescription = this.capTaskSize(taskDescription);
        
        // Mark parallelizable tasks with [P] as required by SDD spec
        const parallelTitle = canRunInParallel ? `${taskTitle} [P]` : taskTitle;
        
        // Add test-first warning if needed
        const finalDescription = needsPrecedingTest 
          ? `${cappedDescription}\n\n**TEST-FIRST REQUIRED**: This implementation task needs a preceding failing test task.`
          : cappedDescription;
        
        return {
          id: taskId,
          phase: phase.name,
          title: parallelTitle,
          description: finalDescription,
          tddOrder: tddOrder as 'Contract' | 'Integration' | 'E2E' | 'Unit' | 'Implementation',
          priority,
          estimatedDuration,
          dependencies: { 
            taskId, 
            dependsOn: dependsOn.filter((dep: string) => dep.startsWith('task-')), 
            canRunInParallel 
          },
          completed: false,
          tags
        };
      }) || [];

      return {
        name: phase.name,
        description: phase.description || `Phase ${phaseIndex + 1} implementation`,
        canRunInParallel: phase.canRunInParallel !== false,
        estimatedDuration: phase.estimatedDuration || '1-2 hours',
        tasks
      };
    }) || [];

    return {
      featureName: plan.featureName || 'Unnamed Feature',
      generatedFrom: plan.planPath || 'specs/plan.md',
      tddOrder: ['Contract', 'Integration', 'E2E', 'Unit', 'Implementation'],
      phases,
      taskDependencies: phases.flatMap((phase: any) => phase.tasks.map((task: any) => task.dependencies)),
      definitionOfDone: {
        codeWrittenAndReviewed: false,
        allTestsPass: false,
        documentationUpdated: false,
        noLintingErrors: false,
        constitutionalComplianceVerified: false
      },
      version: '1.0.0'
    };
  }

  /**
   * Generate task title based on phase and task context
   */
  private static generateTaskTitle(phaseName: string, taskDescription: string, _taskIndex: number): string {
    // Extract the first few words from the task description as the title
    const words = taskDescription.split(' ').slice(0, 4);
    return words.join(' ');
  }

  /**
   * Generate task description based on phase and task context
   */
  private static generateTaskDescription(phaseName: string, taskDescription: string, _taskIndex: number): string {
    // Use the actual task description from the plan
    return taskDescription;
  }

  /**
   * Determine TDD order based on phase and task context
   */
  private static determineTDDOrder(phaseName: string, _taskIndex: number): string {
    if (phaseName.toLowerCase().includes('contract')) return 'Contract';
    if (phaseName.toLowerCase().includes('test')) return 'Unit';
    if (phaseName.toLowerCase().includes('integration')) return 'Integration';
    if (phaseName.toLowerCase().includes('validation') || phaseName.toLowerCase().includes('e2e')) return 'E2E';
    return 'Implementation';
  }

  /**
   * Determine priority based on phase and task index
   */
  private static determinePriority(phaseIndex: number, _taskIndex: number): number {
    return Math.min(phaseIndex + 1, 5);
  }

  /**
   * Estimate duration based on comprehensive task analysis
   */
  private static estimateDuration(phaseName: string, taskDescription: string): string {
    // Base duration in hours
    let baseHours = 1;
    
    // Phase-based adjustments
    if (phaseName.toLowerCase().includes('contract')) {
      baseHours = 0.5; // Contract definition is usually quick
    } else if (phaseName.toLowerCase().includes('test')) {
      baseHours = 1.5; // Testing includes setup, writing, and execution
    } else if (phaseName.toLowerCase().includes('implementation')) {
      baseHours = 2.5; // Implementation is typically the most time-consuming
    } else if (phaseName.toLowerCase().includes('integration')) {
      baseHours = 2; // Integration can be complex
    } else if (phaseName.toLowerCase().includes('documentation')) {
      baseHours = 1; // Documentation is usually straightforward
    } else if (phaseName.toLowerCase().includes('validation')) {
      baseHours = 1; // Validation is typically quick
    }
    
    // Task complexity adjustments based on description
    const complexityKeywords = [
      { keywords: ['complex', 'advanced', 'sophisticated', 'comprehensive'], multiplier: 1.5 },
      { keywords: ['simple', 'basic', 'straightforward', 'minimal'], multiplier: 0.7 },
      { keywords: ['database', 'API', 'authentication', 'security'], multiplier: 1.3 },
      { keywords: ['UI', 'interface', 'frontend', 'component'], multiplier: 1.1 },
      { keywords: ['integration', 'third-party', 'external', 'service'], multiplier: 1.4 },
      { keywords: ['testing', 'unit test', 'integration test', 'e2e'], multiplier: 1.2 },
      { keywords: ['refactor', 'optimize', 'performance', 'scalability'], multiplier: 1.3 }
    ];
    
    let complexityMultiplier = 1.0;
    const lowerDescription = taskDescription.toLowerCase();
    
    complexityKeywords.forEach(({ keywords, multiplier }) => {
      if (keywords.some(keyword => lowerDescription.includes(keyword))) {
        complexityMultiplier *= multiplier;
      }
    });
    
    // Apply complexity multiplier
    const adjustedHours = baseHours * complexityMultiplier;
    
    // Convert to realistic time ranges
    if (adjustedHours <= 0.5) {
      return '30 minutes';
    } else if (adjustedHours <= 1) {
      return '1 hour';
    } else if (adjustedHours <= 1.5) {
      return '1-1.5 hours';
    } else if (adjustedHours <= 2) {
      return '1.5-2 hours';
    } else if (adjustedHours <= 3) {
      return '2-3 hours';
    } else if (adjustedHours <= 4) {
      return '3-4 hours';
    } else if (adjustedHours <= 6) {
      return '4-6 hours';
    } else if (adjustedHours <= 8) {
      return '6-8 hours';
    } else {
      return '1-2 days';
    }
  }

  /**
   * Estimate duration with plan estimates as baseline
   */
  private static estimateDurationWithPlanEstimates(phaseName: string, taskDescription: string, planEstimates: any): string {
    try {
      if (!planEstimates || !planEstimates.human) {
        // Fallback to default estimation if no plan estimates
        return this.estimateDuration(phaseName, taskDescription);
      }

      // Get base human estimate from plan
      const planHumanEstimate = planEstimates.human;
      const planAIEstimate = planEstimates.ai;

      // Calculate task-specific refinement factors
      const refinement = this.calculateTaskRefinement(taskDescription, phaseName);
      
      // Apply refinement to plan estimates
      const refinedHuman = this.applyTaskRefinement(planHumanEstimate, refinement);
      const refinedAI = this.applyTaskRefinement(planAIEstimate, refinement);

      // Return human estimate for now (AI estimate can be used separately)
      return refinedHuman;
    } catch (error) {
      console.error('Error estimating duration with plan estimates:', error);
      // Fallback to default estimation
      return this.estimateDuration(phaseName, taskDescription);
    }
  }

  /**
   * Calculate task-specific refinement factors
   */
  private static calculateTaskRefinement(taskDescription: string, phaseName: string): any {
    const lowerDescription = taskDescription.toLowerCase();
    let complexityMultiplier = 1.0;
    let aiMultiplier = 1.0;
    const factors = [];

    // Phase-based adjustments
    if (phaseName.toLowerCase().includes('contract')) {
      complexityMultiplier *= 0.7; // Contracts are usually simpler
      aiMultiplier *= 0.8;
      factors.push('contract_phase');
    } else if (phaseName.toLowerCase().includes('test')) {
      complexityMultiplier *= 1.2; // Testing can be complex
      aiMultiplier *= 1.1;
      factors.push('test_phase');
    } else if (phaseName.toLowerCase().includes('implementation')) {
      complexityMultiplier *= 1.3; // Implementation is most complex
      aiMultiplier *= 0.9;
      factors.push('implementation_phase');
    }

    // Task complexity keywords
    if (lowerDescription.includes('complex') || lowerDescription.includes('advanced')) {
      complexityMultiplier *= 1.4;
      factors.push('complex_task');
    }
    if (lowerDescription.includes('simple') || lowerDescription.includes('basic')) {
      complexityMultiplier *= 0.8;
      factors.push('simple_task');
    }
    if (lowerDescription.includes('integration') || lowerDescription.includes('third-party')) {
      complexityMultiplier *= 1.3;
      aiMultiplier *= 1.2;
      factors.push('integration_task');
    }
    if (lowerDescription.includes('api') || lowerDescription.includes('crud')) {
      complexityMultiplier *= 1.1;
      aiMultiplier *= 0.7; // AI excels at these
      factors.push('api_task');
    }

    return {
      complexityMultiplier,
      aiMultiplier,
      factors
    };
  }

  /**
   * Apply task refinement to estimates
   */
  private static applyTaskRefinement(baseEstimate: any, refinement: any): string {
    try {
      // Extract numeric value from estimate string
      const numericValue = this.extractNumericValue(baseEstimate);
      if (numericValue === 0) return baseEstimate;

      // Apply refinement
      const refinedValue = numericValue * refinement.complexityMultiplier;
      
      // Convert back to readable format
      return this.convertToReadableTime(refinedValue);
    } catch (error) {
      console.error('Error applying task refinement:', error);
      return baseEstimate;
    }
  }

  /**
   * Extract numeric value from time estimate string
   */
  private static extractNumericValue(estimate: string): number {
    if (typeof estimate !== 'string') return 0;
    
    // Extract hours from various formats
    const hourMatch = estimate.match(/(\d+(?:\.\d+)?)\s*hour/i);
    if (hourMatch) return parseFloat(hourMatch[1]);
    
    const dayMatch = estimate.match(/(\d+(?:\.\d+)?)\s*day/i);
    if (dayMatch) return parseFloat(dayMatch[1]) * 8; // 8 hours per day
    
    const weekMatch = estimate.match(/(\d+(?:\.\d+)?)\s*week/i);
    if (weekMatch) return parseFloat(weekMatch[1]) * 40; // 40 hours per week
    
    return 1; // Default 1 hour
  }

  /**
   * Convert numeric hours to readable time format
   */
  private static convertToReadableTime(hours: number): string {
    if (hours <= 0.5) return '30 minutes';
    if (hours <= 1) return '1 hour';
    if (hours <= 1.5) return '1-1.5 hours';
    if (hours <= 2) return '1.5-2 hours';
    if (hours <= 3) return '2-3 hours';
    if (hours <= 4) return '3-4 hours';
    if (hours <= 6) return '4-6 hours';
    if (hours <= 8) return '6-8 hours';
    if (hours <= 16) return '1-2 days';
    if (hours <= 24) return '2-3 days';
    return '1 week';
  }

  /**
   * Estimate AI-assisted duration based on task analysis
   */
  private static estimateAIDuration(phaseName: string, taskDescription: string): string {
    // Get human estimate first
    const humanEstimate = this.estimateDuration(phaseName, taskDescription);
    
    // Determine AI task type and multiplier
    const aiType = this.getAITaskType(taskDescription);
    const aiMultiplier = this.getAIMultiplier(aiType);
    
    // Add human guidance time (15-25% of original)
    const guidanceMultiplier = this.getGuidanceMultiplier(aiType);
    const totalMultiplier = aiMultiplier + guidanceMultiplier;
    
    // Convert human estimate to hours for calculation
    const humanHours = this.convertToHours(humanEstimate);
    const aiHours = humanHours * totalMultiplier;
    
    // Convert back to readable format
    return this.convertHoursToReadable(aiHours);
  }

  /**
   * Determine AI task type based on description
   */
  private static getAITaskType(description: string): string {
    const lower = description.toLowerCase();
    
    // AI excels at these (6-8x faster)
    if (lower.includes('crud') || lower.includes('api') || lower.includes('boilerplate') || 
        lower.includes('component') || lower.includes('form') || lower.includes('list')) {
      return 'ai_excels';
    }
    
    // AI good at these (4-5x faster)
    if (lower.includes('ui') || lower.includes('interface') || lower.includes('validation') || 
        lower.includes('routing') || lower.includes('display')) {
      return 'ai_good';
    }
    
    // AI needs help (2-3x faster)
    if (lower.includes('business') || lower.includes('logic') || lower.includes('algorithm') || 
        lower.includes('integration') || lower.includes('workflow')) {
      return 'ai_needs_help';
    }
    
    // AI struggles (1.5-2x faster)
    if (lower.includes('security') || lower.includes('architecture') || 
        lower.includes('performance') || lower.includes('optimization')) {
      return 'ai_struggles';
    }
    
    return 'ai_good'; // Default
  }

  /**
   * Get AI multiplier based on task type
   */
  private static getAIMultiplier(aiType: string): number {
    const multipliers = {
      'ai_excels': 0.15,      // 6-7x faster
      'ai_good': 0.2,         // 5x faster
      'ai_needs_help': 0.33,  // 3x faster
      'ai_struggles': 0.5     // 2x faster
    };
    return multipliers[aiType] || 0.2;
  }

  /**
   * Get guidance multiplier based on task type
   */
  private static getGuidanceMultiplier(aiType: string): number {
    const guidanceMultipliers = {
      'ai_excels': 0.15,      // 15% guidance time
      'ai_good': 0.15,        // 15% guidance time
      'ai_needs_help': 0.2,   // 20% guidance time
      'ai_struggles': 0.25    // 25% guidance time
    };
    return guidanceMultipliers[aiType] || 0.15;
  }

  /**
   * Convert time string to hours for calculation
   */
  private static convertToHours(timeString: string): number {
    if (timeString.includes('minutes')) {
      return parseInt(timeString) / 60;
    }
    if (timeString.includes('hour')) {
      const hours = parseInt(timeString);
      return isNaN(hours) ? 1 : hours;
    }
    if (timeString.includes('day')) {
      const days = parseInt(timeString);
      return isNaN(days) ? 8 : days * 8;
    }
    return 1; // Default 1 hour
  }

  /**
   * Convert hours to readable time format
   */
  private static convertHoursToReadable(hours: number): string {
    if (hours <= 0.5) {
      return '30 minutes';
    }
    if (hours <= 1) {
    return '1 hour';
    }
    if (hours <= 1.5) {
      return '1-1.5 hours';
    }
    if (hours <= 2) {
      return '1.5-2 hours';
    }
    if (hours <= 3) {
      return '2-3 hours';
    }
    if (hours <= 4) {
      return '3-4 hours';
    }
    if (hours <= 6) {
      return '4-6 hours';
    }
    if (hours <= 8) {
      return '6-8 hours';
    }
    if (hours <= 16) {
      return '1-2 days';
    }
    return '2-3 days';
  }

  /**
   * Generate tags based on phase and task context
   */
  private static generateTags(phaseName: string, _taskDescription: string): string[] {
    const tags = [];
    
    if (phaseName.toLowerCase().includes('contract')) tags.push('contract');
    if (phaseName.toLowerCase().includes('test')) tags.push('test');
    if (phaseName.toLowerCase().includes('implementation')) tags.push('implementation');
    if (phaseName.toLowerCase().includes('integration')) tags.push('integration');
    if (phaseName.toLowerCase().includes('documentation')) tags.push('documentation');
    if (phaseName.toLowerCase().includes('validation')) tags.push('validation');
    
    tags.push('feature');
    return tags;
  }

  /**
   * Cap task size to ~200 LOC as required by SDD spec
   */
  private static capTaskSize(description: string): string {
    // Estimate LOC based on description length and complexity
    const estimatedLOC = this.estimateLOCFromDescription(description);
    
    if (estimatedLOC > 200) {
      // Split large tasks into smaller ones
      const parts = this.splitLargeTask(description);
      return parts.join('\n\n---\n\n');
    }
    
    return description;
  }

  /**
   * Estimate LOC from task description
   */
  private static estimateLOCFromDescription(description: string): number {
    // Simple heuristic: ~5-10 LOC per word in description
    const words = description.split(/\s+/).length;
    const complexity = description.includes('complex') ? 1.5 : 1;
    return Math.floor(words * 7 * complexity);
  }

  /**
   * Split large tasks into smaller ones
   */
  private static splitLargeTask(description: string): string[] {
    // Simple splitting strategy - could be more sophisticated
    const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks = [];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      const testChunk = currentChunk + (currentChunk ? '. ' : '') + sentence.trim();
      if (this.estimateLOCFromDescription(testChunk) > 200) {
        if (currentChunk) {
          chunks.push(currentChunk + '.');
          currentChunk = sentence.trim();
        } else {
          chunks.push(sentence.trim());
        }
      } else {
        currentChunk = testChunk;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk + '.');
    }
    
    return chunks;
  }

  /**
   * Check if an implementation task has a preceding failing test task
   */
  private static hasPrecedingTest(phaseName: string, taskIndex: number): boolean {
    // Simple heuristic: if this is an implementation task, check if there are test tasks before it
    // In a real implementation, this would check the actual task list
    return phaseName.toLowerCase().includes('test') || taskIndex === 0;
  }

  /**
   * Get all tasks in TDD order
   */
  static getTasksInTDDOrder(taskList: TaskList): Task[] {
    const tddOrder = ['Contract', 'Integration', 'E2E', 'Unit', 'Implementation'];
    return taskList.phases
      .flatMap(phase => phase.tasks)
      .sort((a, b) => {
        const aIndex = tddOrder.indexOf(a.tddOrder);
        const bIndex = tddOrder.indexOf(b.tddOrder);
        return aIndex - bIndex;
      });
  }

  /**
   * Get parallelizable tasks
   */
  static getParallelizableTasks(taskList: TaskList): Task[] {
    return taskList.phases
      .flatMap(phase => phase.tasks)
      .filter(task => task.dependencies.canRunInParallel);
  }

  /**
   * Get next available tasks (dependencies satisfied)
   */
  static getNextAvailableTasks(taskList: TaskList, completedTaskIds: string[] = []): Task[] {
    return taskList.phases
      .flatMap(phase => phase.tasks)
      .filter(task => !task.completed && 
        task.dependencies.dependsOn.every(depId => completedTaskIds.includes(depId))
      );
  }

  /**
   * Calculate task list statistics
   */
  static calculateStatistics(taskList: TaskList): {
    totalTasks: number;
    completedTasks: number;
    remainingTasks: number;
    completionPercentage: number;
    parallelTasks: number;
  } {
    const allTasks = taskList.phases.flatMap(phase => phase.tasks);
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(task => task.completed).length;
    const remainingTasks = totalTasks - completedTasks;
    const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const parallelTasks = this.getParallelizableTasks(taskList).length;

    return {
      totalTasks,
      completedTasks,
      remainingTasks,
      completionPercentage,
      parallelTasks
    };
  }

  /**
   * Validate task dependencies
   */
  static validateDependencies(taskList: TaskList): {
    isValid: boolean;
    circularDependencies: string[];
    missingDependencies: string[];
  } {
    const allTasks = taskList.phases.flatMap(phase => phase.tasks);
    const taskIds = allTasks.map(task => task.id);
    const circularDependencies: string[] = [];
    const missingDependencies: string[] = [];

    // Check for missing dependencies
    allTasks.forEach(task => {
      task.dependencies.dependsOn.forEach(depId => {
        if (!taskIds.includes(depId)) {
          missingDependencies.push(`${task.id} -> ${depId}`);
        }
      });
    });

    // Check for circular dependencies (simplified check)
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (taskId: string): boolean => {
      if (recursionStack.has(taskId)) {
        circularDependencies.push(taskId);
        return true;
      }
      if (visited.has(taskId)) return false;

      visited.add(taskId);
      recursionStack.add(taskId);

      const task = allTasks.find(t => t.id === taskId);
      if (task) {
        for (const depId of task.dependencies.dependsOn) {
          if (hasCycle(depId)) return true;
        }
      }

      recursionStack.delete(taskId);
      return false;
    };

    taskIds.forEach(taskId => {
      if (!visited.has(taskId)) {
        hasCycle(taskId);
      }
    });

    return {
      isValid: circularDependencies.length === 0 && missingDependencies.length === 0,
      circularDependencies,
      missingDependencies
    };
  }
}
