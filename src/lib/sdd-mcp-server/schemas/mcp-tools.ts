/**
 * MCP Tool Schemas
 * JSON schemas for all 7 SDD MCP tools
 */

import { z } from 'zod';

// Common schemas
export const ErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string(),
  details: z.record(z.any()).optional()
});

export const SuccessSchema = z.object({
  success: z.literal(true)
});

// Specify Tool Schemas
export const SpecifyInputSchema = z.object({
  input: z.string().min(10).max(5000),
  featureName: z.string().min(3).max(100).optional(),
  platform: z.enum(['mobile', 'web', 'desktop', 'backend', 'ai']).optional()
});

export const SpecifyOutputSchema = z.object({
  success: z.literal(true),
  featureName: z.string(),
  specPath: z.string(),
  constitutionalCompliant: z.boolean(),
  violations: z.array(z.string()),
  warnings: z.array(z.string()),
  nextStep: z.string().optional()
});

export const SpecifyErrorSchema = ErrorSchema.extend({
  error: z.literal('SPECIFICATION_CREATION_FAILED')
});


// Plan Tool Schemas
export const PlanInputSchema = z.object({
  featureId: z.string().regex(/^[a-zA-Z0-9-_]+$/).optional(),
  platform: z.enum(['mobile', 'web', 'desktop', 'backend', 'ai']).optional()
});

export const PlanOutputSchema = z.object({
  success: z.literal(true),
  featureId: z.string(),
  featureName: z.string(),
  platform: z.string(),
  planPath: z.string(),
  nextStep: z.string(),
  templateData: z.any()
});

export const PlanErrorSchema = ErrorSchema.extend({
  error: z.literal('PLAN_CREATION_FAILED')
});

// Tasks Tool Schemas
export const TasksInputSchema = z.object({
  planPath: z.string().regex(/^(specs\/.*\.(json|md)$|\/.*\.(json|md)$)/).optional(),
  featureId: z.string().optional()
});

export const TasksOutputSchema = z.object({
  success: z.literal(true),
  featureName: z.string(),
  tasksPath: z.string(),
  totalTasks: z.number(),
  tddOrder: z.array(z.string()),
  phases: z.number(),
  parallelTasks: z.number(),
  estimatedDuration: z.string(),
  nextStep: z.string().optional()
});

export const TasksErrorSchema = ErrorSchema.extend({
  error: z.literal('TASKS_CREATION_FAILED')
});


// Status Tool Schemas
export const StatusInputSchema = z.object({
  featureId: z.string().regex(/^[a-zA-Z0-9-_]+$/).optional(),
  platform: z.enum(['mobile', 'web', 'desktop', 'backend', 'ai']).optional(),
  includeDiagrams: z.boolean().optional()
});

export const StatusOutputSchema = z.object({
  success: z.literal(true),
  featureId: z.string(),
  featureName: z.string(),
  platform: z.string(),
  completionPercentage: z.number(),
  includeDiagrams: z.boolean(),
  statusPath: z.string(),
  nextStep: z.string(),
  templateData: z.any()
});

export const StatusErrorSchema = ErrorSchema.extend({
  error: z.literal('STATUS_CHECK_FAILED')
});


export const ConflictItemSchema = z.object({
  type: z.enum(['overlap', 'dependency', 'naming', 'functional', 'entity']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string(),
  conflictingFeature: z.string(),
  suggestedResolution: z.string(),
  confidence: z.number()
});


// IMPLEMENT TOOL SCHEMAS
export const ImplementInputSchema = z.object({
  phase: z.string().optional().describe('Phase number (1, 2, 3...) to implement tasks for'),
  task: z.string().optional().describe('Task number within phase to implement'),
  showPlan: z.union([z.boolean(), z.string()]).optional().describe('Show implementation plan without executing (flag)'),
  validateOnly: z.union([z.boolean(), z.string()]).optional().describe('Just validate current state without implementing (flag)'),
  featureId: z.string().optional().describe('Override auto-detection with specific feature ID (optional)')
});

export const ImplementationFileSchema = z.object({
  path: z.string().describe('File path relative to project root'),
  content: z.string().describe('Generated file content'),
  type: z.enum(['test', 'implementation', 'config', 'documentation']).describe('Type of file generated'),
  language: z.string().describe('Programming language (e.g., "typescript", "javascript")'),
  purpose: z.string().describe('Purpose of this file in the implementation')
});

export const ImplementOutputSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  implementationPath: z.string(),
  nextPhase: z.string(),
  instructions: z.array(z.string()),
  sddGuidelines: z.array(z.string())
});

export const ImplementErrorSchema = ErrorSchema.extend({
  error: z.literal('IMPLEMENTATION_FAILED'),
  availableTasks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    phase: z.string(),
    tddOrder: z.string(),
    completed: z.boolean(),
    canImplement: z.boolean().describe('Whether this task is ready for implementation')
  })).optional().describe('Available tasks if task selection failed')
});

// NOTE: Cleanup tool schemas removed - cleanup is now automatic in template generation
