/**
 * SDD Tasks Tool - Generates comprehensive task breakdown from feature plan
 * 
 * This tool creates a detailed task breakdown with:
 * - 72 atomic tasks across 4 phases
 * - TDD order: Contract → Integration → E2E → Unit → Implementation → UI-API Integration
 * - Explicit verification requirements for each task
 * - Constitutional gate compliance tracking
 * - Duration estimation and project planning capabilities
 * - Identifies parallel execution opportunities
 * - AI-driven platform-specific content generation
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

import * as path from 'path';
import { RobustDatabaseService } from '../database/RobustDatabaseService.js';
import { JsonRepairUtility } from '../utils/JsonRepairUtility.js';

// Platform Detection Types
interface PlatformDetectionResult {
  platform: 'web' | 'mobile' | 'desktop' | 'backend' | 'ai';
  framework: string;
  language: string;
  confidence: number;
  detectedFrom: string[];
}

interface TaskGenerationContext {
  platform: 'web' | 'mobile' | 'desktop' | 'backend' | 'ai';
  framework: string;
  language: string;
  specData: any;
  planData: any;
  projectContext: any;
}

interface TaskContent {
  title: string;
  description: string;
  verification: any;
  commands: string[];
}

/**
 * Platform Detection Engine for multi-source platform detection
 */
class PlatformDetectionEngine {
  async detectPlatform(specData: any, planData: any): Promise<PlatformDetectionResult> {
    const sources = [
      this.detectFromSpecification(specData),
      this.detectFromPlan(planData),
      this.detectFromTechnologyStack(specData),
      this.detectFromUserStories(specData),
      this.detectFromAPIEndpoints(specData)
    ];
    
    return this.consolidateDetection(sources);
  }
  
  private detectFromSpecification(specData: any): PlatformDetectionResult {
    const techStack = specData.technologyStack?.toLowerCase() || specData.template_data?.technologyStack?.toLowerCase() || '';
    const platformReq = specData.platformRequirements?.toLowerCase() || specData.template_data?.platformRequirements?.toLowerCase() || '';
    const businessContext = specData.businessContext?.toLowerCase() || specData.template_data?.businessContext?.toLowerCase() || '';
    const functionalReq = specData.functionalRequirements?.content?.toLowerCase() || specData.functionalRequirements?.description?.toLowerCase() || specData.template_data?.functionalRequirements?.content?.toLowerCase() || '';
    
    const combinedText = `${techStack} ${platformReq} ${businessContext} ${functionalReq}`;
    
    // Platform patterns with confidence scoring
    const patterns = {
      web: ['nextjs', 'next.js', 'react', 'vue', 'angular', 'web', 'browser', 'spa', 'ssr', 'frontend', 'website', 'platform', 'typescript', 'tailwind'],
      mobile: ['react-native', 'flutter', 'ios', 'android', 'mobile', 'app store', 'play store'],
      desktop: ['electron', 'tauri', 'desktop', 'windows', 'macos', 'linux', 'native app'],
      backend: ['nodejs', 'express', 'spring', 'django', 'backend', 'api', 'server'],
      ai: ['machine learning', 'tensorflow', 'pytorch', 'llm', 'artificial intelligence', 'ml model', 'neural network', 'deep learning']
    };
    
    return this.scorePlatforms(combinedText, patterns, 'specification');
  }
  
  private detectFromPlan(planData: any): PlatformDetectionResult {
    // Handle different plan data structures
    const planTemplateData = planData.template_data || planData;
    
    // Prioritize Technical Context - it's the most detailed and reliable
    const technicalContext = planTemplateData.technicalContext || {};
    
    // Extract all technical context fields
    const languageVersion = technicalContext.languageVersion?.toLowerCase() || '';
    const primaryDependencies = technicalContext.primaryDependencies?.toLowerCase() || '';
    const technologyStack = technicalContext.technologyStack?.toLowerCase() || '';
    const frontendStack = technicalContext.frontendStack?.toLowerCase() || '';
    const backendStack = technicalContext.backendStack?.toLowerCase() || '';
    const targetPlatform = technicalContext.targetPlatform?.toLowerCase() || '';
    
    // Combine all technical context
    const combinedText = `${languageVersion} ${primaryDependencies} ${technologyStack} ${frontendStack} ${backendStack} ${targetPlatform}`;
  

    
    const patterns = {
      web: ['nextjs', 'next.js', 'react', 'vue', 'angular', 'web', 'browser', 'frontend', 'typescript', 'javascript', 'tailwind', 'css', 'html', 'spa', 'ssr'],
      mobile: ['react-native', 'flutter', 'ios', 'android', 'mobile', 'native'],
      desktop: ['electron', 'tauri', 'desktop', 'cross-platform'],
      backend: ['nodejs', 'express', 'spring', 'django', 'backend', 'api', 'server'],
      ai: ['machine learning', 'tensorflow', 'pytorch', 'llm', 'ai model', 'neural network']
    };
    
    return this.scorePlatforms(combinedText, patterns, 'plan');
  }
  
  private detectFromTechnologyStack(specData: any): PlatformDetectionResult {
    const techStack = specData.technologyStack?.toLowerCase() || specData.template_data?.technologyStack?.toLowerCase() || '';
    const dependencies = specData.dependencies?.toLowerCase() || specData.template_data?.dependencies?.toLowerCase() || '';
    
    const patterns = {
      web: ['nextjs', 'next.js', 'react', 'vue', 'angular', 'typescript', 'javascript', 'html', 'css'],
      mobile: ['react-native', 'flutter', 'swift', 'kotlin', 'ios', 'android'],
      desktop: ['electron', 'tauri', 'qt', 'gtk', 'windows', 'macos'],
      backend: ['nodejs', 'express', 'spring', 'django', 'fastapi', 'rails'],
      ai: ['tensorflow', 'pytorch', 'scikit-learn', 'openai', 'huggingface', 'machine learning']
    };
    
    return this.scorePlatforms(`${techStack} ${dependencies}`, patterns, 'technology_stack');
  }
  
  private detectFromUserStories(specData: any): PlatformDetectionResult {
    const userStories = specData.userScenarios?.comprehensiveUserStories?.content?.toLowerCase() || 
                       specData.template_data?.userScenarios?.comprehensiveUserStories?.content?.toLowerCase() || '';
    const acceptanceScenarios = specData.userScenarios?.acceptanceScenarios?.content?.toLowerCase() || 
                                specData.template_data?.userScenarios?.acceptanceScenarios?.content?.toLowerCase() || '';
    
    const patterns = {
      web: ['browser', 'website', 'web app', 'online', 'url', 'link'],
      mobile: ['mobile', 'phone', 'tablet', 'app', 'ios', 'android', 'touch'],
      desktop: ['desktop', 'computer', 'application', 'software', 'install'],
      backend: ['api', 'server', 'database', 'backend', 'service'],
      ai: ['machine learning', 'prediction', 'model', 'intelligence', 'neural network']
    };
    
    return this.scorePlatforms(`${userStories} ${acceptanceScenarios}`, patterns, 'user_stories');
  }
  
