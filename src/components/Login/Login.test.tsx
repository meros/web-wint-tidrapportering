import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Login } from './Login';

const defaultProps = {
  onLogin: vi.fn(),
  onCancel: vi.fn(),
  isLoggingIn: false,
  status: '',
  bankIdQr: null,
};

describe('Login', () => {
  it('renders login button', () => {
    render(<Login {...defaultProps} />);
    expect(screen.getByRole('button', { name: /logga in/i })).toBeInTheDocument();
  });

  it('shows brand name', () => {
    render(<Login {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Tidrapporting' })).toBeInTheDocument();
  });

  it('calls onLogin when button clicked', async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn();
    render(<Login {...defaultProps} onLogin={onLogin} />);
    await user.click(screen.getByRole('button', { name: /logga in/i }));
    expect(onLogin).toHaveBeenCalledOnce();
  });

  it('shows spinner when logging in without QR data', () => {
    render(
      <Login {...defaultProps} isLoggingIn={true} status="Startar BankID..." />,
    );
    expect(screen.getByText('Startar BankID...')).toBeInTheDocument();
    // Login button should be hidden during login
    expect(screen.queryByRole('button', { name: /logga in/i })).not.toBeInTheDocument();
  });

  it('shows QR instructions when bankIdQr is provided', () => {
    render(
      <Login
        {...defaultProps}
        isLoggingIn={true}
        bankIdQr={{
          qrData: 'bankid.test-token.0.abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234',
          autoStartToken: 'test-auto',
        }}
      />,
    );
    expect(screen.getByText(/Öppna BankID-appen på din telefon/)).toBeInTheDocument();
    expect(screen.getByText(/Skanna QR-koden/)).toBeInTheDocument();
  });

  it('shows "Öppna BankID på denna enhet" button during QR flow', () => {
    render(
      <Login
        {...defaultProps}
        isLoggingIn={true}
        bankIdQr={{
          qrData: 'bankid.tok.0.abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234',
          autoStartToken: 'auto',
        }}
      />,
    );
    expect(screen.getByRole('button', { name: /denna enhet/i })).toBeInTheDocument();
  });

  it('shows cancel button during QR flow', () => {
    render(
      <Login
        {...defaultProps}
        isLoggingIn={true}
        bankIdQr={{
          qrData: 'bankid.tok.0.abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234',
          autoStartToken: 'auto',
        }}
      />,
    );
    expect(screen.getByRole('button', { name: /avbryt/i })).toBeInTheDocument();
  });

  it('calls onCancel when cancel clicked during QR flow', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <Login
        {...defaultProps}
        onCancel={onCancel}
        isLoggingIn={true}
        bankIdQr={{
          qrData: 'bankid.tok.0.abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234',
          autoStartToken: 'auto',
        }}
      />,
    );
    await user.click(screen.getByRole('button', { name: /avbryt/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
