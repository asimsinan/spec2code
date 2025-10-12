/**
 * INTERNAL: Generic DB Filler Tool
 *
 * - Supports create/upsert/insert/replace/update by delegating to DatabaseService save_* methods
 * - Optionally writes a file (filePath + fileContent) after a successful DB write
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs';
import * as path from 'path';
import { RobustDatabaseService } from '../database/RobustDatabaseService.js';
import { JsonRepairUtility } from '../utils/JsonRepairUtility.js';

type Operation = 'create' | 'upsert' | 'insert' | 'replace' | 'update';

type Args = {
  operation: Operation;
  table: string;
  data?: any;
  where?: any; // not used directly (DB layer uses INSERT OR REPLACE-style saves)
  filePath?: string;
  fileContent?: string;
};

function normalizeTableName(table: string): string {
  if (!table) return table;
  const t = table.trim().toLowerCase();

  // table mappings
  const map: Record<string, string> = {
    analysis: 'analysis',
  };

  // return mapped or original (most tables are already plural in schema)
  return map[t] ?? t;
}

function assert(condition: any, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export class SDDGenericDBFillerTool {
  private basePath: string;
  private db: RobustDatabaseService;

  constructor(basePath: string = process.cwd(), db?: RobustDatabaseService) {
    this.basePath = path.resolve(basePath);
    this.db = db || new RobustDatabaseService(path.join(this.basePath, 'sdd.db'));
  }

  getToolDefinition(): Tool {
    return {
      name: 'sdd_db_filler',
      description:
        '[INTERNAL AI TOOL] Writes JSON into the DB tables (features/specifications/plans/tasks/status). Can also write a file when filePath + fileContent are provided.',
      inputSchema: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['create', 'upsert', 'insert', 'replace', 'update'],
            description:
              'Write strategy. All map to an UPSERT-style save in DB layer (update is treated like upsert).',
          },
          table: {
            type: 'string',
            description:
              'Target table (e.g., analysis, specifications, plans, tasks, status, verifications).',
          },
          data: {
            type: 'object',
            description: 'Payload to persist. Most tables require { feature_id, content }.',
          },
          where: {
            type: 'object',
            description:
              'Optional where clause (ignored by the current DB layer which uses INSERT OR REPLACE semantics).',
          },
          filePath: {
            type: 'string',
            description:
              'Optional: relative path under project root to write a file (e.g., specs/analysis.md).',
          },
          fileContent: {
            type: 'string',
            description: 'Optional: file content to write when filePath is provided.',
          },
        },
        required: ['operation', 'table', 'data'],
      },
    };
  }

  async execute(args: Args): Promise<any> {
    try {
      const { operation, table, data, filePath } = args ?? ({} as Args);
      let { fileContent } = args ?? ({} as Args);

      // Basic validation
      assert(operation && typeof operation === 'string', 'Missing required parameter "operation".');
      assert(table && typeof table === 'string', 'Missing required parameter "table".');
      assert(data && typeof data === 'object', 'Missing required parameter "data".');

      // Treat 'update' like 'upsert'
      const opNormalized: Operation =
        (operation as string) === 'update' ? 'upsert' : (operation as Operation);



      // Route to correct DB writer
      let affected = 0;
      switch (table) {

        case 'specifications': {
          assert(data.feature_id, 'specifications requires data.feature_id');
          assert('content' in data, 'specifications requires data.content');
          
          // 🚀 NEW: Handle JSON content storage and markdown generation
          const content = data.content;
          let jsonContent: any;
          let markdownContent: string;
          
          // Check if content is already JSON object or string with robust repair
          if (typeof content === 'object') {
            // Content is already a JSON object
            jsonContent = content;
            markdownContent = this.generateMarkdownFromSpecJson(jsonContent);
          } else if (typeof content === 'string') {
            // Content is a string - use shared utility to safely parse with repair
            jsonContent = JsonRepairUtility.safeParseJson(content, 'SDDGenericDBFillerTool');
            if (!jsonContent) {
              throw new Error('Invalid JSON content for specifications - repair failed');
            }
            markdownContent = this.generateMarkdownFromSpecJson(jsonContent);
          } else {
            throw new Error('Invalid content type for specifications');
          }
          
          // Store JSON content in database using robust method
          await this.db.save_specification_robust(data.feature_id, jsonContent, data.template_id);
          
          // 🚀 FIX: Set fileContent to generated markdown for the general file writing logic
          if (filePath && fileContent === undefined) {
            // Override fileContent with generated markdown
            fileContent = markdownContent;
          }
          
          affected = 1;
          break;
        }

        case 'plans': {
          assert(data.feature_id, 'plans requires data.feature_id');
          assert('content' in data, 'plans requires data.content');
          
          await this.db.save_plan_robust(data.feature_id, data.content, data.template_id);
          affected = 1;
          break;
        }

        case 'tasks': {
          assert(data.feature_id, 'tasks requires data.feature_id');
          assert('content' in data, 'tasks requires data.content');
          
          await this.db.save_tasks_robust(data.feature_id, data.content, data.template_id);
          
          affected = 1;
          break;
        }

        case 'status': {
          assert(data.feature_id, 'status requires data.feature_id');
          assert('content' in data, 'status requires data.content');
          await this.db.save_status_robust(data.feature_id, data.content, data.template_id);
          affected = 1;
          break;
        }
        case 'features': {
          // Allow creating/updating a feature row
          const f = data;
          assert(f.id && f.name, 'features requires id, name');
          const payload = {
            id: f.id,
            name: f.name,
            status: f.status ?? 'not_started',
            completionPercentage: f.completionPercentage ?? 0,
            currentPhase: f.currentPhase ?? 'Not Started',
            constitutionalCompliant: !!f.constitutionalCompliant,
            // CLI detection fields
            cliRequired: f.cliRequired ?? false,
            cliDetected: f.cliDetected ?? false,
            cliConfidence: f.cliConfidence ?? 0.0,
            cliComplexity: f.cliComplexity ?? 'simple',
            // Library detection fields
            libraryRequired: f.libraryRequired ?? false,
            libraryDetected: f.libraryDetected ?? false,
            libraryConfidence: f.libraryConfidence ?? 0.0,
            libraryComplexity: f.libraryComplexity ?? 'simple',
            createdAt: f.createdAt ?? new Date().toISOString(),
            updatedAt: f.updatedAt ?? new Date().toISOString(),
          };
          await this.db.create_feature_robust(payload.id, payload);
          affected = 1;
          break;
        }

        default:
          throw new Error(`Unknown/unsupported table: ${table}`);
      }

      // Validate file write combo (if one is present, both are required)
      // Note: This validation is after specifications case which may set fileContent
      if ((filePath && fileContent === undefined) || (!filePath && fileContent !== undefined)) {
        throw new Error('If writing a file, both "filePath" and "fileContent" must be provided.');
      }

      // Optional file write (only after DB success)
      let writtenPath: string | undefined;
      if (filePath && fileContent !== undefined) {
        writtenPath = await this.writeFileSafely(this.basePath, filePath, fileContent);
      }
      return {
        success: true,
        message: "Tool executed successfully",
      };
    } catch (err: any) {
      const msg = err?.message || String(err);
      return {
        success: false,
        error: 'DB_FILLER_FAILED',
        message: msg,
      };
    }
  }

  // --------------------------
  // Utilities
  // --------------------------
  private async writeFileSafely(projectRoot: string, relPath: string, content: string): Promise<string> {
    const fullPath = path.join(projectRoot, relPath);
    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.promises.writeFile(fullPath, content, 'utf8');
    return fullPath;
  }



  /**
   * Generate markdown from specification JSON data
   */
  private generateMarkdownFromSpecJson(jsonData: any): string {
    if (!jsonData || typeof jsonData !== 'object') {
      return '# Invalid Specification Data';
    }

    const templateData = jsonData.template_data || jsonData;
    
    // Extract basic information
    const title = templateData.title || 'Feature Specification';
    const metadata = templateData.metadata || {};
    const userScenarios = templateData.userScenarios || {};
    const requirements = templateData.requirements || {};
    const apiSpecification = templateData.apiSpecification || {};
    const constitutionalGates = templateData.constitutionalGates || {};
    const qualityGates = templateData.qualityGates || {};
    const complexityTracking = templateData.complexityTracking || {};
    const sddPrinciples = templateData.sddPrinciples || {};

    let markdown = `# ${title}\n\n`;

    // Metadata section
    if (metadata.created || metadata.status || metadata.input) {
      markdown += `## Metadata\n`;
      if (metadata.created) markdown += `- Created: ${metadata.created}\n`;
      if (metadata.status) markdown += `- Status: ${metadata.status}\n`;
      if (metadata.input) markdown += `- Input: ${metadata.input}\n`;
      markdown += `\n`;
    }

    // User Scenarios section
    if (userScenarios.primaryUserStory?.content) {
      markdown += `## User Scenarios & Testing\n\n`;
      markdown += `### Primary User Story\n`;
      markdown += `${userScenarios.primaryUserStory.content}\n\n`;
    }

    if (userScenarios.comprehensiveUserStories?.content) {
      markdown += `### Comprehensive User Stories\n\n`;
      markdown += `${userScenarios.comprehensiveUserStories.content}\n\n`;
    }

    if (userScenarios.acceptanceScenarios?.content) {
      markdown += `### Acceptance Scenarios\n\n`;
      markdown += `${userScenarios.acceptanceScenarios.content}\n\n`;
    }

    if (userScenarios.edgeCases?.content) {
      markdown += `### Edge Cases\n\n`;
      markdown += `${userScenarios.edgeCases.content}\n\n`;
    }

    // Requirements section
    if (requirements.functionalRequirements?.content) {
      markdown += `## Requirements\n\n`;
      markdown += `### Functional Requirements\n\n`;
      markdown += `${requirements.functionalRequirements.content}\n\n`;
    }

    if (requirements.keyEntities?.content) {
      markdown += `### Key Entities\n\n`;
      markdown += `${requirements.keyEntities.content}\n\n`;
    }

    if (requirements.databaseRequirements?.content) {
      markdown += `### Database Requirements\n\n`;
      markdown += `${requirements.databaseRequirements.content}\n\n`;
    }

    if (requirements.technologyStack?.content) {
      markdown += `### Technology Stack Requirements\n\n`;
      markdown += `${requirements.technologyStack.content}\n\n`;
    }

    // API Specification section
    if (apiSpecification.endpoints?.content || apiSpecification.contracts?.content) {
      markdown += `## API Specification (API-First Approach)\n\n`;
      
      if (apiSpecification.endpoints?.content) {
        markdown += `### API Endpoints\n\n`;
        markdown += `${apiSpecification.endpoints.content}\n\n`;
      }

      if (apiSpecification.contracts?.content) {
        markdown += `### API Contracts\n\n`;
        markdown += `${apiSpecification.contracts.content}\n\n`;
      }

      if (apiSpecification.openApiSpec?.content) {
        markdown += `### OpenAPI Specification\n\n`;
        markdown += `${apiSpecification.openApiSpec.content}\n\n`;
      }
    }

    // Constitutional Gates section
    if (Object.keys(constitutionalGates).length > 0) {
      markdown += `## Constitutional Gates\n\n`;
      for (const [key, gate] of Object.entries(constitutionalGates)) {
        if (typeof gate === 'object' && gate !== null && 'title' in gate) {
          const gateObj = gate as any;
          markdown += `### ${gateObj.title}\n`;
          if (gateObj.description) {
            markdown += `${gateObj.description}\n\n`;
          }
        }
      }
    }

    // Quality Gates section
    if (Object.keys(qualityGates).length > 0) {
      markdown += `## Quality Gates (Enforcement Rules)\n\n`;
      for (const [key, gate] of Object.entries(qualityGates)) {
        if (typeof gate === 'object' && gate !== null && 'title' in gate) {
          const gateObj = gate as any;
          markdown += `### ${gateObj.title}\n`;
          if (gateObj.items && Array.isArray(gateObj.items)) {
            gateObj.items.forEach((item: string) => {
              markdown += `- ${item}\n`;
            });
          }
          markdown += `\n`;
        }
      }
    }

    // Complexity Tracking section
    if (complexityTracking.table?.rows) {
      markdown += `## Complexity Tracking\n\n`;
      markdown += `${complexityTracking.description}\n\n`;
      markdown += `${complexityTracking.table.rows}\n\n`;
    }

    // SDD Principles section
    if (Object.keys(sddPrinciples).length > 0) {
      markdown += `## SDD Principles\n\n`;
      for (const [key, principle] of Object.entries(sddPrinciples)) {
        markdown += `- **${key}**: ${principle}\n`;
      }
      markdown += `\n`;
    }

    return markdown;
  }



}