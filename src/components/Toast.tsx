import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

let toastListeners: Array<(toast: ToastItem) => void> = [];

export function showToast(message: string, type: ToastType = 'info', duration = 4000) {
  const newToast: ToastItem = {
    id: Math.random().toString(36).substring(2, 9),
    message,
    type,
    duration,
  };
  toastListeners.forEach(listener => listener(newToast));
}

// Bind to window for legacy code references
if (typeof window !== 'undefined') {
  (window as any).showToast = showToast;
}

declare global {
  interface Window {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
  }
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleNewToast = (toast: ToastItem) => {
      setToasts(prev => [...prev, toast]);
      if (toast.duration !== 0) {
        setTimeout(() => {
          removeToast(toast.id);
        }, toast.duration || 4000);
      }
    };

    toastListeners.push(handleNewToast);
    return () => {
      toastListeners = toastListeners.filter(l => l !== handleNewToast);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        let icon = <Info className="text-blue-500 shrink-0" size={18} />;
        let borderClass = 'border-blue-100 bg-blue-50';
        let textClass = 'text-blue-900';

        if (toast.type === 'success') {
          icon = <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />;
          borderClass = 'border-emerald-100 bg-emerald-50';
          textClass = 'text-emerald-900';
        } else if (toast.type === 'error') {
          icon = <XCircle className="text-red-500 shrink-0" size={18} />;
          borderClass = 'border-red-100 bg-red-50';
          textClass = 'text-red-900';
        } else if (toast.type === 'warning') {
          icon = <AlertTriangle className="text-amber-500 shrink-0" size={18} />;
          borderClass = 'border-amber-100 bg-amber-50';
          textClass = 'text-amber-900';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start justify-between gap-3 p-4 border rounded-2xl shadow-lg transition-all animate-in slide-in-from-right-8 duration-200 ${borderClass}`}
          >
            <div className="flex gap-2.5">
              {icon}
              <span className={`text-xs font-normal leading-relaxed ${textClass}`}>
                {toast.message}
              </span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-neutral-400 hover:text-neutral-600 transition-colors p-0.5 rounded-lg shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
