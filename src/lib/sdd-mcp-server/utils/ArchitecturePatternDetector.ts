/**
 * Architecture Pattern Detection Engine
 * Detects backend architecture pattern from user input, spec, plan, dependencies, and codebase
 * 
 * Patterns:
 * - baas-firebase: Firebase SDK, Firestore, Firebase Auth (client-side BaaS)
 * - baas-supabase: Supabase client, PostgREST (client-side BaaS)
 * - baas-amplify: AWS Amplify, AppSync (client-side BaaS)
 * - traditional-backend: Express/FastAPI/ASP.NET controllers (server-side API)
 * - serverless: Lambda, Cloud Functions, Vercel Functions
 * - hybrid: Mixed patterns (e.g., Firebase + custom API)
 * - unknown: Default fallback
 */

import * as path from 'path';
import * as fs from 'fs';

export type ArchitecturePatternType = 
  | 'baas-firebase' 
  | 'baas-supabase' 
  | 'baas-amplify' 
  | 'traditional-backend' 
  | 'serverless' 
  | 'hybrid' 
  | 'unknown';

export type DetectionSource = 'user-input' | 'spec' | 'plan' | 'dependencies' | 'codebase';

export interface ArchitecturePattern {
  pattern: ArchitecturePatternType;
  confidence: number; // 0-100
  indicators: string[]; // What evidence led to this detection
  detectedFrom: DetectionSource[];
}

/**
 * Architecture Pattern Detection Engine
 */
export class ArchitecturePatternDetector {
  /**
   * Detect architecture pattern from user input
   */
  detectFromInput(userInput: string): ArchitecturePattern {
    const input = userInput.toLowerCase();
    const indicators: string[] = [];
    const detectedFrom: DetectionSource[] = ['user-input'];
    let confidence = 0;
    let pattern: ArchitecturePatternType = 'unknown';

    // Firebase detection
    if (input.includes('firebase')) {
      indicators.push('firebase mentioned in input');
      confidence += 50;
      
      if (input.includes('firestore') || input.includes('firebase auth') || input.includes('firebase sdk')) {
        indicators.push('firebase components mentioned');
        confidence += 30;
      }
      
      if (input.includes('backend') || input.includes('api')) {
        // Might be hybrid if also mentions API
        if (input.includes('custom') || input.includes('express') || input.includes('api endpoint')) {
          pattern = 'hybrid';
          indicators.push('firebase + custom api mentioned');
          confidence += 20;
        } else {
          pattern = 'baas-firebase';
          confidence += 20;
        }
      } else {
        pattern = 'baas-firebase';
        confidence += 20;
      }
    }

    // Supabase detection
    if (input.includes('supabase')) {
      indicators.push('supabase mentioned in input');
      confidence += 50;
      
      if (input.includes('postgrest') || input.includes('rls') || input.includes('row level security')) {
        indicators.push('supabase components mentioned');
        confidence += 30;
      }
      
      pattern = 'baas-supabase';
      confidence += 20;
    }

    // AWS Amplify detection
    if (input.includes('amplify') || input.includes('appsync')) {
      indicators.push('aws amplify/appsync mentioned in input');
      confidence += 50;
      pattern = 'baas-amplify';
      confidence += 20;
    }

    // Serverless detection
    if (input.includes('serverless') || input.includes('lambda') || input.includes('cloud functions') || input.includes('vercel functions')) {
      indicators.push('serverless keywords mentioned');
      confidence += 40;
      
      if (input.includes('lambda')) {
        indicators.push('aws lambda mentioned');
        confidence += 20;
      }
      
      if (input.includes('cloud functions') || input.includes('gcp')) {
        indicators.push('gcp cloud functions mentioned');
        confidence += 20;
      }
      
      if (input.includes('vercel functions')) {
        indicators.push('vercel functions mentioned');
        confidence += 20;
      }
      
      pattern = 'serverless';
      confidence += 20;
    }

    // Traditional backend detection
    if (input.includes('express') || input.includes('fastapi') || input.includes('asp.net') || input.includes('rest api') || input.includes('api server')) {
      indicators.push('traditional backend framework mentioned');
      confidence += 40;
      
      if (input.includes('controllers') || input.includes('routes') || input.includes('endpoints')) {
        indicators.push('server-side architecture mentioned');
        confidence += 30;
      }
      
      if (pattern === 'unknown') {
        pattern = 'traditional-backend';
        confidence += 30;
      } else if (pattern !== 'hybrid') {
        // If we already detected BaaS but now see traditional backend, it's hybrid
        pattern = 'hybrid';
        indicators.push('mixed architecture detected');
        confidence = Math.min(confidence + 20, 85);
      }
    }

    // Cap confidence at 100
    confidence = Math.min(confidence, 100);

    return {
      pattern: pattern !== 'unknown' ? pattern : 'traditional-backend', // Default to traditional if unclear
      confidence,
      indicators: indicators.length > 0 ? indicators : ['no clear indicators'],
      detectedFrom
    };
  }

