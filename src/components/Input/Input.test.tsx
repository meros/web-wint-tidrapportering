import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Input, Textarea } from './Input';

describe('Input', () => {
  it('renders with placeholder', () => {
    render(<Input placeholder="Ange text..." />);
    expect(screen.getByPlaceholderText('Ange text...')).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Input label="E-post" />);
    expect(screen.getByText('E-post')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<Input error="Obligatoriskt fält" />);
    expect(screen.getByText('Obligatoriskt fält')).toBeInTheDocument();
  });

  it('calls onChange with typed value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input onChange={onChange} />);
    await user.type(screen.getByRole('textbox'), 'hello');
    expect(onChange).toHaveBeenCalled();
  });
});

describe('Textarea', () => {
  it('renders with label', () => {
    render(<Textarea label="Kommentar" />);
    expect(screen.getByText('Kommentar')).toBeInTheDocument();
  });
});
