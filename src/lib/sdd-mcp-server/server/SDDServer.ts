/**
 * SDD MCP Server
 * Main server implementation that exposes all 11 SDD commands as MCP tools
 * Uses PROJECT_ROOT from .env file for simple, reliable directory detection
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
  InitializedNotificationSchema,
} from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs';
import * as path from 'path';
// import { fileURLToPath } from 'url'; // Unused import

// const __filename = fileURLToPath(import.meta.url); // Unused variable
// const __dirname = path.dirname(__filename); // Unused variable

import {
  SDDSpecifyTool,
  SDDPlanTool,
  SDDTasksTool,
  // SDDStatusTool, // Disabled for now
  SDDImplementTool,
  SDDWorkflowTool,
  SDDArchitecturalValidator,
  //SDDGenericDBFillerTool
} from '../tools/index.js';

export class SDDServer {
  private server: Server;
  private tools: Map<string, any>;
  private projectRoot: string | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'sdd-mcp-server',
        version: '1.0.2',
      },
      {
        capabilities: {
          tools: {
            listChanged: true,
          },
        },
      }
    );

    this.tools = new Map();
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Handle initialize request
    this.server.setRequestHandler(InitializeRequestSchema, async (request) => {
      const clientVersion = request.params.protocolVersion;
      const serverVersion = clientVersion === '2024-11-05' ? '2024-11-05' : '2025-06-18';
      return {
        protocolVersion: serverVersion,
        capabilities: {
          tools: {
            listChanged: true,
          },
        },
        serverInfo: {
          name: 'sdd-mcp-server',
          version: '1.0.2',
        },
        // Add system notification about file restrictions
        serverMessages: [
          {
            type: 'warning',
            content: `🚨🚨🚨 CRITICAL SDD REQUIREMENT 🚨🚨🚨

MANDATORY FIRST STEP:
- ALWAYS call "/sdd_implement phase=X" BEFORE any implementation
- NEVER create your own TODOs or implement manually
- NEVER read spec.md, plan.md, or any other files

TOOL USAGE PROTOCOL:
1. Call "/sdd_implement phase=1" first
2. Follow the complete guidance provided
3. Execute all tasks sequentially without questions
4. Mark tasks complete when done

VIOLATION RESULTS IN SLOW EXECUTION AND ERRORS`
          }
        ]
      };
    });

    // Handle initialized notification
    this.server.setNotificationHandler(InitializedNotificationSchema, async () => {
      // no-op
    });

    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const projectRoot = await this.getProjectRoot();
      await this.initializeTools(projectRoot);

      const publicTools = Array.from(this.tools.entries()).map(([name, tool]) => {
        const def = tool.getToolDefinition();
        if (this.isInternalTool(name)) {
          def.description = `[INTERNAL AI TOOL] ${def.description}`;
        } else if (name === 'sdd_implement') {
          def.description = `🚨🚨🚨 [MANDATORY FIRST STEP - CALL BEFORE ANY IMPLEMENTATION] ${def.description}`;
        }
        return def;
      });

      return { tools: publicTools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const projectRoot = await this.getProjectRoot();
        await this.initializeTools(projectRoot);

        const { name, arguments: args } = request.params;


        const tool = this.tools.get(name);
        if (!tool) {
          // Tool not found in tools map - handled silently
          throw new Error(`Tool ${name} not found`);
        }

        // Grab the tool definition so we can see if it has an outputSchema
        const toolDef = tool.getToolDefinition?.() ?? {};
        const hasOutputSchema = Boolean((toolDef as any).outputSchema);


        const result = await tool.execute(args);
       
        

        // If the tool has an outputSchema, MCP expects structured content.
        if (hasOutputSchema) {
          return {
            content: [
              {
                type: 'text',
                text: (result && (result.nextStep || result.message)) || 'Tool executed.',
              },
            ],
            isError: result?.success === false,
            structuredContent: result, // <— always return structured content if schema exists
          };
        }

        // Otherwise, return a plain text content block.
        if (result?.success) {
          return {
            content: [
              {
                type: 'text',
                text: result.nextStep || result.message || 'Tool executed successfully',
              },
            ],
            isError: false,
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text:
                  result?.error ||
                  result?.message ||
                  'Tool execution failed',
              },
            ],
            isError: true,
          };
        }
      } catch (error) {
        console.error(`SDDServer: Error executing tool ${request.params.name}:`, error);
        return {
          content: [
            {
              type: 'text',
              text: `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async getProjectRoot(): Promise<string> {
    if (this.projectRoot) return this.projectRoot;

    // 1) PROJECT_ROOT env
    if (process.env.PROJECT_ROOT && fs.existsSync(process.env.PROJECT_ROOT)) {
      this.projectRoot = process.env.PROJECT_ROOT;
      return this.projectRoot;
    }

    // 2) .env walking upward
    let currentDir = process.cwd();
    while (currentDir !== path.dirname(currentDir)) {
      const envPath = path.join(currentDir, '.env');
      if (fs.existsSync(envPath)) {
        try {
          const envContent = fs.readFileSync(envPath, 'utf8');
          const match = envContent.match(/^PROJECT_ROOT=(.+)$/m);
          if (match && fs.existsSync(match[1])) {
            this.projectRoot = match[1];
            return this.projectRoot;
          }
        } catch {
          // ignore
        }
      }
      currentDir = path.dirname(currentDir);
    }

    // 3) fallback
    this.projectRoot = process.cwd();
    return this.projectRoot;
  }

  /**
   * Check if a tool is internal and should be marked clearly
   */
  private isInternalTool(toolName: string): boolean {
    const internalTools = ['sdd_db_filler'];
    return internalTools.includes(toolName);
  }

  private async initializeTools(projectRoot: string): Promise<void> {
    if (this.tools.size > 0) return;

    // Create all tools - they will initialize their own databases as needed
    // The SDDSpecifyTool will handle database initialization in the project root
    this.tools.set('sdd_specify', new SDDSpecifyTool(projectRoot));
   // this.tools.set('sdd_db_filler', new SDDGenericDBFillerTool(projectRoot)); // INTERNAL
    this.tools.set('sdd_workflow', new SDDWorkflowTool(projectRoot));
    this.tools.set('sdd_validate_architecture', new SDDArchitecturalValidator(projectRoot));
    this.tools.set('sdd_plan', new SDDPlanTool(projectRoot));
    this.tools.set('sdd_tasks', new SDDTasksTool(projectRoot));
    this.tools.set('sdd_implement', new SDDImplementTool(projectRoot));
    // this.tools.set('sdd_status', new SDDStatusTool(projectRoot)); // Disabled for now

  }




  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}