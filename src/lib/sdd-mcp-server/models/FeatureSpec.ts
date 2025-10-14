import { z } from "zod";

/**
 * Core specification model for SDD features
 * Represents the single domain model as per Anti-Abstraction principle
 */
export const UserScenarioSchema = z.object({
  title: z.string().describe("Scenario title"),
  given: z.string().describe("Initial state"),
  when: z.string().describe("Action taken"),
  then: z.string().describe("Expected outcome")
});

export const FunctionalRequirementSchema = z.object({
  id: z.string().regex(/^FR-\d{3}$/, "Must be in format FR-XXX"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

export const KeyEntitySchema = z.object({
  name: z.string().min(1, "Entity name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  attributes: z.array(z.string()).optional(),
  relationships: z.array(z.string()).optional()
});

export const ReviewChecklistSchema = z.object({
  contentQuality: z.object({
    noImplementationDetails: z.boolean().default(false),
    focusedOnUserValue: z.boolean().default(false),
    writtenForNonTechnical: z.boolean().default(false),
    allMandatorySections: z.boolean().default(false)
  }),
  requirementCompleteness: z.object({
    requirementsTestable: z.boolean().default(false),
    successCriteriaMeasurable: z.boolean().default(false),
    scopeClearlyBounded: z.boolean().default(false)
  })
});

export const ExecutionStatusSchema = z.object({
  descriptionParsed: z.boolean().default(false),
  conceptsExtracted: z.boolean().default(false),
  ambiguitiesMarked: z.boolean().default(false),
  scenariosDefined: z.boolean().default(false),
  requirementsGenerated: z.boolean().default(false),
  entitiesIdentified: z.boolean().default(false),
  reviewChecklistPassed: z.boolean().default(false)
});

export const FeatureSpecSchema = z.object({
  // Header information
  featureName: z.string().min(1, "Feature name is required"),
  created: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be in YYYY-MM-DD format"),
  status: z.enum(["Draft", "In Review", "Approved", "Implemented"]).default("Draft"),
  input: z.string().min(10, "Input description must be at least 10 characters"),
  
  // User scenarios and testing
  primaryUserStory: z.string().min(20, "Primary user story must be at least 20 characters"),
  acceptanceScenarios: z.array(UserScenarioSchema).min(1, "At least 5 acceptance scenario is required"),
  edgeCases: z.array(z.string()).min(1, "At least 3 edge case is required"),
  
  // Requirements
  functionalRequirements: z.array(FunctionalRequirementSchema).min(1, "At least ten functional requirement is required"),
  keyEntities: z.array(KeyEntitySchema).optional(),
  
  // Review and acceptance
  reviewChecklist: ReviewChecklistSchema,
  executionStatus: ExecutionStatusSchema,
  
  // Metadata
  specPath: z.string().optional(),
  lastModified: z.string().optional(),
  version: z.string().default("1.0.0")
});

export type UserScenario = z.infer<typeof UserScenarioSchema>;
export type FunctionalRequirement = z.infer<typeof FunctionalRequirementSchema>;
export type KeyEntity = z.infer<typeof KeyEntitySchema>;
export type ReviewChecklist = z.infer<typeof ReviewChecklistSchema>;
export type ExecutionStatus = z.infer<typeof ExecutionStatusSchema>;
export type FeatureSpec = z.infer<typeof FeatureSpecSchema>;

/**
 * Helper functions for FeatureSpec operations
 */
export class FeatureSpecHelper {
  /**
   * Create a new FeatureSpec from user input
   */
  static createFromInput(
    featureDescription: string,
    featureName?: string,
  ): Partial<FeatureSpec> {
    const now = new Date().toISOString().split('T')[0];
    const slug = featureName?.toLowerCase().replace(/\s+/g, '-') || 'feature';
    return {
      featureName: featureName || 'Unnamed Feature',
      created: now,
      status: 'Draft',
      input: featureDescription,
      primaryUserStory: `As a user, I want to ${featureDescription.toLowerCase()} so that I can achieve my goals.`,
      acceptanceScenarios: [],
      edgeCases: [],
      functionalRequirements: [],
      reviewChecklist: {
        contentQuality: {
          noImplementationDetails: false,
          focusedOnUserValue: false,
          writtenForNonTechnical: false,
          allMandatorySections: false
        },
        requirementCompleteness: {
          requirementsTestable: false,
          successCriteriaMeasurable: false,
          scopeClearlyBounded: false
        }
      },
      executionStatus: {
        descriptionParsed: true,
        conceptsExtracted: false,
        ambiguitiesMarked: false,
        scenariosDefined: false,
        requirementsGenerated: false,
        entitiesIdentified: false,
        reviewChecklistPassed: false
      },
      version: '1.0.0'
    };
  }


  /**
   * Check if spec is complete
   */
  static isComplete(spec: FeatureSpec): boolean {
    return spec.executionStatus.reviewChecklistPassed &&
           spec.acceptanceScenarios.length > 0 &&
           spec.functionalRequirements.length > 0;
  }

  /**
   * Validate constitutional compliance
   */
  static validateConstitutionalCompliance(spec: Partial<FeatureSpec>): {
    compliant: boolean;
    violations: string[];
  } {
    const violations: string[] = [];

    // Simplicity Gate: Check for implementation details
    if (spec.input && (spec.input.toLowerCase().includes('typescript') ||
        spec.input.toLowerCase().includes('react') ||
        spec.input.toLowerCase().includes('database'))) {
      violations.push('Input contains implementation details (violates Simplicity Gate)');
    }

    // Library-First: Check if feature can be implemented as library
    if (spec.input && !spec.input.toLowerCase().includes('library') &&
        !spec.input.toLowerCase().includes('service') &&
        !spec.input.toLowerCase().includes('api')) {
      violations.push('Feature may not be implementable as library (violates Library-First principle)');
    }

    // Test-First: Check for testable requirements
    if (spec.functionalRequirements) {
      const untestableRequirements = spec.functionalRequirements.filter(req => 
        !req.description.toLowerCase().includes('must') &&
        !req.description.toLowerCase().includes('should') &&
        !req.description.toLowerCase().includes('will')
      );
      if (untestableRequirements.length > 0) {
        violations.push('Some requirements are not testable (violates Test-First principle)');
      }
    }

    return {
      compliant: violations.length === 0,
      violations
    };
  }

  /**
   * Generate spec summary for status reporting
   */
  static generateSummary(spec: Partial<FeatureSpec>): {
    completeness: number;
    constitutionalCompliant: boolean;
    violations: string[];
  } {
    const totalChecks = spec.executionStatus ? Object.values(spec.executionStatus).filter(Boolean).length : 0;
    const completedChecks = spec.executionStatus ? Object.values(spec.executionStatus).filter(Boolean).length : 0;
    const completeness = totalChecks > 0 ? (completedChecks / totalChecks) * 100 : 0;

    const constitutionalCheck = this.validateConstitutionalCompliance(spec);

    return {
      completeness: Math.round(completeness),
      constitutionalCompliant: constitutionalCheck.compliant,
      violations: constitutionalCheck.violations
    };
  }
}
