-- Migration: 0000_init
-- Newborn Care Tracker schema for Cloudflare D1

CREATE TABLE IF NOT EXISTS babies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  gender TEXT,
  blood_type TEXT,
  doctor_name TEXT,
  hospital TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS caregivers (
  id TEXT PRIMARY KEY,
  baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  permission TEXT NOT NULL DEFAULT 'view',
  initials TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS feedings (
  id TEXT PRIMARY KEY,
  baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  side TEXT,
  duration_seconds INTEGER,
  amount_ml INTEGER,
  notes TEXT,
  logged_by TEXT,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sleeps (
  id TEXT PRIMARY KEY,
  baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  location TEXT,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  duration_seconds INTEGER,
  notes TEXT,
  logged_by TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pumping_sessions (
  id TEXT PRIMARY KEY,
  baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  left_ml INTEGER DEFAULT 0,
  right_ml INTEGER DEFAULT 0,
  total_ml INTEGER DEFAULT 0,
  duration_seconds INTEGER,
  storage_type TEXT,
  pump_brand TEXT,
  notes TEXT,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  logged_by TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS diaper_changes (
  id TEXT PRIMARY KEY,
  baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  consistency TEXT,
  color TEXT,
  notes TEXT,
  logged_by TEXT,
  changed_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS baths (
  id TEXT PRIMARY KEY,
  baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  type TEXT,
  water_temp_c REAL,
  duration_minutes INTEGER,
  soap_used INTEGER,
  soap_type TEXT,
  notes TEXT,
  logged_by TEXT,
  bathed_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS growth_entries (
  id TEXT PRIMARY KEY,
  baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  weight_g INTEGER,
  length_cm REAL,
  head_cm REAL,
  visit_type TEXT,
  notes TEXT,
  logged_by TEXT,
  measured_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS doctor_visits (
  id TEXT PRIMARY KEY,
  baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  doctor_name TEXT,
  hospital TEXT,
  visit_type TEXT,
  notes TEXT,
  vaccines TEXT,
  next_appointment TEXT,
  visited_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_feedings_baby_started ON feedings(baby_id, started_at);
CREATE INDEX IF NOT EXISTS idx_sleeps_baby_started ON sleeps(baby_id, started_at);
CREATE INDEX IF NOT EXISTS idx_pumping_baby_started ON pumping_sessions(baby_id, started_at);
CREATE INDEX IF NOT EXISTS idx_diapers_baby_changed ON diaper_changes(baby_id, changed_at);
CREATE INDEX IF NOT EXISTS idx_baths_baby_bathed ON baths(baby_id, bathed_at);
CREATE INDEX IF NOT EXISTS idx_growth_baby_measured ON growth_entries(baby_id, measured_at);
