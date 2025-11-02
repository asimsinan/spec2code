/**
 * Project Estimator - Analyzes project complexity and generates realistic estimates
 * 
 * Features:
 * - Complexity analysis (low, medium, high)
 * - Scope analysis (features, pages, integrations)
 * - Use Case Points (UCP) estimation (SOTA)
 * - Enhanced NLP specification analysis
 * - Task-level complexity analysis
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
 * Use Case Points (UCP) Analysis - Industry-standard estimation from specifications
 */
export interface UseCase {
  id: string;
  description: string;
  actorCount: number;
  transactionCount: number;
  weight: number; // 5 (simple), 10 (average), 15 (complex)
}

export interface UCPAnalysis {
  useCases: UseCase[];
  totalUseCases: number;
  actors: number;
  unadjustedUseCaseWeight: number; // UUCW
  technicalComplexityFactor: number; // TCF (0.6 to 1.3)
  environmentalComplexityFactor: number; // ECF (0.42 to 1.41)
  useCasePoints: number; // Final UCP = (UUCW + TCF) × ECF
  estimatedHours: number; // UCP × hours per UCP (typically 20-28 hours)
}

/**
 * Enhanced NLP Specification Analysis
 */
export interface NLPAnalysis {
  readabilityScore: number; // Flesch-Kincaid approximate
  requirementDensity: number; // Requirements per 100 words
  domainTermComplexity: number; // Domain-specific terms count
  conditionalComplexity: number; // Conditional statements count
  dependencyComplexity: number; // Dependency indicators count
  actionVerbDensity: number; // Action verbs per 100 words
}

/**
 * Project Estimator
 * Analyzes project specifications and generates realistic time, team, and resource estimates
 */
export class ProjectEstimator {
  /**
   * Analyze specification using Use Case Points (UCP) - Industry standard estimation
   */
  analyzeUseCasePoints(specContent: string): UCPAnalysis {
    const useCases = this.extractUseCases(specContent);
    const actors = this.countActors(specContent);
    const uucw = this.calculateUUCW(useCases);
    const tcf = this.calculateTCF(specContent);
    const ecf = this.calculateECF(specContent);
    const ucp = Math.round((uucw * tcf) * ecf);
    
    // Standard conversion: 1 UCP = 20-28 hours (average 24 hours)
    // For AI-assisted: 1 UCP = 0.5-1 hour (50x speedup)
    const estimatedHours = Math.round(ucp * 24);
    
    return {
      useCases,
      totalUseCases: useCases.length,
      actors,
      unadjustedUseCaseWeight: uucw,
      technicalComplexityFactor: tcf,
      environmentalComplexityFactor: ecf,
      useCasePoints: ucp,
      estimatedHours
    };
  }

  /**
   * Extract use cases from specification
   */
  private extractUseCases(specContent: string): UseCase[] {
    const useCases: UseCase[] = [];
    const lines = specContent.split('\n');
    
    // Patterns that indicate use cases
    const useCasePatterns = [
      /user can (.+)/gi,
      /users can (.+)/gi,
      /system should (.+)/gi,
      /system allows (.+)/gi,
      /must be able to (.+)/gi,
      /should be able to (.+)/gi,
      /can (.+)/gi,
      /feature: (.+)/gi,
      /functionality: (.+)/gi,
      /use case: (.+)/gi
    ];
    
    let useCaseId = 1;
    for (const line of lines) {
      for (const pattern of useCasePatterns) {
        const matches = line.matchAll(pattern);
        for (const match of matches) {
          if (match[1] && match[1].length > 10) { // Filter out very short matches
            const description = match[1].trim();
            // Skip if it's too generic or already captured
            if (description.length < 50 && !description.match(/^(the|a|an|be|is|are|was|were)\s/i)) {
              const transactionCount = this.countTransactions(description);
              const actorCount = this.countActorsInUseCase(line, specContent);
              const weight = this.determineUseCaseWeight(transactionCount, actorCount);
              
              useCases.push({
                id: `UC-${String(useCaseId++).padStart(3, '0')}`,
                description,
                actorCount,
                transactionCount,
                weight
              });
            }
          }
        }
      }
    }
    
    // Also extract from numbered/bulleted lists
    const listPatterns = [
      /^\d+\.\s*(.+)/gm,
      /^[-*]\s*(.+)/gm,
      /^[a-z]\)\s*(.+)/gm
    ];
    
