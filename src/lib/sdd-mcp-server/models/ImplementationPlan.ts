import { z } from "zod";

/**
 * Implementation plan model with constitutional gate validation
 */
export const ConstitutionalGatesSchema = z.object({
  simplicityGate: z.object({
    passed: z.boolean(),
    projectCount: z.number().max(5, "Must be ≤ 5 projects"),
    usingFrameworkDirectly: z.boolean(),
    singleDataModel: z.boolean(),
    violations: z.array(z.string()).default([])
  }),
  architectureGate: z.object({
    passed: z.boolean(),
    everyFeatureAsLibrary: z.boolean(),
    cliPerLibraryPlanned: z.boolean(),
    libraries: z.array(z.string()),
    violations: z.array(z.string()).default([])
  }),
  testingGate: z.object({
    passed: z.boolean(),
    tddOrderEnforced: z.boolean(),
    realDependenciesUsed: z.boolean(),
    contractTestsPlanned: z.boolean(),
    violations: z.array(z.string()).default([])
  })
});

export const TechnicalContextSchema = z.object({
  title: z.string(),
  languageVersion: z.string().optional(),
  primaryDependencies: z.string().optional(),
  technologyStack: z.string().optional(),
  frontendStack: z.string().optional(),
  backendStack: z.string().optional(),
  stylingApproach: z.string().optional(),
  chartLibraries: z.string().optional(),
  stateManagement: z.string().optional(),
  storage: z.string().optional(),
  testing: z.string().optional(),
  targetPlatform: z.string().optional(),
  performanceGoals: z.string().optional(),
  instruction: z.string().optional()
});

export const ProjectStructureSchema = z.object({
  title: z.string(),
  content: z.string().optional(),
  instruction: z.string().optional(),
  template: z.string().optional(),
  enforcement: z.string().optional()
});

export const ImplementationPhaseSchema = z.object({
  name: z.string(),
  description: z.string(),
  tasks: z.array(z.string()),
  dependencies: z.array(z.string()).default([]),
  estimatedDuration: z.string().optional()
});

export const ComplexityTrackingSchema = z.object({
  violations: z.array(z.object({
    violation: z.string(),
    justification: z.string(),
    simplerAlternativeRejected: z.string()
  })).default([])
});

export const ImplementationPlanSchema = z.object({
  // Header information
  featureName: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be in YYYY-MM-DD format"),
  specPath: z.string(),
  
  // Summary
  summary: z.object({
    title: z.string(),
    content: z.string().min(20, "Summary content must be at least 20 characters"),
    instruction: z.string().optional()
  }),
  
  // Technical context
  technicalContext: TechnicalContextSchema,
  
  // Constitutional gates
  constitutionalGates: ConstitutionalGatesSchema,
  
  // Project structure
  projectStructure: ProjectStructureSchema,
  
  // Implementation phases
  implementationPhases: z.object({
    title: z.string(),
    phase1: z.object({
      title: z.string(),
      content: z.string().optional(),
      instruction: z.string().optional()
    }).optional(),
    phase2: z.object({
      title: z.string(),
      content: z.string().optional(),
      instruction: z.string().optional()
    }).optional(),
    phase3: z.object({
      title: z.string(),
      content: z.string().optional(),
      instruction: z.string().optional()
    }).optional(),
    phase4: z.object({
      title: z.string(),
      content: z.string().optional(),
      instruction: z.string().optional()
    }).optional()
  }),
  
  // Complexity tracking
  complexityTracking: ComplexityTrackingSchema,
  
  // Metadata
  planPath: z.string().optional(),
  lastModified: z.string().optional(),
  version: z.string().default("1.0.0")
});

export type ConstitutionalGates = z.infer<typeof ConstitutionalGatesSchema>;
export type TechnicalContext = z.infer<typeof TechnicalContextSchema>;
export type ProjectStructure = z.infer<typeof ProjectStructureSchema>;
export type ImplementationPhase = z.infer<typeof ImplementationPhaseSchema>;
export type ComplexityTracking = z.infer<typeof ComplexityTrackingSchema>;
export type ImplementationPlan = z.infer<typeof ImplementationPlanSchema>;

