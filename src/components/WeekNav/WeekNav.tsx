import { Button } from '../Button/Button';
import './WeekNav.css';

interface WeekNavProps {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function WeekNav({ label, onPrev, onNext, onToday }: WeekNavProps) {
  return (
    <nav className="week-nav">
      <div className="week-nav__arrows">
        <button className="week-nav__arrow" onClick={onPrev} aria-label="Föregående vecka" type="button">
          ←
        </button>
        <button className="week-nav__arrow" onClick={onNext} aria-label="Nästa vecka" type="button">
          →
        </button>
      </div>
      <div className="week-nav__label">{label}</div>
      <Button variant="ghost" size="sm" onClick={onToday}>Idag</Button>
    </nav>
  );
}
