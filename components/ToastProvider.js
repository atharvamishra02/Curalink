'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(({ title, description, type = 'info', duration = 4000 }) => {
    const id = Math.random().toString(36).slice(2);
    const toast = { id, title, description, type };
    setToasts((prev) => [toast, ...prev].slice(0, 5));
    if (duration > 0) {
      setTimeout(() => remove(id), duration);
    }
    return id;
  }, [remove]);

  const api = useMemo(() => ({
    show: push,
    success: (opts) => push({ type: 'success', ...opts }),
    error: (opts) => push({ type: 'error', ...opts }),
    info: (opts) => push({ type: 'info', ...opts }),
    remove,
  }), [push, remove]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Toasts Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col items-end gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`w-80 rounded-xl shadow-lg border p-3 pr-10 relative overflow-hidden transition-all bg-white
              ${t.type === 'success' ? 'border-green-200' : ''}
              ${t.type === 'error' ? 'border-red-200' : ''}
              ${t.type === 'info' ? 'border-blue-200' : ''}
            `}
          >
            <div className="flex items-start gap-2">
              <div className={`w-2 rounded-full mt-0.5 h-6
                ${t.type === 'success' ? 'bg-green-500' : ''}
                ${t.type === 'error' ? 'bg-red-500' : ''}
                ${t.type === 'info' ? 'bg-blue-500' : ''}
              `} />
              <div className="flex-1">
                {t.title && <p className="font-semibold text-gray-900 text-sm">{t.title}</p>}
                {t.description && <p className="text-xs text-gray-600 mt-0.5">{t.description}</p>}
              </div>
            </div>
            <button
              onClick={() => remove(t.id)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