/**
 * Helper functions for ImplementationPlan operations
 */
export class ImplementationPlanHelper {
  /**
   * Create a new ImplementationPlan from FeatureSpec
   */
  static createFromSpec(spec: any): Partial<ImplementationPlan> {
    const now = new Date().toISOString().split('T')[0];
    
    return {
      featureName: spec.featureName || 'Unnamed Feature',
      date: now,
      specPath: spec.specPath || 'specs/001-feature/spec.md',
      summary: {
        title: 'Summary',
        content: `Implementation plan for ${spec.featureName || 'feature'}`,
        instruction: 'Extract from feature spec: primary requirement + technical approach. Focus on business value and user outcomes.'
      },
      technicalContext: {
        title: 'Technical Context',
        languageVersion: 'TypeScript 5.8.2',
        primaryDependencies: '@modelcontextprotocol/sdk, zod, simple-git',
        technologyStack: 'TypeScript, Node.js',
        storage: 'File system',
        testing: 'Test framework as specified in project configuration',
        targetPlatform: 'Node.js MCP Server',
        performanceGoals: '<2s response time per tool call'
      },
      constitutionalGates: {
        simplicityGate: {
          passed: true,
          projectCount: 1,
          usingFrameworkDirectly: true,
          singleDataModel: true,
          violations: []
        },
        architectureGate: {
          passed: true,
          everyFeatureAsLibrary: true,
          cliPerLibraryPlanned: true,
          libraries: ['SDD MCP Server'],
          violations: []
        },
        testingGate: {
          passed: true,
          tddOrderEnforced: true,
          realDependenciesUsed: true,
          contractTestsPlanned: true,
          violations: []
        }
      },
      projectStructure: {
        title: 'Project Structure',
        content: 'Standard SDD project structure',
        instruction: 'Define the EXACT folder structure that MUST be followed during implementation',
        template: 'src/\n├── lib/[feature-name]/\n│   ├── models/\n│   ├── services/\n│   └── cli.(ts|py|rs|go)\n├── contracts/\n└── tests/\n    ├── contract/\n    ├── integration/\n    └── unit/',
        enforcement: 'This project structure is MANDATORY and must be followed exactly during implementation'
      },
      implementationPhases: {
        title: 'Implementation Phases (Balanced 4-Phase Structure)',
        phase1: {
          title: 'Phase 1: Foundations & Data (27 tasks)',
          content: 'Essential foundation work: API contracts, database setup, data models, and core infrastructure.',
          instruction: 'Essential foundation work: API contracts, database setup, data models, and core infrastructure. This phase establishes the fundamental building blocks that all other phases depend on.'
        },
        phase2: {
          title: 'Phase 2: Core Implementation (22 tasks)',
          content: 'Core library implementation, data models, business logic, and basic API structure.',
          instruction: 'Core library implementation, data models, business logic, and basic API structure. This phase builds the core functionality that powers the application.'
        },
        phase3: {
          title: 'Phase 3: UI Development with Real APIs (17 tasks)',
          content: 'Create UI components with real API services, platform setup, and complete user flow testing with live backend data.',
          instruction: 'Create UI components with real API services, platform setup, and complete user flow testing with live backend data. This phase implements the complete frontend with real backend integration.'
        },
        phase4: {
          title: 'Phase 4: Full Integration & Verification (10 tasks)',
          content: 'Complete integration testing with live backend services, documentation, and verify complete end-to-end functionality.',
          instruction: 'Complete integration testing with live backend services, documentation, and verify complete end-to-end functionality. This phase delivers the final working application.'
        }
      },
      complexityTracking: {
        violations: []
      },
      version: '1.0.0'
    };
  }

