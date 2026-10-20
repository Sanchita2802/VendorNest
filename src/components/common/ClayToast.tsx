import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  undoAction?: () => void;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5);
    const newToast: ToastMessage = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    const duration = toast.duration || (toast.undoAction ? 6000 : 4000);
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Toast container */}
      <div
        aria-live="polite"
        className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => {
          let bgClass = 'bg-[var(--surface-elevated)] border-l-4';
          let icon = <Info className="w-5 h-5 text-blue-500 shrink-0" />;

          if (t.type === 'success') {
            bgClass += ' border-emerald-500';
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
          } else if (t.type === 'error') {
            bgClass += ' border-rose-500';
            icon = <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />;
          } else if (t.type === 'warning') {
            bgClass += ' border-amber-500';
            icon = <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
          } else {
            bgClass += ' border-[var(--accent-primary)]';
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto p-4 rounded-2xl shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-0 scale-100 flex items-start justify-between gap-3 ${bgClass}`}
              style={{
                boxShadow:
                  '0 12px 28px rgba(0,0,0,0.12), inset 1px 1px 2px rgba(255,255,255,0.8), inset -1px -1px 3px rgba(0,0,0,0.06)',
              }}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {icon}
                <div className="flex-1 min-w-0">
                  <h4 className="font-heading font-semibold text-sm text-[var(--text-primary)] leading-tight">
                    {t.title}
                  </h4>
                  {t.message && (
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed break-words">
                      {t.message}
                    </p>
                  )}
                  {t.undoAction && (
                    <button
                      onClick={() => {
                        t.undoAction!();
                        removeToast(t.id);
                      }}
                      className="mt-2 text-xs font-bold text-[var(--accent-primary)] hover:underline flex items-center gap-1"
                    >
                      Undo action
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-full transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
