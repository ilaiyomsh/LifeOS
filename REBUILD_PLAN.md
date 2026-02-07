# LifeOS V3 — Rebuild Plan

## Philosophy

The current app tries to do too much (Eisenhower matrix, AI analysis, gamification, smart scheduling) but none of it cohesively. The result: 7 tabs, unclear workflow, tasks scattered across views, and no real persistence.

**V3 strips down to what matters:** a GTD-inspired system with a real database, fast capture, clear processing, and simple daily execution. No AI. No gamification. Just a trusted system for managing work, school, and home.

---

## Method: Simplified GTD

The app follows David Allen's GTD workflow, adapted for a three-area life:

```
Capture → Clarify → Organize → Execute → Review
```

### Core Concepts

| Concept | Implementation |
|---------|---------------|
| **Inbox** | Single capture point. Zero friction. Title only required. |
| **Clarify** | Process inbox items one-by-one: assign area, set next action, estimate effort, or trash. |
| **Areas** | Three life domains: Work (עבודה), School (לימודים), Home (בית). Permanent, no end date. |
| **Projects** | Multi-step outcomes within an area. Each project must have ≥1 next action. |
| **Next Actions** | Concrete, physical tasks you can do right now. The core unit of work. |
| **Waiting For** | Tasks delegated or blocked on someone/something else. |
| **Someday/Maybe** | Ideas and tasks with no commitment yet. Reviewed weekly. |
| **Calendar** | Only hard-landscape items: appointments, deadlines, events with a fixed date/time. |
| **Weekly Review** | Guided walkthrough: empty inbox, review all projects, check waiting-for, plan the week. |

### What We're Dropping

- ❌ Eisenhower Matrix heatmap (replaced by simple priority: high/medium/low)
- ❌ AI task analysis (no AI in V3)
- ❌ Smart schedule algorithm (replaced by manual planning + calendar)
- ❌ Gamification / XP / levels (unnecessary complexity)
- ❌ Focus timer with confetti (replaced by simple "do" mode)

### What We're Keeping

- ✅ Hebrew UI (RTL), proper localization
- ✅ Mobile-first responsive design
- ✅ Vercel deployment
- ✅ Domain-based organization (work/school/home)

---

## Database: Supabase (Postgres)

### Why Supabase
- Free tier: 500MB storage, real-time subscriptions
- First-party Vercel Marketplace integration (auto env vars)
- JS client with query builder — no raw SQL needed for CRUD
- Solves the inbox API problem: external tools POST → serverless fn → Supabase → app reads
- Real-time: React app subscribes to changes, no polling

### Schema

```sql
-- Areas are fixed (work, school, home) — stored as enum, not a table
CREATE TYPE area_enum AS ENUM ('work', 'school', 'home');

CREATE TYPE task_status AS ENUM (
  'inbox',          -- just captured, unprocessed
  'next_action',    -- clarified, ready to do
  'waiting_for',    -- blocked on someone/something
  'someday',        -- maybe later
  'done',           -- completed
  'trashed'         -- soft-deleted
);

CREATE TYPE priority_level AS ENUM ('high', 'medium', 'low');

-- Projects: multi-step outcomes
CREATE TABLE projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  area          area_enum NOT NULL,
  description   TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  completed_at  TIMESTAMPTZ
);

-- Tasks: the core unit
CREATE TABLE tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  notes         TEXT,
  status        task_status DEFAULT 'inbox',
  priority      priority_level,
  area          area_enum,
  project_id    UUID REFERENCES projects(id) ON DELETE SET NULL,

  -- scheduling
  due_date      DATE,                    -- hard deadline
  scheduled_date DATE,                   -- when you plan to do it
  estimated_minutes INTEGER,             -- how long it takes

  -- waiting-for context
  waiting_on    TEXT,                     -- who/what you're waiting for

  -- timestamps
  created_at    TIMESTAMPTZ DEFAULT now(),
  completed_at  TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ DEFAULT now(),

  -- ordering within lists
  position      INTEGER DEFAULT 0
);

-- Calendar events: hard-landscape items
CREATE TABLE events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  area          area_enum,
  start_at      TIMESTAMPTZ NOT NULL,
  end_at        TIMESTAMPTZ,
  is_all_day    BOOLEAN DEFAULT false,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_area ON tasks(area);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_scheduled_date ON tasks(scheduled_date);
CREATE INDEX idx_events_start ON events(start_at);
```

---

## API Endpoints

All under `/api/`, Vercel serverless functions (Node.js 20), talking to Supabase.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/tasks` | List tasks (filter by status, area, date) |
| `POST` | `/api/tasks` | Create task (inbox capture — from app or external) |
| `PATCH` | `/api/tasks/[id]` | Update task (clarify, reschedule, complete) |
| `DELETE` | `/api/tasks/[id]` | Soft-delete (status → trashed) |
| `GET` | `/api/projects` | List projects (filter by area, active) |
| `POST` | `/api/projects` | Create project |
| `PATCH` | `/api/projects/[id]` | Update project |
| `GET` | `/api/events` | List events (filter by date range) |
| `POST` | `/api/events` | Create event |
| `PATCH` | `/api/events/[id]` | Update event |
| `DELETE` | `/api/events/[id]` | Delete event |

### External Inbox Endpoint

The key endpoint for iOS Shortcuts / webhooks / automation:

```
POST /api/tasks
Content-Type: application/json

