import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { HourCell } from './HourCell';

describe('HourCell', () => {
  it('renders empty when value is null', () => {
    render(<HourCell value={null} onChange={() => {}} />);
    expect(screen.getByRole('spinbutton')).toHaveValue(null);
  });

  it('renders with numeric value', () => {
    render(<HourCell value={8} onChange={() => {}} />);
    expect(screen.getByRole('spinbutton')).toHaveValue(8);
  });

  it('calls onChange when value is entered', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<HourCell value={null} onChange={onChange} />);
    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '7.5');
    expect(onChange).toHaveBeenCalled();
  });

  it('is disabled when locked', () => {
    render(<HourCell value={8} locked onChange={() => {}} />);
    expect(screen.getByRole('spinbutton')).toBeDisabled();
  });

  it('shows corner button when onCommentClick provided', () => {
    const { container } = render(<HourCell value={8} onChange={() => {}} onCommentClick={() => {}} />);
    expect(container.querySelector('.hour-cell__corner-btn')).toBeInTheDocument();
  });

  it('applies has-comment class when hasComment', () => {
    const { container } = render(<HourCell value={8} onChange={() => {}} onCommentClick={() => {}} hasComment />);
    expect(container.querySelector('.hour-cell--has-comment')).toBeInTheDocument();
  });

  it('calls onCommentClick when corner button clicked', async () => {
    const user = userEvent.setup();
    const onComment = vi.fn();
    const { container } = render(<HourCell value={8} onChange={() => {}} onCommentClick={onComment} />);
    const btn = container.querySelector('.hour-cell__corner-btn')!;
    await user.click(btn);
    expect(onComment).toHaveBeenCalledOnce();
  });

  it('applies dirty class when dirty', () => {
    render(<HourCell value={8} dirty onChange={() => {}} />);
    expect(screen.getByRole('spinbutton')).toHaveClass('hour-cell__input--dirty');
  });

  it('applies today class when today', () => {
    render(<HourCell value={8} today onChange={() => {}} />);
    expect(screen.getByRole('spinbutton')).toHaveClass('hour-cell__input--today');
  });

  it('does not render corner button in compact mode', () => {
    const { container } = render(<HourCell value={8} onChange={() => {}} onCommentClick={() => {}} compact />);
    expect(container.querySelector('.hour-cell__corner-btn')).not.toBeInTheDocument();
  });
});
