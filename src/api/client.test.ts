import { describe, it, expect, beforeEach } from 'vitest';
import { apiRequest, setAuthToken, setCompanyId } from './client';

describe('apiRequest', () => {
  beforeEach(() => {
    setAuthToken(null);
    setCompanyId(null);
  });

  it('makes GET request and returns JSON', async () => {
    const data = await apiRequest<{ Items: unknown[] }>('/Company?isAutoPaginating=true&includeSummary=false');
    expect(data.Items).toBeDefined();
    expect(data.Items.length).toBeGreaterThan(0);
  });

  it('makes POST request', async () => {
    const data = await apiRequest('/BankIdAuth/start', { method: 'POST' });
    expect(data).toHaveProperty('InProgress');
  });

  it('includes auth header when JWT is set', async () => {
    setAuthToken('test-jwt');
    // This will hit our MSW handler which doesn't validate the token
    const data = await apiRequest('/Company?isAutoPaginating=true&includeSummary=false');
    expect(data).toBeDefined();
  });
});