    for (const pattern of listPatterns) {
      const matches = specContent.matchAll(pattern);
      for (const match of matches) {
        const text = match[1]?.trim();
        if (text && text.length > 15 && text.length < 200) {
          // Check if it describes an action (use case)
          if (this.isUseCaseDescription(text)) {
            const transactionCount = this.countTransactions(text);
            const actorCount = this.countActorsInUseCase(text, specContent);
            const weight = this.determineUseCaseWeight(transactionCount, actorCount);
            
            // Avoid duplicates
            const isDuplicate = useCases.some(uc => 
              uc.description.toLowerCase().includes(text.toLowerCase().substring(0, 20)) ||
              text.toLowerCase().includes(uc.description.toLowerCase().substring(0, 20))
            );
            
            if (!isDuplicate) {
              useCases.push({
                id: `UC-${String(useCaseId++).padStart(3, '0')}`,
                description: text,
                actorCount,
                transactionCount,
                weight
              });
            }
          }
        }
      }
    }
    
    // Ensure minimum use cases (at least 3 for any project)
    if (useCases.length === 0) {
      // Fallback: extract from sentences with action verbs
      const sentences = specContent.match(/[^.!?]+[.!?]+/g) || [];
      for (const sentence of sentences.slice(0, 5)) {
        if (this.isUseCaseDescription(sentence)) {
          const transactionCount = this.countTransactions(sentence);
          const actorCount = 1; // Default
          const weight = this.determineUseCaseWeight(transactionCount, actorCount);
          
          useCases.push({
            id: `UC-${String(useCaseId++).padStart(3, '0')}`,
            description: sentence.trim(),
            actorCount,
            transactionCount,
            weight
          });
        }
      }
    }
    
