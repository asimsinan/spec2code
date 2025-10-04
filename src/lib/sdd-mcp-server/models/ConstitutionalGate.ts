import { z } from "zod";

/**
 * Constitutional gate model for SDD validation
 * Enforces the 6 constitutional principles
 */
export const ConstitutionalPrincipleSchema = z.enum([
  'library-first',
  'cli-interface',
  'test-first',
  'integration-first',
  'simplicity',
  'anti-abstraction'
]);

export const GateValidationResultSchema = z.object({
  principle: ConstitutionalPrincipleSchema,
  passed: z.boolean(),
  violations: z.array(z.string()).default([]),
  justification: z.string().optional(),
  timestamp: z.string().optional()
});

export const ConstitutionalGateSchema = z.object({
  // Gate identification
  id: z.string(),
  name: z.string(),
  description: z.string(),
  
  // Validation results
  validationResults: z.array(GateValidationResultSchema),
  
  // Overall status
  overallPassed: z.boolean(),
  totalViolations: z.number().default(0),
  
  // Metadata
  lastValidated: z.string().optional(),
  version: z.string().default("1.0.0")
});

export type ConstitutionalPrinciple = z.infer<typeof ConstitutionalPrincipleSchema>;
export type GateValidationResult = z.infer<typeof GateValidationResultSchema>;
export type ConstitutionalGate = z.infer<typeof ConstitutionalGateSchema>;

/**
 * Helper functions for Constitutional Gate operations
 */
export class ConstitutionalGateHelper {
  /**
   * Create a new ConstitutionalGate instance
   */
  static create(): ConstitutionalGate {
    const now = new Date().toISOString();
    
    return {
      id: 'constitutional-gates',
      name: 'Constitutional Gates',
      description: 'Enforces the 6 constitutional principles of SDD',
      validationResults: [
        {
          principle: 'library-first',
          passed: false,
          violations: [],
          timestamp: now
        },
        {
          principle: 'cli-interface',
          passed: false,
          violations: [],
          timestamp: now
        },
        {
          principle: 'test-first',
          passed: false,
          violations: [],
          timestamp: now
        },
        {
          principle: 'integration-first',
          passed: false,
          violations: [],
          timestamp: now
        },
        {
          principle: 'simplicity',
          passed: false,
          violations: [],
          timestamp: now
        },
        {
          principle: 'anti-abstraction',
          passed: false,
          violations: [],
          timestamp: now
        }
      ],
      overallPassed: false,
      totalViolations: 0,
      lastValidated: now,
      version: '1.0.0'
    };
  }

  /**
   * Validate Library-First principle
   */
  static validateLibraryFirst(context: any): GateValidationResult {
    const violations: string[] = [];
    const now = new Date().toISOString();

    // Check if every feature is implemented as a library
    if (context.projectStructure && !context.projectStructure.src?.lib) {
      violations.push('No library structure defined in project');
    }

    // Check if UI/app layers are thin veneers
    if (context.projectStructure && context.projectStructure.src?.ui) {
      violations.push('UI layer should be thin veneer over library');
    }

    // Check if feature can be implemented as standalone library
    if (context.featureDescription && 
        !context.featureDescription.toLowerCase().includes('library') &&
        !context.featureDescription.toLowerCase().includes('service') &&
        !context.featureDescription.toLowerCase().includes('api')) {
      violations.push('Feature may not be implementable as standalone library');
    }

    return {
      principle: 'library-first',
      passed: violations.length === 0,
      violations,
      timestamp: now
    };
  }

  /**
   * Validate CLI Interface principle
   */
  static validateCliInterface(context: any): GateValidationResult {
    const violations: string[] = [];
    const now = new Date().toISOString();

    // Check if MCP tools are defined (serves as CLI interface)
    if (!context.mcpTools || context.mcpTools.length === 0) {
      violations.push('No MCP tools defined (CLI interface required)');
    }

    // Check if tools support JSON input/output
    if (context.mcpTools) {
      const toolsWithoutJson = context.mcpTools.filter((tool: any) => 
        !tool.schema || !tool.schema.input || !tool.schema.output
      );
      if (toolsWithoutJson.length > 0) {
        violations.push('Some MCP tools do not support JSON input/output');
      }
    }

    // Check if errors go to stderr (handled by MCP protocol)
    if (context.errorHandling && !context.errorHandling.stderr) {
      violations.push('Error handling should use stderr');
    }

    return {
      principle: 'cli-interface',
      passed: violations.length === 0,
      violations,
      timestamp: now
    };
  }

  /**
   * Validate Test-First principle
   */
  static validateTestFirst(context: any): GateValidationResult {
    const violations: string[] = [];
    const now = new Date().toISOString();

    // Check if TDD order is enforced
    const expectedOrder = ['Contract', 'Integration', 'E2E', 'Unit', 'Implementation'];
    if (context.tddOrder && JSON.stringify(context.tddOrder) !== JSON.stringify(expectedOrder)) {
      violations.push(`TDD order must be: ${expectedOrder.join(' → ')}`);
    }

    // Check if tests are written before implementation
    if (context.tasks) {
      const contractTasks = context.tasks.filter((task: any) => task.tddOrder === 'Contract');
      const implementationTasks = context.tasks.filter((task: any) => task.tddOrder === 'Implementation');
      
      if (contractTasks.length === 0) {
        violations.push('No contract tests defined');
      }
      if (implementationTasks.length > 0 && contractTasks.length === 0) {
        violations.push('Implementation tasks exist without contract tests');
      }
    }

    // Check if test coverage is planned
    if (context.testing && !context.testing.contract && !context.testing.integration) {
      violations.push('Contract and integration tests must be planned');
    }

    return {
      principle: 'test-first',
      passed: violations.length === 0,
      violations,
      timestamp: now
    };
  }

