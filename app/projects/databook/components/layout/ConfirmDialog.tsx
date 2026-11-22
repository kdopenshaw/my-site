import { useEffect, useRef } from 'react';

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="dbk-modal-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="dbk-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dbk-modal-title"
        aria-describedby="dbk-modal-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="dbk-modal-title" className="dbk-modal-title">
          {title}
        </h2>
        <p id="dbk-modal-desc" className="dbk-modal-message">
          {message}
        </p>
        <div className="dbk-modal-actions">
          <button type="button" className="dbk-btn" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="dbk-btn dbk-btn-danger"
            ref={confirmRef}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