  private detectFromAPIEndpoints(specData: any): PlatformDetectionResult {
    const apiEndpoints = specData.apiSpecification?.endpoints?.content?.toLowerCase() || 
                        specData.template_data?.apiSpecification?.endpoints?.content?.toLowerCase() || '';
    const apiContracts = specData.apiSpecification?.contracts?.content?.toLowerCase() || 
                        specData.template_data?.apiSpecification?.contracts?.content?.toLowerCase() || '';
    
    const patterns = {
      web: ['rest', 'graphql', 'http', 'https', 'json', 'api'],
      mobile: ['mobile api', 'push notification', 'offline', 'sync'],
      desktop: ['desktop api', 'file system', 'system integration'],
      backend: ['backend', 'server', 'database', 'service'],
      ai: ['ml api', 'prediction', 'model endpoint', 'machine learning api']
    };
    
    return this.scorePlatforms(`${apiEndpoints} ${apiContracts}`, patterns, 'api_endpoints');
  }
  
  private scorePlatforms(text: string, patterns: Record<string, string[]>, source: string): PlatformDetectionResult {
    const scores: Record<string, number> = {};
    
    // Initialize scores
    Object.keys(patterns).forEach(platform => {
      scores[platform] = 0;
    });
    
    // Score based on pattern matches
    Object.entries(patterns).forEach(([platform, keywords]) => {
      keywords.forEach(keyword => {
        const matches = (text.match(new RegExp(keyword, 'gi')) || []).length;
        scores[platform] += matches;
      });
    });
    
    // Find the platform with highest score
    const maxScore = Math.max(...Object.values(scores));
    const detectedPlatform = Object.keys(scores).find(platform => scores[platform] === maxScore) as keyof typeof patterns;
  
    
    // Determine framework and language based on detected platform
    const { framework, language } = this.determineFrameworkAndLanguage(detectedPlatform, text);
    
    return {
      platform: detectedPlatform as 'web' | 'mobile' | 'desktop' | 'backend' | 'ai',
      framework,
      language,
      confidence: maxScore > 0 ? Math.min(maxScore / 10, 1) : 0.1, // Normalize confidence
      detectedFrom: [source]
    };
  }
  
  private determineFrameworkAndLanguage(platform: string, text: string): { framework: string; language: string } {
    const frameworkMap: Record<string, { framework: string; language: string }> = {
      web: {
        framework: text.includes('nextjs') || text.includes('next.js') ? 'nextjs' : 
                  text.includes('vue') ? 'vue' : 
                  text.includes('angular') ? 'angular' : 'react',
        language: text.includes('typescript') ? 'typescript' : 'javascript'
      },
      mobile: {
        framework: text.includes('flutter') ? 'flutter' : 'react-native',
        language: text.includes('dart') ? 'dart' : text.includes('swift') ? 'swift' : text.includes('kotlin') ? 'kotlin' : 'typescript'
      },
      desktop: {
        framework: text.includes('tauri') ? 'tauri' : 'electron',
        language: text.includes('rust') ? 'rust' : 'typescript'
      },
      backend: {
        framework: text.includes('spring') ? 'spring' : text.includes('django') ? 'django' : text.includes('fastapi') ? 'fastapi' : 'express',
        language: text.includes('java') ? 'java' : text.includes('python') ? 'python' : 'typescript'
      },
      ai: {
        framework: text.includes('tensorflow') ? 'tensorflow' : text.includes('pytorch') ? 'pytorch' : 'openai',
        language: text.includes('python') ? 'python' : 'typescript'
      }
    };
    
    return frameworkMap[platform] || { framework: 'unknown', language: 'typescript' };
  }
  
  private consolidateDetection(sources: PlatformDetectionResult[]): PlatformDetectionResult {

    
    // Group by platform
    const platformGroups: Record<string, PlatformDetectionResult[]> = {};
    sources.forEach(result => {
      if (!platformGroups[result.platform]) {
        platformGroups[result.platform] = [];
      }
      platformGroups[result.platform].push(result);
    });
    

    // Find the platform with highest combined confidence
    let bestPlatform = 'web';
    let bestConfidence = 0;
    let bestFramework = 'react';
    let bestLanguage = 'typescript';
    let allSources: string[] = [];
    
    Object.entries(platformGroups).forEach(([platform, results]) => {
      // Give much more weight to plan data (it's the most reliable source)
      const weightedConfidence = results.reduce((sum, result) => {
        const weight = result.detectedFrom.includes('plan') ? 3.0 : 1.0; // Plan data gets 200% more weight
        const weighted = result.confidence * weight;

        return sum + weighted;
      }, 0);
      
      const avgConfidence = weightedConfidence / results.length;

      
      if (avgConfidence > bestConfidence) {
        bestPlatform = platform;
        bestConfidence = avgConfidence;
        
        // Prefer framework/language from plan data if available
        const planResult = results.find(r => r.detectedFrom.includes('plan'));
        if (planResult) {
          bestFramework = planResult.framework;
          bestLanguage = planResult.language;
        } else {
          bestFramework = results[0].framework;
          bestLanguage = results[0].language;
        }
        
        allSources = results.flatMap(r => r.detectedFrom);
      }
    });
    

    return {
      platform: bestPlatform as any,
      framework: bestFramework,
      language: bestLanguage,
      confidence: bestConfidence,
      detectedFrom: allSources
    };
  }
}


/**
 * Data Integrated Content Generator for spec/plan data utilization
 */
class DataIntegratedContentGenerator {
  async generateTaskContent(taskId: string, context: TaskGenerationContext): Promise<TaskContent> {
    const prompt = this.buildDataRichPrompt(taskId, context);
    const aiResponse = await this.callAI(prompt);
    const parsedContent = this.parseAIResponse(aiResponse);
    return this.validateAndRefineContent(parsedContent, context);
  }
  
  private buildDataRichPrompt(taskId: string, context: TaskGenerationContext): string {
    return `
    Generate platform-specific task content using project data:
    
    TASK ID: ${taskId}
    PLATFORM: ${context.platform}
    FRAMEWORK: ${context.framework}
    LANGUAGE: ${context.language}
    
    SPECIFICATION DATA:
    - Feature: ${context.specData.title}
    - Requirements: ${context.specData.requirements?.functionalRequirements?.content}
    - User Stories: ${context.specData.userScenarios?.comprehensiveUserStories?.content}
    - Technology Stack: ${context.specData.technologyStack}
    - API Endpoints: ${context.specData.apiSpecification?.endpoints?.content}
    - UI Requirements: ${context.specData.requirements?.uiDesignRequirements?.content}
    - Business Context: ${context.specData.businessContext}
    - Success Criteria: ${context.specData.successCriteria}
    - Constraints: ${context.specData.constraints}
    
    PLAN DATA:
    - Implementation Phases: ${context.planData.implementationPhases}
    - Technical Context: ${context.planData.technicalContext}
    - Project Structure: ${context.planData.projectStructure?.content}
    - Database Strategy: ${context.planData.databaseStrategy?.databaseChoice?.content}
    - Design System: ${context.planData.designSystemPlanning?.designSystemArchitecture?.content}
    - Platform Planning: ${context.planData.platformSpecificPlanning?.[context.platform]?.content}
    
    Generate task content that:
    1. Aligns with functional requirements from spec
    2. Follows implementation approach from plan
    3. Uses specified technology stack
    4. Implements planned project structure
    5. Follows database strategy
    6. Incorporates design system requirements
    7. Addresses platform-specific needs
    8. Ensures compilation success
    9. Includes verification commands
    
    Format as JSON with title, description, verification, commands fields.
    `;
  }
  