  /**
   * Validate Integration-First principle
   */
  static validateIntegrationFirst(context: any): GateValidationResult {
    const violations: string[] = [];
    const now = new Date().toISOString();

    // Check if real dependencies are used
    if (context.dependencies) {
      const mockDependencies = context.dependencies.filter((dep: any) => 
        dep.includes('mock') || dep.includes('fake') || dep.includes('stub')
      );
      if (mockDependencies.length > 0) {
        violations.push('Prefer real dependencies over mocks');
      }
    }

    // Check if real file system operations are planned
    if (context.fileOperations && context.fileOperations.mock) {
      violations.push('File operations should use real file system, not mocks');
    }

    // Check for justification if mocks are used
    if (context.mockJustification && !context.mockJustification.reason) {
      violations.push('Mock usage requires written justification');
    }

    return {
      principle: 'integration-first',
      passed: violations.length === 0,
      violations,
      timestamp: now
    };
  }

  /**
   * Validate Simplicity principle
   */
  static validateSimplicity(context: any): GateValidationResult {
    const violations: string[] = [];
    const now = new Date().toISOString();

    // Check project count (≤ 5)
    if (context.projectCount && context.projectCount > 5) {
      violations.push(`Project count ${context.projectCount} exceeds limit of 5`);
    }

    // Check if framework features are used directly
    if (context.frameworkUsage && !context.frameworkUsage.direct) {
      violations.push('Should use framework features directly');
    }

    // Check for unnecessary abstractions
    if (context.abstractions) {
      const unnecessaryAbstractions = context.abstractions.filter((abs: any) => 
        abs.type === 'DTO' || abs.type === 'Repository' || abs.type === 'UnitOfWork'
      );
      if (unnecessaryAbstractions.length > 0) {
        violations.push('Avoid unnecessary abstractions (DTO, Repository, UnitOfWork)');
      }
    }

    // Check if complexity is documented
    if (context.complexity && context.complexity.level > 3 && !context.complexity.documented) {
      violations.push('High complexity must be documented in Complexity Tracking');
    }

    return {
      principle: 'simplicity',
      passed: violations.length === 0,
      violations,
      timestamp: now
    };
  }

  /**
   * Validate Anti-Abstraction principle
   */
  static validateAntiAbstraction(context: any): GateValidationResult {
    const violations: string[] = [];
    const now = new Date().toISOString();

    // Check if single domain model is used
    if (context.domainModels && context.domainModels.length > 1) {
      violations.push('Should use single domain model (FeatureSpec)');
    }

    // Check for unnecessary DTOs
    if (context.dataTransferObjects && context.dataTransferObjects.length > 0) {
      violations.push('Avoid DTOs unless serialization requires them');
    }

    // Check for unnecessary Repository pattern
    if (context.repositories && context.repositories.length > 0) {
      violations.push('Avoid Repository pattern unless truly necessary');
    }

    // Check for unnecessary Unit of Work
    if (context.unitOfWork) {
      violations.push('Avoid Unit of Work pattern unless truly necessary');
    }

    // Check if FeatureSpec is the core domain model
    if (context.coreModel && context.coreModel !== 'FeatureSpec') {
      violations.push('FeatureSpec should be the core domain model');
    }

    return {
      principle: 'anti-abstraction',
      passed: violations.length === 0,
      violations,
      timestamp: now
    };
  }

  /**
   * Validate all constitutional gates
   */
  static validateAllGates(context: any): ConstitutionalGate {
    const now = new Date().toISOString();
    
    const validationResults = [
      this.validateLibraryFirst(context),
      this.validateCliInterface(context),
      this.validateTestFirst(context),
      this.validateIntegrationFirst(context),
      this.validateSimplicity(context),
      this.validateAntiAbstraction(context)
    ];

    const totalViolations = validationResults.reduce((total, result) => 
      total + result.violations.length, 0
    );

    const overallPassed = validationResults.every(result => result.passed);

    return {
      id: 'constitutional-gates',
      name: 'Constitutional Gates',
      description: 'Enforces the 6 constitutional principles of SDD',
      validationResults,
      overallPassed,
      totalViolations,
      lastValidated: now,
      version: '1.0.0'
    };
  }

  /**
   * Get all violations across all gates
   */
  static getAllViolations(gate: ConstitutionalGate): string[] {
    return gate.validationResults.flatMap(result => result.violations);
  }

  /**
   * Get violations for a specific principle
   */
  static getViolationsForPrinciple(gate: ConstitutionalGate, principle: ConstitutionalPrinciple): string[] {
    const result = gate.validationResults.find(r => r.principle === principle);
    return result ? result.violations : [];
  }

  /**
   * Check if a specific principle passes
   */
  static isPrinciplePassed(gate: ConstitutionalGate, principle: ConstitutionalPrinciple): boolean {
    const result = gate.validationResults.find(r => r.principle === principle);
    return result ? result.passed : false;
  }

  /**
   * Generate gate summary for status reporting
   */
  static generateSummary(gate: ConstitutionalGate): {
    overallPassed: boolean;
    passedGates: number;
    totalGates: number;
    violations: string[];
    principleStatus: Record<string, boolean>;
  } {
    const passedGates = gate.validationResults.filter(result => result.passed).length;
    const totalGates = gate.validationResults.length;
    const violations = this.getAllViolations(gate);
    
    const principleStatus = gate.validationResults.reduce((acc, result) => {
      acc[result.principle] = result.passed;
      return acc;
    }, {} as Record<string, boolean>);

    return {
      overallPassed: gate.overallPassed,
      passedGates,
      totalGates,
      violations,
      principleStatus
    };
  }
}
