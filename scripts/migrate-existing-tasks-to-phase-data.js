#!/usr/bin/env node

/**
 * Migration script to populate phase_data table from existing tasks
 * This script parses existing tasks content and creates phase_data records
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 Migrating existing tasks to phase_data table...\n');

const dbPath = path.join(__dirname, '..', 'sdd.db');
const db = new Database(dbPath);

/**
 * Extract phase information from tasks markdown content
 */
function extractPhasesFromTasks(content) {
  const phases = [];
  
  // Split content by phase headers
  const phaseRegex = /### Phase (\d+):\s*(.+?)(?=### Phase \d+:|$)/gs;
  let match;
  
  while ((match = phaseRegex.exec(content)) !== null) {
    const phaseNumber = parseInt(match[1]);
    const phaseContent = match[2].trim();
    
    // Extract phase title (first line after "Phase X:")
    const lines = phaseContent.split('\n');
    const phaseTitle = lines[0]?.trim() || `Phase ${phaseNumber}`;
    
    // Extract tasks content (everything between phase header and next section)
    const tasksStart = phaseContent.indexOf('\n');
    const tasksContent = tasksStart > 0 ? phaseContent.substring(tasksStart).trim() : phaseContent;
    
    // Extract other metadata (basic extraction)
    const phaseDescription = extractSection(phaseContent, 'Description');
    const phasePurpose = extractSection(phaseContent, 'Purpose');
    const successCriteria = extractSection(phaseContent, 'Success Criteria');
    const phaseRequirements = extractSection(phaseContent, 'Requirements');
    const dependencies = extractSection(phaseContent, 'Dependencies');
    const constitutionalCompliance = extractSection(phaseContent, 'Constitutional Compliance');
    const estimatedDuration = extractSection(phaseContent, 'Estimated Duration');
    const parallelizableTasks = extractSection(phaseContent, 'Parallelizable Tasks');
    const criticalPath = extractSection(phaseContent, 'Critical Path');
    
    phases.push({
      phase: phaseNumber,
      phase_title: phaseTitle,
      phase_description: phaseDescription,
      phase_purpose: phasePurpose,
      tasks_content: tasksContent,
      success_criteria: successCriteria,
      phase_requirements: phaseRequirements,
      dependencies: dependencies,
      constitutional_compliance: constitutionalCompliance,
      estimated_duration: estimatedDuration,
      parallelizable_tasks: parallelizableTasks,
      critical_path: criticalPath
    });
  }
  
  return phases;
}

/**
 * Extract a section from phase content
 */
function extractSection(content, sectionName) {
  const regex = new RegExp(`${sectionName}[\\s\\S]*?\\n([\\s\\S]*?)(?=\\n\\w+|$)`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : undefined;
}

async function migrateTasksToPhaseData() {
  try {
    // Get all features with tasks
    const featuresWithTasks = db.prepare(`
      SELECT f.id, f.name, t.content 
      FROM features f 
      JOIN tasks t ON f.id = t.feature_id 
      ORDER BY f.created_at DESC
    `).all();
    
    console.log(`📊 Found ${featuresWithTasks.length} features with tasks to migrate\n`);
    
    let totalPhasesMigrated = 0;
    
    for (const feature of featuresWithTasks) {
      console.log(`🔄 Migrating feature: ${feature.name} (${feature.id})`);
      
      try {
        // Parse the tasks content
        const tasksContent = typeof feature.content === 'string' ? feature.content : JSON.stringify(feature.content);
        const phases = extractPhasesFromTasks(tasksContent);
        
        console.log(`   📋 Found ${phases.length} phases`);
        
        // Save each phase to phase_data table
        for (const phase of phases) {
          const stmt = db.prepare(`
            INSERT OR REPLACE INTO phase_data (
              feature_id, phase, phase_title, phase_description, phase_purpose,
              tasks_content, success_criteria, phase_requirements, dependencies,
              constitutional_compliance, estimated_duration, parallelizable_tasks, critical_path
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          
          stmt.run(
            feature.id,
            phase.phase,
            phase.phase_title,
            phase.phase_description || null,
            phase.phase_purpose || null,
            phase.tasks_content,
            phase.success_criteria || null,
            phase.phase_requirements || null,
            phase.dependencies || null,
            phase.constitutional_compliance || null,
            phase.estimated_duration || null,
            phase.parallelizable_tasks || null,
            phase.critical_path || null
          );
          
          console.log(`   ✅ Phase ${phase.phase}: ${phase.phase_title}`);
          totalPhasesMigrated++;
        }
        
      } catch (error) {
        console.error(`   ❌ Error migrating feature ${feature.name}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Migration completed!`);
    console.log(`📊 Total phases migrated: ${totalPhasesMigrated}`);
    
    // Verify migration
    const phaseDataCount = db.prepare('SELECT COUNT(*) as count FROM phase_data').get();
    console.log(`📊 Total phase_data records: ${phaseDataCount.count}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    db.close();
  }
}

// Run migration
migrateTasksToPhaseData();
