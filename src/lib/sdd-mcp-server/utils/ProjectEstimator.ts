/**
 * Project Estimator - Analyzes project complexity and generates realistic estimates
 * 
 * Features:
 * - Complexity analysis (low, medium, high)
 * - Scope analysis (features, pages, integrations)
 * - Human vs AI time estimates
 * - Team size recommendations
 * - Risk factor identification
 */

export interface ComplexityAnalysis {
  level: 'low' | 'medium' | 'high';
  factors: string[];
  score: number;
}

export interface ScopeAnalysis {
  size: 'small' | 'medium' | 'large';
  features: number;
  pages: number;
  integrations: number;
  score: number;
}

export interface TechnicalFactors {
  factors: string[];
  score: number;
}

export interface TeamAnalysis {
  teamSize: string;
  roles: Array<{ title: string; count: string; responsibilities: string }>;
  skills: string[];
  complexity: string;
}

export interface TimeEstimate {
  totalDuration: string;
  developmentTime: string;
  testingTime: string;
  complexityLevel: string;
  confidenceLevel: string;
  riskFactors: string[];
  assumptions: string[];
  // PERT-style estimates (SOTA)
  optimistic: number;
  pessimistic: number;
  mostLikely: number;
  weightedAverage: number;
  confidenceIntervals?: {
    p50: number; // 50th percentile
    p75: number; // 75th percentile
    p90: number; // 90th percentile
  };
}

export interface AITimeEstimate {
  totalDuration: string;
  developmentTime: string;
  testingTime: string;
  guidanceTime: string;
  reviewTime: string;
  savingsPercentage: number;
  confidenceRanges: any;
  calibrationAdjustments?: any;
}

/**
 * Project Estimator
 * Analyzes project specifications and generates realistic time, team, and resource estimates
 */
export class ProjectEstimator {
  /**
   * Analyze project complexity from specification content
   */
  analyzeProjectComplexity(specContent: string): ComplexityAnalysis {
    const factors: string[] = [];
    let score = 0;

    // Technical Architecture Complexity (0-20 points)
    if (specContent.includes('microservices') || specContent.includes('distributed')) {
      factors.push('Microservices Architecture');
      score += 8;
    }
    if (specContent.includes('enterprise') || specContent.includes('enterprise grade') || specContent.includes('high availability')) {
      factors.push('Enterprise Requirements');
      score += 6;
    }
    if (specContent.includes('API') || specContent.includes('REST') || specContent.includes('GraphQL')) {
      factors.push('API Development');
      score += 3;
    }
    if (specContent.includes('database') || specContent.includes('SQL') || specContent.includes('PostgreSQL')) {
      factors.push('Database Integration');
      score += 2;
    }
    if (specContent.includes('real-time') || specContent.includes('WebSocket') || specContent.includes('socket')) {
      factors.push('Real-time Features');
      score += 4;
    }

    // Security & Authentication Complexity (0-15 points)
    if (specContent.includes('authentication') || specContent.includes('auth') || specContent.includes('login')) {
      factors.push('Authentication System');
      score += 3;
    }
    if (specContent.includes('encryption') || specContent.includes('encrypted') || specContent.includes('security')) {
      factors.push('Security Requirements');
      score += 2;
    }
    if (specContent.includes('authorization') || specContent.includes('permissions') || specContent.includes('roles')) {
      factors.push('Authorization System');
      score += 2;
    }

    // Data & Integration Complexity (0-10 points)
    if (specContent.includes('third-party') || specContent.includes('external') || specContent.includes('integration')) {
      factors.push('Third-party Integrations');
      score += 3;
    }
    if (specContent.includes('export') || specContent.includes('import') || specContent.includes('data migration')) {
      factors.push('Data Export/Import');
      score += 2;
    }

    // Determine complexity level
    let level: 'low' | 'medium' | 'high' = 'low';
    if (score >= 20) level = 'high';
    else if (score >= 10) level = 'medium';

    return { level, factors, score };
  }