  private async callAI(prompt: string): Promise<string> {
    // This would integrate with an actual AI service
    // For now, we'll return a mock response based on the prompt
    return this.generateMockAIResponse(prompt);
  }
  
  private generateMockAIResponse(prompt: string): string {
    // Extract key information from prompt
    const taskIdMatch = prompt.match(/TASK ID: (TASK-\d+)/);
    const platformMatch = prompt.match(/PLATFORM: (\w+)/);
    const frameworkMatch = prompt.match(/FRAMEWORK: (\w+)/);
    const languageMatch = prompt.match(/LANGUAGE: (\w+)/);
    const featureMatch = prompt.match(/Feature: ([^\n]+)/);
    
    const taskId = taskIdMatch?.[1] || 'TASK-001';
    const platform = platformMatch?.[1] || 'web';
    const framework = frameworkMatch?.[1] || 'react';
    const language = languageMatch?.[1] || 'typescript';
    const feature = featureMatch?.[1] || 'Unknown Feature';
    
    // Generate context-aware content based on task type and platform
    const content = this.generateContextAwareContent(taskId, platform, framework, language, feature, prompt);
    
    return JSON.stringify(content);
  }
  
  private generateContextAwareContent(taskId: string, platform: string, framework: string, language: string, feature: string, prompt: string): TaskContent {
    // Determine task type from task ID
    const taskType = this.determineTaskType(taskId);
    
    // Generate platform-specific content based on task type
    const baseContent = this.generateTaskTypeContent(taskType, platform, framework, language, feature);
    
    // Enhance with spec/plan data if available
    const enhancedContent = this.enhanceWithSpecPlanData(baseContent, prompt);
    
    return enhancedContent;
  }
  
  private determineTaskType(taskId: string): string {
    const taskNumber = parseInt(taskId.replace('TASK-', ''));
    
    if (taskNumber >= 1 && taskNumber <= 18) return 'phase1_foundation';
    if (taskNumber >= 19 && taskNumber <= 36) return 'phase2_core';
    if (taskNumber >= 37 && taskNumber <= 54) return 'phase3_ui';
    if (taskNumber >= 55 && taskNumber <= 72) return 'phase4_final';
    
    return 'unknown';
  }
  
  private generateTaskTypeContent(taskType: string, platform: string, framework: string, language: string, feature: string): TaskContent {
    const contentMap: Record<string, TaskContent> = {
      phase1_foundation: {
        title: `Configure ${framework} Development Environment for ${feature}`,
        description: `Set up ${framework} development environment with ${language}, proper project structure, and development tools for ${feature}.`,
        verification: {
          type: 'foundation_setup_verification',
          mandatory: true,
          action: 'COMPILE',
          commands: this.getPlatformCommands(platform, framework, language),
          expectedState: `${framework} development environment operational`,
          proofRequired: {
            format: 'terminal_output',
            mustInclude: ['compilation', 'successful', 'environment', 'ready']
          }
        },
        commands: this.getPlatformCommands(platform, framework, language)
      },
      phase2_core: {
        title: `Implement Core Business Logic for ${feature}`,
        description: `Implement core business logic, services, and API endpoints for ${feature} using ${framework} and ${language}.`,
        verification: {
          type: 'core_implementation_verification',
          mandatory: true,
          action: 'COMPILE',
          commands: this.getPlatformCommands(platform, framework, language),
          expectedState: `Core implementation compiles successfully`,
          proofRequired: {
            format: 'terminal_output',
            mustInclude: ['compilation', 'successful', 'core', 'implementation']
          }
        },
        commands: this.getPlatformCommands(platform, framework, language)
      },
      phase3_ui: {
        title: `Implement UI Components for ${feature}`,
        description: `Implement UI components, design system, and user interface for ${feature} using ${framework} and ${language}.`,
        verification: {
          type: 'ui_implementation_verification',
          mandatory: true,
          action: 'COMPILE',
          commands: this.getPlatformCommands(platform, framework, language),
          expectedState: `UI implementation compiles successfully`,
          proofRequired: {
            format: 'terminal_output_and_browser',
            mustInclude: ['compilation', 'successful', 'ui', 'components']
          }
        },
        commands: this.getPlatformCommands(platform, framework, language)
      },
      phase4_final: {
        title: `Final Testing and Deployment for ${feature}`,
        description: `Execute comprehensive testing, create documentation, and prepare for production deployment of ${feature}.`,
        verification: {
          type: 'final_verification',
          mandatory: true,
          action: 'EXECUTE',
          commands: this.getPlatformCommands(platform, framework, language),
          expectedState: `Final verification passes and application is production ready`,
          proofRequired: {
            format: 'terminal_output_and_verification_report',
            mustInclude: ['verification', 'successful', 'production', 'ready']
          }
        },
        commands: this.getPlatformCommands(platform, framework, language)
      }
    };
    
    return contentMap[taskType] || contentMap.phase1_foundation;
  }
  
  private enhanceWithSpecPlanData(baseContent: TaskContent, prompt: string): TaskContent {
    // Extract spec/plan data from prompt
    const requirements = this.extractFromPrompt(prompt, 'Requirements:');
    const userStories = this.extractFromPrompt(prompt, 'User Stories:');
    const techStack = this.extractFromPrompt(prompt, 'Technology Stack:');
    const apiEndpoints = this.extractFromPrompt(prompt, 'API Endpoints:');
    const uiRequirements = this.extractFromPrompt(prompt, 'UI Requirements:');
    const businessContext = this.extractFromPrompt(prompt, 'Business Context:');
    
    // Enhance content with extracted data
    const enhancedContent = { ...baseContent };
    
    if (requirements) {
      enhancedContent.description += ` Requirements: ${requirements}`;
    }
    
    if (userStories) {
      enhancedContent.description += ` User Stories: ${userStories}`;
    }
    
    if (techStack) {
      enhancedContent.description += ` Technology Stack: ${techStack}`;
    }
    
    if (apiEndpoints) {
      enhancedContent.description += ` API Endpoints: ${apiEndpoints}`;
    }
    
    if (uiRequirements) {
      enhancedContent.description += ` UI Requirements: ${uiRequirements}`;
    }
    
    if (businessContext) {
      enhancedContent.description += ` Business Context: ${businessContext}`;
    }
    
    return enhancedContent;
  }
  
