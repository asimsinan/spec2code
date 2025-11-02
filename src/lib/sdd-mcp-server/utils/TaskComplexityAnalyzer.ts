/**
 * Task Complexity Analyzer - Analyzes individual task complexity from task details
 * 
 * Features:
 * - Task description analysis
 * - Requirements and acceptance criteria counting
 * - Verification complexity assessment
 * - Task type classification
 * - Complexity scoring
 */

export interface TaskComplexity {
  score: number; // 0-100 complexity score
  level: 'low' | 'medium' | 'high';
  descriptionLength: number;
  requirementsCount: number;
  acceptanceCriteriaCount: number;
  verificationCommandsCount: number;
  dependenciesCount: number;
  taskType: 'setup' | 'implementation' | 'integration' | 'testing' | 'documentation';
  estimatedMinutes: number; // Estimated time in minutes
  factors: string[];
}

export class TaskComplexityAnalyzer {
  /**
   * Analyze task complexity from task object
   */
  analyzeTask(task: any): TaskComplexity {
    const description = task.description || task.title || '';
    const descriptionLength = description.split(/\s+/).length;
    
    // Count requirements
    const requirements = task.requirements || task.requirement || '';
    const requirementsText = Array.isArray(requirements) ? requirements.join(' ') : requirements;
    const requirementsCount = this.countListItems(requirementsText) || this.countSentences(requirementsText);
    
    // Count acceptance criteria
    const acceptanceCriteria = task.acceptanceCriteria || task.acceptance_criteria || '';
    const acceptanceText = Array.isArray(acceptanceCriteria) ? acceptanceCriteria.join(' ') : acceptanceCriteria;
    const acceptanceCriteriaCount = this.countListItems(acceptanceText) || this.countSentences(acceptanceText);
    
    // Count verification commands
    const verification = task.verification || {};
    const commands = verification.commands || [];
    const verificationCommandsCount = Array.isArray(commands) ? commands.length : 0;
    
    // Count dependencies
    const dependencies = task.dependencies || [];
    const dependenciesCount = Array.isArray(dependencies) ? dependencies.length : 0;
    
    // Classify task type
    const taskType = this.classifyTaskType(description, task.title || '');
    
    // Calculate complexity score
    const score = this.calculateComplexityScore(
      descriptionLength,
      requirementsCount,
      acceptanceCriteriaCount,
      verificationCommandsCount,
      dependenciesCount,
      taskType,
      description
    );
    
    // Determine complexity level
    const level = score < 30 ? 'low' : score < 60 ? 'medium' : 'high';
    
    // Estimate minutes based on complexity and type
    const estimatedMinutes = this.estimateTaskMinutes(score, taskType, description);
    
    // Extract complexity factors
    const factors = this.extractComplexityFactors(description, requirementsText, acceptanceText, taskType);
    
    return {
      score,
      level,
      descriptionLength,
      requirementsCount,
      acceptanceCriteriaCount,
      verificationCommandsCount,
      dependenciesCount,
      taskType,
      estimatedMinutes,
      factors
    };
  }

  /**
   * Analyze multiple tasks and aggregate
   */
  analyzeTasks(tasks: any[]): {
    averageComplexity: number;
    totalEstimatedMinutes: number;
    taskTypeBreakdown: Record<string, number>;
    complexityDistribution: { low: number; medium: number; high: number };
  } {
    if (tasks.length === 0) {
      return {
        averageComplexity: 0,
        totalEstimatedMinutes: 0,
        taskTypeBreakdown: {},
        complexityDistribution: { low: 0, medium: 0, high: 0 }
      };
    }
    
    let totalScore = 0;
    let totalMinutes = 0;
    const taskTypeCounts: Record<string, number> = {};
    const complexityCounts = { low: 0, medium: 0, high: 0 };
    
    for (const task of tasks) {
      const analysis = this.analyzeTask(task);
      totalScore += analysis.score;
      totalMinutes += analysis.estimatedMinutes;
      taskTypeCounts[analysis.taskType] = (taskTypeCounts[analysis.taskType] || 0) + 1;
      complexityCounts[analysis.level]++;
    }
    
    return {
      averageComplexity: totalScore / tasks.length,
      totalEstimatedMinutes: totalMinutes,
      taskTypeBreakdown: taskTypeCounts,
      complexityDistribution: complexityCounts
    };
  }

  /**
   * Classify task type based on description and title
   */
  private classifyTaskType(description: string, title: string): 'setup' | 'implementation' | 'integration' | 'testing' | 'documentation' {
    const text = `${description} ${title}`.toLowerCase();
    
    // Setup/Foundation tasks
    if (text.match(/\b(setup|configure|install|initialize|create.*structure|foundation|environment|project structure)\b/)) {
      return 'setup';
    }
    
    // Testing tasks
    if (text.match(/\b(test|spec|verify|validate|qa|quality|assurance|coverage)\b/)) {
      return 'testing';
    }
    
    // Documentation tasks
    if (text.match(/\b(document|readme|guide|manual|tutorial|api.*doc)\b/)) {
      return 'documentation';
    }
    
    // Integration tasks
    if (text.match(/\b(integrate|api.*integration|connect|link|wire|hook up|service.*layer)\b/)) {
      return 'integration';
    }
    
    // Default: Implementation
    return 'implementation';
  }

