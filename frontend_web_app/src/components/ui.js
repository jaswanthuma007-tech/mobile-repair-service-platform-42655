import React, { useEffect, useRef } from 'react';

/**
 * PUBLIC_INTERFACE
 * Button component with variants: primary, ghost, amber.
 */
export function Button({ variant = 'primary', className = '', ...props }) {
  const cls = `btn ${variant === 'primary' ? 'btn-primary' : ''} ${variant === 'ghost' ? 'btn-ghost' : ''} ${
    variant === 'amber' ? 'btn-amber' : ''
  } ${className}`.trim();
  return <button className={cls} {...props} />;
}

/**
 * PUBLIC_INTERFACE
 * Card container.
 */
export function Card({ className = '', children }) {
  return <div className={`card ${className}`.trim()}>{children}</div>;
}

/**
 * PUBLIC_INTERFACE
 * Labeled input.
 */
export function Input({ label, id, error, help, ...props }) {
  const inputId = id || props.name;
  const helpId = help ? `${inputId}-help` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="field">
      {label ? (
        <label className="label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <input className="input" id={inputId} aria-invalid={Boolean(error)} aria-describedby={describedBy} {...props} />
      {help ? (
        <div id={helpId} className="help">
          {help}
        </div>
      ) : null}
      {error ? (
        <div id={errorId} className="error" role="alert">
          {error}
        </div>
      ) : null}
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * Labeled select.
 */
export function Select({ label, id, error, help, children, ...props }) {
  const selectId = id || props.name;
  const helpId = help ? `${selectId}-help` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="field">
      {label ? (
        <label className="label" htmlFor={selectId}>
          {label}
        </label>
      ) : null}
      <select className="select" id={selectId} aria-invalid={Boolean(error)} aria-describedby={describedBy} {...props}>
        {children}
      </select>
      {help ? (
        <div id={helpId} className="help">
          {help}
        </div>
      ) : null}
      {error ? (
        <div id={errorId} className="error" role="alert">
          {error}
        </div>
      ) : null}
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * Labeled textarea.
 */
export function Textarea({ label, id, error, help, ...props }) {
  const textareaId = id || props.name;
  const helpId = help ? `${textareaId}-help` : undefined;
  const errorId = error ? `${textareaId}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="field">
      {label ? (
        <label className="label" htmlFor={textareaId}>
          {label}
        </label>
      ) : null}
      <textarea
        className="textarea"
        id={textareaId}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...props}
      />
      {help ? (
        <div id={helpId} className="help">
          {help}
        </div>
      ) : null}
      {error ? (
        <div id={errorId} className="error" role="alert">
          {error}
        </div>
      ) : null}
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * Status badge.
 */
export function Badge({ tone = 'gray', children }) {
  const toneClass =
    tone === 'blue' ? 'badge-blue' : tone === 'amber' ? 'badge-amber' : tone === 'green' ? 'badge-green' : 'badge-gray';
  return <span className={`badge ${toneClass}`}>{children}</span>;
}

/**
 * PUBLIC_INTERFACE
 * Modal dialog with basic focus management and escape/backdrop close.
 */
export function Modal({ open, title, children, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const el = dialogRef.current;
    if (!el) return;

    const prevActive = document.activeElement;
    const focusable = el.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable) focusable.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (prevActive && prevActive.focus) prevActive.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="modal fade-in-up"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        ref={dialogRef}
      >
        <div className="modal-head">
          <h3 className="modal-title">{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close dialog">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
