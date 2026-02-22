import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '../Button/Button';
import { Textarea } from '../Input/Input';
import './CommentDialog.css';

interface CommentDialogProps {
  open: boolean;
  dayLabel: string;
  internalNote: string;
  externalNote: string;
  onSave: (internal: string, external: string) => void;
  onClose: () => void;
}

export function CommentDialog({
  open,
  dayLabel,
  internalNote: initialInternal,
  externalNote: initialExternal,
  onSave,
  onClose,
}: CommentDialogProps) {
  const [internal, setInternal] = useState(initialInternal);
  const [external, setExternal] = useState(initialExternal);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLTextAreaElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setInternal(initialInternal);
    setExternal(initialExternal);
  }, [initialInternal, initialExternal, open]);

  // Remember which element to return focus to, and auto-focus first textarea
  useEffect(() => {
    if (open) {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
      requestAnimationFrame(() => firstInputRef.current?.focus());
    }
  }, [open]);

  const handleClose = useCallback(() => {
    onClose();
    // Return focus to the element that opened the dialog
    requestAnimationFrame(() => returnFocusRef.current?.focus());
  }, [onClose]);

  const handleSave = useCallback(() => {
    onSave(internal, external);
    requestAnimationFrame(() => returnFocusRef.current?.focus());
  }, [onSave, internal, external]);

  // Keyboard: Esc = close, Ctrl+Enter = save, Tab = cycle between textareas only
  useEffect(() => {
    if (!open) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
        return;
      }

      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSave();
        return;
      }

      // Block Tab entirely — keyboard stays in dialog
      if (e.key === 'Tab') {
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, handleClose, handleSave]);

  if (!open) return null;

  return (
    <div className="dialog-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="dialog" ref={dialogRef} role="dialog" aria-label={`Kommentar för ${dayLabel}`}>
        <div className="dialog__title">Kommentar — {dayLabel}</div>
        <div className="dialog__fields">
          <Textarea
            ref={firstInputRef}
            label="Intern anteckning"
            value={internal}
            onChange={(e) => setInternal(e.target.value)}
            placeholder="Synlig bara för dig..."
            rows={3}
          />
          <Textarea
            label="Extern anteckning (syns på faktura)"
            value={external}
            onChange={(e) => setExternal(e.target.value)}
            placeholder="Syns för kund..."
            rows={3}
          />
        </div>
        <div className="dialog__actions">
          <span className="dialog__hint">Ctrl+Enter = spara, Esc = avbryt</span>
          <Button variant="ghost" onClick={handleClose} tabIndex={-1}>Avbryt</Button>
          <Button variant="primary" onClick={handleSave} tabIndex={-1}>Spara</Button>
        </div>
      </div>
    </div>
  );
}
