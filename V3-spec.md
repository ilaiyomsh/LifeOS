# LifeOS V3.0 — Technical Specification

**Upgrading LifeOS V2.5 with the TaskFlow system design**

Version 1.0 | February 2026

-----

## Table of Contents

1. [Current State & Gap Analysis](#chapter-1-current-state--gap-analysis)
1. [Development Phases](#chapter-2-development-phases)
1. [Phase 0 — Supabase Migration](#chapter-3-phase-0--supabase-migration)
1. [Phase 1 — Data Model & Life Areas](#chapter-4-phase-1--data-model--life-areas)
1. [Phase 2 — Flows & Control](#chapter-5-phase-2--flows--control)
1. [Phase 3 — Planning Layers](#chapter-6-phase-3--planning-layers)
1. [Phase 4 — Proactive Notifications](#chapter-7-phase-4--proactive-notifications)
1. [Summary & Testing](#chapter-8-summary--testing)

-----

## Chapter 1: Current State & Gap Analysis

### 1.1 What Exists (LifeOS V2.5)

The current application already includes a strong foundation:

- **Inbox** with quick capture and GTD decision tree (actionable → 2-min rule → next action / waiting / someday)
- **Focus tasks** (`is_focus`, max 3) with a daily capacity bar
- **Weekly review** — 6-step guided process with metrics and Start/Stop/Continue reflection
- **Recurring tasks** — daily / weekly / monthly with automatic instance creation
- **Scheduling** — `scheduled_date` + `due_date` on every task
- **Projects** grouped by area with “no next action” warnings
- **Smart lists** — Today / Upcoming / Overdue filters
- **Overload alerts** — capacity > 100%, priority inflation > 50%
- **Global search** with highlighted results grouped by status
- **Full RTL Hebrew UI**, Mobile-First, PWA-Ready
- **Dual-mode storage** — localStorage (primary) / Supabase (optional)

### 1.2 Gap Analysis

|ID|Gap                  |Description                                             |Phase|Complexity|
|--|---------------------|--------------------------------------------------------|-----|----------|
|G1|Life areas missing   |Add `fitness` and `family` areas                        |1    |Low       |
|G2|No day close         |End-of-day review: what got done, what got deferred     |2    |High      |
|G3|No interruption flow |Mechanism for reactive tasks that break the plan mid-day|2    |High      |
|G4|No emergency mode    |Auto-display 3 most urgent tasks when no review was done|2    |Medium    |
|G5|No monthly planning  |Monthly layer bridging half-year goals → weekly tasks   |3    |Medium    |
|G6|No half-year planning|Compass layer: 3–5 goals per life area for 6 months     |3    |Medium    |
|G7|No proactive alerts  |API endpoints + iPhone Shortcuts for daily/weekly push  |4    |Medium    |
|G8|Supabase migration   |Full migration from localStorage to Supabase-only       |0    |High      |

-----

## Chapter 2: Development Phases

### 2.1 Phase Overview

|Phase|Name                   |Gaps      |Deliverable                                          |
|-----|-----------------------|----------|-----------------------------------------------------|
|0    |Supabase Migration     |G8        |Full Supabase-only operation                         |
|1    |Data Model & Life Areas|G1        |New areas in DB + UI                                 |
|2    |Flows & Control        |G2, G3, G4|Day close + interruption flow + emergency mode       |
|3    |Planning Layers        |G5, G6    |Monthly plan + half-year plan + weekly review updates|
|4    |Proactive Notifications|G7        |2 API endpoints + 2 iPhone Shortcuts                 |

**Rule:** Each phase ends with a production deploy and manual testing before moving to the next.

### 2.2 Dependency Graph

```
Phase 0 (Supabase)
  └── Phase 1 (Life Areas)
        └── Phase 2 (Flows & Control)
              └── Phase 3 (Planning Layers)
                    └── Phase 4 (Proactive Notifications)
```

All phases depend on Phase 0 (Supabase migration) being complete. Phase 4 depends on Phase 2’s `deferred_count` field for the emergency logic.

-----

## Chapter 3: Phase 0 — Supabase Migration

### 3.1 Strategy

The app already supports dual-mode (localStorage / Supabase). This phase makes Supabase the sole storage backend.

### 3.2 Steps

#### Step 1: Update Supabase Schema

Ensure `supabase/schema.sql` includes all current tables and future fields. See Section 3.3 for the complete schema.

#### Step 2: Switch Hooks to Supabase-Only

Remove the localStorage fallback from all data hooks:

- `useTasks.js` — remove `localDb` calls, Supabase-only
- `useProjects.js` — same
- `useEvents.js` — same

Remove the conditional logic that checks for `VITE_SUPABASE_URL`.

#### Step 3: Write Migration Script

Create a one-time migration utility:

```
File: scripts/migrate-to-supabase.js

1. Read all data from localStorage (tasks, subtasks, projects)
2. Transform to match Supabase schema
3. Upsert into Supabase tables
4. Log results (success/failure counts)
5. Do NOT delete localStorage data (keep as backup)
```

#### Step 4: Clean Up

After successful migration and verification:

- Delete `lib/localDb.js`
- Remove `localDb` imports from all files
- Update environment configuration — `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are now required

### 3.3 Complete Schema

```sql
-- ══════════════════════════════════════
-- ENUMS
-- ══════════════════════════════════════

CREATE TYPE task_status AS ENUM (
  'inbox',
  'next_action',
  'waiting_for',
  'someday',
  'done',
  'trashed'
);

CREATE TYPE area_enum AS ENUM (
  'work',
  'school',
  'home',
  'fitness',
  'family'
);

CREATE TYPE priority_enum AS ENUM (
  'high',
  'medium',
  'low'
);

-- ══════════════════════════════════════
-- TASKS
-- ══════════════════════════════════════

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  notes TEXT,
  status task_status NOT NULL DEFAULT 'inbox',
  priority priority_enum,
  area area_enum,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  due_date DATE,
  scheduled_date DATE,
  estimated_minutes INTEGER,
  waiting_on TEXT,
  is_focus BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  recurring_rule JSONB,
  position INTEGER DEFAULT 0,
  -- New fields (Phase 2)
  deferred_count INTEGER DEFAULT 0,
  last_deferred_at TIMESTAMPTZ,
  interrupted_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- ══════════════════════════════════════
-- SUBTASKS
-- ══════════════════════════════════════

CREATE TABLE subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_done BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0
);

-- ══════════════════════════════════════
-- PROJECTS
-- ══════════════════════════════════════

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  area area_enum NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- ══════════════════════════════════════
-- EVENTS (existing model, no UI yet)
-- ══════════════════════════════════════

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  is_all_day BOOLEAN DEFAULT false
);

-- ══════════════════════════════════════
-- MONTHLY PLANS (Phase 3)
-- ══════════════════════════════════════

CREATE TABLE monthly_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  milestones JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (month, year)
);

-- milestones JSONB structure:
-- [
--   {
--     "id": "uuid",
--     "title": "Complete project X",
--     "week": 2,
--     "area": "work",
--     "done": false
--   }
-- ]

-- ══════════════════════════════════════
-- HALF-YEAR PLANS (Phase 3)
-- ══════════════════════════════════════

CREATE TABLE half_year_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  half INTEGER NOT NULL CHECK (half IN (1, 2)),
  year INTEGER NOT NULL,
  goals JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (half, year)
);

-- goals JSONB structure:
-- [
--   {
--     "id": "uuid",
--     "title": "Graduate with honors",
--     "area": "school",
--     "status": "active"    -- active | completed | dropped
--   }
-- ]

-- ══════════════════════════════════════
-- INDEXES
-- ══════════════════════════════════════

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_area ON tasks(area);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_scheduled_date ON tasks(scheduled_date);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_is_focus ON tasks(is_focus) WHERE is_focus = true;
CREATE INDEX idx_subtasks_task_id ON subtasks(task_id);

-- ══════════════════════════════════════
-- RLS POLICIES (adjust per auth setup)
-- ══════════════════════════════════════

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE half_year_plans ENABLE ROW LEVEL SECURITY;
```

### 3.4 Completion Criteria

- [ ] All data from localStorage is in Supabase
- [ ] App works exclusively from Supabase
- [ ] `localDb.js` is deleted
- [ ] No regressions — all existing features work

-----

## Chapter 4: Phase 1 — Data Model & Life Areas

**Gap: G1 — Missing life areas (fitness, family)**

### 4.1 Database Changes

The `area_enum` in the schema above already includes `fitness` and `family`. If migrating from an existing Supabase instance:

```sql
ALTER TYPE area_enum ADD VALUE 'fitness';
ALTER TYPE area_enum ADD VALUE 'family';
```

### 4.2 Constants Update

Update `lib/constants.js`:

```javascript
export const AREAS = {
  work:    { label: 'עבודה',   icon: 'Briefcase',     color: 'blue'   },
  school:  { label: 'לימודים', icon: 'GraduationCap', color: 'purple' },
  home:    { label: 'בית',     icon: 'Home',          color: 'green'  },
  fitness: { label: 'כושר',    icon: 'Dumbbell',      color: 'orange' },
  family:  { label: 'משפחה',   icon: 'Heart',         color: 'red'    },
};
```

### 4.3 UI Changes

#### 4.3.1 Area Filter Buttons

In every screen that displays area filters (`ActionsView`, `ProjectsView`, `EditTaskModal`), add the two new options. The existing filter logic iterates over `AREAS`, so this should work automatically once the constant is updated.

#### 4.3.2 GTD Decision Tree (InboxView)

In the area selection step of the Clarify flow, add the new area options.

#### 4.3.3 Weekly Review — Balance Check

In Step 6 (Metrics), add a new metric card: **Area Balance** — shows task completion count per area. Highlight any area with 0 completed tasks this week.

### 4.4 Completion Criteria

- [ ] All 5 areas appear in all filter bars
- [ ] New tasks can be assigned to `fitness` or `family`
- [ ] Existing tasks retain their original area
- [ ] DB schema updated in Supabase
- [ ] Area balance visible in weekly review

-----

## Chapter 5: Phase 2 — Flows & Control

**Gaps: G2 (Day Close), G3 (Interruption Flow), G4 (Emergency Mode)**

### 5.1 Day Close (G2)

#### 5.1.1 New Screen: DayCloseView

A new screen accessible via a floating button at the bottom of `ActionsView` (not a separate tab — avoids 5-tab overcrowding).

**File:** `features/day-close/DayCloseView.jsx`

**Display:**

The screen shows all tasks that were scheduled or in focus for today, split into two sections:

**Section 1 — Completed:** Tasks completed today (`completed_at` = today). Display with a green checkmark. Read-only.

**Section 2 — Not Completed:** Tasks that were scheduled/focused today but not completed. Each task shows two action buttons:

|Action           |Label      |Behavior                                                                                   |
|-----------------|-----------|-------------------------------------------------------------------------------------------|
|Defer to tomorrow|“מחר”      |Set `scheduled_date = tomorrow`, increment `deferred_count`, set `last_deferred_at = now()`|
|Reschedule       |“תזמן מחדש”|Open date picker → set new `scheduled_date`, increment `deferred_count`                    |

**Footer:** “סיימתי” button that closes the view and returns to Actions.

#### 5.1.2 New Fields in `tasks` Table

```sql
ALTER TABLE tasks ADD COLUMN deferred_count INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN last_deferred_at TIMESTAMPTZ;
```

These fields are already included in the Phase 0 schema. If applying incrementally:

- `deferred_count` — incremented every time a task is deferred via Day Close
- `last_deferred_at` — timestamp of most recent deferral

#### 5.1.3 Deferred Badge

In `TaskItem.jsx`, when `deferred_count > 0`, show an orange badge: `"נדחה ×{deferred_count}"`. When `deferred_count >= 3`, badge turns red — this task keeps falling through.

-----

### 5.2 Interruption Flow (G3)

#### 5.2.1 Mechanism

When a reactive task arrives mid-day (urgent bug, client call), the user needs a way to:

1. **Capture** the interruption into the Inbox (existing Quick Add)
1. **Classify** it immediately using the two-question system from the TaskFlow spec:
- “What happens if I don’t handle this today?” → Urgent or not
- “How long will it take?” → Short (<30 min) or long (30+ min)
1. **Link** it to the interrupted task
1. **Return** to the interrupted task when done

#### 5.2.2 New Field in `tasks` Table

```sql
ALTER TABLE tasks ADD COLUMN interrupted_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;
```

Already included in the Phase 0 schema.

#### 5.2.3 UI Implementation

**Option A — Inline in ActionsView (Recommended):**

When the user starts working on a Focus task, add a subtle “הופסק” (interrupted) button on each focus task card. Tapping it:

1. Marks the current task as interrupted (visual indicator)
1. Opens the Quick Add with `interrupted_task_id` pre-filled
1. After the new task is added and classified, it gets the `interrupted_task_id` link

When the interrupting task is completed, the app shows a toast: `"חזור ל-[interrupted task title]?"` with a tap-to-navigate action.

#### 5.2.4 Day Close Integration

In the Day Close screen, interrupted tasks show a special label: `"הופסק על ידי: [interrupting task title]"` — giving context for why it wasn’t completed.

-----

### 5.3 Emergency Mode (G4)

#### 5.3.1 Trigger

Emergency mode activates when the user opens `ActionsView` and **both** conditions are met:

- No focus tasks are set for today (`is_focus` tasks with `scheduled_date = today` count is 0)
- No daily review was done (no task has `scheduled_date = today` set during a review)

#### 5.3.2 UI

A banner at the top of `ActionsView`:

```
┌─────────────────────────────────────────┐
│  ⚡ מצב חירום — הנה 3 הדברים הדחופים   │
│                                         │
│  1. [Task title]           due: today   │
│  2. [Task title]           deferred ×5  │
│  3. [Task title]           due: yesterday│
│                                         │
│  [ לחץ על משימה כדי להתחיל ]            │
└─────────────────────────────────────────┘
```

Tapping a task in the emergency banner sets it as `is_focus = true` and scrolls to it.

#### 5.3.3 Emergency Ranking Logic

The 3 tasks are selected by priority order:

1. Tasks with `due_date` ≤ today (overdue first, then due today)
1. Tasks with `deferred_count >= 3` (chronically deferred)
1. Tasks with `scheduled_date = today`

If there are fewer than 3 qualifying tasks, show however many exist.

#### 5.3.4 Implementation

```javascript
// lib/emergencyRank.js

export function getEmergencyTasks(tasks) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const active = tasks.filter(t =>
    t.status === 'next_action' && !t.completed_at
  );

  const scored = active.map(t => ({
    ...t,
    score: calculateUrgencyScore(t, today),
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function calculateUrgencyScore(task, today) {
  let score = 0;

  // Overdue
  if (task.due_date && task.due_date < today) {
    const daysOverdue = daysBetween(task.due_date, today);
    score += 1000 + daysOverdue * 10;
  }

  // Due today
  if (task.due_date === today) {
    score += 500;
  }

  // Chronically deferred
  if (task.deferred_count >= 3) {
    score += 300 + task.deferred_count * 10;
  }

  // Scheduled today
  if (task.scheduled_date === today) {
    score += 200;
  }

  return score;
}
```

### 5.4 Completion Criteria

- [ ] Day Close screen works — tasks defer correctly, `deferred_count` increments
- [ ] Deferred badge shows on task items
- [ ] Interruption flow — task links correctly, “return to” toast appears
- [ ] Emergency mode banner appears when conditions are met
- [ ] Emergency ranking returns the 3 most urgent tasks

-----

## Chapter 6: Phase 3 — Planning Layers

**Gaps: G5 (Monthly Planning), G6 (Half-Year Planning)**

### 6.1 Monthly Planning (G5)

#### 6.1.1 Database Table

`monthly_plans` table (see Phase 0 schema). Each row represents one month. Milestones are stored as JSONB array.

#### 6.1.2 New Hook: `useMonthlyPlan.js`

```javascript
// hooks/useMonthlyPlan.js

export function useMonthlyPlan(month, year) {
  // Returns: { plan, milestones, addMilestone, updateMilestone,
  //            removeMilestone, toggleDone, updateNotes }

  // Queries: SELECT * FROM monthly_plans WHERE month = $1 AND year = $2
  // Auto-creates row if not found
}
```

#### 6.1.3 New Screen: MonthlyPlanView

**File:** `features/monthly/MonthlyPlanView.jsx`

**Navigation:** Accessible from the Weekly Review (Step 6) via a button, or from a menu/settings page. Not a main tab.

**Layout:**

```
┌──────────────────────────────────────┐
│  תכנון חודשי — פברואר 2026    ◀ ▶   │
├──────────────────────────────────────┤
│  שבוע 1                             │
│  ☐ Submit project proposal  [work]   │
│  ☑ Complete lab report     [school]  │
│  + הוסף אבן דרך                      │
├──────────────────────────────────────┤
│  שבוע 2                             │
│  ☐ Client demo             [work]   │
│  + הוסף אבן דרך                      │
├──────────────────────────────────────┤
│  שבוע 3                             │
│  (ריק)                              │
│  + הוסף אבן דרך                      │
├──────────────────────────────────────┤
│  שבוע 4                             │
│  ☐ Midterm exam            [school]  │
│  + הוסף אבן דרך                      │
├──────────────────────────────────────┤
│  הערות: ___________________________  │
└──────────────────────────────────────┘
```

Each milestone has: title, week (1–4), area (colored badge), done (checkbox).

The `◀ ▶` arrows navigate between months.

#### 6.1.4 Integration with Weekly Review

In the Weekly Review Step 5 (“Plan the week”), add a reference panel showing this week’s milestones from the monthly plan. Read-only — just for context.

-----

### 6.2 Half-Year Planning (G6)

#### 6.2.1 Database Table

`half_year_plans` table (see Phase 0 schema). Each row represents one half (H1 = Jan–Jun, H2 = Jul–Dec). Goals are stored as JSONB array.

#### 6.2.2 New Hook: `useHalfYearPlan.js`

```javascript
// hooks/useHalfYearPlan.js

export function useHalfYearPlan(half, year) {
  // Returns: { plan, goals, addGoal, updateGoal,
  //            removeGoal, updateNotes }

  // Queries: SELECT * FROM half_year_plans WHERE half = $1 AND year = $2
  // Auto-creates row if not found
}
```

#### 6.2.3 New Screen: HalfYearPlanView

**File:** `features/half-year/HalfYearPlanView.jsx`

**Navigation:** Accessible from Weekly Review (Step 6) or Monthly Plan view. Not a main tab.

**Layout:**

```
┌──────────────────────────────────────┐
│  מצפן — H1 2026 (ינואר–יוני)       │
├──────────────────────────────────────┤
│  עבודה                               │
│  ● Reach 10K MRR              [active]│
│  ● Launch 2 new client apps   [active]│
├──────────────────────────────────────┤
│  לימודים                             │
│  ● Graduate with honors       [active]│
├──────────────────────────────────────┤
│  כושר                                │
│  ● Train 3x/week consistently [active]│
├──────────────────────────────────────┤
│  משפחה                               │
│  ● Weekly date night          [active]│
├──────────────────────────────────────┤
│  + הוסף יעד                          │
│  הערות: ___________________________  │
└──────────────────────────────────────┘
```

Goals are grouped by area. Each goal has: title, area, status (active / completed / dropped).

#### 6.2.4 Navigation Flow

The planning layers are connected hierarchically:

```
Weekly Review (Step 6)
  ├── "תכנון חודשי" button → MonthlyPlanView
  │     └── "מצפן חצי-שנתי" button → HalfYearPlanView
  └── "מצפן חצי-שנתי" button → HalfYearPlanView
```

-----

### 6.3 Weekly Review Updates

The existing 6-step review gets enhancements:

#### Step 5 — “Plan the Week” Enhancements

Add the structured process from the TaskFlow spec:

1. **Fixed blocks first** — show recurring tasks (fitness, family time) already on the calendar
1. **Monthly milestones** — show this week’s milestones from the monthly plan
1. **Look back** — show deferred tasks from last week (`last_deferred_at` within last 7 days)
1. **Open blocks** — remaining availability for reactive work
1. **Balance check** — highlight any life area with no planned tasks this week

#### Step 6 — Metrics Enhancements

Add two new metric cards:

|Metric                  |Calculation                                                           |
|------------------------|----------------------------------------------------------------------|
|Tasks deferred this week|`COUNT WHERE deferred_count > 0 AND last_deferred_at within this week`|
|Area balance            |Per-area completion count — highlight areas with 0                    |

### 6.4 Completion Criteria

- [ ] Monthly plan screen — create, edit, complete milestones across 4 weeks
- [ ] Half-year plan screen — create, edit goals grouped by area
- [ ] Monthly milestones show as reference in weekly review Step 5
- [ ] Deferred count and area balance metrics appear in weekly review Step 6
- [ ] Navigation between planning layers works smoothly

-----

## Chapter 7: Phase 4 — Proactive Notifications

**Gap: G7 — No proactive alerts**

### 7.1 Daily Summary API

#### 7.1.1 Endpoint

**File:** `api/daily-summary.js`

```
GET /api/daily-summary
Authorization: Bearer <DAILY_SUMMARY_API_KEY>
```

#### 7.1.2 Response Schema

```json
{
  "date": "2026-02-17",
  "focus_tasks": [
    { "id": "uuid", "title": "Fix auth bug", "area": "work" }
  ],
  "scheduled_tasks": [
    { "id": "uuid", "title": "Listen to lecture 5", "area": "school", "estimated_minutes": 45 }
  ],
  "overdue_tasks": [
    { "id": "uuid", "title": "Submit report", "area": "school", "due_date": "2026-02-15", "days_overdue": 2 }
  ],
  "deferred_tasks": [
    { "id": "uuid", "title": "Go to gym", "area": "fitness", "deferred_count": 4 }
  ],
  "inbox_count": 3,
  "emergency_3": [
    { "id": "uuid", "title": "Submit report", "score": 1020 },
    { "id": "uuid", "title": "Go to gym", "score": 340 },
    { "id": "uuid", "title": "Fix auth bug", "score": 200 }
  ]
}
```

#### 7.1.3 Implementation

```javascript
// api/daily-summary.js

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Auth check
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token !== process.env.DAILY_SUMMARY_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const today = new Date().toISOString().split('T')[0];

  // Query active tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .in('status', ['next_action', 'waiting_for'])
    .is('completed_at', null);

  const focus = tasks.filter(t => t.is_focus);
  const scheduled = tasks.filter(t => t.scheduled_date === today && !t.is_focus);
  const overdue = tasks.filter(t => t.due_date && t.due_date < today);
  const deferred = tasks.filter(t => t.deferred_count > 0)
    .sort((a, b) => b.deferred_count - a.deferred_count);

  const { count: inboxCount } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'inbox');

  // Emergency ranking (same logic as client-side)
  const emergency3 = getEmergency3(tasks, today);

  return res.status(200).json({
    date: today,
    focus_tasks: focus,
    scheduled_tasks: scheduled,
    overdue_tasks: overdue.map(t => ({
      ...t,
      days_overdue: daysBetween(t.due_date, today)
    })),
    deferred_tasks: deferred.slice(0, 5),
    inbox_count: inboxCount,
    emergency_3: emergency3,
  });
}
```

-----

### 7.2 Weekly Summary API

#### 7.2.1 Endpoint

**File:** `api/weekly-summary.js`

```
GET /api/weekly-summary
Authorization: Bearer <DAILY_SUMMARY_API_KEY>
```

#### 7.2.2 Response Schema

```json
{
  "week_start": "2026-02-15",
  "week_end": "2026-02-21",
  "inbox_count": 3,
  "completed_this_week": 12,
  "deferred_this_week": 4,
  "area_balance": {
    "work": 5,
    "school": 3,
    "home": 2,
    "fitness": 0,
    "family": 2
  },
  "missing_areas": ["fitness"],
  "stale_tasks": 2
}
```

#### 7.2.3 Implementation

Same pattern as daily summary. Queries tasks with `completed_at` and `last_deferred_at` within the current week. Calculates area balance by counting completed tasks per area.

-----

### 7.3 iPhone Shortcuts

#### 7.3.1 Daily Shortcut

**Name:** “LifeOS — מה היום?”

**Automation trigger:** Time of Day → 07:30 (configurable)

**Steps:**

1. **Get Contents of URL** — `GET https://life-os-iota-seven.vercel.app/api/daily-summary` with `Authorization: Bearer {key}` header
1. **Get Dictionary from Input**
1. **Build notification text:**
- If `focus_tasks` is not empty: `"📌 מיקוד: {task1}, {task2}, {task3}"`
- If `overdue_tasks` is not empty: `"⚠️ באיחור: {count}"`
- If `inbox_count > 0`: `"📥 תיבת דואר: {count}"`
- If `deferred_tasks` is not empty: `"🔄 נדחו: {task1} (×{count})"`
1. **Show Notification** with the composed text

#### 7.3.2 Weekly Shortcut

**Name:** “LifeOS — סקירה שבועית”

**Automation trigger:** Day of Week (Friday) + Time (10:00)

**Steps:**

1. **Get Contents of URL** — `GET .../api/weekly-summary`
1. **Build notification text:**
- `"✅ הושלמו: {completed}"`
- `"🔄 נדחו: {deferred}"`
- `"📥 תיבת דואר: {inbox_count}"`
- If `missing_areas` is not empty: `"⚠️ חסר: {areas}"`
1. **Show Notification**
1. **Open URL** — app URL (opens LifeOS directly to the review screen)

### 7.4 Security

- Store `DAILY_SUMMARY_API_KEY` as a Vercel environment variable
- The Shortcut stores the key locally on the device
- Use `SUPABASE_SERVICE_ROLE_KEY` (not anon key) in the serverless functions — server-side only
- Serverless functions use Vercel’s built-in CORS protection

### 7.5 Completion Criteria

- [ ] `GET /api/daily-summary` returns correct JSON
- [ ] `GET /api/weekly-summary` returns correct JSON
- [ ] Both endpoints reject unauthorized requests
- [ ] Daily Shortcut fires and shows notification
- [ ] Weekly Shortcut fires and shows notification
- [ ] Time automations run reliably

-----

## Chapter 8: Summary & Testing

### 8.1 Full Development Order

|Phase|What                   |Deliverable                                                 |
|-----|-----------------------|------------------------------------------------------------|
|0    |Supabase Migration     |All data in Supabase, localStorage removed                  |
|1    |Life Areas             |5 areas everywhere, DB schema updated                       |
|2    |Flows & Control        |Day Close + interruption + emergency mode + `deferred_count`|
|3    |Planning Layers        |Monthly + half-year plans, weekly review updates            |
|4    |Proactive Notifications|2 API endpoints + 2 iPhone Shortcuts                        |

### 8.2 Testing Checklist Per Phase

Before deploying each phase, verify:

- [ ] **Functional** — all new features work as specified
- [ ] **Regression** — existing features still work
- [ ] **RTL** — all new UI renders correctly in Hebrew
- [ ] **Mobile** — test on actual iPhone (Safari)
- [ ] **Supabase** — data persists and loads correctly
- [ ] **Edge cases** — empty states, no tasks, first-time use

### 8.3 Updated File Structure

```
LifeOS/
├── api/
│   ├── daily-summary.js          # Phase 4
│   └── weekly-summary.js         # Phase 4
├── supabase/
│   └── schema.sql                # Updated (Phase 0)
├── scripts/
│   └── migrate-to-supabase.js    # Phase 0 (one-time)
└── app/src/
    ├── components/
    │   └── ui/
    │       ├── TaskItem.jsx       # Updated: deferred badge (Phase 2)
    │       ├── EditTaskModal.jsx  # Updated: new areas (Phase 1)
    │       ├── EmergencyBanner.jsx # New (Phase 2)
    │       └── ... (existing)
    ├── features/
    │   ├── inbox/
    │   │   └── InboxView.jsx      # Updated: new areas (Phase 1)
    │   ├── actions/
    │   │   └── ActionsView.jsx    # Updated: emergency banner (Phase 2)
    │   ├── projects/
    │   │   └── ProjectsView.jsx   # Updated: new areas (Phase 1)
    │   ├── review/
    │   │   └── ReviewView.jsx     # Updated: planning refs (Phase 3)
    │   ├── day-close/
    │   │   └── DayCloseView.jsx   # New (Phase 2)
    │   ├── monthly/
    │   │   └── MonthlyPlanView.jsx # New (Phase 3)
    │   └── half-year/
    │       └── HalfYearPlanView.jsx # New (Phase 3)
    ├── hooks/
    │   ├── useTasks.js            # Updated: Supabase-only (Phase 0)
    │   ├── useProjects.js         # Updated: Supabase-only (Phase 0)
    │   ├── useEvents.js           # Updated: Supabase-only (Phase 0)
    │   ├── useMonthlyPlan.js      # New (Phase 3)
    │   ├── useHalfYearPlan.js     # New (Phase 3)
    │   └── useToast.js
    └── lib/
        ├── constants.js           # Updated: new areas (Phase 1)
        ├── emergencyRank.js       # New (Phase 2)
        ├── utils.js
        ├── supabase.js
        └── ToastContext.js
```