  /**
   * Analyze project scope from specification content
   */
  analyzeProjectScope(specContent: string): ScopeAnalysis {
    const features = this.countFeatures(specContent);
    const pages = this.countPages(specContent);
    const integrations = this.countIntegrations(specContent);

    let score = features * 2 + pages + integrations * 3;

    let size: 'small' | 'medium' | 'large' = 'medium';
    if (score >= 30) size = 'large';
    else if (score <= 10) size = 'small';

    return { size, features, pages, integrations, score };
  }

  /**
   * Analyze technical factors that affect development time
   */
  analyzeTechnicalFactors(specContent: string): TechnicalFactors {
    const factors: string[] = [];
    let score = 0;

    // Technology Stack Complexity
    if (specContent.includes('TypeScript') || specContent.includes('React') || specContent.includes('Node.js')) {
      factors.push('Modern Tech Stack');
      score += 1; // Positive - well-documented
    }
    if (specContent.includes('legacy') || specContent.includes('old') || specContent.includes('deprecated')) {
      factors.push('Legacy System Integration');
      score += 3; // Negative - more complex
    }
    if (specContent.includes('responsive') || specContent.includes('mobile') || specContent.includes('tablet')) {
      factors.push('Multi-device Support');
      score += 2; // Additional complexity
    }

    return { factors, score };
  }

  /**
   * Generate team analysis based on project complexity
   */
  generateTeamAnalysis(specContent: string): TeamAnalysis {
    const complexity = this.analyzeProjectComplexity(specContent);

    // Determine team size based on complexity
    let teamSize = '2-3';
    let roles: Array<{ title: string; count: string; responsibilities: string }> = [
      { title: 'Full-Stack Developer', count: '1', responsibilities: 'Core development, API, and frontend integration' },
      { title: 'Frontend Developer', count: '1', responsibilities: 'UI/UX implementation and user interface' }
    ];

    if (complexity.level === 'high') {
      teamSize = '4-5';
      roles = [
        { title: 'Backend Developer', count: '1', responsibilities: 'API development, database design, and server logic' },
        { title: 'Frontend Developer', count: '1', responsibilities: 'UI/UX implementation and user interface' },
        { title: 'Full-Stack Developer', count: '1', responsibilities: 'Integration, testing, and deployment' },
        { title: 'DevOps Engineer', count: '0.5', responsibilities: 'Infrastructure, CI/CD, and monitoring' }
      ];
    } else if (complexity.level === 'medium') {
      teamSize = '3-4';
      roles = [
        { title: 'Backend Developer', count: '1', responsibilities: 'API development and database design' },
        { title: 'Frontend Developer', count: '1', responsibilities: 'UI/UX implementation' },
        { title: 'Full-Stack Developer', count: '1', responsibilities: 'Integration and testing' }
      ];
    }

    // Analyze required skills based on specification content
    const skills = this.analyzeRequiredSkills(specContent);

    return {
      teamSize,
      roles,
      skills,
      complexity: complexity.level
    };
  }

  /**
   * Generate human time estimates
   */
  generateTimeEstimate(specContent: string): TimeEstimate {
    try {
      const complexity = this.analyzeProjectComplexity(specContent);
      const scope = this.analyzeProjectScope(specContent);
      const technicalFactors = this.analyzeTechnicalFactors(specContent);

      // Calculate base estimates
      const baseEstimates = this.calculateBaseEstimates(complexity, scope, technicalFactors);
      
      // Calculate PERT-style estimates (SOTA: Three-Point Estimation)
      const pertEstimates = this.calculatePERTEstimates(baseEstimates, complexity, scope);

      // Format durations using PERT weighted average
      const formattedDuration = this.formatDuration(pertEstimates.weightedAverage);

      return {
        totalDuration: formattedDuration,
        developmentTime: formattedDuration,
        testingTime: formattedDuration,
        complexityLevel: complexity.level,
        confidenceLevel: pertEstimates.weightedAverage < pertEstimates.mostLikely ? 'High' : 'Medium',
        riskFactors: complexity.factors,
        assumptions: [`${complexity.level} complexity`, `${scope.size} scope`],
        optimistic: pertEstimates.optimistic,
        pessimistic: pertEstimates.pessimistic,
        mostLikely: pertEstimates.mostLikely,
        weightedAverage: pertEstimates.weightedAverage,
        confidenceIntervals: pertEstimates.confidenceIntervals
      };
    } catch (error) {
      console.error('Error generating time estimate:', error);
      return {
        totalDuration: '2-3 weeks',
        developmentTime: '2-3 weeks',
        testingTime: '2-3 weeks',
        complexityLevel: 'medium',
        confidenceLevel: 'Medium',
        riskFactors: ['Limited specification analysis'],
        assumptions: ['Standard development approach'],
        optimistic: 10,
        pessimistic: 20,
        mostLikely: 15,
        weightedAverage: 15,
        confidenceIntervals: { p50: 15, p75: 17, p90: 19 }
      };
    }
  }

