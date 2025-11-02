/**
 * Shared Platform Detection Engine
 * Detects platform, framework, and language from specification and plan data
 * 
 * Features:
 * - Multi-source detection (spec, plan, tech stack)
 * - Specific framework detection (nextjs, spring-boot, etc.)
 * - Confidence scoring (0-100)
 * - Maps specific frameworks to generic platforms
 */

// Type definitions
export type PlatformType = 'web' | 'mobile' | 'desktop' | 'backend' | 'ai';
export type FrameworkType = 'nextjs' | 'react-native' | 'ios-native' | 'android-native' | 'java-spring' | 'python-django' | 'nodejs-express' | 'go' | 'gin' | 'express' | 'django' | 'spring-boot' | 'unknown';
export type LanguageType = 'typescript' | 'javascript' | 'swift' | 'kotlin' | 'java' | 'python' | 'go' | 'unknown';

export interface PlatformDetectionResult {
  platform: PlatformType;           // Generic platform category
  framework: FrameworkType;         // Specific framework (nextjs, spring-boot, etc.)
  language: LanguageType;             // Programming language
  confidence: number;                 // Detection confidence (0-100)
  detectedFrom: string[];            // Sources that contributed to detection
  // SOTA: Top candidates with scores
  topCandidates?: Array<{platform: string, score: number}>;
  // SOTA: Alternative detection methods used
  detectionMethods?: string[];
  // SOTA: Confidence intervals
  confidenceRange?: { min: number; max: number };
}

/**
 * Platform Detection Engine
 * Detects the most appropriate platform, framework, and language based on specification and plan data
 */
export class PlatformDetectionEngine {
  async detectPlatform(specData: any, planData: any): Promise<PlatformDetectionResult> {
    const platforms = ['nextjs', 'react-native', 'ios-native', 'android-native', 'java-spring', 'python-django', 'nodejs-express', 'go'] as const;
    const scores = await this.scorePlatforms(specData, planData, platforms);
    
    // Get best match
    const bestMatch = scores.reduce((best, current) => 
      current.score > best.score ? current : best
    );
    
    // SOTA: Get top 3 candidates for transparency
    const topCandidates = scores
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(s => ({ platform: s.platform, score: s.score }));
    
    // SOTA: Calculate confidence interval
    const secondBestScore = scores.length > 1 ? scores.sort((a, b) => b.score - a.score)[1].score : 0;
    const scoreSpread = bestMatch.score - secondBestScore;
    const confidenceMin = Math.max(0, bestMatch.score - scoreSpread);
    const confidenceMax = Math.min(100, bestMatch.score + scoreSpread);
    
    // SOTA: Detect if multiple methods agree
    const detectionMethods: string[] = [];
    if (specData && planData) detectionMethods.push('multi-source');
    else if (specData) detectionMethods.push('specification');
    else if (planData) detectionMethods.push('plan');
    
    // Return generic platform for compatibility, but map to specific framework
    const platformMap = this.mapSpecificToGeneric(bestMatch.platform);
    
    return {
      platform: platformMap.platform as PlatformType,
      framework: bestMatch.platform as FrameworkType,
      language: bestMatch.language as LanguageType,
      confidence: bestMatch.score,
      detectedFrom: bestMatch.detectedFrom,
      // SOTA features
      topCandidates,
      detectionMethods,
      confidenceRange: { min: confidenceMin, max: confidenceMax }
    };
  }

  private mapSpecificToGeneric(specificPlatform: string): { platform: string } {
    const mapping: Record<string, string> = {
      'nextjs': 'web',
      'react-native': 'mobile',
      'ios-native': 'mobile',
      'android-native': 'mobile',
      'java-spring': 'backend',
      'python-django': 'backend',
      'nodejs-express': 'backend',
      'go': 'backend'
    };
    
    return { platform: mapping[specificPlatform] || 'web' };
  }

