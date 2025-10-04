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
  language: z.string().default("TypeScript"),
  version: z.string().default("5.8.2"),
  primaryDependencies: z.array(z.string()),
  storage: z.string(),
  testing: z.string(),
  targetPlatform: z.string(),
  performanceGoals: z.string().optional()
});

export const ProjectStructureSchema = z.object({
  root: z.string(),
  src: z.object({
    lib: z.string(),
    contracts: z.string(),
    tests: z.object({
      contract: z.string(),
      integration: z.string(),
      unit: z.string()
    })
  }),
  specs: z.string()
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
  summary: z.string().min(20, "Summary must be at least 20 characters"),
  
  // Technical context
  technicalContext: TechnicalContextSchema,
  
  // Constitutional gates
  constitutionalGates: ConstitutionalGatesSchema,
  
  // Project structure
  projectStructure: ProjectStructureSchema,
  
  // Implementation phases
  implementationPhases: z.array(ImplementationPhaseSchema).min(1, "At least one phase is required"),
  
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
      summary: `Implementation plan for ${spec.featureName || 'feature'}`,
      technicalContext: {
        language: 'TypeScript',
        version: '5.8.2',
        primaryDependencies: ['@modelcontextprotocol/sdk', 'zod', 'simple-git'],
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
        root: 'src/',
        src: {
          lib: 'lib/sdd-mcp-server/',
          contracts: 'contracts/',
          tests: {
            contract: 'tests/contract/',
            integration: 'tests/integration/',
            unit: 'tests/unit/'
          }
        },
        specs: 'specs/'
      },
      implementationPhases: [
        {
          name: 'Phase 1: Contracts & Tests',
          description: 'Define contracts and create failing tests',
          tasks: ['Create MCP tool contracts', 'Create contract tests', 'Create integration tests'],
          dependencies: [],
          estimatedDuration: '1-2 hours'
        },
        {
          name: 'Phase 2: Library Implementation',
          description: 'Implement core library following TDD',
          tasks: ['Implement data models', 'Implement services', 'Create MCP tools'],
          dependencies: ['Phase 1: Contracts & Tests'],
          estimatedDuration: '4-6 hours'
        },
        {
          name: 'Phase 3: Integration & Validation',
          description: 'Final integration and validation',
          tasks: ['End-to-end testing', 'Performance validation', 'Documentation'],
          dependencies: ['Phase 2: Library Implementation'],
          estimatedDuration: '2-3 hours'
        }
      ],
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
      gates.simplicityGate.violations.push(`Project count ${gates.simplicityGate.projectCount} exceeds limit of 5`);
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
    const phaseCount = plan.implementationPhases.length;
    
    const totalHours = plan.implementationPhases.reduce((total, phase) => {
      const hours = phase.estimatedDuration?.match(/(\d+)-(\d+)/);
      if (hours) {
        return total + (parseInt(hours[1]) + parseInt(hours[2])) / 2;
      }
      return total;
    }, 0);

    return {
      constitutionalCompliant,
      violations,
      phaseCount,
      estimatedDuration: `${Math.round(totalHours)} hours`
    };
  }
}