  /**
   * Generate AI-assisted time estimates
   */
  generateAITimeEstimate(specContent: string): AITimeEstimate {
    try {
      const complexity = this.analyzeProjectComplexity(specContent);
      const scope = this.analyzeProjectScope(specContent);

      // Get human estimates (for multiplier calculation)
      const humanEstimates = this.calculateBaseEstimates(complexity, scope, { factors: [], score: 0 });
      
      // Apply AI multipliers (AI is much faster)
      const aiMultipliers = this.calculateAIMultipliers(specContent);
      
      // Calculate AI total days using PERT
      const aiTotalDays = Math.max(0.125, humanEstimates.totalDays * (aiMultipliers.development + aiMultipliers.testing + aiMultipliers.guidance + aiMultipliers.review));
      
      // Apply PERT to AI estimates
      const aiPERTEstimates = this.calculatePERTEstimates(
        { totalDays: aiTotalDays },
        complexity,
        scope
      );

      // Format durations (cap AI estimates for rapid development)
      const maxTotalHours = 8; // AI total max 8 hours (1 day)
      const totalDuration = this.formatDurationWithCap(aiPERTEstimates.weightedAverage / 8, maxTotalHours);
      
      // Calculate savings
      const savingsPercentage = Math.round(((humanEstimates.totalDays - aiPERTEstimates.weightedAverage) / humanEstimates.totalDays) * 100);

      return {
        totalDuration,
        developmentTime: totalDuration,
        testingTime: totalDuration,
        guidanceTime: totalDuration,
        reviewTime: totalDuration,
        savingsPercentage,
        confidenceRanges: aiPERTEstimates.confidenceIntervals
      };
    } catch (error) {
      console.error('Error generating AI time estimate:', error);
      return {
        totalDuration: '2-4 hours',
        developmentTime: '2-4 hours',
        testingTime: '2-4 hours',
        guidanceTime: '2-4 hours',
        reviewTime: '2-4 hours',
        savingsPercentage: 80,
        confidenceRanges: { p50: 2, p75: 3, p90: 4 }
      };
    }
  }

  // Private helper methods

  private countFeatures(specContent: string): number {
    const featureIndicators = ['feature', 'function', 'functionality', 'requirement', 'user story'];
    let count = 0;
    for (const indicator of featureIndicators) {
      const matches = specContent.match(new RegExp(indicator, 'gi'));
      if (matches) count += matches.length;
    }
    return Math.max(3, Math.floor(count / 2)); // Conservative estimate
  }

  private countPages(specContent: string): number {
    const pageIndicators = ['page', 'screen', 'view', 'route', 'component'];
    let count = 0;
    for (const indicator of pageIndicators) {
      const matches = specContent.match(new RegExp(indicator, 'gi'));
      if (matches) count += matches.length;
    }
    return Math.max(3, Math.floor(count / 3)); // Conservative estimate
  }

  private countIntegrations(specContent: string): number {
    const integrationIndicators = ['integration', 'third-party', 'external', 'API', 'service'];
    let count = 0;
    for (const indicator of integrationIndicators) {
      const matches = specContent.match(new RegExp(indicator, 'gi'));
      if (matches) count += matches.length;
    }
    return Math.max(1, Math.floor(count / 4)); // Conservative estimate
  }

  private analyzeRequiredSkills(specContent: string): string[] {
    const skills: string[] = [];
    if (specContent.includes('TypeScript') || specContent.includes('JavaScript')) skills.push('TypeScript/JavaScript');
    if (specContent.includes('React')) skills.push('React');
    if (specContent.includes('Node.js')) skills.push('Node.js');
    if (specContent.includes('database') || specContent.includes('SQL')) skills.push('Database Design');
    if (specContent.includes('API') || specContent.includes('REST')) skills.push('API Development');
    return skills;
  }