{
  "title": "Buy groceries",
  "notes": "Milk, eggs, bread",     // optional
  "area": "home"                     // optional
}

→ 201 Created
{ "id": "uuid", "title": "Buy groceries", "status": "inbox", ... }
```

Minimal required field: `title`. Everything else defaults. This is the zero-friction capture point.

---

## App Structure

### Views (4 main tabs, down from 7)

```
┌─────────────────────────────────────┐
│  1. Inbox     — Capture & Clarify   │
│  2. Actions   — Today's work        │
│  3. Projects  — Organized by area   │
│  4. Review    — Weekly review        │
└─────────────────────────────────────┘
```

#### 1. Inbox (תיבת דואר נכנס)

The first screen. Two modes:

**Capture mode (default):**
- Single text input at top, always visible
- Type → Enter → task lands in inbox list below
- Nothing else required. Speed is everything.

**Clarify mode:**
- Toggle to process inbox items one-by-one (card-based, like Tinder)
- For each item, decide:
  - **Area**: work / school / home
  - **What's the next action?** → set title, move to `next_action`
  - **Is it a project?** → create project, add first next action
  - **Waiting on someone?** → set `waiting_on`, move to `waiting_for`
  - **Someday/maybe?** → move to `someday`
  - **Trash it?** → move to `trashed`
- Shows count badge: "5 items to process"

#### 2. Actions (פעולות)

The daily work view. Shows:

- **Today's tasks**: tasks with `scheduled_date = today` or `due_date = today`
- **Next actions by area**: grouped sections (Work / School / Home), filtered to `status = next_action`
- **Waiting for**: collapsed section showing blocked items
- Each task shows: title, area color dot, due date (if set), estimated time
- Tap to complete (checkbox). Swipe to snooze to tomorrow.
- Quick-add within any area section (inherits that area)

**Top bar**: date, total task count, optional filter by area.

#### 3. Projects (פרויקטים)

Organized by area (3 collapsible sections):

```
📘 עבודה (Work)
  ├── Project: Q1 Marketing Campaign
  │   ├── ✓ Draft brief
  │   ├── → Design mockups (next action)
  │   └── ⏳ Waiting: Client feedback
  └── Project: Hire Junior Dev
      └── → Review resumes (next action)

📗 לימודים (School)
  └── Project: Final Paper
      ├── → Research sources (next action)
      └── Submit draft (due: Feb 15)

📙 בית (Home)
  └── Project: Kitchen Renovation
      └── ⏳ Waiting: Contractor quote