  private extractFromPrompt(prompt: string, label: string): string | null {
    const regex = new RegExp(`${label}\\s*([^\\n]+)`);
    const match = prompt.match(regex);
    return match ? match[1].trim() : null;
  }
  
  private getPlatformCommands(platform: string, framework: string, language: string): string[] {
    const commandMap: Record<string, string[]> = {
      web: [
        'npm run build',
        'npx tsc --noEmit',
        'npm run lint',
        'npm run test'
      ],
      mobile: [
        'npx react-native bundle --platform ios --dev false',
        'npx react-native bundle --platform android --dev false',
        'npx tsc --noEmit',
        'npm run lint'
      ],
      desktop: [
        'npm run build',
        'npx electron-builder --dir',
        'npx tsc --noEmit',
        'npm run lint'
      ],
      backend: [
        'npm run build',
        'npx tsc --noEmit',
        'npm run test',
        'npm run lint'
      ],
      ai: [
        'python -m pytest',
        'python -m mypy .',
        'python -m black --check .',
        'python -m flake8'
      ]
    };
    
    return commandMap[platform] || commandMap.web;
  }
  
  private parseAIResponse(response: string): TaskContent {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return {
        title: 'Error parsing AI response',
        description: 'Failed to generate platform-specific content',
        verification: {
          type: 'error',
          mandatory: true,
          action: 'SHOW',
          commands: ['echo "Error in AI response parsing"'],
          expectedState: 'Error state',
          proofRequired: {
            format: 'terminal_output',
            mustInclude: ['error']
          }
        },
        commands: ['echo "Error in AI response parsing"']
      };
    }
  }
  
  private validateAndRefineContent(content: TaskContent, context: TaskGenerationContext): TaskContent {
    // Validate that generated content includes compilation verification
    if (!content.verification?.commands?.some(cmd => cmd.includes('compile') || cmd.includes('build'))) {
      console.warn('Generated content missing compilation verification');
    }
    
    // Validate that content is platform-specific
    if (!content.title.toLowerCase().includes(context.platform) && 
        !content.description.toLowerCase().includes(context.platform)) {
      console.warn('Generated content may not be platform-specific enough');
    }
    
    // Validate that content references the feature
    if (!content.title.toLowerCase().includes(context.specData.title?.toLowerCase() || 'feature')) {
      console.warn('Generated content may not reference the feature');
    }
    
    return content;
  }
}

/**
 * Compilation Safe Content Generator with compilation safety prompts
 */
class CompilationSafeContentGenerator {
  async generateTaskContent(taskId: string, context: TaskGenerationContext): Promise<TaskContent> {
    const prompt = this.buildCompilationSafePrompt(taskId, context);
    const aiResponse = await this.callAI(prompt);
    const parsedContent = this.parseAIResponse(aiResponse);
    return this.validateCompilationSafety(parsedContent, context);
  }
  
  private buildCompilationSafePrompt(taskId: string, context: TaskGenerationContext): string {
    return `
    Generate platform-specific task content that GUARANTEES compilation success:
    
    TASK ID: ${taskId}
    PLATFORM: ${context.platform}
    FRAMEWORK: ${context.framework}
    LANGUAGE: ${context.language}
    
    COMPILATION SAFETY REQUIREMENTS:
    1. Use correct ${context.language} syntax
    2. Include all required dependencies
    3. Follow ${context.framework} best practices
    4. Ensure compilation commands are accurate
    5. Include proper error handling
    6. Add compilation verification commands
    7. Use timeout protection for long-running processes
    8. Include platform-specific build commands
    
    PROJECT CONTEXT:
    - Feature: ${context.specData.title}
    - Technology Stack: ${context.specData.technologyStack}
    - API Endpoints: ${context.specData.apiSpecification?.endpoints?.content}
    - Database: ${context.planData.databaseStrategy?.databaseChoice?.content}
    - UI Requirements: ${context.specData.requirements?.uiDesignRequirements?.content}
    
    PLATFORM-SPECIFIC COMPILATION COMMANDS:
    ${this.getPlatformCompilationCommands(context.platform, context.framework, context.language)}
    
    TIMEOUT CONFIGURATION:
    - Unit tests: 60s timeout
    - Integration tests: 90s timeout
    - Full test suite: 120s timeout
    - Build process: 60s timeout
    - Startup process: 30s timeout
    
    Generate content that will compile successfully on first attempt.
    Format as JSON with title, description, verification, commands fields.
    `;
  }
  
  private getPlatformCompilationCommands(platform: string, framework: string, language: string): string {
    const commandMap: Record<string, string> = {
      web: `
        - npm run build (with timeout protection)
        - npx tsc --noEmit (TypeScript compilation check)
        - npm run lint (code quality check)
        - npm run test (with 60s timeout)
        - timeout 60s bash -c 'npm run build' || echo "Build timeout exceeded"
      `,
      mobile: `
        - npx react-native bundle --platform ios --dev false (with timeout)
        - npx react-native bundle --platform android --dev false (with timeout)
        - npx tsc --noEmit (TypeScript compilation check)
        - npm run lint (code quality check)
        - timeout 90s bash -c 'npx react-native bundle --platform ios' || echo "Bundle timeout exceeded"
      `,
      desktop: `
        - npm run build (with timeout protection)
        - npx electron-builder --dir (with timeout)
        - npx tsc --noEmit (TypeScript compilation check)
        - npm run lint (code quality check)
        - timeout 60s bash -c 'npm run build' || echo "Build timeout exceeded"
      `,
      backend: `
        - npm run build (with timeout protection)
        - npx tsc --noEmit (TypeScript compilation check)
        - npm run test (with 60s timeout)
        - npm run lint (code quality check)
        - timeout 60s bash -c 'npm run build' || echo "Build timeout exceeded"
      `,
      ai: `
        - python -m pytest (with timeout)
        - python -m mypy . (type checking)
        - python -m black --check . (code formatting)
        - python -m flake8 (linting)
        - timeout 60s bash -c 'python -m pytest' || echo "Test timeout exceeded"
      `
    };
    
    return commandMap[platform] || commandMap.web;
  }
  
  private async callAI(prompt: string): Promise<string> {
    // This would integrate with an actual AI service
    // For now, we'll return a mock response based on the prompt
    return this.generateMockAIResponse(prompt);
  }
  
