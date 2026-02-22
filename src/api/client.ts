const BASE_URL = '/api';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

let storedJwt: string | null = null;
let storedCompanyId: string | null = null;

export function setAuthToken(jwt: string | null) {
  storedJwt = jwt;
}

export function setCompanyId(id: string | null) {
  storedCompanyId = id;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
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
  if (!text) return undefined as T;

  return JSON.parse(text) as T;
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
