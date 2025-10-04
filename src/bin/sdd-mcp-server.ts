#!/usr/bin/env node
/**
 * SDD MCP Server - Binary Entry Point
 * Specification-Driven Development Model Context Protocol Server
 */

import { SDDServer } from '../lib/sdd-mcp-server/server/SDDServer.js';

// Handle command line arguments
const args = process.argv.slice(2);

// Show help if requested
if (args.includes('--help') || args.includes('-h')) {
  process.exit(0);
}

// Show version if requested
if (args.includes('--version') || args.includes('-v')) {
  process.exit(0);
}

// Show server info if requested
if (args.includes('--info')) {
  process.exit(0);
}

// Run tests if requested
if (args.includes('--test')) {
  try {
    // Import and run the test integration
    const { execSync } = await import('child_process');
    execSync('node test-integration.js', { stdio: 'inherit' });
  } catch (error) {
    process.exit(1);
  }
  process.exit(0);
}

// Start the MCP server
const server = new SDDServer();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  process.exit(0);
});

process.on('SIGTERM', async () => {
  process.exit(0);
});

// Start the server
(async () => {
  try {
    await server.run();
  } catch (error) {
    // Don't exit on error, just log it
    // MCP servers should stay running
  }
})();