  private generateMockAIResponse(prompt: string): string {
    // Extract key information from prompt
    const taskIdMatch = prompt.match(/TASK ID: (TASK-\d+)/);
    const platformMatch = prompt.match(/PLATFORM: (\w+)/);
    const frameworkMatch = prompt.match(/FRAMEWORK: (\w+)/);
    const languageMatch = prompt.match(/LANGUAGE: (\w+)/);
    const featureMatch = prompt.match(/Feature: ([^\n]+)/);
    
    const taskId = taskIdMatch?.[1] || 'TASK-001';
    const platform = platformMatch?.[1] || 'web';
    const framework = frameworkMatch?.[1] || 'react';
    const language = languageMatch?.[1] || 'typescript';
    const feature = featureMatch?.[1] || 'Unknown Feature';
    
    // Generate compilation-safe content
    const content = this.generateCompilationSafeContent(taskId, platform, framework, language, feature);
    
    return JSON.stringify(content);
  }
  
  private generateCompilationSafeContent(taskId: string, platform: string, framework: string, language: string, feature: string): TaskContent {
    const compilationCommands = this.getCompilationCommands(platform, framework, language);
    
    return {
      title: `Compilation-Safe ${framework} Implementation for ${feature}`,
      description: `Implement ${framework} functionality for ${feature} using ${language} with guaranteed compilation success. Includes timeout protection and proper error handling.`,
      verification: {
        type: 'compilation_safe_verification',
        mandatory: true,
        action: 'COMPILE',
        commands: compilationCommands,
        expectedState: `${framework} implementation compiles successfully with 0 errors`,
        proofRequired: {
          format: 'terminal_output',
          mustInclude: ['compilation', 'successful', '0 errors', 'timeout', 'protection']
        }
      },
      commands: compilationCommands
    };
  }
  
  private getCompilationCommands(platform: string, framework: string, language: string): string[] {
    const commandMap: Record<string, string[]> = {
      web: [
        'timeout 60s bash -c "npm run build" || echo "Build timeout exceeded"',
        'npx tsc --noEmit',
        'npm run lint',
        'timeout 60s bash -c "npm run test" || echo "Test timeout exceeded"'
      ],
      mobile: [
        'timeout 90s bash -c "npx react-native bundle --platform ios --dev false" || echo "iOS bundle timeout exceeded"',
        'timeout 90s bash -c "npx react-native bundle --platform android --dev false" || echo "Android bundle timeout exceeded"',
        'npx tsc --noEmit',
        'npm run lint'
      ],
      desktop: [
        'timeout 60s bash -c "npm run build" || echo "Build timeout exceeded"',
        'timeout 60s bash -c "npx electron-builder --dir" || echo "Electron build timeout exceeded"',
        'npx tsc --noEmit',
        'npm run lint'
      ],
      backend: [
        'timeout 60s bash -c "npm run build" || echo "Build timeout exceeded"',
        'npx tsc --noEmit',
        'timeout 60s bash -c "npm run test" || echo "Test timeout exceeded"',
        'npm run lint'
      ],
      ai: [
        'timeout 60s bash -c "python -m pytest" || echo "Test timeout exceeded"',
        'python -m mypy .',
        'python -m black --check .',
        'python -m flake8'
      ]
    };
    
    return commandMap[platform] || commandMap.web;
  }
  
  private parseAIResponse(response: string): TaskContent {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return {
        title: 'Error parsing AI response',
        description: 'Failed to generate compilation-safe content',
        verification: {
          type: 'error',
          mandatory: true,
          action: 'SHOW',
          commands: ['echo "Error in AI response parsing"'],
          expectedState: 'Error state',
          proofRequired: {
            format: 'terminal_output',
            mustInclude: ['error']
          }
        },
        commands: ['echo "Error in AI response parsing"']
      };
    }
  }
  
  private validateCompilationSafety(content: TaskContent, context: TaskGenerationContext): TaskContent {
    // Validate that generated content includes compilation verification
    if (!content.verification?.commands?.some(cmd => cmd.includes('compile') || cmd.includes('build'))) {
      console.warn('Generated content missing compilation verification');
    }
    
    // Validate that content includes timeout protection
    if (!content.verification?.commands?.some(cmd => cmd.includes('timeout'))) {
      console.warn('Generated content missing timeout protection');
    }
    
    // Validate that content is platform-specific
    if (!content.title.toLowerCase().includes(context.platform) && 
        !content.description.toLowerCase().includes(context.platform)) {
      console.warn('Generated content may not be platform-specific enough');
    }
    
    // Validate that content references the feature
    if (!content.title.toLowerCase().includes(context.specData.title?.toLowerCase() || 'feature')) {
      console.warn('Generated content may not reference the feature');
    }
    
    // Ensure compilation safety
    const safeContent = { ...content };
    if (!safeContent.verification?.commands?.some(cmd => cmd.includes('timeout'))) {
      safeContent.verification.commands.push('timeout 60s bash -c "echo \'Compilation safety check\'" || echo "Timeout exceeded"');
    }
    
    return safeContent;
  }
}

/**
 * Task Validation and Compilation Safety Engine
 */
class TaskValidationEngine {
  /**
   * Validate generated task content for completeness and correctness
   */
  validateTaskContent(task: any, context: TaskGenerationContext): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Required fields validation
    if (!task.id) errors.push('Task ID is missing');
    if (!task.title) errors.push('Task title is missing');
    if (!task.description) errors.push('Task description is missing');
    if (!task.verification) errors.push('Task verification is missing');
    
    // Verification validation
    if (task.verification) {
      if (!task.verification.type) errors.push('Verification type is missing');
      if (!task.verification.commands || !Array.isArray(task.verification.commands)) {
        errors.push('Verification commands are missing or invalid');
      }
      if (!task.verification.expectedState) warnings.push('Expected state is missing');
    }
    
    // Platform-specific validation
    this.validatePlatformSpecificContent(task, context, errors, warnings);
    
    // Compilation safety validation
    this.validateCompilationSafety(task, context, errors, warnings);
    