  /**
   * Detect architecture pattern from spec content
   */
  detectFromSpec(specContent: string): ArchitecturePattern {
    const content = specContent.toLowerCase();
    const indicators: string[] = [];
    const detectedFrom: DetectionSource[] = ['spec'];
    let confidence = 0;
    let pattern: ArchitecturePatternType = 'unknown';

    // Check metadata for architecture pattern
    const architectureMatch = specContent.match(/architecture.*pattern[:\s]*(\w+)/i);
    if (architectureMatch) {
      const detectedPattern = architectureMatch[1].toLowerCase();
      if (detectedPattern.includes('firebase')) pattern = 'baas-firebase';
      else if (detectedPattern.includes('supabase')) pattern = 'baas-supabase';
      else if (detectedPattern.includes('amplify')) pattern = 'baas-amplify';
      else if (detectedPattern.includes('serverless')) pattern = 'serverless';
      else if (detectedPattern.includes('hybrid')) pattern = 'hybrid';
      else if (detectedPattern.includes('traditional')) pattern = 'traditional-backend';
      
      if (pattern !== 'unknown') {
        indicators.push(`architecture pattern found in spec metadata: ${detectedPattern}`);
        confidence += 70;
      }
    }

    // Check technology stack section
    if (content.includes('firebase')) {
      indicators.push('firebase in technology stack');
      if (pattern === 'unknown') {
        pattern = 'baas-firebase';
        confidence += 40;
      } else if (pattern !== 'baas-firebase') {
        pattern = 'hybrid';
        confidence += 30;
      }
    }

    if (content.includes('supabase')) {
      indicators.push('supabase in technology stack');
      if (pattern === 'unknown') {
        pattern = 'baas-supabase';
        confidence += 40;
      }
    }

    if (content.includes('aws amplify') || content.includes('appsync')) {
      indicators.push('aws amplify in technology stack');
      if (pattern === 'unknown') {
        pattern = 'baas-amplify';
        confidence += 40;
      }
    }

    // Check for serverless mentions
    if (content.includes('lambda') || content.includes('cloud functions') || content.includes('serverless')) {
      indicators.push('serverless in technology stack');
      if (pattern === 'unknown') {
        pattern = 'serverless';
        confidence += 40;
      } else if (!pattern.startsWith('baas-')) {
        pattern = 'hybrid';
        confidence += 20;
      }
    }

    // Check for traditional backend indicators
    if (content.includes('express') || content.includes('fastapi') || content.includes('rest api') || content.includes('api endpoints')) {
      indicators.push('traditional backend in technology stack');
      if (pattern === 'unknown') {
        pattern = 'traditional-backend';
        confidence += 40;
      } else if (pattern.startsWith('baas-')) {
        pattern = 'hybrid';
        indicators.push('mixed baas + traditional backend');
        confidence = Math.min(confidence + 20, 85);
      }
    }

    confidence = Math.min(confidence, 100);

    return {
      pattern: pattern !== 'unknown' ? pattern : 'traditional-backend',
      confidence,
      indicators: indicators.length > 0 ? indicators : ['no clear indicators in spec'],
      detectedFrom
    };
  }

  /**
   * Detect architecture pattern from plan content
   */
  detectFromPlan(planContent: string): ArchitecturePattern {
    const content = planContent.toLowerCase();
    const indicators: string[] = [];
    const detectedFrom: DetectionSource[] = ['plan'];
    let confidence = 0;
    let pattern: ArchitecturePatternType = 'unknown';

    // Check technical context section
    if (content.includes('firebase')) {
      indicators.push('firebase in technical context');
      pattern = 'baas-firebase';
      confidence += 50;
    }

    if (content.includes('supabase')) {
      indicators.push('supabase in technical context');
      pattern = 'baas-supabase';
      confidence += 50;
    }

    if (content.includes('aws amplify') || content.includes('appsync')) {
      indicators.push('aws amplify in technical context');
      pattern = 'baas-amplify';
      confidence += 50;
    }

    if (content.includes('serverless') || content.includes('lambda') || content.includes('cloud functions')) {
      indicators.push('serverless in technical context');
      if (pattern === 'unknown') {
        pattern = 'serverless';
        confidence += 50;
      } else {
        pattern = 'hybrid';
        confidence += 30;
      }
    }

    // Check architecture description
    if (content.includes('client-side') && content.includes('sdk')) {
      indicators.push('client-side sdk architecture');
      if (pattern === 'unknown') {
        pattern = 'baas-firebase'; // Default assumption, but could be any BaaS
        confidence += 30;
      }
    }

    if (content.includes('server-side') && (content.includes('controller') || content.includes('api layer'))) {
      indicators.push('server-side api architecture');
      if (pattern === 'unknown') {
        pattern = 'traditional-backend';
        confidence += 40;
      } else if (pattern.startsWith('baas-')) {
        pattern = 'hybrid';
        confidence += 20;
      }
    }

    confidence = Math.min(confidence, 100);

    return {
      pattern: pattern !== 'unknown' ? pattern : 'traditional-backend',
      confidence,
      indicators: indicators.length > 0 ? indicators : ['no clear indicators in plan'],
      detectedFrom
    };
  }

