import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

function makeId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/**
 * PUBLIC_INTERFACE
 * Hook to access toast helpers.
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

/**
 * PUBLIC_INTERFACE
 * Provider that manages toast stack and exposes helper methods.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    ({ title, message, variant = 'default', durationMs = 3500 }) => {
      const id = makeId();
      setToasts((prev) => [...prev, { id, title, message, variant }]);

      const timer = window.setTimeout(() => remove(id), durationMs);
      timers.current.set(id, timer);
      return id;
    },
    [remove]
  );

  const api = useMemo(
    () => ({
      push,
      remove,
      success: (title, message) => push({ title, message, variant: 'success' }),
      error: (title, message) => push({ title, message, variant: 'error' })
    }),
    [push, remove]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toasts" role="region" aria-label="Notifications">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast ${t.variant === 'error' ? 'toast-error' : ''} ${
              t.variant === 'success' ? 'toast-success' : ''
            } fade-in-up`}
            role="status"
            aria-live="polite"
          >
            <p className="toast-title">{t.title}</p>
            {t.message ? <p className="toast-msg">{t.message}</p> : null}
            <div className="row">
              <button className="btn btn-ghost" onClick={() => remove(t.id)} aria-label="Dismiss notification">
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
