# LifeOS V3

מערכת ניהול משימות מבוססת GTD לעבודה, לימודים ובית.

## Stack

- **Frontend:** React 19 + Vite, Tailwind CSS, lucide-react
- **Database:** Supabase (Postgres)
- **API:** Vercel Serverless Functions (Node.js 20)
- **Deployment:** Vercel

## Setup

### 1. Supabase

1. צור פרויקט חדש ב-[supabase.com](https://supabase.com)
2. פתח את ה-SQL Editor והרץ את `supabase/schema.sql`
3. העתק את ה-URL וה-keys מ-Settings > API

### 2. Environment Variables

צור קובץ `.env` בשורש (או הגדר ב-Vercel Dashboard):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Development

```bash
npm install && cd app && npm install
cd app && npm run dev
```

### 4. Deploy

```bash
vercel
```

Or connect the repo to Vercel for auto-deploys.

## Architecture

```
app/src/
  App.jsx              # Root: 4-tab layout
  features/
    inbox/             # Capture + Clarify
    actions/           # Today + Next Actions
    projects/          # Projects by area
    review/            # Weekly Review (5 steps)
  hooks/               # useTasks, useProjects, useEvents
  components/ui/       # TaskItem, TaskInput, EditTaskModal, Toast

api/
  tasks/               # GET/POST/PATCH/DELETE
  projects/            # GET/POST/PATCH
  events/              # GET/POST/PATCH/DELETE
```

## External Inbox

POST tasks from anywhere (iOS Shortcuts, webhooks, curl):

```bash
curl -X POST https://your-app.vercel.app/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy groceries"}'
```

## GTD Flow

```
Capture (Inbox) -> Clarify -> Organize (Projects/Areas) -> Execute (Actions) -> Review
```
