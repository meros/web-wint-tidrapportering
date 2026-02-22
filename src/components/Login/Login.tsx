import { Button } from '../Button/Button';
import { BankIdQr } from '../BankIdQr/BankIdQr';
import './Login.css';

export interface BankIdQrData {
  /** Full QR string: bankid.<token>.<time>.<authCode> */
  qrData: string;
  autoStartToken: string;
}

interface LoginProps {
  onLogin: () => void;
  onCancel: () => void;
  isLoggingIn: boolean;
  status: string;
  bankIdQr: BankIdQrData | null;
}

export function Login({ onLogin, onCancel, isLoggingIn, status, bankIdQr }: LoginProps) {
  return (
    <div className="login halftone-dense">
      <div className="login__card">
        <div className="login__brand">W</div>
        <h1 className="login__title">Tidrapporting</h1>
        <p className="login__subtitle">Wint.se</p>

        {!isLoggingIn && (
          <Button variant="primary" size="lg" onClick={onLogin}>
            Logga in med BankID
          </Button>
        )}

        {isLoggingIn && bankIdQr && (
          <BankIdQr
            qrData={bankIdQr.qrData}
            autoStartToken={bankIdQr.autoStartToken}
            onCancel={onCancel}
          />
        )}

        {isLoggingIn && !bankIdQr && (
          <div className="login__status">
            <span className="login__spinner" />
            {status || 'Startar BankID...'}
          </div>
        )}

        {isLoggingIn && bankIdQr && status && (
          <div className="login__status">
            <span className="login__spinner" />
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