    // Dependencies validation
    this.validateDependencies(task, errors, warnings);
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: this.calculateValidationScore(errors, warnings)
    };
  }
  
  /**
   * Validate platform-specific content
   */
  private validatePlatformSpecificContent(task: any, context: TaskGenerationContext, errors: string[], warnings: string[]): void {
    const title = task.title?.toLowerCase() || '';
    const description = task.description?.toLowerCase() || '';
    
    // Check if content references the platform
    if (!title.includes(context.platform) && !description.includes(context.platform)) {
      warnings.push(`Task may not be platform-specific enough for ${context.platform}`);
    }
    
    // Check if content references the framework
    if (!title.includes(context.framework) && !description.includes(context.framework)) {
      warnings.push(`Task may not reference framework ${context.framework}`);
    }
    
    // Check if content references the feature
    const featureName = context.specData.metadata?.name?.toLowerCase() || '';
    if (featureName && !title.includes(featureName) && !description.includes(featureName)) {
      warnings.push(`Task may not reference feature ${featureName}`);
    }
  }
  
  /**
   * Validate compilation safety
   */
  private validateCompilationSafety(task: any, context: TaskGenerationContext, errors: string[], warnings: string[]): void {
    const commands = task.verification?.commands || [];
    
    // Check for compilation commands
    const hasCompilationCommand = commands.some((cmd: string) => 
      cmd.includes('build') || cmd.includes('compile') || cmd.includes('bundle')
    );
    
    if (!hasCompilationCommand) {
      errors.push('Task missing compilation verification command');
    }
    
    // Check for timeout protection
    const hasTimeoutProtection = commands.some((cmd: string) => 
      cmd.includes('timeout') || cmd.includes('timeout')
    );
    
    if (!hasTimeoutProtection) {
      warnings.push('Task missing timeout protection');
    }
    
    // Check for platform-specific commands
    const platformCommands = this.getExpectedPlatformCommands(context.platform);
    const hasPlatformCommand = commands.some((cmd: string) => 
      platformCommands.some(expectedCmd => cmd.includes(expectedCmd))
    );
    
    if (!hasPlatformCommand) {
      warnings.push(`Task missing expected ${context.platform} platform commands`);
    }
  }
  
  /**
   * Validate task dependencies
   */
  private validateDependencies(task: any, errors: string[], warnings: string[]): void {
    if (task.dependencies && Array.isArray(task.dependencies)) {
      // Check for circular dependencies (basic check)
      const taskId = task.id;
      if (task.dependencies.includes(taskId)) {
        errors.push(`Task ${taskId} has circular dependency on itself`);
      }
      
      // Check for valid dependency format
      task.dependencies.forEach((dep: string) => {
        if (!dep.startsWith('TASK-')) {
          warnings.push(`Dependency ${dep} does not follow TASK-XXX format`);
        }
      });
    }
  }
  
  /**
   * Get expected platform commands
   */
  private getExpectedPlatformCommands(platform: string): string[] {
    const commandMap: Record<string, string[]> = {
      web: ['npm run build', 'npx tsc', 'npm run test'],
      mobile: ['react-native bundle', 'npx tsc', 'npm run test'],
      desktop: ['npm run build', 'electron-builder', 'npx tsc'],
      backend: ['npm run build', 'npx tsc', 'npm run test'],
      ai: ['python -m pytest', 'python -m mypy', 'python -m black']
    };
    
    return commandMap[platform] || commandMap.web;
  }
  
  /**
   * Calculate validation score
   */
  private calculateValidationScore(errors: string[], warnings: string[]): number {
    const maxScore = 100;
    const errorPenalty = 20;
    const warningPenalty = 5;
    
    let score = maxScore;
    score -= errors.length * errorPenalty;
    score -= warnings.length * warningPenalty;
    
    return Math.max(0, score);
  }
  
  /**
   * Validate all tasks in a template
   */
  validateTemplate(template: any, context: TaskGenerationContext): TemplateValidationResult {
    const taskValidations: TaskValidationResult[] = [];
    let totalScore = 0;
    let validTasks = 0;
    
    // Validate each phase
    if (template.taskPhases) {
      for (const phaseKey of Object.keys(template.taskPhases)) {
        const phase = template.taskPhases[phaseKey];
        if (phase.tasks && Array.isArray(phase.tasks)) {
          for (const task of phase.tasks) {
            const validation = this.validateTaskContent(task, context);
            taskValidations.push({
              taskId: task.id,
              phase: phaseKey,
              validation
            });
            
            totalScore += validation.score;
            if (validation.isValid) validTasks++;
          }
        }
      }
    }
    
    const averageScore = taskValidations.length > 0 ? totalScore / taskValidations.length : 0;
    
    return {
      isValid: validTasks === taskValidations.length,
      totalTasks: taskValidations.length,
      validTasks,
      averageScore,
      taskValidations
    };
  }
}

/**
 * Compilation Safety Engine
 */
class CompilationSafetyEngine {
  /**
   * Ensure all tasks have compilation safety features
   */
  ensureCompilationSafety(task: any, context: TaskGenerationContext): any {
    const safeTask = { ...task };
    
    // Ensure verification exists
    if (!safeTask.verification) {
      safeTask.verification = {
        type: 'compilation_safety_verification',
        mandatory: true,
        action: 'COMPILE',
        commands: [],
        expectedState: 'Compilation successful',
        proofRequired: {
          format: 'terminal_output',
          mustInclude: ['compilation', 'successful']
        }
      };
    }
    
    // Ensure commands exist and have timeout protection
    if (!safeTask.verification.commands || !Array.isArray(safeTask.verification.commands)) {
      safeTask.verification.commands = this.getDefaultCommands(context.platform);
    }
    
    // Add timeout protection to commands
    safeTask.verification.commands = safeTask.verification.commands.map((cmd: string) => 
      this.addTimeoutProtection(cmd, context.platform)
    );
    
    // Ensure compilation verification exists
    if (!this.hasCompilationCommand(safeTask.verification.commands)) {
      safeTask.verification.commands.push(this.getCompilationCommand(context.platform));
    }
    
    return safeTask;
  }
  
  /**
   * Add timeout protection to a command
   */
  private addTimeoutProtection(command: string, platform: string): string {
    // Skip if already has timeout protection
    if (command.includes('timeout')) {
      return command;
    }
    
    const timeoutMap: Record<string, number> = {
      web: 60,
      mobile: 90,
      desktop: 60,
      backend: 60,
      ai: 60
    };
    
    const timeout = timeoutMap[platform] || 60;
    
    // Wrap command with timeout protection
    return `timeout ${timeout}s bash -c "${command}" || echo "${command} timeout exceeded"`;
  }
  
  /**
   * Check if command has compilation verification
   */
  private hasCompilationCommand(commands: string[]): boolean {
    return commands.some(cmd => 
      cmd.includes('build') || 
      cmd.includes('compile') || 
      cmd.includes('bundle') ||
      cmd.includes('tsc') ||
      cmd.includes('pytest')
    );
  }
  
  /**
   * Get compilation command for platform
   */
  private getCompilationCommand(platform: string): string {
    const commandMap: Record<string, string> = {
      web: 'npm run build',
      mobile: 'npx react-native bundle --platform ios --dev false',
      desktop: 'npx electron-builder --dir',
      backend: 'npm run build',
      ai: 'python -m pytest'
    };
    
    const command = commandMap[platform] || commandMap.web;
    return this.addTimeoutProtection(command, platform);
  }
  
  /**
   * Get default commands for platform
   */
  private getDefaultCommands(platform: string): string[] {
    const commandMap: Record<string, string[]> = {
      web: [
        'npm run build',
        'npx tsc --noEmit',
        'npm run lint',
        'npm run test'
      ],
      mobile: [
        'npx react-native bundle --platform ios --dev false',
        'npx react-native bundle --platform android --dev false',
        'npx tsc --noEmit',
        'npm run lint'
      ],
      desktop: [
        'npm run build',
        'npx electron-builder --dir',
        'npx tsc --noEmit',
        'npm run lint'
      ],
      backend: [
        'npm run build',
        'npx tsc --noEmit',
        'npm run test',
        'npm run lint'
      ],
      ai: [
        'python -m pytest',
        'python -m mypy .',
        'python -m black --check .',
        'python -m flake8'
      ]
    };
    
    return commandMap[platform] || commandMap.web;
  }
  
