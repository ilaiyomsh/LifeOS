# LifeOS V2.5 — אפיון מוצר

## סקירה כללית

**LifeOS** היא אפליקציית ניהול משימות מבוססת עקרונות GTD (Getting Things Done), עם ממשק עברי מלא (RTL). האפליקציה מיועדת לנייד תחילה (Mobile-First) ומאפשרת ניהול מלא של משימות, פרויקטים, וסקירה שבועית.

| פרמטר | ערך |
|--------|------|
| **סטאק** | React 19 + Vite 7 + Tailwind CSS 3 |
| **אחסון** | localStorage (ראשי) / Supabase (אופציונלי) |
| **Deployment** | Vercel |
| **שפת ממשק** | עברית (RTL) |
| **מצב** | PWA-Ready (meta tags, safe areas) |
| **דומיין** | life-os-iota-seven.vercel.app |

---

## ארכיטקטורה

```
App.jsx
├── ToastProvider (הודעות)
├── Shell (layout)
│   ├── Search Bar (חיפוש גלובלי)
│   ├── Main Content Area
│   │   ├── InboxView (תיבת דואר)
│   │   ├── ActionsView (פעולות)
│   │   ├── ProjectsView (פרויקטים)
│   │   └── ReviewView (סקירה שבועית)
│   └── Bottom Navigation (4 טאבים)
└── EditTaskModal (עריכת משימה — גלובלי מחיפוש)
```

**אחסון נתונים**: Dual-mode — אם משתני סביבה של Supabase מוגדרים, עובד מול Postgres + Realtime. אחרת, הכל ב-localStorage עם in-memory cache ופרסום אירועים בין hooks.

---

## מודל נתונים

### משימה (Task)

| שדה | סוג | תיאור |
|------|------|--------|
| `id` | UUID | מזהה ייחודי |
| `title` | string | שם המשימה (חובה) |
| `notes` | string / null | הערות חופשיות |
| `status` | enum | inbox / next_action / waiting_for / someday / done / trashed |
| `priority` | enum / null | high / medium / low |
| `area` | enum / null | work (עבודה) / school (לימודים) / home (בית) |
| `project_id` | UUID / null | שיוך לפרויקט |
| `due_date` | date / null | תאריך יעד |
| `scheduled_date` | date / null | מתוכנן ליום |
| `estimated_minutes` | number / null | זמן משוער בדקות |
| `waiting_on` | string / null | ממתין למי/למה |
| `is_focus` | boolean | האם משימת מיקוד (מקס 3) |
| `tags` | string[] | תגיות חופשיות |
| `recurring_rule` | object / null | `{ frequency: daily/weekly/monthly }` |
| `position` | number | סדר מיון |
| `created_at` | timestamp | תאריך יצירה |
| `updated_at` | timestamp | תאריך עדכון אחרון |
| `completed_at` | timestamp / null | תאריך השלמה |

### משימת משנה (Subtask)

| שדה | סוג | תיאור |
|------|------|--------|
| `id` | UUID | מזהה |
| `task_id` | UUID | שיוך למשימה-אב |
| `title` | string | שם |
| `is_done` | boolean | הושלם? |
| `position` | number | סדר |

### פרויקט (Project)

| שדה | סוג | תיאור |
|------|------|--------|
| `id` | UUID | מזהה |
| `title` | string | שם |
| `area` | enum | תחום (חובה) |
| `description` | string / null | תיאור |
| `is_active` | boolean | פעיל? |
| `created_at` | timestamp | נוצר |
| `completed_at` | timestamp / null | הושלם |

### אירוע (Event) — קיים במודל, עדיין לא בממשק

| שדה | סוג | תיאור |
|------|------|--------|
| `id` | UUID | מזהה |
| `title` | string | שם |
| `start_at` / `end_at` | timestamp | זמנים |
| `is_all_day` | boolean | יום שלם? |

---

## מסכים ופיצ'רים

### 1. חיפוש גלובלי

שדה חיפוש קבוע בראש האפליקציה. בלחיצה נפתח מודל חיפוש:

- **חיפוש מיידי** — מינימום 2 תווים
- **חיפוש בתוך**: כותרת, הערות, שדה "ממתין ל..."
- **תוצאות מקובצות** לפי סטטוס (תיבת דואר, פעולה הבאה, ממתין, יום אחד, הושלם)
- **הדגשת טקסט תואם** (צהוב)
- **לחיצה על תוצאה** → פתיחת עורך המשימה
- **סגירה** ב-Escape או לחיצה על הרקע

### 2. תיבת דואר (Inbox)

מסך ראשי לתיעוד ועיבוד משימות חדשות. שני מצבים:

#### מצב תיעוד (Capture)
- שדה הוספה מהירה (Enter לשליחה)
- רשימת כל הפריטים בתיבה
- מחיקה עם אפשרות ביטול (Toast)

#### מצב עיבוד (Clarify) — עץ החלטות GTD
תהליך מונחה בן 3 שלבים לכל פריט:

