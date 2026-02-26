const BASE_URL = '/api';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

let storedJwt: string | null = null;
let storedRefreshToken: string | null = null;
let storedCompanyId: string | null = null;
let onAuthFailure: (() => void) | null = null;
let refreshPromise: Promise<boolean> | null = null;

export function setAuthToken(jwt: string | null) {
  storedJwt = jwt;
}

export function setRefreshToken(token: string | null) {
  storedRefreshToken = token;
}

export function setCompanyId(id: string | null) {
  storedCompanyId = id;
}

/** Register a callback invoked when auth cannot be recovered (triggers logout) */
export function setOnAuthFailure(cb: (() => void) | null) {
  onAuthFailure = cb;
}

interface RefreshResponse {
  AuthTokens: {
    AccessToken: string;
    RefreshToken: string;
  };
  PersonId: number;
  Name: string;
}

/** Attempt to refresh the session using the stored refresh token.
 *  Deduplicates concurrent refresh attempts. */
async function tryRefresh(): Promise<boolean> {
  if (!storedRefreshToken) return false;

  // Deduplicate: if a refresh is already in-flight, wait for it
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${BASE_URL}/Auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'wint-client': 'wint-client-web',
          'wint-client-version': '0.2.258',
        },
        body: JSON.stringify(storedRefreshToken),
      });

      if (!response.ok) return false;

      const data = (await response.json()) as RefreshResponse;
      const newJwt = data.AuthTokens?.AccessToken;
      const newRefresh = data.AuthTokens?.RefreshToken;
      if (!newJwt) return false;

      // Update in-memory tokens
      storedJwt = newJwt;
      if (newRefresh) storedRefreshToken = newRefresh;

      // Persist to localStorage so next page load uses fresh tokens
      localStorage.setItem('wint-jwt', newJwt);
      if (newRefresh) localStorage.setItem('wint-refresh-token', newRefresh);

      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function doFetch<T>(path: string, options: RequestOptions): Promise<{ response: Response; parsed: T }> {
  const { body, headers: extraHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'wint-client': 'wint-client-web',
    'wint-client-version': '0.2.258',
    ...(extraHeaders as Record<string, string>),
  };

  if (storedJwt) {
    headers['Authorization'] = `Bearer ${storedJwt}`;
  }

  if (storedCompanyId) {
    headers['companyid'] = storedCompanyId;
    headers['x-wint-capabilities'] = 'ReceiptPaymentMethodNullability';
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new ApiError(response.status, response.statusText, path);
  }

  const text = await response.text();
  const parsed = (text ? JSON.parse(text) : undefined) as T;
  return { response, parsed };
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    const { parsed } = await doFetch<T>(path, options);
    return parsed;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      // Try refreshing the token once
      const refreshed = await tryRefresh();
      if (refreshed) {
        const { parsed } = await doFetch<T>(path, options);
        return parsed;
      }

      // Refresh failed — force logout
      onAuthFailure?.();
    }
    throw err;
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public path: string,
  ) {
    super(`API ${status} ${statusText} at ${path}`);
    this.name = 'ApiError';
  }
}
