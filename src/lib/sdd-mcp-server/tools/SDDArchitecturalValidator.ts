/**
 * SDD Architectural Validator
 * Prevents "tunnel vision" by validating implementation against original specifications
 * Universal approach that works across all platforms and languages
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import * as path from 'path';
import * as fs from 'fs';

export class SDDArchitecturalValidator {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  getToolDefinition(): Tool {
    return {
      name: 'sdd_validate_architecture',
      description: '🛡️ ARCHITECTURAL VALIDATION: Validates implementation against original specifications to prevent tunnel vision and ensure complete architectural compliance.',
      inputSchema: {
        type: 'object',
        properties: {
          phase: {
            type: 'number',
            description: 'Phase number to validate (1-4)',
            minimum: 1,
            maximum: 4
          },
          strict_mode: {
            type: 'boolean',
            description: 'Enable strict validation that blocks completion on any architectural gap',
            default: true
          }
        },
        required: ['phase']
      }
    };
  }

  async execute(input: any): Promise<any> {
    const { phase, strict_mode = true } = input;



    try {
      // Load original specification
      const specContent = this.loadSpecification();

      // Extract architecture pattern from spec
      const architecturePattern = this.extractArchitectureFromSpec(specContent);

      // Extract platform from spec
      const platformInfo = this.extractPlatformFromSpec(specContent);

      // Load current implementation state
      const implementationState = this.analyzeImplementation(phase);

      // Validate against architectural requirements (architecture-aware and platform-aware)
      const validationResult = this.validateArchitecture(specContent, implementationState, phase, architecturePattern, platformInfo);

      // Generate validation report
      const report = this.generateValidationReport(validationResult, phase, strict_mode);


      return {
        success: validationResult.isComplete,
        phase,
        validation_result: validationResult,
        report,
        can_proceed: validationResult.isComplete || !strict_mode,
        critical_gaps: validationResult.criticalGaps,
        recommendations: validationResult.recommendations
      };

    } catch (error) {
      console.error('❌ Architecture validation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Validation failed',
        can_proceed: false
      };
    }
  }

  private loadSpecification(): string {
    const specPath = path.join(this.projectRoot, 'specs', 'spec.md');
    if (!fs.existsSync(specPath)) {
      throw new Error('Specification file not found. Run sdd_specify first.');
    }
    return fs.readFileSync(specPath, 'utf-8');
  }

  private analyzeImplementation(phase: number): ImplementationState {
    const implementationState: ImplementationState = {
      files: [],
      directories: [],
      technologies: new Set<string>(),
      patterns: {
        hasApiLayer: false,
        hasSecurityLayer: false,
        hasDatabaseLayer: false,
        hasClientServerSeparation: false,
        hasAuthentication: false,
        hasAuthorization: false,
        hasDataValidation: false,
        hasErrorHandling: false,
        hasLogging: false,
        hasTesting: false,
        hasDocumentation: false
      },
      security: {
        hasSecureApiCalls: false,
        hasInputValidation: false,
        hasAuthentication: false,
        hasAuthorization: false,
        hasSecureStorage: false
      },
      architecture: {
        layers: [],
        communication: [],
        dataFlow: []
      }
    };

    // Analyze file structure
    this.analyzeFileStructure(implementationState);

    // Analyze technologies used
    this.analyzeTechnologies(implementationState);

    // Analyze architectural patterns
    this.analyzeArchitecturalPatterns(implementationState, phase);

    return implementationState;
  }

  private analyzeFileStructure(state: ImplementationState): void {
    const srcDir = path.join(this.projectRoot, 'src');
    if (fs.existsSync(srcDir)) {
      this.walkDirectory(srcDir, state.files, '');
    }
  }

  private walkDirectory(dirPath: string, files: string[], prefix: string): void {
    try {
      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const relativePath = prefix ? `${prefix}/${item}` : item;
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // Check for architectural directories
          if (this.isArchitecturalDirectory(item)) {
            files.push(`📁 ${relativePath}/`);
          }
          this.walkDirectory(fullPath, files, relativePath);
        } else if (stat.isFile()) {
          // Check for architectural files
          if (this.isArchitecturalFile(item)) {
            files.push(`📄 ${relativePath}`);
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }
  }

  private isArchitecturalDirectory(name: string): boolean {
    const keyDirs = [
      'api', 'routes', 'controllers', 'services', 'models',
      'middleware', 'auth', 'security', 'database', 'config',
      'utils', 'lib', 'core', 'business', 'domain'
    ];
    return keyDirs.includes(name.toLowerCase());
  }

  private isArchitecturalFile(name: string): boolean {
    const keyFiles = [
      'server.js', 'app.js', 'index.js', 'main.js',
      'server.ts', 'app.ts', 'index.ts', 'main.ts',
      'Dockerfile', 'docker-compose.yml', 'package.json',
      '.env', 'config.js', 'config.ts', 'database.js'
    ];
    return keyFiles.some(keyFile => name.toLowerCase().includes(keyFile.toLowerCase()));
  }

  private analyzeTechnologies(state: ImplementationState): void {
    // Check package.json for technologies
    const packagePath = path.join(this.projectRoot, 'package.json');
    if (fs.existsSync(packagePath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

        Object.keys(deps).forEach(dep => {
          if (dep.includes('express') || dep.includes('fastify') || dep.includes('koa')) {
            state.technologies.add('Backend Framework');
            state.patterns.hasApiLayer = true;
          }
          if (dep.includes('firebase') || dep.includes('mongodb') || dep.includes('postgres')) {
            state.technologies.add('Database');
            state.patterns.hasDatabaseLayer = true;
          }
          if (dep.includes('jwt') || dep.includes('passport') || dep.includes('auth')) {
            state.technologies.add('Authentication');
            state.patterns.hasAuthentication = true;
          }
          if (dep.includes('jest') || dep.includes('mocha') || dep.includes('jasmine')) {
            state.technologies.add('Testing Framework');
            state.patterns.hasTesting = true;
          }
        });
      } catch (error) {
        // Can't parse package.json
      }
    }
  }

  private analyzeArchitecturalPatterns(state: ImplementationState, phase: number): void {
    // Check for API layer evidence
    state.patterns.hasApiLayer = state.files.some(file =>
      file.includes('/api/') ||
      file.includes('/routes/') ||
      file.includes('/controllers/') ||
      file.includes('server.') ||
      file.includes('app.')
    );

    // Check for security layer
    state.patterns.hasSecurityLayer = state.files.some(file =>
      file.includes('/auth/') ||
      file.includes('/security/') ||
      file.includes('/middleware/') ||
      file.includes('auth.') ||
      file.includes('security.')
    );

    // Check for client-server separation
    state.patterns.hasClientServerSeparation =
      state.files.some(file => file.includes('/api/') || file.includes('/server/')) &&
      state.files.some(file => file.includes('/components/') || file.includes('/pages/'));

    // Analyze based on phase requirements
    this.analyzePhaseSpecificRequirements(state, phase);
  }

  private analyzePhaseSpecificRequirements(state: ImplementationState, phase: number): void {
    switch (phase) {
      case 1: // Foundation - Project Setup & Configuration
        // Phase 1 should establish solid project foundation
        state.patterns.hasTesting = state.files.some(file =>
          file.includes('test') || file.includes('spec') || file.includes('jest') || file.includes('mocha')
        );

        // Check for basic project structure
        const hasPackageJson = state.files.some(file => file.includes('package.json'));
        const hasConfigFiles = state.files.some(file =>
          file.includes('tsconfig') || file.includes('eslint') || file.includes('prettier')
        );
        const hasSourceDir = state.files.some(file => file.includes('src/') || file.includes('lib/'));

        // Add Phase 1 specific patterns
        state.patterns['hasPackageConfig'] = hasPackageJson;
        state.patterns['hasDevTools'] = hasConfigFiles;
        state.patterns['hasSourceStructure'] = hasSourceDir;
        break;

      case 2: // Core Implementation - Business Logic & Data
        // Phase 2 should implement core business logic and data layer
        state.patterns.hasDatabaseLayer = state.files.some(file =>
          file.includes('/models/') ||
          file.includes('/database/') ||
          file.includes('/entities/') ||
          file.includes('firebase') ||
          file.includes('mongoose') ||
          file.includes('prisma') ||
          file.includes('db.')
        );

        // Check for business logic implementation
        const hasServices = state.files.some(file =>
          file.includes('/services/') || file.includes('/business/') || file.includes('/logic/')
        );
        const hasControllers = state.files.some(file =>
          file.includes('/controllers/') || file.includes('/handlers/') || file.includes('/api/')
        );

        // Add Phase 2 specific patterns
        state.patterns['hasBusinessLogic'] = hasServices;
        state.patterns['hasApiControllers'] = hasControllers;
        break;

      case 3: // UI/UX Development - Frontend Implementation
        // Phase 3 should implement user interface and frontend logic
        // Platform-agnostic component detection
        const hasComponents = state.files.some(file =>
          file.includes('/components/') ||
          file.includes('/ui/') ||
          file.includes('/views/') ||
          file.includes('/screens/') ||
          file.includes('ViewController') ||
          file.includes('View.swift') ||
          file.includes('ContentView') ||
          file.includes('Activity') ||
          file.includes('Fragment') ||
          file.includes('Composable') ||
          (file.includes('.swift') && (file.includes('View') || file.includes('Screen'))) ||
          (file.includes('.kt') && (file.includes('Screen') || file.includes('View')))
        );

        const hasPages = state.files.some(file =>
          file.includes('/pages/') ||
          file.includes('/routes/') ||
          file.includes('/navigation/') ||
          file.includes('Navigation') ||
          file.includes('Router') ||
          file.includes('Coordinator') ||
          file.includes('NavController') ||
          file.includes('react-navigation') ||
          file.includes('@react-navigation')
        );

        const hasStyles = state.files.some(file =>
          file.includes('.css') ||
          file.includes('.scss') ||
          file.includes('.less') ||
          file.includes('/styles/') ||
          file.includes('/theme/') ||
          file.includes('swiftui') ||
          file.includes('material') ||
          file.includes('compose')
        );

        // Add Phase 3 specific patterns
        state.patterns['hasUIComponents'] = hasComponents;
        state.patterns['hasPageStructure'] = hasPages;
        state.patterns['hasStyling'] = hasStyles;
        break;

      case 4: // Testing & Deployment - Quality Assurance
        // Phase 4 should have comprehensive testing and deployment setup
        state.patterns.hasTesting = state.files.some(file =>
          file.includes('test') ||
          file.includes('spec') ||
          file.includes('e2e') ||
          file.includes('integration') ||
          file.includes('cypress') ||
          file.includes('playwright')
        );

        // Check for deployment configurations
        const hasDocker = state.files.some(file =>
          file.includes('Dockerfile') ||
          file.includes('docker-compose') ||
          file.includes('docker')
        );

        const hasDeployment = state.files.some(file =>
          file.includes('vercel') ||
          file.includes('netlify') ||
          file.includes('heroku') ||
          file.includes('deploy') ||
          file.includes('ci') ||
          file.includes('cd')
        );

        // Add Phase 4 specific patterns
        state.patterns['hasDeploymentConfig'] = hasDocker || hasDeployment;
        state.patterns['hasIntegrationTests'] = state.files.some(file =>
          file.includes('integration') || file.includes('e2e')
        );
        break;
    }
  }

  /**
   * Extract architecture pattern from spec
   */
  private extractArchitectureFromSpec(specContent: string): string {
    // Check metadata section for architecture pattern
    const metadataMatch = specContent.match(/architecture.*pattern[:\s]*([a-z-]+)/i);
    if (metadataMatch) {
      return metadataMatch[1].toLowerCase();
    }

    // Check architecture section
    const archSectionMatch = specContent.match(/##\s+Architecture[\s\S]*?###\s+Pattern\s*\n([a-z-]+)/i);
    if (archSectionMatch) {
      return archSectionMatch[1].toLowerCase();
    }

    // Check for keywords
    const content = specContent.toLowerCase();
    if (content.includes('firebase')) return 'baas-firebase';
    if (content.includes('supabase')) return 'baas-supabase';
    if (content.includes('amplify') || content.includes('appsync')) return 'baas-amplify';
    if (content.includes('serverless') || content.includes('lambda')) return 'serverless';
    if (content.includes('express') || content.includes('fastapi') || content.includes('rest api')) {
      if (content.includes('firebase') || content.includes('supabase')) return 'hybrid';
      return 'traditional-backend';
    }

    return 'traditional-backend'; // Default
  }

  /**
   * Extract platform from spec
   */
  private extractPlatformFromSpec(specContent: string): { platform: string; framework: string } {
    const content = specContent.toLowerCase();
    
    // Check metadata section for platform
    const metadataMatch = specContent.match(/platform[:\s]*([^\n]+)/i);
    if (metadataMatch) {
      const platformText = metadataMatch[1].toLowerCase();
      if (platformText.includes('ios') || platformText.includes('swift')) {
        return { platform: 'mobile', framework: 'ios-native' };
      }
      if (platformText.includes('android') || platformText.includes('kotlin')) {
        return { platform: 'mobile', framework: 'android-native' };
      }
      if (platformText.includes('react-native') || platformText.includes('expo')) {
        return { platform: 'mobile', framework: 'react-native' };
      }
      if (platformText.includes('web') || platformText.includes('next')) {
        return { platform: 'web', framework: 'nextjs' };
      }
    }

    // Check for iOS/Swift keywords
    if (content.includes('swift') || content.includes('swiftui') || content.includes('xcode') || 
        (content.includes('ios') && !content.includes('react-native'))) {
      return { platform: 'mobile', framework: 'ios-native' };
    }

    // Check for Android/Kotlin keywords
    if (content.includes('kotlin') || content.includes('android studio') || 
        (content.includes('android') && !content.includes('react-native'))) {
      return { platform: 'mobile', framework: 'android-native' };
    }

    // Check for React Native
    if (content.includes('react-native') || content.includes('expo')) {
      return { platform: 'mobile', framework: 'react-native' };
    }

    // Check for web
    if (content.includes('next.js') || content.includes('nextjs') || 
        (content.includes('web') && !content.includes('mobile'))) {
      return { platform: 'web', framework: 'nextjs' };
    }

    // Default to web if not detected
    return { platform: 'web', framework: 'nextjs' };
  }

  private validateArchitecture(specContent: string, implementation: ImplementationState, phase: number, architecturePattern: string, platformInfo: { platform: string; framework: string }): ValidationResult {
    const result: ValidationResult = {
      isComplete: true,
      criticalGaps: [],
      warnings: [],
      recommendations: [],
      phaseSpecificValidation: {}
    };

    // Extract architectural requirements from spec (architecture-aware)
    const requirements = this.extractRequirementsFromSpec(specContent, architecturePattern);

    // Validate each requirement
    requirements.forEach(req => {
      const validation = this.validateRequirement(req, implementation, phase, architecturePattern);
      if (!validation.passed) {
        // Skip API layer gaps for BaaS (handled in phase-specific validation)
        if (req.type === 'api_layer' && architecturePattern.startsWith('baas-')) {
          // Don't add as gap - BaaS doesn't need server-side API layer
          return;
        }
        
        if (validation.critical) {
          result.criticalGaps.push(validation);
          result.isComplete = false;
        } else {
          result.warnings.push(validation);
        }
      }
    });

    // Validate phase-specific requirements (architecture-aware and platform-aware)
    const phaseValidation = this.validatePhaseSpecificRequirements(implementation, phase, architecturePattern, platformInfo);
    result.phaseSpecificValidation = phaseValidation;

    // Add phase-specific gaps to critical gaps if they fail
    phaseValidation.criticalGaps.forEach(gap => {
      result.criticalGaps.push(gap);
      result.isComplete = false;
    });

    phaseValidation.warnings.forEach(warning => {
      result.warnings.push(warning);
    });

    // Add recommendations
    result.recommendations = this.generateRecommendations(result, phase);

    return result;
  }

  private extractRequirementsFromSpec(specContent: string, architecturePattern: string): ArchitecturalRequirement[] {
    const requirements: ArchitecturalRequirement[] = [];

    // Parse common architectural patterns from spec
    const spec = specContent.toLowerCase();

    // API Layer requirements (skip for BaaS - they use client-side SDK, not server-side API)
    if (!architecturePattern.startsWith('baas-')) {
      if (spec.includes('api') || spec.includes('backend') || spec.includes('server')) {
        requirements.push({
          type: 'api_layer',
          description: 'API/Backend layer implementation',
          critical: true,
          phase: 'all'
        });
      }
    }

    // Security requirements
    if (spec.includes('security') || spec.includes('secure') || spec.includes('authentication')) {
      requirements.push({
        type: 'security',
        description: 'Security implementation (auth, validation, secure calls)',
        critical: true,
        phase: 'all'
      });
    }

    // Database requirements
    if (spec.includes('database') || spec.includes('data') || spec.includes('storage')) {
      requirements.push({
        type: 'database',
        description: 'Database/data persistence layer',
        critical: true,
        phase: 2
      });
    }

    // Client-Server separation
    if ((spec.includes('web') && spec.includes('api')) ||
        (spec.includes('mobile') && spec.includes('backend'))) {
      requirements.push({
        type: 'client_server_separation',
        description: 'Clear client-server architecture separation',
        critical: true,
        phase: 'all'
      });
    }

    return requirements;
  }

  private validateRequirement(req: ArchitecturalRequirement, implementation: ImplementationState, phase: number, architecturePattern: string): RequirementValidation {
    const validation: RequirementValidation = {
      requirement: req.description,
      passed: false,
      critical: req.critical,
      evidence: [],
      message: ''
    };

    switch (req.type) {
      case 'api_layer':
        // For BaaS, API layer is client-side (services), not server-side
        // Don't flag missing server-side API layer for BaaS architectures
        // Note: This validation is architecture-agnostic, architecture-aware check happens in phase validation
        validation.passed = implementation.patterns.hasApiLayer;
        validation.evidence = implementation.files.filter(f =>
          f.includes('/api/') || f.includes('/routes/') || f.includes('/controllers/') || f.includes('server.')
        );
        validation.message = validation.passed ?
          'API layer detected' : 'Missing API/backend layer implementation';
        break;

      case 'security':
        const hasSecurity = implementation.patterns.hasSecurityLayer ||
                          implementation.patterns.hasAuthentication;
        validation.passed = hasSecurity;
        validation.evidence = implementation.files.filter(f =>
          f.includes('/auth/') || f.includes('/security/') || f.includes('/middleware/') || f.includes('auth.')
        );
        validation.message = validation.passed ?
          'Security layer implemented' : 'Missing security/authentication implementation';
        break;

      case 'database':
        validation.passed = implementation.patterns.hasDatabaseLayer;
        validation.evidence = implementation.files.filter(f =>
          f.includes('/models/') || f.includes('/database/') || f.includes('/entities/') ||
          f.includes('firebase') || f.includes('mongoose') || f.includes('prisma')
        );
        validation.message = validation.passed ?
          'Database layer implemented' : 'Missing database/data layer implementation';
        break;

      case 'client_server_separation':
        validation.passed = implementation.patterns.hasClientServerSeparation;
        validation.evidence = [
          ...implementation.files.filter(f => f.includes('/api/') || f.includes('/server/') || f.includes('/controllers/')),
          ...implementation.files.filter(f => f.includes('/components/') || f.includes('/pages/') || f.includes('/ui/'))
        ];
        validation.message = validation.passed ?
          'Client-server separation detected' : 'Missing clear client-server architecture separation';
        break;
    }

    return validation;
  }

  private validatePhaseSpecificRequirements(implementation: ImplementationState, phase: number, architecturePattern: string, platformInfo: { platform: string; framework: string }): { criticalGaps: RequirementValidation[], warnings: RequirementValidation[] } {
    const result = { criticalGaps: [] as RequirementValidation[], warnings: [] as RequirementValidation[] };

    switch (phase) {
      case 1: // Foundation - Project Setup & Configuration
        // Critical: Must have basic project structure
        if (!implementation.patterns['hasPackageConfig']) {
          result.criticalGaps.push({
            requirement: 'Package configuration (package.json)',
            passed: false,
            critical: true,
            evidence: [],
            message: 'Missing package.json - cannot proceed without basic project configuration'
          });
        }

        if (!implementation.patterns['hasSourceStructure']) {
          result.criticalGaps.push({
            requirement: 'Source code structure (src/ or lib/)',
            passed: false,
            critical: true,
            evidence: [],
            message: 'Missing source directory structure - foundation phase incomplete'
          });
        }

        // Warning: Development tools
        if (!implementation.patterns['hasDevTools']) {
          result.warnings.push({
            requirement: 'Development tools (TypeScript, ESLint, Prettier)',
            passed: false,
            critical: false,
            evidence: [],
            message: 'Consider adding development tools for better code quality'
          });
        }
        break;

      case 2: // Core Implementation - Business Logic & Data
        // Architecture-aware validation
        if (architecturePattern.startsWith('baas-')) {
          // BaaS architecture: client-side services, client-side components, SDK integration
          if (!implementation.patterns['hasBusinessLogic']) {
            result.criticalGaps.push({
              requirement: 'Client-side service layer (/services/ using SDK)',
              passed: false,
              critical: true,
              evidence: [],
              message: 'Missing client-side service layer - services should use Firebase/Supabase SDK'
            });
          }

          if (!implementation.patterns.hasDatabaseLayer) {
            result.criticalGaps.push({
              requirement: 'SDK-based data access (Firestore/Supabase client)',
              passed: false,
              critical: true,
              evidence: [],
              message: 'Missing SDK-based data access - should use Firestore/Supabase client SDK'
            });
          }

          // Check for Firebase Security Rules (if Firebase)
          if (architecturePattern === 'baas-firebase') {
            const hasFirebaseRules = implementation.files.some(f => 
              f.includes('firestore.rules') || f.includes('firebase.json') || f.includes('security.rules')
            );
            if (!hasFirebaseRules) {
              result.warnings.push({
                requirement: 'Firebase Security Rules configuration',
                passed: false,
                critical: false,
                evidence: [],
                message: 'Consider configuring Firebase Security Rules for data access control'
              });
            }
          }

          // Don't flag missing server-side API controllers for BaaS (they're client-side components)
          // Client-side components are validated in Phase 3
        } else {
          // Traditional backend: server-side services, server-side controllers, REST API
          if (!implementation.patterns['hasBusinessLogic']) {
            result.criticalGaps.push({
              requirement: 'Business logic layer (/services/ or /business/)',
              passed: false,
              critical: true,
              evidence: [],
              message: 'Missing business logic implementation - core functionality not implemented'
            });
          }

          if (!implementation.patterns.hasDatabaseLayer) {
            result.criticalGaps.push({
              requirement: 'Data persistence layer (database/models)',
              passed: false,
              critical: true,
              evidence: [],
              message: 'Missing database/data layer - cannot persist application data'
            });
          }

          // Critical: API controllers for traditional backend
          if (!implementation.patterns['hasApiControllers'] && !implementation.patterns.hasApiLayer) {
            result.criticalGaps.push({
              requirement: 'API controllers/endpoints',
              passed: false,
              critical: true,
              evidence: [],
              message: 'Missing API controllers - required for traditional backend architecture'
            });
          }
        }
        break;

      case 3: // UI/UX Development - Frontend Implementation
        // Platform-aware validation for UI components
        if (platformInfo.framework === 'ios-native') {
          // iOS native: Check for ViewControllers, Views, SwiftUI views
          const hasIOSViews = implementation.files.some(file =>
            file.includes('ViewController') ||
            file.includes('View.swift') ||
            file.includes('ContentView') ||
            file.includes('.swift') && (file.includes('View') || file.includes('Screen'))
          );
          
          if (!hasIOSViews) {
            result.criticalGaps.push({
              requirement: 'iOS UI Views (ViewControllers, SwiftUI Views)',
              passed: false,
              critical: true,
              evidence: [],
              message: 'Missing iOS UI components - ViewControllers, Views, or SwiftUI views not implemented'
            });
          }

          // Check for navigation structure (UINavigationController, NavigationStack for SwiftUI)
          const hasNavigation = implementation.files.some(file =>
            file.includes('Navigation') ||
            file.includes('Router') ||
            file.includes('Coordinator')
          );

          if (!hasNavigation) {
            result.criticalGaps.push({
              requirement: 'iOS Navigation structure',
              passed: false,
              critical: true,
              evidence: [],
              message: 'Missing iOS navigation structure - UINavigationController or NavigationStack not implemented'
            });
          }
        } else if (platformInfo.framework === 'android-native') {
          // Android native: Check for Activities, Fragments, Composables
          const hasAndroidViews = implementation.files.some(file =>
            file.includes('Activity') ||
            file.includes('Fragment') ||
            file.includes('Composable') ||
            file.includes('.kt') && (file.includes('Screen') || file.includes('View'))
          );

          if (!hasAndroidViews) {
            result.criticalGaps.push({
              requirement: 'Android UI Components (Activities, Fragments, Composables)',
              passed: false,
              critical: true,
              evidence: [],
              message: 'Missing Android UI components - Activities, Fragments, or Composables not implemented'
            });
          }

          // Check for navigation (NavController, Navigation Component)
          const hasNavigation = implementation.files.some(file =>
            file.includes('Navigation') ||
            file.includes('NavController')
          );

          if (!hasNavigation) {
            result.criticalGaps.push({
              requirement: 'Android Navigation structure',
              passed: false,
              critical: true,
              evidence: [],
              message: 'Missing Android navigation structure - Navigation Component not implemented'
            });
          }
        } else if (platformInfo.framework === 'react-native') {
          // React Native: Check for components and navigation
          const hasComponents = implementation.files.some(file =>
            file.includes('/components/') ||
            file.includes('/screens/') ||
            file.includes('.tsx') || file.includes('.jsx')
          );

          if (!hasComponents) {
            result.criticalGaps.push({
              requirement: 'React Native components (/components/ or /screens/)',
              passed: false,
              critical: true,
              evidence: [],
              message: 'Missing React Native components - UI components not implemented'
            });
          }

          const hasNavigation = implementation.files.some(file =>
            file.includes('navigation') ||
            file.includes('react-navigation') ||
            file.includes('@react-navigation')
          );

          if (!hasNavigation) {
            result.criticalGaps.push({
              requirement: 'React Native navigation',
              passed: false,
              critical: true,
              evidence: [],
              message: 'Missing React Native navigation - react-navigation not configured'
            });
          }
        } else {
          // Web platforms (Next.js, React, etc.): Use web-style patterns
          if (!implementation.patterns['hasUIComponents']) {
            result.criticalGaps.push({
              requirement: 'UI components (/components/ or /ui/)',
              passed: false,
              critical: true,
              evidence: [],
              message: 'Missing UI components - user interface not implemented'
            });
          }

          if (!implementation.patterns['hasPageStructure']) {
            result.criticalGaps.push({
              requirement: 'Page structure (/pages/ or /routes/)',
              passed: false,
              critical: true,
              evidence: [],
              message: 'Missing page structure - application navigation not implemented'
            });
          }
        }

        // Warning: Styling (platform-agnostic)
        if (!implementation.patterns['hasStyling']) {
          const stylingMessage = platformInfo.framework === 'ios-native' 
            ? 'Consider adding SwiftUI styling or UIKit design patterns'
            : platformInfo.framework === 'android-native'
            ? 'Consider adding Material Design or Jetpack Compose theming'
            : 'Consider adding styling for better user experience';
          
          result.warnings.push({
            requirement: 'Styling system',
            passed: false,
            critical: false,
            evidence: [],
            message: stylingMessage
          });
        }
        break;

      case 4: // Testing & Deployment - Quality Assurance
        // Critical: Must have testing and deployment
        if (!implementation.patterns.hasTesting) {
          result.criticalGaps.push({
            requirement: 'Testing framework and test files',
            passed: false,
            critical: true,
            evidence: [],
            message: 'Missing testing implementation - quality assurance incomplete'
          });
        }

        if (!implementation.patterns['hasDeploymentConfig']) {
          result.criticalGaps.push({
            requirement: 'Deployment configuration (Docker, CI/CD, hosting)',
            passed: false,
            critical: true,
            evidence: [],
            message: 'Missing deployment configuration - cannot deploy application'
          });
        }

        // Warning: Integration tests
        if (!implementation.patterns['hasIntegrationTests']) {
          result.warnings.push({
            requirement: 'Integration/E2E tests',
            passed: false,
            critical: false,
            evidence: [],
            message: 'Consider adding integration tests for end-to-end validation'
          });
        }
        break;
    }

    return result;
  }

  private generateRecommendations(validation: ValidationResult, phase: number): string[] {
    const recommendations: string[] = [];

    if (validation.criticalGaps.length > 0) {
      recommendations.push('🚨 CRITICAL: Address all critical gaps before proceeding');
      validation.criticalGaps.forEach(gap => {
        recommendations.push(`- Implement: ${gap.requirement}`);
      });
    }

    if (validation.warnings.length > 0) {
      recommendations.push('⚠️ WARNING: Consider addressing these architectural concerns');
      validation.warnings.forEach(warning => {
        recommendations.push(`- Consider: ${warning.requirement}`);
      });
    }

    // Phase-specific recommendations
    switch (phase) {
      case 2:
        if (!validation.criticalGaps.some(g => g.requirement.includes('API'))) {
          recommendations.push('✅ Phase 2: Ensure API endpoints are implemented, not just client services');
        }
        break;
    }

    return recommendations;
  }

  private generateValidationReport(validation: ValidationResult, phase: number, strict: boolean): string {
    let report = `
🛡️ ARCHITECTURAL VALIDATION REPORT - Phase ${phase}
${'='.repeat(50)}

`;

    if (validation.isComplete) {
      report += `✅ PHASE ${phase} ARCHITECTURE: COMPLETE
🎉 All architectural requirements satisfied
`;
    } else {
      report += `❌ PHASE ${phase} ARCHITECTURE: INCOMPLETE
🚨 Critical gaps found - ${strict ? 'BLOCKING PROGRESS' : 'WARNING ONLY'}
`;
    }

    // Critical Gaps
    if (validation.criticalGaps.length > 0) {
      report += `
🚨 CRITICAL GAPS (${validation.criticalGaps.length}):
${'-'.repeat(30)}

`;
      validation.criticalGaps.forEach((gap, i) => {
        report += `${i + 1}. ${gap.requirement}
   Status: ❌ MISSING
   Impact: BLOCKS PHASE COMPLETION
   Message: ${gap.message}
   Evidence checked: ${gap.evidence.length} items found

`;
      });
    }

    // Warnings
    if (validation.warnings.length > 0) {
      report += `
⚠️ WARNINGS (${validation.warnings.length}):
${'-'.repeat(30)}

`;
      validation.warnings.forEach((warning, i) => {
        report += `${i + 1}. ${warning.requirement}
   Status: ⚠️ SUBOPTIMAL
   Message: ${warning.message}

`;
      });
    }

    // Recommendations
    if (validation.recommendations.length > 0) {
      report += `
💡 RECOMMENDATIONS:
${'-'.repeat(30)}

`;
      validation.recommendations.forEach(rec => {
        report += `• ${rec}
`;
      });
    }

    // Implementation Evidence
    report += `
📋 IMPLEMENTATION EVIDENCE:
${'-'.repeat(30)}

Files/Directories Found:
${validation.criticalGaps.concat(validation.warnings)
  .flatMap(gap => gap.evidence)
  .filter((item, index, arr) => arr.indexOf(item) === index) // Remove duplicates
  .map(item => `• ${item}`)
  .join('\n') || 'No architectural files detected'}

`;

    report += `
🎯 VALIDATION RESULT:
${'-'.repeat(30)}

Can Proceed: ${validation.isComplete || !strict ? '✅ YES' : '❌ NO'}
Strict Mode: ${strict ? '✅ ENABLED' : '⚠️ DISABLED'}
Phase Complete: ${validation.isComplete ? '✅ YES' : '❌ NO'}

${validation.isComplete ?
  '🎉 Architecture validation PASSED - Phase can proceed' :
  '🚨 Architecture validation FAILED - Address critical gaps before proceeding'
}

`;

    return report;
  }
}