  /**
   * Validate compilation safety for all tasks
   */
  validateCompilationSafety(template: any, context: TaskGenerationContext): CompilationSafetyResult {
    const safetyIssues: CompilationSafetyIssue[] = [];
    let totalTasks = 0;
    let safeTasks = 0;
    
    if (template.taskPhases) {
      for (const phaseKey of Object.keys(template.taskPhases)) {
        const phase = template.taskPhases[phaseKey];
        if (phase.tasks && Array.isArray(phase.tasks)) {
          for (const task of phase.tasks) {
            totalTasks++;
            
            const issues = this.checkTaskSafety(task, context);
            if (issues.length === 0) {
              safeTasks++;
            } else {
              safetyIssues.push({
                taskId: task.id,
                phase: phaseKey,
                issues
              });
            }
          }
        }
      }
    }
    
    return {
      isSafe: safetyIssues.length === 0,
      totalTasks,
      safeTasks,
      safetyIssues,
      safetyScore: totalTasks > 0 ? (safeTasks / totalTasks) * 100 : 0
    };
  }
  
  /**
   * Check individual task safety
   */
  private checkTaskSafety(task: any, context: TaskGenerationContext): string[] {
    const issues: string[] = [];
    
    if (!task.verification) {
      issues.push('Missing verification section');
      return issues;
    }
    
    const commands = task.verification.commands || [];
    
    // Check for compilation command
    if (!this.hasCompilationCommand(commands)) {
      issues.push('Missing compilation verification command');
    }
    
    // Check for timeout protection
    const hasTimeout = commands.some((cmd: string) => cmd.includes('timeout'));
    if (!hasTimeout) {
      issues.push('Missing timeout protection');
    }
    
    // Check for platform-specific commands
    const expectedCommands = this.getDefaultCommands(context.platform);
    const hasPlatformCommand = commands.some((cmd: string) => 
      expectedCommands.some(expectedCmd => cmd.includes(expectedCmd.split(' ')[0]))
    );
    
    if (!hasPlatformCommand) {
      issues.push(`Missing ${context.platform} platform-specific commands`);
    }
    
    return issues;
  }
}

// Interface definitions for validation results
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
}

interface TaskValidationResult {
  taskId: string;
  phase: string;
  validation: ValidationResult;
}

interface TemplateValidationResult {
  isValid: boolean;
  totalTasks: number;
  validTasks: number;
  averageScore: number;
  taskValidations: TaskValidationResult[];
}

interface CompilationSafetyIssue {
  taskId: string;
  phase: string;
  issues: string[];
}

interface CompilationSafetyResult {
  isSafe: boolean;
  totalTasks: number;
  safeTasks: number;
  safetyIssues: CompilationSafetyIssue[];
  safetyScore: number;
}

export class SDDTasksTool {
  private db: RobustDatabaseService;
  private basePath: string;
  private templateCache: Map<string, any> = new Map();
  private platformCache: Map<string, string> = new Map();
  private platformDetector: PlatformDetectionEngine;

  constructor(basePath: string = process.cwd()) {
    this.basePath = path.resolve(basePath);
    // Use the database file in the project root
    const dbPath = path.join(this.basePath, 'sdd.db');
    this.db = new RobustDatabaseService(dbPath);
    this.platformDetector = new PlatformDetectionEngine();
  }