```
שלב 1: "האם זה ניתן לפעולה?"
├── כן → שלב 2
└── לא → "יום אחד/אולי" | "מחיקה"

שלב 2: "זה לוקח פחות מ-2 דקות?"
├── כן → סימון כפעולה + "עשה את זה עכשיו!" (2 דק׳)
└── לא → שלב 3

שלב 3: "מה הצעד הבא?"
├── פעולה הבאה
├── ממתין ל...
└── יום אחד
```

- חיצי ניווט בין פריטים
- בחירת תחום מהירה (עבודה/לימודים/בית)
- כפתור "עריכה מפורטת" → פתיחת עורך מלא

### 3. פעולות (Actions)

מסך מרכזי לניהול משימות פעילות.

#### בר קיבולת יומית
- **פס ויזואלי** המציג עומס מול מקסימום (5 שעות ברירת מחדל)
- **צבעים**: ירוק (<60%), כתום (60-90%), אדום (>90%)
- **תצוגה**: "X שעות / 5 שעות"

#### התראות
- **עומס יתר** (אדום): מופיע כשהקיבולת > 100%
- **אינפלציית עדיפויות** (כתום): מופיע כשיותר מ-50% מהמשימות בעדיפות גבוהה

#### רשימות חכמות (Smart Lists)
כפתורי סינון מהיר (מופיעים רק כשיש נתונים):
- **היום** — משימות מתוזמנות/עם יעד להיום
- **בקרוב** — יעד בשבוע הקרוב
- **באיחור** — עברו את תאריך היעד (אדום)

#### סינון לפי תחום
כפתורי "הכל" / "עבודה" / "לימודים" / "בית"

#### חלוקת משימות
1. **מיקוד** (Focus) — מקסימום 3 משימות מסומנות, עם אייקון כוכב
2. **אם יש זמן** — שאר הפעולות, מקובצות לפי תחום
3. **ממתין ל...** — משימות בהמתנה עם פירוט למי ממתינים

#### יכולות בכל משימה
- סימון כהושלם (עם undo ב-Toast)
- מחיקה (עם undo)
- עריכה → מודל מלא
- תג "ישן" (כתום) אם המשימה חורגת מסף הזמן

### 4. פרויקטים (Projects)

ניהול פרויקטים מקובצים לפי תחום.

- **יצירת פרויקט חדש**: שם + בחירת תחום
- **תצוגה**: פרויקטים מקובצים לפי תחום (עבודה/לימודים/בית)
- **כל פרויקט**:
  - מתקפל/נפתח לצפייה במשימות שבתוכו
  - אזהרה אם אין פעולה הבאה (אייקון כתום)
  - הוספת משימה מהירה בתוך הפרויקט
  - סיום פרויקט (ארכוב)

### 5. סקירה שבועית (Review)

תהליך סקירה מונחה בן 6 צעדים:

| # | שלב | תיאור |
|---|------|--------|
| 1 | עבד את תיבת הדואר | צפה בפריטים שלא עובדו |
| 2 | סקור פרויקטים | ודא שלכל פרויקט יש פעולה הבאה |
| 3 | בדוק ממתינים | עקוב אחרי דברים שממתינים |
| 4 | סקור יום אחד/אולי | הפעל או מחק פריטים ישנים |
| 5 | תכנן את השבוע | הקצה משימות ל-7 הימים הבאים |
| 6 | מדדים ורפלקציה | סטטיסטיקות + Start/Stop/Continue |

#### מדדים שבועיים (שלב 6)
4 כרטיסי סטטיסטיקה:
- משימות שהושלמו השבוע
- דקות עבודה
- משימות ישנות (stale)
- גודל תיבת הדואר

#### רפלקציה (Start/Stop/Continue)
3 שדות טקסט חופשי שנשמרים אוטומטית ל-localStorage:
- **להתחיל** — מה להתחיל לעשות?
- **להפסיק** — מה לא עובד?
- **להמשיך** — מה עובד טוב?

### 6. עורך משימה (EditTaskModal)

מודל עריכה מלא הנפתח מכל מסך. שדות:

- **כותרת** (חובה)
- **הערות** (טקסט חופשי)
- **משימות משנה** — הוספה, סימון V, מחיקה
- **תחום** — עבודה / לימודים / בית
- **עדיפות** — גבוהה / בינונית / נמוכה
- **משימת מיקוד** — כוכב (רק אם סטטוס = פעולה הבאה)
- **תגיות** — הוספה/הסרה של תוויות חופשיות
- **חזרה** — ללא / יומי / שבועי / חודשי
- **פרויקט** — בחירה מרשימה (מסוננת לפי תחום)
- **סטטוס** — תיבת דואר / פעולה הבאה / ממתין / יום אחד
- **ממתין למי/למה** (מותנה)
- **תאריך יעד** + **מתוכנן ליום**
- **זמן משוער** (דקות)

---

## לוגיקה מרכזית

### סף "משימה ישנה" (Staleness)
| סטטוס | סף |
|--------|-----|
| תיבת דואר | יום אחד |
| פעולה הבאה | 3 ימים |
| ממתין ל... | 14 ימים |
| יום אחד/אולי | 30 ימים |

