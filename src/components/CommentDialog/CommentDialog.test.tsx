import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CommentDialog } from './CommentDialog';

describe('CommentDialog', () => {
  const defaultProps = {
    open: true,
    dayLabel: 'Mån 17/2',
    internalNote: '',
    externalNote: '',
    onSave: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders nothing when closed', () => {
    render(<CommentDialog {...defaultProps} open={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders dialog with day label when open', () => {
    render(<CommentDialog {...defaultProps} />);
    expect(screen.getByText('Kommentar — Mån 17/2')).toBeInTheDocument();
  });

  it('shows existing notes', () => {
    render(
      <CommentDialog
        {...defaultProps}
        internalNote="Intern text"
        externalNote="Extern text"
      />,
    );
    expect(screen.getByDisplayValue('Intern text')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Extern text')).toBeInTheDocument();
  });

  it('calls onSave with updated notes', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<CommentDialog {...defaultProps} onSave={onSave} />);

    const textareas = screen.getAllByRole('textbox');
    await user.type(textareas[0]!, 'Ny intern');
    await user.type(textareas[1]!, 'Ny extern');
    await user.click(screen.getByText('Spara'));

    expect(onSave).toHaveBeenCalledWith('Ny intern', 'Ny extern');
  });

  it('calls onClose when Avbryt clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<CommentDialog {...defaultProps} onClose={onClose} />);
    await user.click(screen.getByText('Avbryt'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose on Escape key', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<CommentDialog {...defaultProps} onClose={onClose} />);
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when clicking overlay', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<CommentDialog {...defaultProps} onClose={onClose} />);
    // Click the overlay (the outer div)
    const overlay = document.querySelector('.dialog-overlay');
    if (overlay) {
      await user.click(overlay as Element);
      expect(onClose).toHaveBeenCalled();
    }
  });
});