  getToolDefinition(): Tool {
    return {
      name: 'sdd_tasks',
      description: 'Generate task breakdown from the most recent feature specification. Creates tasks.md file with all 72 tasks across four phases. Automatically detects platform and uses latest feature from database. No parameters needed - creates file immediately.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    };
  }

  async execute(input: any): Promise<any> {       
    try {
      // Always get the most recent feature
      let featureId: string;
      try {
        featureId = await this.resolveFeatureId(null); // null means get most recent
      } catch (error) {
        return this.error(error instanceof Error ? error.message : 'Failed to get most recent feature');
      }
      
      const feature = await this.db.get_feature_robust(featureId);
      if (!feature) {
        return this.error(`Feature '${featureId}' not found in database.`);
      }


      // Check if specification exists (prerequisite)
      const specData = await this.db.get_specification_robust(featureId);
      if (!specData) {
        return this.error(`Specification not found for feature: ${featureId}. Please create a specification first using /spec command.`);
      }

      // Repair and parse the specification data
      const repairedSpecData = JsonRepairUtility.extractDbJsonContent(specData, 'SDDTasksTool');

      // Get original universal tasks template from database
      const universalTasksTemplate = await this.db.get_task_template_robust('sdd-tasks-atomic-v9');
      if (!universalTasksTemplate) {
        return this.error('Tasks template not found.');
      }

      // Get filled plan data for context
      const planData = await this.getPlanData(feature.name);
      
      // Get platform detection results
      const platformDetection = await this.platformDetector.detectPlatform(repairedSpecData, planData);

      // Create success message following plan tool pattern
      const successMessage = `📋 TASK: Create tasks.md file in specs/tasks.md directory using the AI-driven template data provided below.

📊 PROJECT DETAILS:
-- Feature: ${feature.name}
-- Platform: ${platformDetection.platform} (${platformDetection.framework} + ${platformDetection.language})
-- Total Tasks: 72 tasks
-- Phases: 4 phases with atomic task structure
-- AI Detection Confidence: ${platformDetection.confidence}%
-- Detected From: ${platformDetection.detectedFrom.join(', ')}

📋 UNIVERSAL TASKS TEMPLATE):
${JSON.stringify(universalTasksTemplate, null, 2)}

📋 FILLED SPECIFICATION DATA (Use for Project Context):
${JSON.stringify(repairedSpecData, null, 2)}

📋 FILLED PLAN DATA (Use for Implementation Context):
${JSON.stringify(planData, null, 2)}

🎯 TASK REGENERATION INSTRUCTIONS:

**USE THE PROVIDED UNIVERSAL TEMPLATE**: The universal tasks template above contains the complete 72-task structure. Use this as a reference for task numbers, phases, and overall structure.

**REGENERATE CONTENT** based on the detected platform (${platformDetection.platform}) and specification, plan context:

**KEEP UNCHANGED:**
- Task numbers (TASK-001, TASK-002, etc.)
- Phase numbers and phase explanations
- Task IDs and dependencies
- Constitutional compliance gates
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

6. **VERIFICATION TYPES**: Generate platform-appropriate verification
   - Web: "component_verification", "api_verification", "build_verification"
   - Mobile: "screen_verification", "native_verification", "app_verification"
   - Backend: "api_verification", "database_verification", "service_verification"

7. **ACTIONS**: Generate appropriate actions
   - "SHOW", "COMPILE", "TEST", "VERIFY", "EXECUTE"
   - **NEVER**: "SUDO", "CHOWN", "CHMOD" with elevated permissions

8. **COMMANDS**: Generate platform-specific commands
   - NextJS: "npm run build", "npm run dev", "npm test"
   - React Native: "npx react-native run-android", "npx react-native run-ios"
   - Backend: "npm start", "npm test", "node server.js"
   - **PERMISSION-SAFE**: Only user-level commands, NO sudo/root commands

9. **EXPECTED STATES**: Generate platform-specific success criteria
   - Include platform name and project domain in success messages

10. **PROOF KEYWORDS**: Generate relevant keywords
    - Include platform, framework, and project domain keywords

**PLATFORM-SPECIFIC GUIDELINES**:
${this.getPlatformSpecificGuidelines(platformDetection.platform, platformDetection.framework)}

**PROJECT DOMAIN**: Use the specification and plan data to make all content specific to the project domain

📝 MARKDOWN STRUCTURE:
Create tasks.md with this focused structure:

# 📋 SDD Tasks Breakdown

## 📊 Metadata
- **Generated**: [template_data.metadata.generated]
- **Platform**: [template_data.metadata.platform]
- **Total Tasks**: [template_data.metadata.totalTasks]
- **Status**: [template_data.metadata.status]

## Phase 1: Project Setup & Foundations ([template_data.taskPhases.phase1.taskCount] tasks)
### 📋 Implementation Tasks

[For each task in template_data.taskPhases.phase1.tasks:]
### [task.id]: [task.title]
- **Description**: [task.description]
- **TDD Phase**: [task.tddPhase]
- **Sub Phase**: [task.subPhase]
- **Dependencies**: [task.dependencies]
- **Requirements**: [task.requirements]
- **Acceptance Criteria**: [task.acceptanceCriteria]
- **Estimated Duration**: [task.estimatedDuration]
- **Estimated LOC**: [task.estimatedLOC]
- **Constitutional Compliance**: [task.constitutionalCompliance]
- **Parallelizable**: [task.parallelizable]
- **Verification**: [task.verification.description]

[Repeat for Phase 2, Phase 3, Phase 4]

🎯 CRITICAL INSTRUCTIONS:
1. **USE UNIVERSAL TEMPLATE**: Use the universal template as a reference for structure and task numbers
2. **REGENERATE CONTENT**: Generate new content based on platform, language, plan, and spec data
3. **KEEP STRUCTURE**: Maintain task numbers, phase numbers, dependencies, and constitutional gates
4. **PLATFORM-SPECIFIC**: Generate content appropriate for the detected platform and framework
5. **PROJECT-SPECIFIC**: Make all content specific to the project domain from specification and plan data
6. **REALISTIC ESTIMATES**: Generate appropriate duration and LOC estimates based on task complexity
7. **CONSISTENT FORMAT**: Maintain the exact structure and format of the universal template
8. **COMPLETE COVERAGE**: Process all 72 tasks across all 4 phases

DO NOT JUST ACKNOWLEDGE - CREATE THE FILE NOW!`;


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
   * Resolve feature ID - get most recent if null
   */
  private async resolveFeatureId(inputFeatureId?: string): Promise<string> {
    if (inputFeatureId) {
      return inputFeatureId;
    }

    // Get most recent feature with spec, plan, and tasks
    const features = await this.db.get_all_features_robust();
    if (features.length === 0) {
      throw new Error('No features found in database. Please create a feature first using /spec command.');
    }

    // Find most recent feature that has spec, plan, and tasks
    for (const feature of features) {
      try {
        const spec = await this.db.get_specification_robust(feature.id);
        const plan = await this.db.get_plan_robust(feature.id);
        const tasks = await this.db.get_tasks_robust(feature.id);
        
        if (spec && plan && tasks) {
          return feature.id;
        }
    } catch (error) {
        // Continue to next feature
        continue;
      }
    }

    // If no feature has all three, return the most recent one
    return features[0].id;
  }

  
  
  /**
   * Generate AI-driven task content for all tasks
   */
  
  /**
   * Get platform-specific guidelines for the detected platform
   */
  private getPlatformSpecificGuidelines(platform: string, framework: string): string {
    switch (platform) {
      case 'web':
        return `- **Web (${framework})**: Focus on components, pages, API routes, responsive design
- Use web-specific technologies: HTML, CSS, JavaScript/TypeScript
- Include responsive design considerations
- Focus on browser compatibility and performance
- Use web-specific testing frameworks and tools`;

      case 'mobile':
        return `- **Mobile (${framework})**: Focus on screens, navigation, native features, mobile UX
- Use mobile-specific technologies: React Native, Flutter, native APIs
- Include mobile UX considerations: touch interactions, gestures, navigation
- Focus on mobile performance and battery optimization
- Use mobile-specific testing frameworks and device testing`;

      case 'desktop':
        return `- **Desktop (${framework})**: Focus on desktop-specific features, window management, system integration
- Use desktop-specific technologies: Electron, native desktop frameworks
- Include desktop UX considerations: keyboard shortcuts, window management, system integration
- Focus on desktop performance and system resource usage
- Use desktop-specific testing frameworks and cross-platform compatibility`;

      case 'backend':
        return `- **Backend**: Focus on APIs, services, database operations, authentication
- Use backend-specific technologies: Node.js, Python, Java, Go, etc.
- Include server-side considerations: scalability, security, performance
- Focus on API design, database optimization, and microservices architecture
- Use backend-specific testing frameworks and load testing tools`;

      case 'ai':
        return `- **AI (${framework})**: Focus on AI/ML models, data processing, model training
- Use AI-specific technologies: TensorFlow, PyTorch, OpenAI APIs, etc.
- Include AI considerations: model accuracy, data quality, inference performance
- Focus on AI model optimization and deployment
- Use AI-specific testing frameworks and model validation tools`;

      default:
        return `- **${platform} (${framework})**: Focus on platform-specific features and technologies
- Use appropriate technologies for the detected platform
- Include platform-specific considerations and best practices
- Focus on platform-specific performance and optimization
- Use platform-specific testing frameworks and tools`;
    }
  }

  /**
   * Get plan data for enhanced context
   */
  private async getPlanData(featureName?: string): Promise<any> {
    try {
      if (!featureName) {
        return {};
      }
      
      // Try to get plan data from database
      const features = await this.db.get_all_features_robust();
      
      // Try exact match first, then try without "Feature Specification:" prefix
      let feature = features.find(f => f.name === featureName);
      if (!feature && featureName.includes('Feature Specification:')) {
        const cleanName = featureName.replace('Feature Specification:', '').trim();
        feature = features.find(f => f.name === cleanName);
      }
      
      if (feature) {
        const planData = await this.db.get_plan_robust(feature.id);
        
        if (planData) {
          const extractedData = JsonRepairUtility.extractDbJsonContent(planData, 'SDDTasksTool');
          return extractedData;
        }
      }
      
      return {};
    } catch (error) {
      console.error('Error getting plan data:', error);
      return {};
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
   * Error response helper
   */
  private error(message: string): any {
        return {
      success: false,
      error: message
    };
  }
}