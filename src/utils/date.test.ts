import { describe, it, expect } from 'vitest';
import {
  getISOWeek,
  getWeekDates,
  formatWeekLabel,
  toApiDate,
  getDayName,
  formatShortDate,
  isToday,
  isWeekend,
  getWeekDays,
} from './date';

describe('getISOWeek', () => {
  it('returns correct week number', () => {
    expect(getISOWeek(new Date(2026, 1, 16))).toBe(8); // Feb 16, 2026 = week 8
  });

  it('handles year boundary', () => {
    // Jan 1, 2026 is a Thursday, which is week 1
    expect(getISOWeek(new Date(2026, 0, 1))).toBe(1);
  });
});

describe('getWeekDates', () => {
  it('returns monday and sunday for current week (offset 0)', () => {
    const { monday, sunday } = getWeekDates(0);
    expect(monday.getDay()).toBe(1); // Monday
    expect(sunday.getDay()).toBe(0); // Sunday
  });

  it('previous week has offset -1', () => {
    const current = getWeekDates(0);
    const prev = getWeekDates(-1);
    const diff = current.monday.getTime() - prev.monday.getTime();
    expect(diff).toBe(7 * 24 * 60 * 60 * 1000);
  });
});

describe('formatWeekLabel', () => {
  it('formats same-month week', () => {
    const monday = new Date(2026, 1, 16); // Feb 16
    const label = formatWeekLabel(monday);
    expect(label).toContain('V.8');
    expect(label).toContain('16');
    expect(label).toContain('22');
    expect(label).toContain('feb');
  });

  it('formats cross-month week', () => {
    const monday = new Date(2026, 0, 26); // Jan 26
    const label = formatWeekLabel(monday);
    expect(label).toContain('jan');
    expect(label).toContain('feb');
  });
});

describe('toApiDate', () => {
  it('formats date correctly', () => {
    expect(toApiDate(new Date(2026, 1, 16))).toBe('2026-02-16T00:00:00.000');
  });

  it('pads single digit months', () => {
    expect(toApiDate(new Date(2026, 0, 5))).toBe('2026-01-05T00:00:00.000');
  });
});

describe('getDayName', () => {
  it('returns Swedish day name', () => {
    expect(getDayName(new Date(2026, 1, 16))).toBe('Mån'); // Monday
    expect(getDayName(new Date(2026, 1, 22))).toBe('Sön'); // Sunday
  });
});

describe('formatShortDate', () => {
  it('formats as day/month', () => {
    expect(formatShortDate(new Date(2026, 1, 16))).toBe('16/2');
  });
});

describe('isToday', () => {
  it('returns true for today', () => {
    expect(isToday(new Date())).toBe(true);
  });

  it('returns false for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isToday(yesterday)).toBe(false);
  });
});

describe('isWeekend', () => {
  it('returns true for Saturday', () => {
    expect(isWeekend(new Date(2026, 1, 21))).toBe(true); // Saturday
  });

  it('returns true for Sunday', () => {
    expect(isWeekend(new Date(2026, 1, 22))).toBe(true); // Sunday
  });

  it('returns false for weekday', () => {
    expect(isWeekend(new Date(2026, 1, 16))).toBe(false); // Monday
  });
});

describe('getWeekDays', () => {
  it('returns 7 days starting from Monday', () => {
    const monday = new Date(2026, 1, 16);
    const days = getWeekDays(monday);
    expect(days).toHaveLength(7);
    expect(days[0]!.getDay()).toBe(1); // Mon
    expect(days[6]!.getDay()).toBe(0); // Sun
  });
});