    return useCases.slice(0, 50); // Cap at 50 use cases
  }

  /**
   * Determine if text describes a use case (action-oriented)
   */
  private isUseCaseDescription(text: string): boolean {
    const actionVerbs = [
      'create', 'add', 'edit', 'delete', 'update', 'save', 'submit',
      'login', 'logout', 'register', 'authenticate', 'authorize',
      'view', 'search', 'filter', 'sort', 'export', 'import',
      'send', 'receive', 'upload', 'download', 'process',
      'manage', 'configure', 'setup', 'install', 'deploy'
    ];
    
    const lowerText = text.toLowerCase();
    return actionVerbs.some(verb => lowerText.includes(verb));
  }

  /**
   * Count transactions in a use case (number of steps/interactions)
   */
  private countTransactions(useCaseText: string): number {
    let count = 1; // Minimum 1 transaction
    
    // Count action verbs (each represents a potential transaction)
    const actionVerbs = /\b(create|add|edit|delete|update|save|submit|view|search|filter|sort|send|receive|process|validate|verify)\b/gi;
    const verbMatches = useCaseText.match(actionVerbs);
    if (verbMatches) {
      count = Math.max(count, verbMatches.length);
    }
    
    // Count conditional/branching logic
    const conditions = /\b(if|when|then|else|after|before|while)\b/gi;
    const conditionMatches = useCaseText.match(conditions);
    if (conditionMatches) {
      count += Math.floor(conditionMatches.length / 2);
    }
    
    // Count sequential steps (numbered, "then", "next", "finally")
    const sequential = /\b(then|next|finally|first|second|third|step|steps)\b/gi;
    const sequentialMatches = useCaseText.match(sequential);
    if (sequentialMatches) {
      count += Math.floor(sequentialMatches.length / 2);
    }
    
    // Classify: 1-3 = simple (5 points), 4-7 = average (10 points), 8+ = complex (15 points)
    return Math.min(count, 15); // Cap at reasonable maximum
  }

  /**
   * Determine use case weight based on transaction and actor count
   */
  private determineUseCaseWeight(transactionCount: number, actorCount: number): number {
    // Use Case Weight Classification:
    // Simple: ≤3 transactions → 5 points
    // Average: 4-7 transactions → 10 points  
    // Complex: ≥8 transactions → 15 points
    
    if (transactionCount <= 3) return 5;
    if (transactionCount <= 7) return 10;
    return 15;
  }

  /**
   * Count actors in specification
   */
  private countActors(specContent: string): number {
    const actorPatterns = [
      /user/gi,
      /admin/gi,
      /customer/gi,
      /client/gi,
      /developer/gi,
      /manager/gi,
      /role/gi,
      /actor/gi
    ];
    
    const uniqueActors = new Set<string>();
    for (const pattern of actorPatterns) {
      const matches = specContent.match(pattern);
      if (matches) {
        matches.forEach(match => uniqueActors.add(match.toLowerCase()));
      }
    }
    
    // Also look for explicit actor definitions
    const actorDefPattern = /(?:actor|user|role)[:\s]+([^\n,]+)/gi;
    const actorMatches = specContent.matchAll(actorDefPattern);
    for (const match of actorMatches) {
      if (match[1]) uniqueActors.add(match[1].trim().toLowerCase());
    }
    
    return Math.max(1, uniqueActors.size); // At least 1 actor (user)
  }

  /**
   * Count actors mentioned in a use case
   */
  private countActorsInUseCase(useCaseText: string, fullSpec: string): number {
    // Check for explicit actor mentions
    const actorMentions = /\b(user|admin|customer|client|developer|manager)\b/gi;
    const matches = useCaseText.match(actorMentions);
    return matches ? new Set(matches.map(m => m.toLowerCase())).size : 1;
  }

  /**
   * Calculate Unadjusted Use Case Weight (UUCW)
   */
  private calculateUUCW(useCases: UseCase[]): number {
    return useCases.reduce((sum, uc) => sum + uc.weight, 0);
  }

  /**
   * Calculate Technical Complexity Factor (TCF)
   * 13 technical factors, each 0-5 points, weighted
   */
  private calculateTCF(specContent: string): number {
    const factors = [
      { name: 'Distributed System', weight: 2.0, keywords: ['distributed', 'microservices', 'cloud', 'serverless'] },
      { name: 'Performance Requirements', weight: 1.0, keywords: ['performance', 'speed', 'latency', 'throughput', 'response time'] },
      { name: 'End User Efficiency', weight: 1.0, keywords: ['efficient', 'user experience', 'ux', 'ui', 'interface'] },
      { name: 'Complex Internal Processing', weight: 1.0, keywords: ['algorithm', 'complex', 'calculation', 'processing', 'computation'] },
      { name: 'Reusability', weight: 1.0, keywords: ['reusable', 'component', 'library', 'module', 'shared'] },
      { name: 'Easy to Install', weight: 0.5, keywords: ['install', 'deploy', 'setup', 'configuration'] },
      { name: 'Easy to Use', weight: 0.5, keywords: ['easy to use', 'user-friendly', 'intuitive', 'simple interface'] },
      { name: 'Portable', weight: 2.0, keywords: ['portable', 'cross-platform', 'mobile', 'web', 'desktop'] },
      { name: 'Easy to Change', weight: 1.0, keywords: ['flexible', 'configurable', 'customizable', 'adaptable'] },
      { name: 'Concurrent', weight: 1.0, keywords: ['concurrent', 'parallel', 'multi-user', 'multi-tenant', 'real-time'] },
      { name: 'Special Security Features', weight: 1.0, keywords: ['security', 'encryption', 'authentication', 'authorization', 'secure'] },
      { name: 'Access for Third Parties', weight: 1.0, keywords: ['api', 'third-party', 'external', 'integration', 'webhook'] },
      { name: 'Special User Training', weight: 1.0, keywords: ['training', 'documentation', 'tutorial', 'guide', 'manual'] }
    ];
    
    let totalFactor = 0;
    for (const factor of factors) {
      let score = 0;
      for (const keyword of factor.keywords) {
        const regex = new RegExp(keyword, 'gi');
        if (regex.test(specContent)) {
          score = Math.max(score, Math.min(5, specContent.match(regex)!.length)); // Cap at 5
        }
      }
      totalFactor += score * factor.weight;
    }
    
    // TCF = 0.6 + (0.01 × Total Factor)
    const tcf = 0.6 + (0.01 * totalFactor);
    return Math.max(0.6, Math.min(1.3, tcf)); // Bound between 0.6 and 1.3
  }

  /**
   * Calculate Environmental Complexity Factor (ECF)
   * 8 environmental factors, each 0-5 points, weighted
   */
  private calculateECF(specContent: string): number {
    // For AI-assisted development, we assume favorable environment
    // But we can still detect from spec
    const factors = [
      { name: 'Familiarity with Development Process', weight: 1.5, default: 4 }, // AI tools = high familiarity
      { name: 'Application Experience', weight: 0.5, default: 3 },
      { name: 'Object-Oriented Experience', weight: 1.0, default: 4 }, // Modern development
      { name: 'Lead Analyst Capability', weight: 0.5, default: 4 }, // AI assistance
      { name: 'Motivation', weight: 1.0, default: 4 },
      { name: 'Stable Requirements', weight: 2.0, keywords: ['stable', 'fixed', 'defined', 'specification'] },
      { name: 'Part-Time Workers', weight: -1.0, default: 5 }, // AI = always available
      { name: 'Difficult Programming Language', weight: -1.0, keywords: ['legacy', 'cobol', 'assembly', 'complex', 'low-level'] }
    ];
    
    let totalFactor = 0;
    for (const factor of factors) {
      let score = factor.default || 3; // Default neutral score
      
      // Override with keyword detection if available
      if (factor.keywords) {
        for (const keyword of factor.keywords) {
          const regex = new RegExp(keyword, 'gi');
          if (regex.test(specContent)) {
            score = keyword.includes('stable') || keyword.includes('fixed') || keyword.includes('defined') ? 5 : 1;
            break;
          }
        }
      }
      
      totalFactor += score * factor.weight;
    }
    
    // ECF = 1.4 + (-0.03 × Total Factor)
    const ecf = 1.4 + (-0.03 * totalFactor);
    return Math.max(0.42, Math.min(1.41, ecf)); // Bound between 0.42 and 1.41
  }

  /**
   * Enhanced NLP specification analysis
   */
  analyzeNLPSpecification(specContent: string): NLPAnalysis {
    const words = specContent.split(/\s+/).filter(w => w.length > 0);
    const sentences = specContent.match(/[^.!?]+[.!?]+/g) || [specContent];
    const wordCount = words.length;
    
    // Readability score approximation (Flesch-Kincaid approximate)
    const avgWordsPerSentence = wordCount / Math.max(1, sentences.length);
    const avgSyllablesPerWord = this.estimateSyllables(words) / wordCount;
    const readabilityScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    
    // Requirement density (requirements per 100 words)
    const requirementKeywords = /\b(must|shall|should|will|requires?|needs?|feature|functionality)\b/gi;
    const requirementCount = (specContent.match(requirementKeywords) || []).length;
    const requirementDensity = (requirementCount / wordCount) * 100;
    
    // Domain term complexity (technical/domain-specific terms)
    const domainPatterns = /\b([A-Z][a-z]+[A-Z][a-zA-Z]*|[a-z]+(?:API|SDK|UI|UX|DB|SQL|HTTP|REST|JSON|XML))\b/g;
    const domainTerms = new Set((specContent.match(domainPatterns) || []).map(t => t.toLowerCase()));
    
    // Conditional complexity
    const conditionals = /\b(if|when|then|else|unless|provided|assuming|depending on)\b/gi;
    const conditionalCount = (specContent.match(conditionals) || []).length;
    
    // Dependency complexity
    const dependencies = /\b(depends on|requires|needs|relies on|uses|integrates with)\b/gi;
    const dependencyCount = (specContent.match(dependencies) || []).length;
    
    // Action verb density
    const actionVerbs = /\b(create|implement|build|develop|design|configure|setup|install|deploy|manage|process|handle)\b/gi;
    const actionVerbCount = (specContent.match(actionVerbs) || []).length;
    const actionVerbDensity = (actionVerbCount / wordCount) * 100;
    
    return {
      readabilityScore: Math.max(0, Math.min(100, readabilityScore)),
      requirementDensity,
      domainTermComplexity: domainTerms.size,
      conditionalComplexity: conditionalCount,
      dependencyComplexity: dependencyCount,
      actionVerbDensity
    };
  }

  /**
   * Estimate syllables in words (approximate for readability)
   */
  private estimateSyllables(words: string[]): number {
    let totalSyllables = 0;
    for (const word of words) {
      const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
      if (cleanWord.length <= 3) {
        totalSyllables += 1;
      } else {
        // Simple heuristic: count vowel groups
        const vowelGroups = cleanWord.match(/[aeiouy]+/g) || [];
        totalSyllables += Math.max(1, vowelGroups.length);
      }
    }
    return totalSyllables;
  }

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
   * Uses Use Case Points (UCP) as baseline, enhanced with NLP analysis and traditional complexity scoring
   */
  generateTimeEstimate(specContent: string): TimeEstimate {
    try {
      // SOTA: Use Case Points analysis (industry standard)
      const ucpAnalysis = this.analyzeUseCasePoints(specContent);
      
      // Enhanced NLP analysis
      const nlpAnalysis = this.analyzeNLPSpecification(specContent);
      
      // Traditional complexity analysis (for compatibility and risk factors)
      const complexity = this.analyzeProjectComplexity(specContent);
      const scope = this.analyzeProjectScope(specContent);
      const technicalFactors = this.analyzeTechnicalFactors(specContent);

      // Calculate base estimates using UCP as primary source
      const baseEstimates = this.calculateBaseEstimatesWithUCP(
        ucpAnalysis,
        nlpAnalysis,
        complexity,
        scope,
        technicalFactors
      );
      
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
   * Uses UCP as baseline with AI speedup factors
   */
  generateAITimeEstimate(specContent: string): AITimeEstimate {
    try {
      // SOTA: Use Case Points analysis for baseline
      const ucpAnalysis = this.analyzeUseCasePoints(specContent);
      const nlpAnalysis = this.analyzeNLPSpecification(specContent);
      const complexity = this.analyzeProjectComplexity(specContent);
      const scope = this.analyzeProjectScope(specContent);

      // Get human estimates (using UCP-based calculation)
      const humanEstimates = this.calculateBaseEstimatesWithUCP(
        ucpAnalysis,
        nlpAnalysis,
        complexity,
        scope,
        { factors: [], score: 0 }
      );
      
      // Apply AI multipliers (AI is much faster)
      const aiMultipliers = this.calculateAIMultipliers(specContent);
      
      // Calculate AI total days using PERT
      // For AI: UCP hours are much lower (50x speedup)
      const aiUCPHours = Math.max(0.5, ucpAnalysis.estimatedHours * 0.02); // 2% of human time (50x speedup)
      const aiTraditionalDays = Math.max(0.125, humanEstimates.totalDays * (aiMultipliers.development + aiMultipliers.testing + aiMultipliers.guidance + aiMultipliers.review));
      
      // Blend: Use UCP-based AI estimate (70%) with traditional (30%)
      const aiTotalDays = (aiUCPHours / 8 * 0.7) + (aiTraditionalDays * 0.3);
      
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

  /**
   * Calculate base estimates using UCP as primary source (SOTA)
   */
  private calculateBaseEstimatesWithUCP(
    ucpAnalysis: UCPAnalysis,
    nlpAnalysis: NLPAnalysis,
    complexity: ComplexityAnalysis,
    scope: ScopeAnalysis,
    technicalFactors: TechnicalFactors
  ): any {
    // Primary estimation from UCP (industry standard)
    // 1 UCP = 20-28 hours (average 24 hours) for human development
    let baseHours = ucpAnalysis.estimatedHours;
    
    // Adjust based on NLP analysis
    // Higher requirement density = more work
    const requirementMultiplier = 1 + (nlpAnalysis.requirementDensity / 200); // 0-50% adjustment
    // Higher conditional complexity = more testing/debugging
    const conditionalMultiplier = 1 + (nlpAnalysis.conditionalComplexity / 100); // 0-20% adjustment
    // Higher dependency complexity = more integration work
    const dependencyMultiplier = 1 + (nlpAnalysis.dependencyComplexity / 80); // 0-25% adjustment
    
    baseHours = baseHours * requirementMultiplier * conditionalMultiplier * dependencyMultiplier;
    
    // Fallback: If UCP is too low or high, blend with traditional method
    const traditionalEstimates = this.calculateBaseEstimates(complexity, scope, technicalFactors);
    
    // Blend: 70% UCP (if reliable), 30% traditional (as sanity check)
    const ucpDays = baseHours / 8;
    const traditionalDays = traditionalEstimates.totalDays;
    
    // If UCP seems too low (less than 10 days for 33 tasks), use blend
    // If UCP seems too high (more than 100 days), cap and blend
    let finalDays: number;
    if (ucpDays < 10) {
      // UCP might be underestimating, blend more with traditional
      finalDays = (ucpDays * 0.5) + (traditionalDays * 0.5);
    } else if (ucpDays > 100) {
      // UCP might be overestimating, cap and blend
      finalDays = (Math.min(ucpDays, 100) * 0.7) + (traditionalDays * 0.3);
    } else {
      // UCP looks reasonable, use 70/30 blend
      finalDays = (ucpDays * 0.7) + (traditionalDays * 0.3);
    }
    
    // Calculate breakdown
    const developmentDays = finalDays * 0.65; // 65% development
    const testingDays = finalDays * 0.25; // 25% testing
    const bufferDays = finalDays * 0.10; // 10% buffer
    
    return {
      developmentDays: Math.ceil(developmentDays),
      testingDays: Math.ceil(testingDays),
      bufferDays: Math.ceil(bufferDays),
      totalDays: Math.ceil(finalDays),
      developmentHours: Math.ceil(developmentDays * 8),
      testingHours: Math.ceil(testingDays * 8),
      bufferHours: Math.ceil(bufferDays * 8),
      totalHours: Math.ceil(finalDays * 8),
      ucpBased: true, // Flag to indicate UCP was used
      ucpPoints: ucpAnalysis.useCasePoints,
      ucpHours: ucpAnalysis.estimatedHours
    };
  }

  private calculateBaseEstimates(complexity: ComplexityAnalysis, scope: ScopeAnalysis, technicalFactors: TechnicalFactors): any {
    // SOTA estimation: Base on 33 tasks with realistic task time
    // Small project: 4 hours per task average (132 hours = 16.5 days)
    // Medium project: 6 hours per task average (198 hours = 24.75 days)
    // Large project: 8 hours per task average (264 hours = 33 days)
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

    // Total development hours = 33 tasks * hours per task * multipliers
    const developmentHours = Math.round(33 * baseHoursPerTask * taskMultiplier * technicalAdjustment);
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
    const totalProjectMinutes = 33 * 30; // Total project estimated at 30min avg per task
    const phaseTaskCount = this.getPhaseTaskCount(phaseNumber);
    const phaseMinutes = phaseTaskCount * avgMinutesPerTask;
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
   * Calculate phase-specific PERT estimates (Phase 1: 9 tasks, Phase 2: 8 tasks, Phase 3: 9 tasks, Phase 4: 7 tasks)
   * Returns days for human, hours for AI
   */
  private getPhaseTaskCount(phaseNumber: number): number {
    const taskCounts = { 1: 9, 2: 8, 3: 9, 4: 7 };
    return taskCounts[phaseNumber as keyof typeof taskCounts] || 9;
  }

  /**
   * Calculate phase-specific PERT estimates with optional task-level complexity analysis
   * @param totalDuration - Total project duration string (e.g., "10 weeks")
   * @param phaseNumber - Phase number (1-4)
   * @param isAI - Whether estimating for AI (hours) or human (days)
   * @param tasks - Optional array of tasks for task-level complexity analysis (SOTA)
   */
  async calculatePhasePERTEstimates(
    totalDuration: string,
    phaseNumber: number,
    isAI: boolean = false,
    tasks?: any[]
  ): Promise<any> {
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
    // SOTA: Use actual task complexity if tasks provided, otherwise use defaults
    let avgMinutesPerTask: number;
    if (tasks && tasks.length > 0) {
      // Import and use TaskComplexityAnalyzer (dynamic import to avoid circular dependency)
      try {
        const { TaskComplexityAnalyzer } = await import('./TaskComplexityAnalyzer.js');
        const analyzer = new TaskComplexityAnalyzer();
        const analysis = analyzer.analyzeTasks(tasks);
        // Average minutes per task from actual task analysis
        avgMinutesPerTask = analysis.totalEstimatedMinutes / tasks.length;
      } catch (importError) {
        // Fallback if import fails (use synchronous require for Node.js compatibility)
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { TaskComplexityAnalyzer } = require('./TaskComplexityAnalyzer');
          const analyzer = new TaskComplexityAnalyzer();
          const analysis = analyzer.analyzeTasks(tasks);
          avgMinutesPerTask = analysis.totalEstimatedMinutes / tasks.length;
        } catch {
          // Final fallback if both fail
          console.warn('[ProjectEstimator] Failed to import TaskComplexityAnalyzer, using defaults');
          const taskComplexityMinutes: Record<number, number> = {
            1: 30, 2: 55, 3: 45, 4: 25
          };
          avgMinutesPerTask = taskComplexityMinutes[phaseNumber] || 30;
        }
      }
    } else {
      // Fallback to defaults
      const taskComplexityMinutes: Record<number, number> = {
        1: 30,  // Phase 1: Mix of quick setup (10-15min) and medium (30-45min)
        2: 55,  // Phase 2: Mostly complex implementation (45-75min)
        3: 45,  // Phase 3: Mix of components (30-60min)
        4: 25   // Phase 4: Mostly quick testing/documentation (10-30min)
      };
      avgMinutesPerTask = taskComplexityMinutes[phaseNumber] || 30;
    }
    
    // Base phase estimate (dynamic task counts per phase)
    // Calculate phase duration directly from phase tasks with minimal scaling
    // This gives realistic per-phase estimates that don't inflate with large projects
    const phaseTaskCount = this.getPhaseTaskCount(phaseNumber);
    const totalPhaseMinutes = phaseTaskCount * avgMinutesPerTask;
    
    // Base phase days: minutes / 60 (hours) / 8 (hours per day) * phaseWeight
    // PhaseWeight already accounts for phase complexity differences (1.0, 1.5, 1.3, 0.8)
    // avgMinutesPerTask already accounts for task complexity differences (30, 55, 45, 25)
    // phaseTaskCount accounts for task count differences (9, 8, 9, 7)
    // So we get: Phase 1 = 9×30×1.0 = 270min, Phase 2 = 8×55×1.5 = 660min, etc.
    let basePhaseDays = (totalPhaseMinutes / 60 / 8) * phaseWeight;
    
    // No additional scaling needed - phaseWeight and avgMinutesPerTask already create differences
    // The original problem was scaling by totalValue which inflated everything
    // Now phases differentiate naturally based on:
    // 1. Task count per phase (9 vs 8 vs 9 vs 7)
    // 2. Minutes per task (30 vs 55 vs 45 vs 25)  
    // 3. Phase weight (1.0 vs 1.5 vs 1.3 vs 0.8)
    
    // For AI, convert to hours (AI is much faster: 50x speedup for most tasks)
    // AI can complete most tasks in 1-10 minutes
    const aiSpeedupFactor = phaseNumber === 4 ? 30 : 50; // Testing tasks have less AI speedup
    const aiMinutesPerTask = avgMinutesPerTask / aiSpeedupFactor;
    // Calculate AI hours base
    let basePhaseHours = isAI ? (phaseTaskCount * aiMinutesPerTask) / 60 : basePhaseDays * 8;
    
    // Scale AI base to preserve phase differentiation
    // Without scaling, all phases converge to ~0.1h which is too small to differentiate
    // Scale up by 3-5x to make differences visible (0.5h vs 1h vs 1.5h)
    if (isAI) {
      basePhaseHours = basePhaseHours * 5; // Scale up to preserve phase differences
    }
    
    // PERT multipliers
    // For AI: use smaller multipliers since base is already small
    // For Human: use standard multipliers
    let optimisticMultiplier = 0.6;
    let pessimisticMultiplier = 1.8;
    
    if (isAI) {
      // AI estimates: use multipliers that preserve differentiation
      // Base values are small (0.1-0.2h), so don't floor too aggressively
      optimisticMultiplier = 0.6;  // Allow optimistic to go below 0.5h
      pessimisticMultiplier = 2.0; // Keep pessimistic range wide
    }
    
    // Calculate PERT values without aggressive flooring to preserve phase differences
    let optimistic = basePhaseHours * optimisticMultiplier;
    let mostLikely = basePhaseHours;
    let pessimistic = basePhaseHours * pessimisticMultiplier;
    
    // Only apply minimum floor AFTER PERT calculation to preserve differentiation
    // For AI: ensure minimum 0.5 hours total, but allow phases to differ
    // For Human: no minimum needed
    
    // PERT weighted average: (O + 4M + P) / 6
    let weightedAverage = (optimistic + 4 * mostLikely + pessimistic) / 6;
    
    // For AI: Use a very low minimum (0.3h) to preserve phase differences
    // The phases naturally range from 0.1-0.2h base, so 0.3h min preserves differences
    // For Human: No minimum needed
    if (isAI) {
      weightedAverage = Math.max(0.3, weightedAverage);
      // Round to nearest 0.25 hours first for granularity
      weightedAverage = Math.round(weightedAverage * 4) / 4;
      // Then round to readable increments: 0.5h, 1h, 1.5h, 2h
      // Use thresholds that preserve Phase 2 (most complex) as longer
      if (weightedAverage < 0.625) weightedAverage = 0.5;      // 0-0.625 → 0.5h
      else if (weightedAverage < 1.25) weightedAverage = 1.0;   // 0.625-1.25 → 1h
      else if (weightedAverage < 1.75) weightedAverage = 1.5;   // 1.25-1.75 → 1.5h
      else weightedAverage = Math.round(weightedAverage);       // 1.75+ → round to nearest hour
    } else {
      // Human: Round up to whole hours
      weightedAverage = Math.ceil(weightedAverage);
    }
    
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

