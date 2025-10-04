#!/usr/bin/env node
/**
 * Copy template to dist directory for distribution
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcTemplatesPath = path.join(__dirname, '..', 'src', 'templates');
const distPath = path.join(__dirname, '..', 'dist', 'lib', 'sdd-mcp-server', 'templates');

try {
  // Create templates directory in dist
  if (!fs.existsSync(distPath)) {
    fs.mkdirSync(distPath, { recursive: true });
  }

  // Copy all template files from src/templates to dist
  const templateFiles = ['spec.json', 'plan.json', 'status.json', 'tasks.json'];
  
  for (const templateFile of templateFiles) {
    const srcTemplatePath = path.join(srcTemplatesPath, templateFile);
    const distTemplatePath = path.join(distPath, templateFile);
    fs.copyFileSync(srcTemplatePath, distTemplatePath);
    console.log(`✅ Copied ${templateFile} to dist`);
  }
  
  console.log('✅ All templates copied to dist directory successfully');
} catch (error) {
  console.error('❌ Error copying template to dist:', error);
  process.exit(1);
}