```

- Each project shows progress (X/Y tasks done)
- Warning indicator if a project has no next action
- Tap project to expand/collapse tasks
- Quick-add task within a project

#### 4. Review (סקירה שבועית)

A guided weekly review flow (5 steps):

1. **Process Inbox** — "You have N unprocessed items" → links to Inbox clarify mode
2. **Review Projects** — Walk through each project: is it still active? does it have a next action? any new tasks needed?
3. **Review Waiting For** — Check each waiting-for item: any updates? need to follow up?
4. **Review Someday/Maybe** — Anything to activate? Anything to trash?
5. **Plan the Week** — Show next 7 days calendar, drag/assign tasks to days

Completion state saved (so you can pause and resume the review).

---

## Component Architecture

```
app/src/
├── main.jsx                    # Entry point
├── App.jsx                     # Router + providers
├── index.css                   # Tailwind base
│
├── lib/
│   ├── supabase.js             # Supabase client init
│   ├── constants.js            # Areas config, colors
│   └── utils.js                # cn(), formatDate(), etc.
│
├── hooks/
│   ├── useTasks.js             # CRUD operations for tasks
│   ├── useProjects.js          # CRUD operations for projects
│   ├── useEvents.js            # CRUD operations for events
│   └── useRealtime.js          # Supabase real-time subscriptions
│
├── components/
│   ├── layout/
│   │   ├── Shell.jsx           # App frame + bottom nav (4 tabs)
│   │   └── Header.jsx          # Top bar with context info
│   │
│   └── ui/
│       ├── TaskItem.jsx        # Single task row (checkbox, title, meta)
│       ├── TaskInput.jsx       # Quick-add input field
│       ├── ProjectCard.jsx     # Collapsible project with tasks
│       ├── AreaSection.jsx     # Area-grouped task list
│       ├── ClarifyCard.jsx     # Single inbox item processing card
│       ├── EventItem.jsx       # Calendar event row
│       ├── Badge.jsx           # Count badge
│       ├── EmptyState.jsx      # Friendly empty state illustrations
│       └── Toast.jsx           # Undo/feedback toasts
│
├── features/
│   ├── inbox/
│   │   └── InboxView.jsx       # Capture + clarify modes
│   ├── actions/
│   │   └── ActionsView.jsx     # Today + next actions by area
│   ├── projects/
│   │   └── ProjectsView.jsx    # Projects organized by area
│   └── review/
│       └── ReviewView.jsx      # Guided weekly review
│
api/
├── tasks.js                    # GET/POST tasks
├── tasks/[id].js               # PATCH/DELETE single task
├── projects.js                 # GET/POST projects
├── projects/[id].js            # PATCH single project
├── events.js                   # GET/POST events
└── events/[id].js              # PATCH/DELETE single event
```

---

## Key UX Decisions

### 1. Inbox-first, not matrix-first
The home screen is Inbox, not a matrix. The user's first action should always be: dump what's in your head. Processing comes later.

### 2. Simple priority, not a 5×5 grid
Instead of importance (1-5) × urgency (1-5), we use: **high / medium / low**. That's it. Three levels. The Eisenhower matrix is a mental model, not a UI element — users apply it when they clarify ("Is this important? Is it urgent? → high priority").

### 3. Areas are fixed, projects are flexible
Work, School, Home are hardcoded areas (not user-configurable). Projects are created freely within areas. This reduces decision fatigue.

### 4. Complete Hebrew UI
Every string in Hebrew. No mixed English/Hebrew. Consistent RTL layout.

### 5. Undo instead of confirmation dialogs
Delete a task → toast with "undo" button (5 seconds). No "are you sure?" modals.

### 6. Mobile-first, touch-friendly
- Minimum touch target: 44×44px
- Swipe gestures: left to complete, right to snooze
- Bottom navigation (thumb-reachable)
- No hover-dependent interactions

### 7. Keyboard shortcuts (desktop)
- `N` — new task (quick add)
- `1-4` — switch tabs
- `J/K` — navigate task list
- `Enter` — open task
- `E` — complete task
- `?` — show shortcuts

---

## Implementation Phases

### Phase 1: Foundation (database + API + basic shell)
1. Set up Supabase project + tables (schema above)
2. Create `lib/supabase.js` client
3. Build all API endpoints (tasks, projects, events CRUD)
4. Test POST `/api/tasks` from curl / iOS Shortcut
5. Build Shell layout with 4-tab navigation
6. Build `useTasks`, `useProjects` hooks with Supabase queries

### Phase 2: Inbox (capture + clarify)
7. Build `TaskInput` component (single-field quick add)
8. Build `InboxView` capture mode (input + inbox list)
9. Build `ClarifyCard` component (one-by-one processing)
10. Build `InboxView` clarify mode (swipe through inbox)

### Phase 3: Actions (daily work)
11. Build `TaskItem` component (checkbox, title, area dot, due date)
12. Build `AreaSection` component (collapsible area group)
13. Build `ActionsView` (today + next actions by area + waiting-for)
14. Add swipe-to-complete and swipe-to-snooze

### Phase 4: Projects
15. Build `ProjectCard` component (collapsible, progress bar)
16. Build `ProjectsView` (grouped by area)
17. Add quick-add task within project
18. Add "no next action" warning indicator

### Phase 5: Review
19. Build `ReviewView` (5-step guided flow)
20. Step 1: inbox processing count + link
21. Step 2: project walk-through
22. Step 3: waiting-for check
23. Step 4: someday/maybe scan
24. Step 5: week planning (assign tasks to days)

### Phase 6: Polish
25. Toast/undo system
26. Keyboard shortcuts
27. Empty states
28. Loading/error states
29. Full Hebrew localization pass
30. Mobile responsiveness pass
31. Accessibility (aria-labels, focus management, screen reader)

---

## What's NOT in V3

These are intentionally excluded to keep scope tight:

- AI analysis / suggestions
- Gamification / XP / levels
- Smart scheduling algorithm
- Pomodoro / focus timer
- Dark mode
- Multi-user / auth
- Drag-and-drop reordering
- Recurring tasks
- Calendar sync (Google/Apple)
- Notifications
- Search (add in V3.1)
- Statistics / analytics

They can all be added later once the core is solid.

---

## Migration Plan

The rebuild is a **full rewrite**, not an incremental refactor. The existing code is too entangled.

1. Remove all existing `app/src/features/`, `app/src/contexts/`, `app/src/components/`
2. Remove `app/src/lib/ai.js`, `app/src/lib/scheduler.js`
3. Keep `app/src/lib/utils.js` (cn utility)
4. Keep `app/src/main.jsx`, `app/src/index.css` (modify in place)
5. Rewrite `App.jsx` from scratch
6. Replace all `api/*.js` serverless functions
7. Remove root-level `api/` directory (duplicate of `app/api/`)
8. Update `vercel.json` if needed
9. Keep `package.json` — add `@supabase/supabase-js`, remove `@google/generative-ai`, `recharts`, `canvas-confetti`