  /**
   * Calculate complexity score (0-100)
   */
  private calculateComplexityScore(
    descriptionLength: number,
    requirementsCount: number,
    acceptanceCriteriaCount: number,
    verificationCommandsCount: number,
    dependenciesCount: number,
    taskType: string,
    description: string
  ): number {
    let score = 0;
    
    // Description length factor (0-20 points)
    if (descriptionLength < 20) score += 5;
    else if (descriptionLength < 50) score += 10;
    else if (descriptionLength < 100) score += 15;
    else score += 20;
    
    // Requirements count (0-20 points)
    score += Math.min(20, requirementsCount * 3);
    
    // Acceptance criteria count (0-15 points)
    score += Math.min(15, acceptanceCriteriaCount * 2.5);
    
    // Verification complexity (0-15 points)
    score += Math.min(15, verificationCommandsCount * 2);
    
    // Dependencies (0-10 points)
    score += Math.min(10, dependenciesCount * 3);
    
    // Task type complexity (0-10 points)
    const typeWeights: Record<string, number> = {
      'setup': 5,
      'implementation': 10,
      'integration': 8,
      'testing': 6,
      'documentation': 4
    };
    score += typeWeights[taskType] || 5;
    
    // Additional complexity indicators (0-10 points)
    const complexityKeywords = /\b(complex|advanced|comprehensive|multiple|various|several|all|complete)\b/gi;
    const complexityMatches = description.match(complexityKeywords);
    if (complexityMatches) {
      score += Math.min(10, complexityMatches.length * 2);
    }
    
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Estimate task duration in minutes
   */
  private estimateTaskMinutes(score: number, taskType: string, description: string): number {
    // Base minutes per task type
    const baseMinutes: Record<string, number> = {
      'setup': 20,
      'implementation': 45,
      'integration': 35,
      'testing': 25,
      'documentation': 20
    };
    
    let baseTime = baseMinutes[taskType] || 30;
    
    // Adjust based on complexity score
    // Score 0-30 (low): 0.8x base
    // Score 31-60 (medium): 1.0x base
    // Score 61-100 (high): 1.5x base
    let complexityMultiplier = 1.0;
    if (score < 30) complexityMultiplier = 0.8;
    else if (score > 60) complexityMultiplier = 1.5;
    
    // Additional adjustments from description
    let descriptionMultiplier = 1.0;
    if (description.match(/\b(all|complete|comprehensive|full|entire)\b/gi)) {
      descriptionMultiplier = 1.3; // "All" or "complete" suggests more work
    }
    if (description.match(/\b(quick|simple|basic|minimal)\b/gi)) {
      descriptionMultiplier = 0.7; // Simple suggests less work
    }
    
    return Math.ceil(baseTime * complexityMultiplier * descriptionMultiplier);
  }

  /**
   * Extract complexity factors
   */
  private extractComplexityFactors(
    description: string,
    requirements: string,
    acceptanceCriteria: string,
    taskType: string
  ): string[] {
    const factors: string[] = [];
    const text = `${description} ${requirements} ${acceptanceCriteria}`.toLowerCase();
    
    if (description.split(/\s+/).length > 100) factors.push('Long description');
    if (this.countListItems(requirements) > 5) factors.push('Many requirements');
    if (this.countListItems(acceptanceCriteria) > 5) factors.push('Many acceptance criteria');
    if (text.includes('all') || text.includes('complete') || text.includes('comprehensive')) factors.push('Comprehensive scope');
    if (text.includes('multiple') || text.includes('various') || text.includes('several')) factors.push('Multiple components');
    if (text.includes('integrate') || text.includes('connect') || text.includes('wire')) factors.push('Integration work');
    if (text.includes('test') || text.includes('verify') || text.includes('validate')) factors.push('Testing requirements');
    if (text.includes('complex') || text.includes('advanced')) factors.push('Complex logic');
    
    return factors;
  }

  /**
   * Count list items (bullets, numbers)
   */
  private countListItems(text: string): number {
    if (!text) return 0;
    const patterns = [
      /^[-*•]\s/gm, // Bullet points
      /^\d+\.\s/gm, // Numbered lists
      /^[a-z]\)\s/gm // Lettered lists
    ];
    
    let count = 0;
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) count += matches.length;
    }
    
    return count;
  }

  /**
   * Count sentences
   */
  private countSentences(text: string): number {
    if (!text) return 0;
    const sentences = text.match(/[^.!?]+[.!?]+/g);
    return sentences ? sentences.length : 1;
  }
}

