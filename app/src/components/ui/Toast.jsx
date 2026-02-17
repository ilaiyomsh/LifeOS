import { useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ToastContext } from '../../lib/ToastContext';

export { ToastContext };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, { action, duration = 4000 } = {}) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, action }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed inset-x-0 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none" style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto bg-slate-800 dark:bg-gray-700 text-white px-4 py-3 rounded-xl shadow-lg',
              'flex items-center gap-3 max-w-sm w-full animate-slide-up text-sm'
            )}
            role="status"
            aria-live="polite"
          >
            <span className="flex-1">{toast.message}</span>
            {toast.action && (
              <button
                onClick={() => { toast.action.onClick(); removeToast(toast.id); }}
                className="font-semibold text-blue-300 hover:text-blue-200 shrink-0"
              >
                {toast.action.label}
              </button>
            )}
            <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-white shrink-0" aria-label="סגור">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
