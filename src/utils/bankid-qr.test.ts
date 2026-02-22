import { describe, it, expect } from 'vitest';
import { computeQrData, buildAutoStartUrl } from './bankid-qr';

describe('computeQrData', () => {
  it('produces correct format: bankid.<token>.<time>.<hex>', async () => {
    const data = await computeQrData('my-token', 'my-secret', 0);
    const parts = data.split('.');
    expect(parts[0]).toBe('bankid');
    expect(parts[1]).toBe('my-token');
    expect(parts[2]).toBe('0');
    // qrAuthCode should be 64 hex chars
    expect(parts[3]).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces different codes for different times', async () => {
    const data0 = await computeQrData('tok', 'sec', 0);
    const data1 = await computeQrData('tok', 'sec', 1);
    const data2 = await computeQrData('tok', 'sec', 2);

    expect(data0).not.toBe(data1);
    expect(data1).not.toBe(data2);
  });

  it('produces same code for same inputs (deterministic)', async () => {
    const a = await computeQrData('tok', 'sec', 5);
    const b = await computeQrData('tok', 'sec', 5);
    expect(a).toBe(b);
  });

  it('floors fractional seconds', async () => {
    const whole = await computeQrData('tok', 'sec', 3);
    const frac = await computeQrData('tok', 'sec', 3.7);
    expect(whole).toBe(frac);
  });

  it('produces different codes for different secrets', async () => {
    const a = await computeQrData('tok', 'secret-a', 0);
    const b = await computeQrData('tok', 'secret-b', 0);
    expect(a).not.toBe(b);
  });
});

describe('buildAutoStartUrl', () => {
  it('wraps token in square brackets', () => {
    const url = buildAutoStartUrl('abc-123');
    expect(url).toContain('[abc-123]');
  });

  it('includes autostarttoken param', () => {
    const url = buildAutoStartUrl('abc-123');
    expect(url).toContain('autostarttoken=[abc-123]');
  });

  it('includes redirect=null', () => {
    const url = buildAutoStartUrl('abc-123');
    expect(url).toContain('redirect=null');
  });
});
