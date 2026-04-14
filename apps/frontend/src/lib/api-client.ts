let currentEstudioId: string | null = null;
let onUnauthorizedCallback: (() => void) | null = null;
let refreshPromise: Promise<boolean> | null = null;

const AUTH_PATHS = ['/v1/auth/login', '/v1/auth/register', '/v1/auth/refresh-token'];

export function getApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured. Set it in .env.local');
  }
  return url;
}

export function setEstudioId(id: string | null): void {
  currentEstudioId = id;
}

export function getEstudioId(): string | null {
  return currentEstudioId;
}

export function setOnUnauthorized(cb: (() => void) | null): void {
  onUnauthorizedCallback = cb;
}

export function _resetRefreshState(): void {
  refreshPromise = null;
}

function getAccessToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]*)/);
  return match ? match[1] : null;
}

function getRefreshToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)refresh_token=([^;]*)/);
  return match ? match[1] : null;
}

function setCookie(name: string, value: string, maxAge: number): void {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}`;
}

function buildHeaders(init?: RequestInit): Headers {
  const headers = new Headers(init?.headers);
  const isFormData = init?.body instanceof FormData;

  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (currentEstudioId) {
    headers.set('x-estudio-id', currentEstudioId);
  }

  return headers;
}

async function attemptRefresh(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;

  try {
    const res = await fetch(`${getApiUrl()}/v1/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    setCookie('access_token', data.accessToken, 900);
    setCookie('refresh_token', data.refreshToken, 604800);
    return true;
  } catch {
    return false;
  }
}

function isAuthPath(path: string): boolean {
  return AUTH_PATHS.some((p) => path.includes(p));
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `${getApiUrl()}${path}`;
  const headers = buildHeaders(init);

  const response = await fetch(url, { ...init, headers });

  // Don't refresh for auth endpoints
  if (response.status !== 401 || isAuthPath(path)) {
    return response;
  }

  // Attempt refresh with mutex
  if (!refreshPromise) {
    refreshPromise = attemptRefresh().finally(() => {
      refreshPromise = null;
    });
  }

  const refreshed = await refreshPromise;

  if (!refreshed) {
    onUnauthorizedCallback?.();
    return response;
  }

  // Retry with new token
  const retryHeaders = buildHeaders(init);
  return fetch(url, { ...init, headers: retryHeaders });
}
