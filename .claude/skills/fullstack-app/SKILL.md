---
name: fullstack-app
description: Scaffold a complete fullstack app with React (Vite), Supabase (Postgres), Tailwind CSS, and Vercel deployment — all in one shot. Use when building a new web app from scratch.
argument-hint: <app-name> <description-of-what-it-does>
user-invocable: true
---

# Fullstack App Scaffolder

You are scaffolding a production-ready fullstack app. Generate ALL files in one go — the user should have a working app after a single command.

## Arguments

- `$0` — App name (kebab-case, e.g. `task-manager`)
- `$1+` — Description of what the app does (used to generate the data model)

If no arguments provided, ask the user for:
1. App name
2. What the app does (1-2 sentences)
3. Main data entities (e.g. "tasks, projects, tags")

## Stack

- **Frontend**: React 19 + Vite + Tailwind CSS v4
- **Backend**: Supabase (Postgres + Auth + Realtime)
- **API**: Vercel Serverless Functions (Node.js 20)
- **Deployment**: Vercel
- **Language**: JavaScript (no TypeScript unless requested)

## Project Structure to Generate

```
<app-name>/
├── app/                          # Vite React SPA
│   ├── public/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── index.css             # Tailwind directives
│   │   ├── lib/
│   │   │   ├── supabase.js       # Browser client (with localStorage fallback)
│   │   │   ├── localDb.js        # localStorage fallback for offline use
│   │   │   └── utils.js
│   │   ├── hooks/                # Data hooks with Supabase + localStorage dual mode
│   │   ├── components/
│   │   │   ├── ui/               # Reusable UI primitives
│   │   │   └── layout/           # Shell, navigation
│   │   └── features/             # Feature-sliced modules
│   ├── index.html
│   ├── vite.config.js
│   ├── eslint.config.js
│   └── package.json
├── api/                          # Vercel serverless functions
│   ├── _supabase.js              # Server-side Supabase client + CORS helper
│   └── <resources>/              # CRUD endpoints per entity
├── supabase/
│   └── schema.sql                # Full database schema
├── vercel.json
├── .env.example
├── .gitignore
└── package.json                  # Root (optional, for scripts)
```

## File Generation Rules

### 1. `vercel.json`

```json
{
  "buildCommand": "cd app && npm install && npm run build",
  "outputDirectory": "app/dist",
  "framework": null,
  "functions": { "api/**/*.js": { "runtime": "nodejs20.x" } },
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 2. `app/package.json`

Required dependencies:
- `react`, `react-dom` (^19)
- `@supabase/supabase-js` (^2)
- `lucide-react` (icons)
- `clsx`, `tailwind-merge` (className utility)
- `date-fns` (if dates are involved)

Dev dependencies:
- `vite` (^6), `@vitejs/plugin-react`
- `tailwindcss` (^4), `@tailwindcss/vite`
- `eslint`, `@eslint/js`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`

### 3. `app/src/lib/supabase.js` — Dual-mode client

```js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
```

### 4. `app/src/lib/localDb.js` — localStorage fallback

Generate a localStorage-backed data layer with:
- `generateId()` using `crypto.randomUUID()`
- `getStore(table)` / `setStore(table, data)` helpers
- A pub/sub event emitter for cross-hook reactivity (`subscribe(table, fn)`)
- Full CRUD functions per entity (get, add, update, delete)
- Proper sorting (created_at descending by default)

### 5. Data Hooks — ALWAYS dual-mode

Every hook must check `supabase` and fall back to `localDb`:

```js
const fetchItems = useCallback(() => {
  if (!supabase) {
    setItems(localDb.getItems(filters));
    setLoading(false);
    return;
  }
  // Supabase query...
}, [deps]);
```

- Use `useRef(false)` mountedRef pattern for initial fetch
- Subscribe to Supabase realtime OR localDb events for reactivity
- Return `{ data, loading, error, add, update, delete, refresh }`

### 6. API Routes (`api/`)

- `api/_supabase.js` — Server Supabase client using `process.env.SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`, plus CORS helper
- One file per resource with GET/POST (index.js) and PATCH/DELETE ([id].js)
- POST endpoints should only require essential fields (e.g., `title`)
- Always validate required fields and return proper status codes

### 7. Database Schema (`supabase/schema.sql`)

- Use UUID primary keys with `gen_random_uuid()`
- Add `created_at TIMESTAMPTZ DEFAULT now()`
- Add `updated_at` with trigger where appropriate
- Create indexes on frequently filtered columns
- Include `ALTER PUBLICATION supabase_realtime ADD TABLE` for reactive tables
- Match enums to the app's domain model

### 8. UI Components

Generate a clean, minimal UI with:
- RTL support if the user's language requires it (use `dir="rtl"` on html)
- Mobile-first responsive design
- Bottom tab navigation for mobile
- Toast notifications for feedback
- Empty states with icons
- Loading skeletons or simple spinners

### 9. `.env.example`

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

### 10. `.gitignore`

```
node_modules/
dist/
.env
.env.local
.env.*.local
```

## Execution Steps

After generating all files:

1. Run `cd app && npm install` to install dependencies
2. Run `npx eslint . --fix` to ensure lint passes
3. Run `npm run build` to verify the build succeeds
4. Initialize git: `git init && git add -A && git commit -m "Initial scaffold"`
5. Report to the user what was created and next steps:
   - Create a Supabase project at supabase.com
   - Run schema.sql in the SQL Editor
   - Add env vars to Vercel
   - Deploy

## Important

- The app MUST work immediately with localStorage (no Supabase required)
- Supabase is a progressive enhancement — add it later for persistence + multi-device
- Generate COMPLETE, working code — no TODOs, no placeholders, no "implement this"
- Keep it simple. No over-engineering. No auth unless requested.
- Follow the user's description to derive the data model, views, and navigation