  private calculateBaseEstimates(complexity: ComplexityAnalysis, scope: ScopeAnalysis, technicalFactors: TechnicalFactors): any {
    // SOTA estimation: Base on 72 tasks with realistic task time
    // Small project: 4 hours per task average (288 hours = 36 days)
    // Medium project: 6 hours per task average (432 hours = 54 days)
    // Large project: 8 hours per task average (576 hours = 72 days)
    let baseHoursPerTask = 4; // Base: 4 hours per task
    
    // Complexity increases task time
    if (complexity.level === 'high') baseHoursPerTask = 8; // 8 hours per task
    else if (complexity.level === 'medium') baseHoursPerTask = 6; // 6 hours per task
    
    // Scope increases number of complex tasks
    let taskMultiplier = 1.0;
    if (scope.size === 'large') taskMultiplier = 1.5; // More complex features
    else if (scope.size === 'medium') taskMultiplier = 1.2;

    // Technical factors add overhead per task
    const technicalAdjustment = 1 + (technicalFactors.score * 0.10);

    // Total development hours = 72 tasks * hours per task * multipliers
    const developmentHours = Math.round(72 * baseHoursPerTask * taskMultiplier * technicalAdjustment);
    const testingHours = Math.round(developmentHours * 0.30); // 30% for comprehensive testing
    const bufferHours = Math.round(developmentHours * 0.20); // 20% risk buffer
    const totalHours = developmentHours + testingHours + bufferHours;

    return {
      developmentDays: developmentHours / 8,
      testingDays: testingHours / 8,
      bufferDays: bufferHours / 8,
      totalDays: totalHours / 8,
      developmentHours,
      testingHours,
      bufferHours,
      totalHours
    };
  }


  private calculateAIMultipliers(specContent: string): any {
    // Aggressive AI acceleration for rapid development (2024-2025)
    // Modern AI can code 10-50x faster than humans for standard tasks
    // Development: AI can write entire features in hours vs days/weeks
    // Testing: AI generates tests instantly vs hours of manual test writing
    // Guidance: Minimal - AI provides instant context
    // Review: Minimal - AI does instant review
    return {
      development: 0.02,  // AI is 50x faster (2% of human time) - 98% time savings
      testing: 0.01,       // AI generates tests 100x faster - 99% time savings
      guidance: 0.005,      // AI guidance is instant - minimal time
      review: 0.005        // AI review is instant - minimal time
    };
  }


  private formatDuration(days: number): string {
    if (days < 1) return `${Math.ceil(days * 8)} hours`;
    if (days <= 5) return `${Math.ceil(days)} day${Math.ceil(days) > 1 ? 's' : ''}`;
    if (days <= 20) {
      const weeks = Math.ceil(days / 5);
      return `${weeks} week${weeks > 1 ? 's' : ''}`;
    }
    const months = Math.ceil(days / 20);
    return `${months} month${months > 1 ? 's' : ''}`;
  }

  private formatDurationWithCap(days: number, maxHours: number): string {
    const hours = Math.min(days * 8, maxHours);
    if (hours < 8) return `${Math.ceil(hours)} hour${hours !== 1 ? 's' : ''}`;
    
    // Convert capped hours to days for proper formatting
    const cappedDays = hours / 8;
    if (cappedDays < 1) return `${Math.ceil(hours)} hour${hours !== 1 ? 's' : ''}`;
    if (cappedDays <= 5) return `${Math.ceil(cappedDays)} day${Math.ceil(cappedDays) > 1 ? 's' : ''}`;
    
    const weeks = Math.ceil(cappedDays / 5);
    return `${weeks} week${weeks > 1 ? 's' : ''}`;
  }