  /**
   * Detect architecture pattern from package.json dependencies
   */
  detectFromDependencies(packageJsonPath: string): ArchitecturePattern {
    const indicators: string[] = [];
    const detectedFrom: DetectionSource[] = ['dependencies'];
    let confidence = 0;
    let pattern: ArchitecturePatternType = 'unknown';

    if (!fs.existsSync(packageJsonPath)) {
      return {
        pattern: 'unknown',
        confidence: 0,
        indicators: ['package.json not found'],
        detectedFrom
      };
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      const depNames = Object.keys(deps).map(k => k.toLowerCase());

      // Firebase detection
      if (depNames.some(d => d.includes('firebase'))) {
        indicators.push('firebase dependency found');
        pattern = 'baas-firebase';
        confidence += 60;
      }

      // Supabase detection
      if (depNames.some(d => d.includes('supabase'))) {
        indicators.push('supabase dependency found');
        pattern = 'baas-supabase';
        confidence += 60;
      }

      // AWS Amplify detection
      if (depNames.some(d => d.includes('amplify') || d.includes('appsync'))) {
        indicators.push('aws amplify dependency found');
        pattern = 'baas-amplify';
        confidence += 60;
      }

      // Serverless detection (less reliable from deps alone)
      if (depNames.some(d => d.includes('serverless') || d.includes('aws-lambda'))) {
        indicators.push('serverless dependency found');
        if (pattern === 'unknown') {
          pattern = 'serverless';
          confidence += 40;
        }
      }

      // Traditional backend detection
      if (depNames.some(d => d.includes('express') || d.includes('fastify') || d.includes('koa'))) {
        indicators.push('traditional backend framework dependency found');
        if (pattern === 'unknown') {
          pattern = 'traditional-backend';
          confidence += 50;
        } else if (pattern.startsWith('baas-')) {
          pattern = 'hybrid';
          indicators.push('mixed baas + traditional backend dependencies');
          confidence = Math.min(confidence + 20, 85);
        }
      }

      confidence = Math.min(confidence, 100);
    } catch (error) {
      indicators.push('error reading package.json');
    }

    return {
      pattern: pattern !== 'unknown' ? pattern : 'unknown',
      confidence,
      indicators: indicators.length > 0 ? indicators : ['no architecture indicators in dependencies'],
      detectedFrom
    };
  }

  /**
   * Detect architecture pattern from codebase structure
   */
  detectFromCodebase(projectRoot: string): ArchitecturePattern {
    const indicators: string[] = [];
    const detectedFrom: DetectionSource[] = ['codebase'];
    let confidence = 0;
    let pattern: ArchitecturePatternType = 'unknown';

    // Check for Firebase config files
    const firebaseConfig = path.join(projectRoot, 'firebase.json');
    const firebaseRc = path.join(projectRoot, '.firebaserc');
    if (fs.existsSync(firebaseConfig) || fs.existsSync(firebaseRc)) {
      indicators.push('firebase configuration files found');
      pattern = 'baas-firebase';
      confidence += 50;
    }

    // Check for Supabase config
    const supabaseConfig = path.join(projectRoot, 'supabase', 'config.toml');
    if (fs.existsSync(supabaseConfig)) {
      indicators.push('supabase configuration found');
      pattern = 'baas-supabase';
      confidence += 50;
    }

    // Check for serverless config
    const serverlessYml = path.join(projectRoot, 'serverless.yml');
    const serverlessYaml = path.join(projectRoot, 'serverless.yaml');
    if (fs.existsSync(serverlessYml) || fs.existsSync(serverlessYaml)) {
      indicators.push('serverless configuration found');
      if (pattern === 'unknown') {
        pattern = 'serverless';
        confidence += 50;
      }
    }

    // Check directory structure
    const srcPath = path.join(projectRoot, 'src');
    if (fs.existsSync(srcPath)) {
      const dirs = fs.readdirSync(srcPath, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name.toLowerCase());

      // Traditional backend indicators
      const hasControllers = dirs.some(d => d.includes('controller') || d.includes('route'));
      const hasServices = dirs.some(d => d.includes('service'));
      const hasApi = dirs.some(d => d.includes('api') && !d.includes('client'));

      if (hasControllers || hasApi) {
        indicators.push('server-side architecture structure found');
        if (pattern === 'unknown') {
          pattern = 'traditional-backend';
          confidence += 40;
        } else if (pattern.startsWith('baas-')) {
          pattern = 'hybrid';
          indicators.push('mixed structure: baas + server-side');
          confidence = Math.min(confidence + 20, 85);
        }
      }

      // Client-side service indicators (BaaS)
      const hasClientServices = dirs.some(d => d.includes('service') && !hasServices);
      if (hasClientServices && !hasControllers && pattern === 'unknown') {
        indicators.push('client-side services structure found');
        // Could be BaaS, but need more evidence
        confidence += 20;
      }
    }

    confidence = Math.min(confidence, 100);

    return {
      pattern: pattern !== 'unknown' ? pattern : 'unknown',
      confidence,
      indicators: indicators.length > 0 ? indicators : ['no clear architecture structure'],
      detectedFrom
    };
  }

