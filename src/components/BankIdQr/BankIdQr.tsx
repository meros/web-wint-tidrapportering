import { useEffect, useRef, useState, useCallback } from 'react';
import QRCode from 'qrcode';
import { buildAutoStartUrl } from '../../utils/bankid-qr';
import { Button } from '../Button/Button';
import './BankIdQr.css';

interface BankIdQrProps {
  /** The full QR data string (bankid.<token>.<time>.<authCode>), updated by parent on each poll */
  qrData: string;
  autoStartToken: string;
  onCancel: () => void;
}

export function BankIdQr({ qrData, autoStartToken, onCancel }: BankIdQrProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrError, setQrError] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !qrData) return;
    QRCode.toCanvas(canvasRef.current, qrData, {
      width: 200,
      margin: 1,
      color: { dark: '#1A1A2E', light: '#FFFFFF' },
      errorCorrectionLevel: 'L',
    }).catch(() => setQrError(true));
  }, [qrData]);

  const openOnThisDevice = useCallback(() => {
    window.location.href = buildAutoStartUrl(autoStartToken);
  }, [autoStartToken]);

  return (
    <div className="bankid-qr">
      {qrError ? (
        <p className="bankid-qr__instructions">Kunde inte visa QR-kod.</p>
      ) : (
        <>
          <div className="bankid-qr__code">
            <canvas ref={canvasRef} />
          </div>

          <div className="bankid-qr__instructions">
            <ol>
              <li>Öppna BankID-appen på din telefon</li>
              <li>Tryck på QR-ikonen i BankID-appen</li>
              <li>Skanna QR-koden ovan</li>
            </ol>
          </div>

          <div className="bankid-qr__or">eller</div>
        </>
      )}

      <Button
        variant="outline"
        onClick={openOnThisDevice}
        className="bankid-qr__same-device"
      >
        Öppna BankID på denna enhet
      </Button>

      <Button variant="ghost" size="sm" onClick={onCancel}>
        Avbryt
      </Button>
    </div>
  );
}
