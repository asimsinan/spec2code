-- SDD MCP Server Database Schema v2.0
-- Two-table architecture: Template tables + Filled data tables
-- SQLite database schema for Specification-Driven Development

-- Set schema version
PRAGMA user_version = 2;

-- ========================================
-- TEMPLATE TABLES (Reusable templates)
-- ========================================

-- Specification templates
CREATE TABLE IF NOT EXISTS spec_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  description TEXT,
  template_data JSON NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Plan templates
CREATE TABLE IF NOT EXISTS plan_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  description TEXT,
  template_data JSON NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Task templates
CREATE TABLE IF NOT EXISTS task_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  description TEXT,
  template_data JSON NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);





-- Plan templates
CREATE TABLE IF NOT EXISTS plan_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  description TEXT,
  template_data JSON NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);




-- ========================================
-- FILLED DATA TABLES (AI-generated content)
-- ========================================

-- Features table (main entity) - NORMALIZED (no specification content)
CREATE TABLE IF NOT EXISTS features (
  id TEXT PRIMARY KEY,
  content JSON NOT NULL,
  template_id TEXT,
  ai_generated BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  metadata JSON,
  schema_version TEXT DEFAULT '1.0',
  validated_at DATETIME,
  content_size INTEGER,
  content_hash TEXT
);

-- Specifications (AI-filled)
CREATE TABLE IF NOT EXISTS specifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feature_id TEXT NOT NULL,
  template_id TEXT,
  content JSON NOT NULL,
  metadata JSON,
  schema_version TEXT DEFAULT '1.0',
  validated_at DATETIME,
  content_size INTEGER,
  content_hash TEXT,
  ai_generated BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES spec_templates(id)
);

-- Plans (AI-filled)
CREATE TABLE IF NOT EXISTS plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feature_id TEXT NOT NULL,
  template_id TEXT,
  content JSON NOT NULL,
  metadata JSON,
  schema_version TEXT DEFAULT '1.0',
  validated_at DATETIME,
  content_size INTEGER,
  content_hash TEXT,
  ai_generated BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES plan_templates(id)
);

-- Tasks (AI-filled)
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feature_id TEXT NOT NULL,
  template_id TEXT,
  content JSON NOT NULL,
  metadata JSON,
  schema_version TEXT DEFAULT '1.0',
  validated_at DATETIME,
  content_size INTEGER,
  content_hash TEXT,
  ai_generated BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES task_templates(id)
);


-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Template table indexes
CREATE INDEX IF NOT EXISTS idx_spec_templates_active ON spec_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_plan_templates_active ON plan_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_task_templates_active ON task_templates(is_active);

-- Filled data table indexes
CREATE INDEX IF NOT EXISTS idx_specifications_feature_id ON specifications(feature_id);
CREATE INDEX IF NOT EXISTS idx_specifications_template_id ON specifications(template_id);
CREATE INDEX IF NOT EXISTS idx_specifications_ai_generated ON specifications(ai_generated);
CREATE INDEX IF NOT EXISTS idx_plans_feature_id ON plans(feature_id);
CREATE INDEX IF NOT EXISTS idx_plans_template_id ON plans(template_id);
CREATE INDEX IF NOT EXISTS idx_plans_ai_generated ON plans(ai_generated);
CREATE INDEX IF NOT EXISTS idx_tasks_feature_id ON tasks(feature_id);
CREATE INDEX IF NOT EXISTS idx_tasks_template_id ON tasks(template_id);
CREATE INDEX IF NOT EXISTS idx_tasks_ai_generated ON tasks(ai_generated);





-- Feature indexes for JSON content
CREATE INDEX IF NOT EXISTS idx_features_created_at ON features(created_at);
CREATE INDEX IF NOT EXISTS idx_features_updated_at ON features(updated_at);
CREATE INDEX IF NOT EXISTS idx_features_template_id ON features(template_id);
CREATE INDEX IF NOT EXISTS idx_features_ai_generated ON features(ai_generated);
CREATE INDEX IF NOT EXISTS idx_features_validated_at ON features(validated_at);

-- ========================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ========================================

-- Template table triggers
CREATE TRIGGER IF NOT EXISTS update_spec_templates_updated_at 
  AFTER UPDATE ON spec_templates
  BEGIN
    UPDATE spec_templates SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_plan_templates_updated_at 
  AFTER UPDATE ON plan_templates
  BEGIN
    UPDATE plan_templates SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_task_templates_updated_at 
  AFTER UPDATE ON task_templates
  BEGIN
    UPDATE task_templates SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;






-- Triggers for plan_templates
CREATE TRIGGER IF NOT EXISTS update_plan_templates_updated_at
  AFTER UPDATE ON plan_templates
  BEGIN
    UPDATE plan_templates SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;




-- Filled data table triggers
CREATE TRIGGER IF NOT EXISTS update_specifications_updated_at 
  AFTER UPDATE ON specifications
  BEGIN
    UPDATE specifications SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_plans_updated_at 
  AFTER UPDATE ON plans
  BEGIN
    UPDATE plans SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_tasks_updated_at 
  AFTER UPDATE ON tasks
  BEGIN
    UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;






-- Keep existing feature trigger
CREATE TRIGGER IF NOT EXISTS update_features_updated_at 
  AFTER UPDATE ON features
  BEGIN
    UPDATE features SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;