  /**
   * Comprehensive detection combining all sources
   */
  async detectComprehensive(options: {
    userInput?: string;
    specContent?: string;
    planContent?: string;
    projectRoot?: string;
  }): Promise<ArchitecturePattern> {
    const results: ArchitecturePattern[] = [];
    const allIndicators: string[] = [];
    const allDetectedFrom: DetectionSource[] = [];

    // Detect from each source
    if (options.userInput) {
      const result = this.detectFromInput(options.userInput);
      results.push(result);
      allIndicators.push(...result.indicators);
      allDetectedFrom.push(...result.detectedFrom);
    }

    if (options.specContent) {
      const result = this.detectFromSpec(options.specContent);
      results.push(result);
      allIndicators.push(...result.indicators);
      allDetectedFrom.push(...result.detectedFrom);
    }

    if (options.planContent) {
      const result = this.detectFromPlan(options.planContent);
      results.push(result);
      allIndicators.push(...result.indicators);
      allDetectedFrom.push(...result.detectedFrom);
    }

    if (options.projectRoot) {
      // Check dependencies
      const packageJsonPath = path.join(options.projectRoot, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const result = this.detectFromDependencies(packageJsonPath);
        if (result.pattern !== 'unknown') {
          results.push(result);
          allIndicators.push(...result.indicators);
          allDetectedFrom.push(...result.detectedFrom);
        }
      }

      // Check codebase structure
      const result = this.detectFromCodebase(options.projectRoot);
      if (result.pattern !== 'unknown') {
        results.push(result);
        allIndicators.push(...result.indicators);
        allDetectedFrom.push(...result.detectedFrom);
      }
    }

    // Determine consensus pattern
    if (results.length === 0) {
      return {
        pattern: 'traditional-backend', // Default
        confidence: 30,
        indicators: ['no detection sources provided'],
        detectedFrom: []
      };
    }

    // Count pattern occurrences
    const patternCounts = new Map<ArchitecturePatternType, number>();
    const patternConfidences = new Map<ArchitecturePatternType, number[]>();

    results.forEach(result => {
      if (result.pattern !== 'unknown') {
        patternCounts.set(result.pattern, (patternCounts.get(result.pattern) || 0) + 1);
        const confidences = patternConfidences.get(result.pattern) || [];
        confidences.push(result.confidence);
        patternConfidences.set(result.pattern, confidences);
      }
    });

    // Find most common pattern
    let consensusPattern: ArchitecturePatternType = 'traditional-backend';
    let maxCount = 0;
    
    patternCounts.forEach((count, pattern) => {
      if (count > maxCount) {
        maxCount = count;
        consensusPattern = pattern;
      }
    });

    // Handle hybrid detection (if multiple different patterns detected)
    const uniquePatterns = Array.from(patternCounts.keys());
    if (uniquePatterns.length > 1 && !uniquePatterns.includes('hybrid')) {
      // Multiple different patterns = hybrid
      consensusPattern = 'hybrid';
      allIndicators.push('multiple architecture patterns detected = hybrid');
    }

    // Calculate weighted confidence
    const confidences = patternConfidences.get(consensusPattern) || [50];
    const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    const sourceBonus = results.length * 5; // Bonus for multiple sources agreeing
    const consensusBonus = maxCount > 1 ? 15 : 0; // Bonus for consensus
    
    const finalConfidence = Math.min(
      avgConfidence + sourceBonus + consensusBonus,
      100
    );

    return {
      pattern: consensusPattern,
      confidence: Math.round(finalConfidence),
      indicators: Array.from(new Set(allIndicators)), // Remove duplicates
      detectedFrom: Array.from(new Set(allDetectedFrom))
    };
  }
}

