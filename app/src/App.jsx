import { useState } from 'react';
import Shell from './components/layout/Shell';
import InboxView from './features/inbox/InboxView';
import ActionsView from './features/actions/ActionsView';
import ProjectsView from './features/projects/ProjectsView';
import ReviewView from './features/review/ReviewView';
import { ToastProvider } from './components/ui/Toast';
import { isSupabaseConfigured } from './lib/supabase';

function SetupScreen() {
  return (
    <div className="min-h-dvh bg-slate-50 flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl text-white font-bold">L</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">LifeOS</h1>
        <p className="text-sm text-slate-500 mb-8">
          צריך לחבר מסד נתונים כדי להתחיל
        </p>

        <div className="bg-white rounded-xl border border-slate-200 p-5 text-right space-y-4">
          <h2 className="text-sm font-semibold text-slate-800">הגדרת Supabase</h2>

          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">1</span>
              <p>צור פרויקט חדש ב-<span className="font-medium text-slate-800">supabase.com</span></p>
            </div>
            <div className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">2</span>
              <p>הרץ את <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">supabase/schema.sql</code> ב-SQL Editor</p>
            </div>
            <div className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">3</span>
              <p>הוסף Environment Variables ב-Vercel:</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 text-left text-xs font-mono text-slate-600 space-y-1">
            <p>VITE_SUPABASE_URL</p>
            <p>VITE_SUPABASE_ANON_KEY</p>
            <p>SUPABASE_URL</p>
            <p>SUPABASE_SERVICE_ROLE_KEY</p>
          </div>

          <div className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">4</span>
            <p className="text-sm text-slate-600">בצע Redeploy ב-Vercel</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('inbox');

  if (!isSupabaseConfigured) {
    return <SetupScreen />;
  }

  const renderView = () => {
    switch (activeTab) {
      case 'inbox':
        return <InboxView />;
      case 'actions':
        return <ActionsView />;
      case 'projects':
        return <ProjectsView />;
      case 'review':
        return <ReviewView />;
      default:
        return <InboxView />;
    }
  };

  return (
    <ToastProvider>
      <Shell activeTab={activeTab} onTabChange={setActiveTab}>
        {renderView()}
      </Shell>
    </ToastProvider>
  );
}
