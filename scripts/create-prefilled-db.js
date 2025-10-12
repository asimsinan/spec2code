#!/usr/bin/env node
/**
 * Create a pre-filled sdd.db with all templates and schema
 */

import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prefilledDbPath = path.join(__dirname, '..', 'dist', 'lib', 'sdd-mcp-server', 'database', 'sdd.db');
const templatePath = path.join(__dirname, '..', 'src', 'templates', 'spec.json');

try {
  console.log('🏗️  Creating pre-filled sdd.db...');
  
  // Remove existing pre-filled db if it exists
  if (fs.existsSync(prefilledDbPath)) {
    fs.unlinkSync(prefilledDbPath);
  }

  // Create the database
  const db = new Database(prefilledDbPath);
  
  // Apply schema
  const schemaPath = path.join(__dirname, '..', 'src', 'lib', 'sdd-mcp-server', 'database', 'schema-v2.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
  console.log('✅ Schema applied to pre-filled database');

  // Install the perfect SDD template
  const specTemplateData = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
  
  const insertSpecStmt = db.prepare(`
    INSERT INTO spec_templates (id, name, version, description, template_data, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  insertSpecStmt.run(
    specTemplateData.id,
    specTemplateData.name,
    specTemplateData.version,
    specTemplateData.description,
    JSON.stringify(specTemplateData.template_data),
    specTemplateData.is_active ? 1 : 0
  );
  
  console.log('✅ Perfect SDD template installed in pre-filled database');



  // Install the perfect plan template
  const planTemplatePath = path.join(__dirname, '..', 'src', 'templates', 'plan.json');
  const planTemplateData = JSON.parse(fs.readFileSync(planTemplatePath, 'utf8'));

  const insertPlanStmt = db.prepare(`
    INSERT INTO plan_templates (id, name, version, description, template_data, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertPlanStmt.run(
    planTemplateData.id,
    planTemplateData.name,
    planTemplateData.version,
    planTemplateData.description,
    JSON.stringify(planTemplateData.template_data),
    planTemplateData.is_active ? 1 : 0
  );

  console.log('✅ Perfect plan template installed in pre-filled database');

  // Install the perfect status template
  const statusTemplatePath = path.join(__dirname, '..', 'src', 'templates', 'status.json');
  const statusTemplateData = JSON.parse(fs.readFileSync(statusTemplatePath, 'utf8'));

  const insertStatusStmt = db.prepare(`
    INSERT INTO status_templates (id, name, version, description, template_data, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertStatusStmt.run(
    statusTemplateData.id,
    statusTemplateData.name,
    statusTemplateData.version,
    statusTemplateData.description,
    JSON.stringify(statusTemplateData.template_data),
    statusTemplateData.is_active ? 1 : 0
  );

  console.log('✅ Perfect status template installed in pre-filled database');

  // Install the perfect tasks template
  const tasksTemplatePath = path.join(__dirname, '..', 'src', 'templates', 'tasks.json');
  const tasksTemplateData = JSON.parse(fs.readFileSync(tasksTemplatePath, 'utf8'));

  const insertTasksStmt = db.prepare(`
    INSERT INTO task_templates (id, name, version, description, template_data, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertTasksStmt.run(
    tasksTemplateData.id,
    tasksTemplateData.name,
    tasksTemplateData.version,
    tasksTemplateData.description,
    JSON.stringify(tasksTemplateData.template_data),
    tasksTemplateData.is_active ? 1 : 0
  );

  console.log('✅ Perfect tasks template installed in pre-filled database');



  // Verify the installation
  const verifySpecStmt = db.prepare('SELECT COUNT(*) as count FROM spec_templates WHERE id = ?');
  const specResult = verifySpecStmt.get('sdd-spec-perfect-v1');


  const verifyPlanStmt = db.prepare('SELECT COUNT(*) as count FROM plan_templates WHERE id = ?');
  const planResult = verifyPlanStmt.get('sdd-plan-perfect-v1');

  const verifyStatusStmt = db.prepare('SELECT COUNT(*) as count FROM status_templates WHERE id = ?');
  const statusResult = verifyStatusStmt.get('sdd-status-perfect-v1');

  const verifyTasksStmt = db.prepare('SELECT COUNT(*) as count FROM task_templates WHERE id = ?');
  const tasksResult = verifyTasksStmt.get('sdd-tasks-atomic-v5');

  if (specResult.count > 0  && planResult.count > 0 && statusResult.count > 0 && tasksResult.count > 0) {
    console.log('✅ All templates verification successful');
  } else {
    throw new Error('Template verification failed');
  }

  db.close();
  console.log('🎉 Pre-filled sdd.db created successfully at:', prefilledDbPath);

} catch (error) {
  console.error('❌ Error creating pre-filled database:', error);
  process.exit(1);
}