  /**
   * Calculate phase-specific duration using PERT from total project duration
   */
  calculatePhaseDuration(totalDuration: string, phaseNumber: number): string {
    // Extract number from duration string (e.g., "10 months" -> 10)
    const match = totalDuration.match(/(\d+)/);
    if (!match) return '2-3 weeks';
    
    const totalValue = parseInt(match[1]);
    
    // Phase-specific weights (tasks in different phases have different complexity)
    const phaseWeights: Record<number, number> = {
      1: 1.0,   // Phase 1: Setup (average tasks 10-45min, avg 30min) - baseline
      2: 1.5,   // Phase 2: Core implementation (complex tasks 45-75min, avg 55min) - 50% heavier
      3: 1.3,   // Phase 3: UI development (component tasks 30-60min, avg 45min) - 30% heavier
      4: 0.8    // Phase 4: Testing (quick tasks 10-30min, avg 25min) - 20% lighter
    };
    const phaseWeight = phaseWeights[phaseNumber] || 1.0;
    
    // Task complexity within each phase (minutes per task)
    const taskComplexityMinutes: Record<number, number> = {
      1: 30,  // Phase 1: Mix of quick setup and medium complexity
      2: 55,  // Phase 2: Mostly complex implementation tasks
      3: 45,  // Phase 3: Mix of component development
      4: 25   // Phase 4: Mostly quick testing/documentation
    };
    
    // Calculate base phase days accounting for task complexity
    const avgMinutesPerTask = taskComplexityMinutes[phaseNumber] || 30;
    const totalProjectMinutes = 72 * 30; // Total project estimated at 30min avg per task
    const phaseMinutes = 18 * avgMinutesPerTask;
    const basePhaseDays = (phaseMinutes / totalProjectMinutes) * totalValue * phaseWeight;
    
    // Apply PERT multipliers for phase-specific estimates
    const optimisticMultiplier = 0.6;   // Best case: 60% of estimate
    const pessimisticMultiplier = 1.8;  // Worst case: 180% of estimate
    
    const optimistic = Math.ceil(basePhaseDays * optimisticMultiplier);
    const mostLikely = Math.ceil(basePhaseDays);
    const pessimistic = Math.ceil(basePhaseDays * pessimisticMultiplier);
    
    // PERT weighted average: (O + 4M + P) / 6
    const weightedAverage = Math.ceil((optimistic + 4 * mostLikely + pessimistic) / 6);
    
    // Convert days to appropriate format
    if (weightedAverage < 5) {
      // Less than 5 days, show as weeks
      if (weightedAverage < 1) return '2-3 days';
      return '1-2 weeks';
    } else if (weightedAverage < 20) {
      // 5-20 days, show as weeks
      const weeks = Math.ceil(weightedAverage / 5);
      return `${weeks} week${weeks > 1 ? 's' : ''}`;
    } else {
      // More than 20 days, show as months
      const months = Math.ceil(weightedAverage / 20);
      return `${months} month${months > 1 ? 's' : ''}`;
    }
  }

