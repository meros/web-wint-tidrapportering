import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { WeekNav } from './WeekNav';

describe('WeekNav', () => {
  it('renders week label', () => {
    render(
      <WeekNav
        label="V.8 · 17–23 feb 2026"
        onPrev={() => {}}
        onNext={() => {}}
        onToday={() => {}}
      />,
    );
    expect(screen.getByText('V.8 · 17–23 feb 2026')).toBeInTheDocument();
  });

  it('calls onPrev when left arrow clicked', async () => {
    const user = userEvent.setup();
    const onPrev = vi.fn();
    render(
      <WeekNav label="V.8" onPrev={onPrev} onNext={() => {}} onToday={() => {}} />,
    );
    await user.click(screen.getByLabelText('Föregående vecka'));
    expect(onPrev).toHaveBeenCalledOnce();
  });

  it('calls onNext when right arrow clicked', async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    render(
      <WeekNav label="V.8" onPrev={() => {}} onNext={onNext} onToday={() => {}} />,
    );
    await user.click(screen.getByLabelText('Nästa vecka'));
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('calls onToday when Idag clicked', async () => {
    const user = userEvent.setup();
    const onToday = vi.fn();
    render(
      <WeekNav label="V.8" onPrev={() => {}} onNext={() => {}} onToday={onToday} />,
    );
    await user.click(screen.getByText('Idag'));
    expect(onToday).toHaveBeenCalledOnce();
  });
});