  private async scorePlatforms(specData: any, planData: any, platforms: readonly string[]): Promise<Array<{platform: string, framework: string, language: string, score: number, detectedFrom: string[]}>> {
    const scores: Array<{platform: string, framework: string, language: string, score: number, detectedFrom: string[]}> = [];
    
    for (const platform of platforms) {
      const score = this.calculatePlatformScore(platform, specData, planData);
      const { framework, language } = this.getPlatformDefaults(platform);
      const detectedFrom = this.getDetectionSources(platform, specData, planData);
      
      scores.push({
        platform,
        framework,
        language,
        score,
        detectedFrom
      });
    }
    
    return scores;
  }

  private calculatePlatformScore(platform: string, specData: any, planData: any): number {
    let score = 0;
    const text = JSON.stringify({ specData, planData }).toLowerCase();
    
    const keywords: Record<string, Array<{term: string, weight: number}>> = {
      'nextjs': [
        { term: 'next.js 15', weight: 25 },
        { term: 'next.js 14', weight: 25 },
        { term: 'next.js 13', weight: 25 },
        { term: 'next.js', weight: 25 },
        { term: 'nextjs', weight: 22 },
        { term: 'app router', weight: 15 },
        { term: 'server component', weight: 12 },
        { term: 'react server component', weight: 12 },
        { term: 'web app', weight: 15 },
        { term: 'web application', weight: 15 },
        { term: 'postgresql', weight: 8 },
        { term: 'api', weight: 5 },
        { term: 'gemini', weight: 8 },
        { term: 'turbopack', weight: 10 },
        { term: 'typescript', weight: 5 },
        { term: 'tailwind', weight: 8 },
        { term: 'next', weight: 3 }
      ],
      'react-native': [
        { term: 'react-native', weight: 25 },
        { term: 'react native', weight: 22 },
        { term: 'expo', weight: 15 },
        { term: 'rn', weight: 12 },
        { term: 'reactnative', weight: 12 },
        { term: 'mobile', weight: 8 },
        { term: 'ios app', weight: 10 },
        { term: 'android app', weight: 10 },
        { term: 'cross-platform mobile', weight: 12 },
        { term: 'react navigation', weight: 10 },
        { term: 'mobile app', weight: 10 }
      ],
      'ios-native': [
        { term: 'swiftui', weight: 25 }, // Higher weight for SwiftUI (explicit framework)
        { term: 'swift', weight: 22 }, // High weight for Swift language
        { term: 'ios', weight: 20 }, // High weight for iOS
        { term: 'uikit', weight: 15 },
        { term: 'xcode', weight: 15 },
        { term: 'cocoapods', weight: 10 },
        { term: 'swift package manager', weight: 10 },
        { term: 'spm', weight: 10 },
        { term: 'objective-c', weight: 10 },
        { term: 'native ios', weight: 18 },
        { term: 'apple', weight: 8 },
        { term: 'app store', weight: 12 },
        { term: 'ios app', weight: 15 }, // Explicit iOS app mention
        { term: 'ios native', weight: 18 } // Explicit native iOS
      ],
      'android-native': [
        { term: 'kotlin', weight: 20 },
        { term: 'android', weight: 18 },
        { term: 'gradle', weight: 15 },
        { term: 'android studio', weight: 15 },
        { term: 'jetpack compose', weight: 20 },
        { term: 'jetpack', weight: 12 },
        { term: 'room', weight: 12 },
        { term: 'mvvm', weight: 10 },
        { term: 'lifecycle', weight: 8 },
        { term: 'material design', weight: 10 },
        { term: 'google android', weight: 12 }
      ],
      'java-spring': [
        { term: 'spring boot', weight: 25 },
        { term: 'spring', weight: 20 },
        { term: 'java', weight: 15 },
        { term: 'maven', weight: 12 },
        { term: 'gradle', weight: 12 },
        { term: 'jpa', weight: 10 },
        { term: 'hibernate', weight: 10 },
        { term: 'rest api', weight: 8 },
        { term: 'microservices', weight: 10 },
        { term: 'spring framework', weight: 18 }
      ],
      'python-django': [
        { term: 'django', weight: 20 },
        { term: 'django rest', weight: 18 },
        { term: 'python', weight: 15 },
        { term: 'drf', weight: 12 },
        { term: 'django orm', weight: 12 },
        { term: 'python web', weight: 10 },
        { term: 'wsgi', weight: 10 },
        { term: 'asgi', weight: 10 },
        { term: 'python framework', weight: 12 }
      ],
      'nodejs-express': [
        { term: 'express', weight: 18 },
        { term: 'node.js', weight: 15 },
        { term: 'nodejs', weight: 15 },
        { term: 'npm', weight: 8 },
        { term: 'javascript', weight: 10 },
        { term: 'typescript', weight: 10 },
        { term: 'middleware', weight: 8 },
        { term: 'rest api', weight: 8 },
        { term: 'backend api', weight: 10 },
        { term: 'express.js', weight: 15 }
      ],
      'go': [
        { term: 'golang', weight: 18 },
        { term: 'go', weight: 15 },
        { term: 'gin', weight: 12 },
        { term: 'echo', weight: 12 },
        { term: 'fiber', weight: 12 },
        { term: 'goroutine', weight: 10 },
        { term: 'go modules', weight: 12 },
        { term: 'go mod', weight: 12 },
        { term: 'standard library', weight: 8 },
        { term: 'microservices', weight: 10 },
        { term: 'golang backend', weight: 12 }
      ]
    };
    
    const platformKeywords = keywords[platform] || [];
    
    // Calculate weighted score from all keyword matches
    for (const { term, weight } of platformKeywords) {
      if (text.includes(term)) {
        score += weight;
      }
    }
    
    // Boost score if platform is explicitly mentioned
    if (text.includes(platform)) {
      score += 10;
    }
    
    // CRITICAL: Penalty for react-native when Swift/SwiftUI is explicitly mentioned
    // If spec explicitly mentions Swift or SwiftUI, strongly favor ios-native
    if (platform === 'react-native' && (text.includes('swift') || text.includes('swiftui'))) {
      score -= 30; // Strong penalty to prevent react-native from winning
    }
    
    // CRITICAL: Boost ios-native when Swift/SwiftUI is mentioned
    if (platform === 'ios-native' && (text.includes('swift') || text.includes('swiftui'))) {
      score += 15; // Additional boost for explicit Swift/SwiftUI mentions
    }
    
    // Apply exponential decay to normalize scores (prevents runaway scores)
    const normalizedScore = Math.min(score * 1.5, 100);
    
    return Math.round(normalizedScore);
  }

  private getPlatformDefaults(platform: string): { framework: FrameworkType, language: LanguageType } {
    const defaults: Record<string, { framework: FrameworkType, language: LanguageType }> = {
      'nextjs': { framework: 'nextjs', language: 'typescript' },
      'react-native': { framework: 'react-native', language: 'typescript' },
      'ios-native': { framework: 'ios-native', language: 'swift' },
      'android-native': { framework: 'android-native', language: 'kotlin' },
      'java-spring': { framework: 'java-spring', language: 'java' },
      'python-django': { framework: 'python-django', language: 'python' },
      'nodejs-express': { framework: 'nodejs-express', language: 'typescript' },
      'go': { framework: 'go', language: 'go' }
    };
    
    return defaults[platform] || { framework: 'unknown', language: 'unknown' };
  }

  private getDetectionSources(platform: string, specData: any, planData: any): string[] {
    const sources: string[] = [];
    
    if (specData?.technologyStack) sources.push('technology_stack');
    if (specData?.functionalRequirements) sources.push('functional_requirements');
    if (specData?.userStories) sources.push('user_stories');
    if (specData?.apiSpecification) sources.push('api_specification');
    if (planData?.technicalContext) sources.push('technical_context');
    
    return sources;
  }
}

