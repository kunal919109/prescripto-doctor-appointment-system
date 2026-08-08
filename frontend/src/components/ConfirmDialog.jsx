import React, { useEffect, useRef } from 'react';

/**
 * Reusable confirmation dialog for destructive actions.
 * Traps focus while open and restores focus to the trigger element on close.
 *
 * @param {boolean} open - Whether the dialog is visible
 * @param {string} title - Dialog title
 * @param {string} message - Dialog body message
 * @param {function} onConfirm - Called when user confirms
 * @param {function} onCancel - Called when user dismisses
 */
const ConfirmDialog = ({ open, title, message, onConfirm, onCancel }) => {
  const cancelBtnRef = useRef(null);
  const confirmBtnRef = useRef(null);
  // Remember which element had focus before the dialog opened so we can restore it
  const triggerRef = useRef(null);

  // When dialog opens: capture trigger, focus cancel button; prevent body scroll
  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement;
      document.body.style.overflow = 'hidden';
      // Defer focus slightly so the dialog is rendered first
      const id = requestAnimationFrame(() => {
        cancelBtnRef.current?.focus();
      });
      return () => cancelAnimationFrame(id);
    } else {
      document.body.style.overflow = '';
      // Restore focus to the element that opened the dialog
      if (triggerRef.current && typeof triggerRef.current.focus === 'function') {
        triggerRef.current.focus();
        triggerRef.current = null;
      }
    }
  }, [open]);

  // Keyboard trap: keep Tab / Shift+Tab within dialog, Escape closes
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onCancel();
      return;
    }
    if (e.key !== 'Tab') return;

    const focusable = [cancelBtnRef.current, confirmBtnRef.current].filter(Boolean);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full z-10"
      >
        <h3 id="confirm-dialog-title" className="text-lg font-semibold text-text-primary mb-2">
          {title}
        </h3>
        <p id="confirm-dialog-desc" className="text-sm text-text-secondary mb-6">{message}</p>

        <div className="flex gap-3 justify-end">
          <button
            ref={cancelBtnRef}
            onClick={onCancel}
            className="px-5 py-2 rounded-lg border border-border text-sm font-medium text-text-secondary hover:bg-secondary transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Keep Appointment
          </button>
          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            className="px-5 py-2 rounded-lg border border-error text-sm font-medium text-error hover:bg-red-50 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2"
          >
            Cancel Appointment
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
