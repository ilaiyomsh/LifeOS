# LifeOS V2.5 - מדריך למפתחים (Developer Guide) 🛠️

ברוכים הבאים ל-LifeOS! מסמך זה נועד לספק הבנה מעמיקה של ארכיטקטורת הפרויקט, הטכנולוגיות והלוגיקה העסקית עבור מפתחים חדשים המצטרפים לצוות.

---

## 📚 סקירה טכנית (Tech Stack)

*   **Framework:** React 18 (Vite)
*   **Language:** JavaScript (ES6+)
*   **Styling:** Tailwind CSS (Utility-first) + `clsx` & `tailwind-merge` לניהול מחלקות דינמיות.
*   **State Management:** React Context API (`TaskContext`, `GameContext`).
*   **Persistence:** LocalStorage (שמירת נתונים בצד לקוח).
*   **AI:** Google Generative AI SDK (`@google/generative-ai`) - מודל `gemini-1.5-flash`.
*   **Icons:** `lucide-react`.

---

## 🏗️ ארכיטקטורת המערכת (Architecture)

המערכת בנויה ארכיטקטורת שכבות פשוטה (Layered Architecture) המתאימה ל-SPA:

```mermaid
graph TD
    classDef ui fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef logic fill:#fff9c4,stroke:#fbc02d,stroke-width:2px;
    classDef data fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    classDef ext fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;

    subgraph UI_Layer [שכבת התצוגה - UI]
        App[App.jsx]:::ui
        Shell[Shell.jsx (Layout)]:::ui
        Plan[PlanningFeature.jsx]:::ui
        Sched[ScheduleFeature.jsx]:::ui
    end

    subgraph Logic_Layer [שכבת הלוגיקה - Context & Hooks]
        TaskCtx[TaskContext Provider]:::logic
        GameCtx[GameContext Provider]:::logic
        Hooks[Custom Hooks (useTasks, useGame)]:::logic
    end

    subgraph Service_Layer [שכבת השירותים]
        AIService[ai.js]:::ext
        Utils[utils.js]:::ext
    end

    subgraph Storage_Layer [שכבת הנתונים]
        LS[(LocalStorage)]:::data
        Gemini[Google Gemini Cloud]:::data
    end

    %% Connections
    App --> Shell
    Shell --> Plan & Sched
    Plan --> Hooks
    Sched --> Hooks
    
    Hooks --> TaskCtx & GameCtx
    
    TaskCtx --> LS
    GameCtx --> LS
    
    Plan --> AIService
    AIService --> Gemini
    
    TaskCtx -.->|Triggers XP| GameCtx
```

---

## 🧩 רכיבי מפתח והסבר מעמיק

### 1. ניהול משימות (`TaskContext.jsx`)
זהו הלב של האפליקציה. הוא מנהל את מערך המשימות (`tasks`) ומספק פונקציות CRUD.
*   **Persistence:** שימוש ב-`useEffect` כדי לשמור את המערך ל-`localStorage` בכל שינוי.
*   **Timer:** מנהל `activeTaskId` ו-`setInterval` שרץ ברקע ומעדכן `elapsedTime` למשימה הפעילה.
*   **Snooze:** לוגיקה לדחיית משימות ליום למחרת.

### 2. משחוק (`GameContext.jsx`)
אחראי על חווית ה-Gamification.
*   **State:** משתנים `xp` (נקודות) ו-`level` (רמה נוכחית).
*   **נוסחת עליית רמה:** הרמות מחושבות לוגריתמית/אקספוננציאלית (לדוגמה `level * 1000`).
*   **אינטגרציה:** כאשר משימה מסומנת כ"הושלמה" ב-`TaskContext`, הוא קורא לפונקציה `addXp` ב-`GameContext`.

### 3. מנוע הבינה המלאכותית (`ai.js`)
סרוויס עצמאי שמבצע קריאות ל-Google Gemini.
*   **`analyzeTaskWithAI`:** מקבל טקסט משימה, בונה Prompt שמבקש JSON עם שדות `importance`, `urgency`, `duration`, ושולח למודל.
*   **Error Handling:** מטפל ספציפית בשגיאות `429` (Rate Limit) כדי להציג הודעה ידידותית למשתמש.

### 4. מטריצת התכנון (`PlanningFeature.jsx`)
רכיב מורכב המציג מפה ויזואלית (Heatmap).
*   **מיקום דינמי:** המשימות ממוקמות על המסך באמצעות `calc` ו-CSS Variables (`bottom %`, `left %`) בהתבסס על ציוני החשיבות והדחיפות שלהן.
*   **Quick Add UI:** חלונית הוספה חכמה עם תמיכה ב-RTL, המשתמשת ב-Media Queries למיקום רספונסיבי ("Smart Flip" למניעת חיתוך בתחתית המסך).

---

## 💡 הנחיות לפיתוח UI (Design System)

אנו משתמשים בעקרונות עיצוב "Clean & Gamified":
*   **צבעים:** לכל קטגוריה ("דומיין") יש צבע ייחודי המוגדר ב-`constants.js`. יש להשתמש בערכים אלו (`bg-blue-500`, `text-rose-600` וכו').
*   **אנימציות:** שימוש ב-`tailwindcss-animate` ומחלקות `animate-in`, `slide-in` לתחושה חלקה.
*   **Glassmorphism:** שימוש ב-`bg-white/50 backdrop-blur` ליצירת עומק.

## ⚠️ נקודות תורפה ידועות (Known Issues)

1.  **Race Conditions:** שמירה מהירה מדי ל-LocalStorage עלולה לעיתים רחוקות לאבד מידע אם הטאב נסגר מיידית.
2.  **API Keys:** המפתח שמור כרגע בקוד צד-לקוח (`constants.js`). בפרודקשן יש להעביר זאת ל-Backend Proxy או Environment Variable.
3.  **Mobile View:** המטריצה דחוסה במסכים צרים מאוד; נדרשת אופטימיזציה נוספת למובייל.

---
נכתב ע"י הצוות המוביל של LifeOS. בהצלחה! 🚀
