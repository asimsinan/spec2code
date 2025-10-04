#!/usr/bin/env node

/**
 * Script to install the perfect SDD specification template into the database
 * This should be run during the build process or installation
 */

import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the template data
const templatePath = path.join(__dirname, '..', 'src', 'templates', 'spec.json');
const templateData = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

// Database path
const dbPath = path.join(__dirname, '..', 'sdd.db');

console.log('Installing perfect SDD specification template...');
console.log('Template path:', templatePath);
console.log('Database path:', dbPath);

try {
  // Initialize database
  const db = new Database(dbPath);
  
  // Ensure spec_templates table exists
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS spec_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      version TEXT NOT NULL,
      description TEXT,
      template_data TEXT NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  db.exec(createTableSQL);
  console.log('✅ spec_templates table created/verified');
  
  // Insert or update the template
  const insertSQL = `
    INSERT OR REPLACE INTO spec_templates 
    (id, name, version, description, template_data, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `;
  
  const stmt = db.prepare(insertSQL);
  stmt.run(
    templateData.id,
    templateData.name,
    templateData.version,
    templateData.description,
    JSON.stringify(templateData.template_data),
    templateData.is_active ? 1 : 0
  );
  
  console.log('✅ Perfect SDD template installed successfully');
  
  // Verify installation
  const verifySQL = 'SELECT id, name, version FROM spec_templates WHERE id = ?';
  const result = db.prepare(verifySQL).get(templateData.id);
  
  if (result) {
    console.log('✅ Template verification successful:');
    console.log(`   - ID: ${result.id}`);
    console.log(`   - Name: ${result.name}`);
    console.log(`   - Version: ${result.version}`);
  } else {
    console.error('❌ Template verification failed');
    process.exit(1);
  }
  
  db.close();
  console.log('✅ Database connection closed');
  
} catch (error) {
  console.error('❌ Error installing template:', error);
  process.exit(1);
}
