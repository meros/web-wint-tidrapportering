import { useCallback } from 'react';
import './HourCell.css';

interface HourCellProps {
  value: number | null;
  locked?: boolean;
  dirty?: boolean;
  today?: boolean;
  weekend?: boolean;
  hasComment?: boolean;
  /** Compact mode for mobile — no hover corner button */
  compact?: boolean;
  onChange: (value: number | null) => void;
  onCommentClick?: () => void;
}

export function HourCell({
  value,
  locked = false,
  dirty = false,
  today = false,
  weekend = false,
  hasComment = false,
  compact = false,
  onChange,
  onCommentClick,
}: HourCellProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (raw === '') {
        onChange(null);
        return;
      }
      const num = parseFloat(raw);
      if (!isNaN(num) && num >= 0 && num <= 24) {
        onChange(num);
      }
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'c' || e.key === 'C') {
        if (onCommentClick) {
          e.preventDefault();
          onCommentClick();
        }
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const target = e.currentTarget;
        const cells = Array.from(
          target.closest('.week-grid')?.querySelectorAll<HTMLInputElement>('.hour-cell__input') ?? [],
        );
        const idx = cells.indexOf(target);
        const next = e.key === 'ArrowRight' ? cells[idx + 1] : cells[idx - 1];
        if (next) {
          e.preventDefault();
          next.focus();
          next.select();
        }
      }
    },
    [onCommentClick],
  );

  const classes = [
    'hour-cell__input',
    dirty && 'hour-cell__input--dirty',
    locked && 'hour-cell__input--locked',
    today && 'hour-cell__input--today',
    weekend && 'hour-cell__input--weekend',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`hour-cell ${compact ? 'hour-cell--compact' : ''} ${hasComment ? 'hour-cell--has-comment' : ''}`}>
      <input
        type="number"
        className={classes}
        value={value ?? ''}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={(e) => e.target.select()}
        disabled={locked}
        min={0}
        max={24}
        step={0.5}
        inputMode="decimal"
      />
      {onCommentClick && !compact && (
        <button
          className="hour-cell__corner-btn"
          onClick={onCommentClick}
          title={hasComment ? 'Redigera notering' : 'Lägg till notering'}
          aria-label={hasComment ? 'Redigera notering' : 'Lägg till notering'}
          type="button"
          tabIndex={-1}
        />
      )}
    </div>
  );
}