// Type definitions
interface ImplementationState {
  files: string[];
  directories: string[];
  technologies: Set<string>;
  patterns: {
    hasApiLayer: boolean;
    hasSecurityLayer: boolean;
    hasDatabaseLayer: boolean;
    hasClientServerSeparation: boolean;
    hasAuthentication: boolean;
    hasAuthorization: boolean;
    hasDataValidation: boolean;
    hasErrorHandling: boolean;
    hasLogging: boolean;
    hasTesting: boolean;
    hasDocumentation: boolean;
  };
  security: {
    hasSecureApiCalls: boolean;
    hasInputValidation: boolean;
    hasAuthentication: boolean;
    hasAuthorization: boolean;
    hasSecureStorage: boolean;
  };
  architecture: {
    layers: string[];
    communication: string[];
    dataFlow: string[];
  };
}

interface ArchitecturalRequirement {
  type: string;
  description: string;
  critical: boolean;
  phase: string | number;
}

interface RequirementValidation {
  requirement: string;
  passed: boolean;
  critical: boolean;
  evidence: string[];
  message: string;
}

interface ValidationResult {
  isComplete: boolean;
  criticalGaps: RequirementValidation[];
  warnings: RequirementValidation[];
  recommendations: string[];
  phaseSpecificValidation: any;
}
