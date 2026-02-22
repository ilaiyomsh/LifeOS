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
  is_focus          BOOLEAN DEFAULT false,
  tags              TEXT[] DEFAULT '{}',
  recurring_rule    JSONB,
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

-- Habits table
CREATE TABLE habits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  area        area_enum,
  frequency   TEXT DEFAULT 'daily',
  target_days INTEGER DEFAULT 1,
  color       TEXT DEFAULT 'blue',
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Habit logs table
CREATE TABLE habit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id    UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT now(),
  date        DATE NOT NULL
);

-- Focus sessions table (Pomodoro)
CREATE TABLE focus_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id         UUID REFERENCES tasks(id) ON DELETE SET NULL,
  started_at      TIMESTAMPTZ NOT NULL,
  ended_at        TIMESTAMPTZ,
  duration_minutes INTEGER,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_area ON tasks(area);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_scheduled_date ON tasks(scheduled_date);
CREATE INDEX idx_tasks_focus ON tasks(is_focus) WHERE is_focus = true;
CREATE INDEX idx_events_start ON events(start_at);
CREATE INDEX idx_habits_active ON habits(is_active) WHERE is_active = true;
CREATE INDEX idx_habit_logs_habit ON habit_logs(habit_id);
CREATE INDEX idx_habit_logs_date ON habit_logs(date);
CREATE INDEX idx_focus_sessions_task ON focus_sessions(task_id);
CREATE INDEX idx_focus_sessions_started ON focus_sessions(started_at);

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
ALTER PUBLICATION supabase_realtime ADD TABLE events;
