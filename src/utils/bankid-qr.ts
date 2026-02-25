/**
 * BankID animated QR code generation.
 *
 * QR data format: `bankid.<qrStartToken>.<qrTime>.<qrAuthCode>`
 * where qrAuthCode = HMAC-SHA256(key=qrStartSecret, message=String(qrTime)) as hex
 *
 * Each second produces a new frame — the QR code animates to prevent screenshot replay.
 * See: https://developers.bankid.com/getting-started/qr-code
 */

function hexEncode(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

let cachedKey: { secret: string; key: CryptoKey } | null = null;

async function getHmacKey(qrStartSecret: string): Promise<CryptoKey> {
  if (cachedKey && cachedKey.secret === qrStartSecret) {
    return cachedKey.key;
  }
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(qrStartSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  cachedKey = { secret: qrStartSecret, key };
  return key;
}

/** Compute a single QR frame's data string */
export async function computeQrData(
  qrStartToken: string,
  qrStartSecret: string,
  elapsedSeconds: number,
): Promise<string> {
  const qrTime = Math.floor(elapsedSeconds);
  const key = await getHmacKey(qrStartSecret);
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(String(qrTime)));
  const qrAuthCode = hexEncode(signature);
  return `bankid.${qrStartToken}.${qrTime}.${qrAuthCode}`;
}

/** Start an animated QR code that fires a new data string every second.
 *  Returns a cleanup function to stop the animation. */
export function startAnimatedQr(
  qrStartToken: string,
  qrStartSecret: string,
  onFrame: (qrData: string) => void,
): () => void {
  const startTime = Date.now();
  let stopped = false;

  const tick = async () => {
    if (stopped) return;
    const elapsed = (Date.now() - startTime) / 1000;
    const qrData = await computeQrData(qrStartToken, qrStartSecret, elapsed);
    if (!stopped) onFrame(qrData);
  };

  tick();
  const interval = setInterval(tick, 1000);

  return () => {
    stopped = true;
    clearInterval(interval);
  };
}

/** Build BankID autostart URL (for opening BankID on the same device) */
export function buildAutoStartUrl(autoStartToken: string): string {
  // Universal link works on both iOS and Android (recommended by BankID)
  // redirect=null tells BankID not to redirect after auth (browser polls instead)
  return `https://app.bankid.com/?autostarttoken=${autoStartToken}&redirect=null`;
}
