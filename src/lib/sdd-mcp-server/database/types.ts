/**
 * Database Types for SDD MCP Server
 * TypeScript interfaces for SQLite database operations
 */

export interface FeatureData {
  id: string;
  name: string;
  currentPhase?: string;
  constitutionalCompliant?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // CLI detection fields
  cliRequired?: boolean;
  cliDetected?: boolean;
  cliConfidence?: number;
  cliComplexity?: string;
  // Library detection fields
  libraryRequired?: boolean;
  libraryDetected?: boolean;
  libraryConfidence?: number;
  libraryComplexity?: string;
}

export interface SpecificationData {
  id?: number;
  featureId: string;
  content: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlanData {
  id?: number;
  featureId: string;
  content: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskData {
  id?: number;
  featureId: string;
  content: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface StatusData {
  id?: number;
  featureId: string;
  content: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface ImplementationData {
  id?: number;
  featureId: string;
  content: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface VerificationData {
  id?: number;
  featureId: string;
  content: any;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Matches DatabaseService.getStats() return (with extra tables optional)
 */
export interface DatabaseStats {
  features: number;
  specifications: number;
  plans: number;
  tasks: number;
  totalRecords: number;
}

/**
 * Widened to cover DatabaseService.get_feature_analysis() shape
 * while keeping your previous fields (now optional) so existing code compiles.
 */
export interface FeatureAnalysis {
  featureName: string;
  // Existence flags returned by get_feature_analysis()
  specExists: boolean;
  planExists: boolean;
  tasksExist: boolean;
  implementationExists: boolean;
  verificationExists: boolean;

  currentPhase: string;
  completionPercentage: number;
  constitutionalCompliant: boolean;

  // Parsed JSON blobs (nullable if not present)
  specContent?: any | null;
  planContent?: any | null;
  tasksContent?: any | null;
  statusContent?: any | null;
  implementationContent?: any | null;
  verificationContent?: any | null;

  // ---- Your previous fields kept as optional so older callers still work ----
  completedSteps?: string[];
  remainingSteps?: string[];
  violations?: string[];
  warnings?: string[];
  qualityGates?: {
    specificationQuality: string;
    planQuality: string;
    tasksQuality: string;
    implementationQuality: string;
    overallQuality: string;
  };
  implementationProgress?: {
    completedTasks: string[];
    inProgressTasks: string[];
    pendingTasks: string[];
    testCoverage: string;
    codeQuality: string;
  };
  nextSteps?: string[];
  quickLinks?: {
    specPath: string;
    planPath: string;
    tasksPath: string;
    implementationPath: string;
    verificationPath: string;
  };
}