### משימות חוזרות
כשמשלימים משימה חוזרת, נוצר אוטומטית מופע חדש:
- **יומי** → +1 יום
- **שבועי** → +7 ימים
- **חודשי** → +1 חודש
המופע החדש מקבל `scheduled_date` מחושב ונשמר כ-`next_action`.

### משימות מיקוד
- מקסימום 3 משימות מסומנות כ-`is_focus`
- הקיבולת מחושבת רק מהן
- מוצגות בסקשן נפרד בראש מסך הפעולות

### אינפלציית עדיפויות
אזהרה מופיעה כשיותר מ-50% מכל המשימות הפעילות מסומנות כעדיפות גבוהה.

---

## מאפיינים טכניים

### ביצועים
- **In-memory cache** ב-localStorage — אין JSON.parse בכל קריאה
- **React.memo** על TaskItem — מונע רנדורים מיותרים
- **useCallback** על כל ה-handlers שעוברים כ-props
- **Dependency arrays** תקינים בכל ה-hooks

### נגישות
- `role="tablist"` + `aria-selected` בניווט
- `aria-label` על כל כפתור
- RTL מלא (`dir="rtl"` על HTML)

### Mobile / PWA
- `viewport-fit=cover` + Safe Area padding
- `apple-mobile-web-app-capable` + `black-translucent` status bar
- No zoom (`maximum-scale=1`)
- `active:` states על כל כפתור (במקום `hover:`)
- Touch targets >= 28px

### Supabase (אופציונלי)
אם מוגדרים `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`:
- Postgres backend עם Realtime subscriptions
- Schema ב-`supabase/schema.sql`
- כל ה-hooks עוברים אוטומטית ל-Supabase

---

## תלויות

| חבילה | גרסה | שימוש |
|--------|-------|--------|
| react | 19.2.0 | UI Framework |
| react-dom | 19.2.0 | DOM rendering |
| lucide-react | 0.561.0 | אייקונים |
| clsx | 2.1.1 | CSS class merging |
| tailwind-merge | 3.4.0 | Tailwind dedup |
| @supabase/supabase-js | 2.95.3 | DB (אופציונלי) |
| tailwindcss | 3.4.17 | CSS framework |
| vite | 7.2.4 | Build tool |

---

## מבנה קבצים

```
LifeOS/
├── api/                        # Vercel Serverless (planned)
├── supabase/
│   └── schema.sql              # DB schema
├── app/
│   ├── index.html              # SPA entry
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx            # Entry point
│       ├── App.jsx             # Root component
│       ├── index.css           # Global styles + safe areas
│       ├── components/
│       │   ├── layout/
│       │   │   └── Shell.jsx   # Layout + nav + search
│       │   └── ui/
│       │       ├── Badge.jsx
│       │       ├── TaskInput.jsx
│       │       ├── TaskItem.jsx     # React.memo wrapped
│       │       ├── EditTaskModal.jsx
│       │       ├── SearchModal.jsx
│       │       ├── Toast.jsx
│       │       └── EmptyState.jsx
│       ├── features/
│       │   ├── inbox/
│       │   │   └── InboxView.jsx    # GTD decision tree
│       │   ├── actions/
│       │   │   └── ActionsView.jsx  # Focus + capacity + smart lists
│       │   ├── projects/
│       │   │   └── ProjectsView.jsx
│       │   └── review/
│       │       └── ReviewView.jsx   # 6 steps + metrics
│       ├── hooks/
│       │   ├── useTasks.js     # CRUD + recurring
│       │   ├── useProjects.js
│       │   ├── useEvents.js
│       │   └── useToast.js
│       └── lib/
│           ├── constants.js    # Areas, status, GTD config
│           ├── utils.js        # Dates, staleness, capacity
│           ├── localDb.js      # localStorage DB + cache
│           ├── supabase.js     # Optional client
│           └── ToastContext.js
└── vercel.json
```

---

## סיכום יכולות

| קטגוריה | מה יש |
|----------|--------|
| **ניהול משימות** | CRUD מלא, עדיפויות, תחומים, פרויקטים, תאריכי יעד |
| **GTD** | עץ החלטות, כלל 2 דקות, תיבת דואר → פעולה |
| **משימות משנה** | צ׳קליסט עם סימון, הוספה, מחיקה |
| **משימות חוזרות** | יומי/שבועי/חודשי, יצירה אוטומטית |
| **תגיות** | תוויות חופשיות, תצוגת chips |
| **מיקוד** | מקס 3 משימות, בר קיבולת, התראות עומס |
| **חיפוש** | גלובלי, הדגשת תוצאות, מקובץ לפי סטטוס |
| **סינון חכם** | היום / בקרוב / באיחור |
| **סקירה שבועית** | 6 צעדים + מדדים + Start/Stop/Continue |
| **זיהוי בעיות** | משימות ישנות, אינפלציית עדיפויות, פרויקטים ללא פעולה |
| **Mobile** | Safe areas, touch targets, active states, PWA meta |
