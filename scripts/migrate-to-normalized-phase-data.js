#!/usr/bin/env node

/**
 * Migration script to convert denormalized phase data in tasks table
 * to normalized task_phase_data table
 */

import Database from 'better-sqlite3';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateToNormalizedPhaseData() {
  console.log('🔄 Migrating to normalized phase data structure...\n');

  try {
    const dbPath = path.join(__dirname, '..', 'sdd.db');
    const db = new Database(dbPath);

    // Step 1: Create the new task_phase_data table
    console.log('📋 Step 1: Creating task_phase_data table...');
    
    const createTable = db.prepare(`
      CREATE TABLE IF NOT EXISTS task_phase_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feature_id TEXT NOT NULL,
        phase INTEGER NOT NULL CHECK (phase >= 1 AND phase <= 8),
        phase_title TEXT NOT NULL,
        phase_description TEXT,
        phase_purpose TEXT,
        tasks_content TEXT NOT NULL,
        success_criteria TEXT,
        phase_requirements TEXT,
        dependencies TEXT,
        constitutional_compliance TEXT,
        estimated_duration TEXT,
        parallelizable_tasks TEXT,
        critical_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE,
        UNIQUE(feature_id, phase)
      )
    `);
    
    createTable.run();
    console.log('   ✅ task_phase_data table created\n');

    // Step 2: Create indexes
    console.log('📊 Step 2: Creating indexes...');
    
    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_task_phase_data_feature_id ON task_phase_data(feature_id)',
      'CREATE INDEX IF NOT EXISTS idx_task_phase_data_phase ON task_phase_data(phase)',
      'CREATE INDEX IF NOT EXISTS idx_task_phase_data_feature_phase ON task_phase_data(feature_id, phase)'
    ];
    
    for (const indexSql of createIndexes) {
      db.prepare(indexSql).run();
    }
    console.log('   ✅ Indexes created\n');

    // Step 3: Create trigger
    console.log('⚡ Step 3: Creating trigger...');
    
    const createTrigger = db.prepare(`
      CREATE TRIGGER IF NOT EXISTS update_task_phase_data_updated_at 
      AFTER UPDATE ON task_phase_data
      BEGIN
        UPDATE task_phase_data SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `);
    
    createTrigger.run();
    console.log('   ✅ Trigger created\n');

    // Step 4: Migrate existing data
    console.log('🔄 Step 4: Migrating existing phase data...');
    
    // Check if tasks table has phase columns
    const tableInfo = db.prepare("PRAGMA table_info(tasks)").all();
    const hasPhaseColumns = tableInfo.some(col => col.name.startsWith('phase1_'));
    
    if (hasPhaseColumns) {
      console.log('   📋 Found denormalized phase data in tasks table');
      
      // Get all tasks with phase data
      const tasksWithPhases = db.prepare(`
        SELECT feature_id, 
          phase1_title, phase1_description, phase1_tasks, phase1_success_criteria, phase1_requirements, phase1_dependencies, phase1_constitutional_compliance, phase1_estimated_duration, phase1_parallelizable_tasks, phase1_critical_path,
          phase2_title, phase2_description, phase2_tasks, phase2_success_criteria, phase2_requirements, phase2_dependencies, phase2_constitutional_compliance, phase2_estimated_duration, phase2_parallelizable_tasks, phase2_critical_path,
          phase3_title, phase3_description, phase3_tasks, phase3_success_criteria, phase3_requirements, phase3_dependencies, phase3_constitutional_compliance, phase3_estimated_duration, phase3_parallelizable_tasks, phase3_critical_path,
          phase4_title, phase4_description, phase4_tasks, phase4_success_criteria, phase4_requirements, phase4_dependencies, phase4_constitutional_compliance, phase4_estimated_duration, phase4_parallelizable_tasks, phase4_critical_path,
          phase5_title, phase5_description, phase5_tasks, phase5_success_criteria, phase5_requirements, phase5_dependencies, phase5_constitutional_compliance, phase5_estimated_duration, phase5_parallelizable_tasks, phase5_critical_path,
          phase6_title, phase6_description, phase6_tasks, phase6_success_criteria, phase6_requirements, phase6_dependencies, phase6_constitutional_compliance, phase6_estimated_duration, phase6_parallelizable_tasks, phase6_critical_path,
          phase7_title, phase7_description, phase7_tasks, phase7_success_criteria, phase7_requirements, phase7_dependencies, phase7_constitutional_compliance, phase7_estimated_duration, phase7_parallelizable_tasks, phase7_critical_path,
          phase8_title, phase8_description, phase8_tasks, phase8_success_criteria, phase8_requirements, phase8_dependencies, phase8_constitutional_compliance, phase8_estimated_duration, phase8_parallelizable_tasks, phase8_critical_path
        FROM tasks 
        WHERE phase1_title IS NOT NULL OR phase2_title IS NOT NULL OR phase3_title IS NOT NULL OR phase4_title IS NOT NULL 
           OR phase5_title IS NOT NULL OR phase6_title IS NOT NULL OR phase7_title IS NOT NULL OR phase8_title IS NOT NULL
      `).all();
      
      console.log(`   📊 Found ${tasksWithPhases.length} tasks with phase data`);
      
      // Insert phase data into new table
      const insertPhaseData = db.prepare(`
        INSERT OR REPLACE INTO task_phase_data (
          feature_id, phase, phase_title, phase_description, phase_purpose,
          tasks_content, success_criteria, phase_requirements, dependencies,
          constitutional_compliance, estimated_duration, parallelizable_tasks, critical_path
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      let migratedPhases = 0;
      
      for (const task of tasksWithPhases) {
        for (let phase = 1; phase <= 8; phase++) {
          const phasePrefix = `phase${phase}`;
          const phaseTitle = task[`${phasePrefix}_title`];
          
          if (phaseTitle) {
            insertPhaseData.run(
              task.feature_id,
              phase,
              phaseTitle,
              task[`${phasePrefix}_description`] || null,
              null, // phase_purpose (not in old structure)
              task[`${phasePrefix}_tasks`] || '',
              task[`${phasePrefix}_success_criteria`] || null,
              task[`${phasePrefix}_requirements`] || null,
              task[`${phasePrefix}_dependencies`] || null,
              task[`${phasePrefix}_constitutional_compliance`] || null,
              task[`${phasePrefix}_estimated_duration`] || null,
              task[`${phasePrefix}_parallelizable_tasks`] || null,
              task[`${phasePrefix}_critical_path`] || null
            );
            migratedPhases++;
          }
        }
      }
      
      console.log(`   ✅ Migrated ${migratedPhases} phase records\n`);
      
      // Step 5: Remove phase columns from tasks table
      console.log('🧹 Step 5: Removing phase columns from tasks table...');
      
      // SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
      const tasksTableInfo = db.prepare("PRAGMA table_info(tasks)").all();
      const nonPhaseColumns = tasksTableInfo.filter(col => !col.name.startsWith('phase'));
      
      if (nonPhaseColumns.length > 0) {
        // Create new tasks table without phase columns
        const newTableColumns = nonPhaseColumns.map(col => {
          let colDef = `${col.name} ${col.type}`;
          if (col.notnull) colDef += ' NOT NULL';
          if (col.pk) colDef += ' PRIMARY KEY';
          if (col.dflt_value !== null) colDef += ` DEFAULT ${col.dflt_value}`;
          return colDef;
        }).join(', ');
        
        const foreignKeys = `
          FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE,
          FOREIGN KEY (template_id) REFERENCES task_templates(id)
        `;
        
        // Create new table
        db.prepare(`
          CREATE TABLE tasks_new (
            ${newTableColumns},
            ${foreignKeys}
          )
        `).run();
        
        // Copy data
        const copyData = db.prepare(`
          INSERT INTO tasks_new (${nonPhaseColumns.map(col => col.name).join(', ')})
          SELECT ${nonPhaseColumns.map(col => col.name).join(', ')} FROM tasks
        `);
        copyData.run();
        
        // Drop old table and rename new one
        db.prepare('DROP TABLE tasks').run();
        db.prepare('ALTER TABLE tasks_new RENAME TO tasks').run();
        
        // Recreate indexes
        db.prepare('CREATE INDEX IF NOT EXISTS idx_tasks_feature_id ON tasks(feature_id)').run();
        db.prepare('CREATE INDEX IF NOT EXISTS idx_tasks_template_id ON tasks(template_id)').run();
        db.prepare('CREATE INDEX IF NOT EXISTS idx_tasks_ai_generated ON tasks(ai_generated)').run();
        
        // Recreate trigger
        db.prepare(`
          CREATE TRIGGER IF NOT EXISTS update_tasks_updated_at 
          AFTER UPDATE ON tasks
          BEGIN
            UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
          END
        `).run();
        
        console.log('   ✅ Phase columns removed from tasks table\n');
      }
    } else {
      console.log('   ℹ️  No denormalized phase data found in tasks table\n');
    }

    // Step 6: Verify migration
    console.log('✅ Step 6: Verifying migration...');
    
    const phaseDataCount = db.prepare('SELECT COUNT(*) as count FROM task_phase_data').get().count;
    const tasksCount = db.prepare('SELECT COUNT(*) as count FROM tasks').get().count;
    
    console.log(`   📊 task_phase_data records: ${phaseDataCount}`);
    console.log(`   📊 tasks records: ${tasksCount}`);
    
    if (phaseDataCount > 0) {
      console.log('   ✅ Migration successful!');
      console.log('\n🎉 Normalized Phase Data Migration Complete!');
      console.log('\n📋 Summary:');
      console.log('   ✅ Created task_phase_data table with normalized structure');
      console.log('   ✅ Migrated existing phase data from denormalized columns');
      console.log('   ✅ Removed phase columns from tasks table');
      console.log('   ✅ Created proper indexes and triggers');
      console.log('\n🚀 Benefits:');
      console.log('   - Normalized database structure (one row per phase)');
      console.log('   - Easier queries and data management');
      console.log('   - Better extensibility for future phase fields');
      console.log('   - Cleaner, more maintainable code');
    } else {
      console.log('   ℹ️  No phase data to migrate');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (typeof db !== 'undefined') {
      db.close();
    }
  }
}

// Run the migration
migrateToNormalizedPhaseData().catch(console.error);