  /**
   * Validate constitutional gates
   */
  static validateConstitutionalGates(plan: ImplementationPlan): ConstitutionalGates {
    const gates = { ...plan.constitutionalGates };

    // Simplicity Gate validation
    gates.simplicityGate.violations = [];
    if (gates.simplicityGate.projectCount > 5) {
      gates.simplicityGate.violations.push(`Project count ${gates.simplicityGate.projectCount} exceeds limit of 15`);
      gates.simplicityGate.passed = false;
    }
    if (!gates.simplicityGate.usingFrameworkDirectly) {
      gates.simplicityGate.violations.push('Not using framework directly');
      gates.simplicityGate.passed = false;
    }
    if (!gates.simplicityGate.singleDataModel) {
      gates.simplicityGate.violations.push('Not using single data model');
      gates.simplicityGate.passed = false;
    }
    gates.simplicityGate.passed = gates.simplicityGate.violations.length === 0;

    // Architecture Gate validation
    gates.architectureGate.violations = [];
    if (!gates.architectureGate.everyFeatureAsLibrary) {
      gates.architectureGate.violations.push('Not every feature implemented as library');
      gates.architectureGate.passed = false;
    }
    if (!gates.architectureGate.cliPerLibraryPlanned) {
      gates.architectureGate.violations.push('No CLI planned per library');
      gates.architectureGate.passed = false;
    }
    if (gates.architectureGate.libraries.length === 0) {
      gates.architectureGate.violations.push('No libraries defined');
      gates.architectureGate.passed = false;
    }
    gates.architectureGate.passed = gates.architectureGate.violations.length === 0;

    // Testing Gate validation
    gates.testingGate.violations = [];
    if (!gates.testingGate.tddOrderEnforced) {
      gates.testingGate.violations.push('TDD order not enforced');
      gates.testingGate.passed = false;
    }
    if (!gates.testingGate.realDependenciesUsed) {
      gates.testingGate.violations.push('Not using real dependencies');
      gates.testingGate.passed = false;
    }
    if (!gates.testingGate.contractTestsPlanned) {
      gates.testingGate.violations.push('No contract tests planned');
      gates.testingGate.passed = false;
    }
    gates.testingGate.passed = gates.testingGate.violations.length === 0;

    return gates;
  }

  /**
   * Check if plan passes all constitutional gates
   */
  static isConstitutionallyCompliant(plan: ImplementationPlan): boolean {
    const gates = this.validateConstitutionalGates(plan);
    return gates.simplicityGate.passed && 
           gates.architectureGate.passed && 
           gates.testingGate.passed;
  }

  /**
   * Get all constitutional violations
   */
  static getConstitutionalViolations(plan: ImplementationPlan): string[] {
    const gates = this.validateConstitutionalGates(plan);
    return [
      ...gates.simplicityGate.violations,
      ...gates.architectureGate.violations,
      ...gates.testingGate.violations
    ];
  }

  /**
   * Add complexity tracking violation
   */
  static addComplexityViolation(
    plan: ImplementationPlan,
    violation: string,
    justification: string,
    simplerAlternativeRejected: string
  ): ImplementationPlan {
    return {
      ...plan,
      complexityTracking: {
        violations: [
          ...plan.complexityTracking.violations,
          { violation, justification, simplerAlternativeRejected }
        ]
      }
    };
  }

  /**
   * Generate plan summary for status reporting
   */
  static generateSummary(plan: ImplementationPlan): {
    constitutionalCompliant: boolean;
    violations: string[];
    phaseCount: number;
    estimatedDuration: string;
  } {
    const constitutionalCompliant = this.isConstitutionallyCompliant(plan);
    const violations = this.getConstitutionalViolations(plan);
    const phaseCount = 4; // Fixed 4 phases in the new structure
    
    // Calculate total hours based on the 4-phase structure
    const totalHours = 44; 

    return {
      constitutionalCompliant,
      violations,
      phaseCount,
      estimatedDuration: `${Math.round(totalHours)} hours`
    };
  }
}
