-- LifeOS V3 Database Schema
-- Run this in the Supabase SQL Editor to set up the database

-- Enum types
CREATE TYPE task_status AS ENUM (
  'inbox',
  'next_action',
  'waiting_for',
  'someday',
  'done',
  'trashed'
);

CREATE TYPE priority_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE area_enum AS ENUM ('work', 'school', 'home');

-- Projects table
CREATE TABLE projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  area          area_enum NOT NULL,
  description   TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  completed_at  TIMESTAMPTZ
);

-- Tasks table
CREATE TABLE tasks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  notes             TEXT,
  status            task_status DEFAULT 'inbox',
  priority          priority_level,
  area              area_enum,
  project_id        UUID REFERENCES projects(id) ON DELETE SET NULL,
  due_date          DATE,
  scheduled_date    DATE,
  estimated_minutes INTEGER,
  waiting_on        TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  completed_at      TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ DEFAULT now(),
  position          INTEGER DEFAULT 0
);

-- Events table
CREATE TABLE events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  area        area_enum,
  start_at    TIMESTAMPTZ NOT NULL,
  end_at      TIMESTAMPTZ,
  is_all_day  BOOLEAN DEFAULT false,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_area ON tasks(area);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_scheduled_date ON tasks(scheduled_date);
CREATE INDEX idx_events_start ON events(start_at);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
