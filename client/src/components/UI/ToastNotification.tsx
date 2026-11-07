/**
 * @file ToastNotification.tsx
 * @description Floating alerts for edge cases: missing lyrics, session refresh, fallback modes.
 */

import React from 'react';
import { useStore } from '../../store/useStore';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export const ToastNotification: React.FC = () => {
  const toasts = useStore((state) => state.toasts);
  const removeToast = useStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        let borderClass = 'border-sky-500/30';
        let bgClass = 'bg-slate-900/90 text-sky-200';
        let IconComponent = Info;

        if (toast.type === 'warning') {
          borderClass = 'border-amber-500/40';
          bgClass = 'bg-amber-950/80 text-amber-200';
          IconComponent = AlertTriangle;
        } else if (toast.type === 'error') {
          borderClass = 'border-rose-500/40';
          bgClass = 'bg-rose-950/80 text-rose-200';
          IconComponent = AlertCircle;
        } else if (toast.type === 'success') {
          borderClass = 'border-emerald-500/40';
          bgClass = 'bg-emerald-950/80 text-emerald-200';
          IconComponent = CheckCircle2;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-xl border backdrop-blur-xl shadow-2xl flex items-start gap-3 transition-all animate-in slide-in-from-right-4 duration-300 ${borderClass} ${bgClass}`}
          >
            <IconComponent className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              {toast.title && (
                <div className="font-bold mb-0.5 text-white">{toast.title}</div>
              )}
              <div className="opacity-90">{toast.message}</div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-md hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastNotification;