  /**
   * Calculate phase-specific PERT estimates (for 18 tasks per phase)
   * Returns days for human, hours for AI
   */
  calculatePhasePERTEstimates(totalDuration: string, phaseNumber: number, isAI: boolean = false): any {
    const match = totalDuration.match(/(\d+)/);
    if (!match) {
      return {
        optimistic: isAI ? 2 : 10,
        mostLikely: isAI ? 3 : 15,
        pessimistic: isAI ? 4 : 20,
        weightedAverage: isAI ? 3 : 15,
        confidenceIntervals: isAI ? { p50: 2, p75: 3, p90: 4 } : { p50: 15, p75: 17, p90: 19 }
      };
    }
    
    const totalValue = parseInt(match[1]);
    
    // Phase-specific weights (accounts for different phase complexities)
    const phaseWeights: Record<number, number> = {
      1: 1.0,   // Phase 1: Setup, contracts, initial tests (setup tasks: 10-45min avg)
      2: 1.5,   // Phase 2: Core implementation (implementation: 45-75min avg) - 50% heavier
      3: 1.3,   // Phase 3: UI development (components: 30-60min avg) - 30% heavier
      4: 0.8    // Phase 4: Testing, documentation (testing: 10-30min avg) - 20% lighter
    };
    const phaseWeight = phaseWeights[phaseNumber] || 1.0;
    
    // Average task complexity within phase (minutes per task)
    const taskComplexityMinutes: Record<number, number> = {
      1: 30,  // Phase 1: Mix of quick setup (10-15min) and medium (30-45min)
      2: 55,  // Phase 2: Mostly complex implementation (45-75min)
      3: 45,  // Phase 3: Mix of components (30-60min)
      4: 25   // Phase 4: Mostly quick testing/documentation (10-30min)
    };
    const avgMinutesPerTask = taskComplexityMinutes[phaseNumber] || 30;
    
    // Base phase estimate (18 tasks per phase, account for task complexity)
    const totalPhaseMinutes = 18 * avgMinutesPerTask;
    const basePhaseDays = (totalPhaseMinutes / 60 / 8) * phaseWeight * (totalValue / (72 * 30 / 60 / 8));
    
    // For AI, convert to hours (AI is much faster: 50x speedup for most tasks)
    // AI can complete most tasks in 1-10 minutes
    const aiSpeedupFactor = phaseNumber === 4 ? 30 : 50; // Testing tasks have less AI speedup
    const aiMinutesPerTask = avgMinutesPerTask / aiSpeedupFactor;
    const basePhaseHours = isAI ? Math.max(0.5, Math.ceil((18 * aiMinutesPerTask) / 60)) : basePhaseDays * 8;
    
    // PERT multipliers
    const optimistic = Math.ceil(basePhaseHours * 0.6);   // 60% of average
    const mostLikely = Math.ceil(basePhaseHours);          // Baseline
    const pessimistic = Math.ceil(basePhaseHours * 1.8);   // 180% of average
    
    // PERT weighted average: (O + 4M + P) / 6
    const weightedAverage = Math.ceil((optimistic + 4 * mostLikely + pessimistic) / 6);
    
    // Confidence intervals (simplified)
    const confidenceIntervals = {
      p50: Math.ceil(weightedAverage * 1.0),
      p75: Math.ceil(weightedAverage * 1.15),
      p90: Math.ceil(weightedAverage * 1.35)
    };
    
    return {
      optimistic,
      mostLikely,
      pessimistic,
      weightedAverage,
      confidenceIntervals
    };
  }

  /**
   * Calculate PERT-style three-point estimates (SOTA)
   * PERT Formula: Expected = (Optimistic + 4×MostLikely + Pessimistic) / 6
   */
  private calculatePERTEstimates(baseEstimates: any, complexity: ComplexityAnalysis, scope: ScopeAnalysis): any {
    const totalDays = baseEstimates.totalDays;

    // Set optimistic, most likely, pessimistic based on complexity and scope
    let optimisticMultiplier = 0.7;  // Best case: 70% of estimate
    let pessimisticMultiplier = 1.8; // Worst case: 180% of estimate
    
    // Adjust based on complexity
    if (complexity.level === 'high') {
      optimisticMultiplier = 0.8;   // High complexity = less optimistic
      pessimisticMultiplier = 2.2;  // More pessimistic
    } else if (complexity.level === 'low') {
      optimisticMultiplier = 0.6;   // Low complexity = more optimistic
      pessimisticMultiplier = 1.5;  // Less pessimistic
    }

    // Adjust based on scope
    if (scope.size === 'large') {
      optimisticMultiplier = Math.max(0.75, optimisticMultiplier); // Large projects are less optimistic
      pessimisticMultiplier = Math.min(2.5, pessimisticMultiplier); // More variability
    }

    const optimistic = Math.ceil(totalDays * optimisticMultiplier);
    const mostLikely = totalDays;
    const pessimistic = Math.ceil(totalDays * pessimisticMultiplier);

    // PERT weighted average: (O + 4M + P) / 6
    const weightedAverage = Math.ceil((optimistic + 4 * mostLikely + pessimistic) / 6);

    // Standard deviation for confidence intervals
    const standardDeviation = (pessimistic - optimistic) / 6;

    // Confidence intervals using normal distribution approximation
    // p50 (median), p75 (1 std dev above), p90 (1.28 std dev above)
    const confidenceIntervals = {
      p50: Math.ceil(weightedAverage),
      p75: Math.ceil(weightedAverage + standardDeviation),
      p90: Math.ceil(weightedAverage + 1.28 * standardDeviation)
    };

    return {
      optimistic,
      pessimistic,
      mostLikely,
      weightedAverage,
      confidenceIntervals
    };
  }
}

