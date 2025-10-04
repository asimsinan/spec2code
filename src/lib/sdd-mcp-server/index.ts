/**
 * SDD MCP Server - Main Entry Point
 * Exports all components for the Specification-Driven Development MCP Server
 */

// Export all data models
export * from './models/index.js';

// Services removed - using template-based approach

// Export all tools
export * from './tools/index.js';

// Export server
export { SDDServer } from './server/SDDServer.js';
