import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch, getApiUrl, setOnUnauthorized, _resetRefreshState } from './api-client';

describe('api-client', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, NEXT_PUBLIC_API_URL: 'http://localhost:4000' };
    vi.stubGlobal('document', {
      cookie: 'access_token=test-token-123; refresh_token=rt-456',
    });
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    vi.restoreAllMocks();
  });

  describe('getApiUrl', () => {
    it('returns NEXT_PUBLIC_API_URL', () => {
      expect(getApiUrl()).toBe('http://localhost:4000');
    });

    it('throws when NEXT_PUBLIC_API_URL is not set', () => {
      delete process.env.NEXT_PUBLIC_API_URL;
      expect(() => getApiUrl()).toThrow('NEXT_PUBLIC_API_URL is not configured');
    });
  });

  describe('URL construction', () => {
    it('builds absolute URLs (never relative)', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response('{}', { status: 200 }));

      await apiFetch('/v1/auth/login', { method: 'POST' });

      const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(calledUrl).toMatch(/^https?:\/\//);
    });
  });

  describe('apiFetch', () => {
    it('prepends base URL to path', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response('{}', { status: 200 }));

      await apiFetch('/v1/auth/login', { method: 'POST' });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:4000/v1/auth/login',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('injects Authorization header from access_token cookie', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response('{}', { status: 200 }));

      await apiFetch('/v1/usuarios/me');

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const headers = new Headers((callArgs[1] as RequestInit).headers);
      expect(headers.get('Authorization')).toBe('Bearer test-token-123');
    });

    it('injects x-estudio-id header when estudioId is set', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response('{}', { status: 200 }));
      const { setEstudioId } = await import('./api-client');
      setEstudioId('estudio-abc');

      await apiFetch('/v1/clientes');

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const headers = new Headers((callArgs[1] as RequestInit).headers);
      expect(headers.get('x-estudio-id')).toBe('estudio-abc');
    });

    it('sets Content-Type to application/json by default', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response('{}', { status: 200 }));

      await apiFetch('/v1/test');

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const headers = new Headers((callArgs[1] as RequestInit).headers);
      expect(headers.get('Content-Type')).toBe('application/json');
    });

    it('allows overriding Content-Type', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response('{}', { status: 200 }));

      await apiFetch('/v1/test', {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const headers = new Headers((callArgs[1] as RequestInit).headers);
      expect(headers.get('Content-Type')).toBe('multipart/form-data');
    });

    it('returns the fetch Response object', async () => {
      const mockResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse);

      const result = await apiFetch('/v1/test');

      expect(result).toBe(mockResponse);
    });
  });

  describe('token refresh interceptor', () => {
    beforeEach(() => {
      _resetRefreshState();
    });

    it('attempts refresh on 401 and retries the original request', async () => {
      // First call returns 401
      vi.mocked(fetch)
        .mockResolvedValueOnce(new Response('{}', { status: 401 }))
        // Refresh call succeeds
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ accessToken: 'new-token', refreshToken: 'new-rt' }), { status: 200 }),
        )
        // Retry succeeds
        .mockResolvedValueOnce(new Response(JSON.stringify({ data: 'ok' }), { status: 200 }));

      const result = await apiFetch('/v1/clientes');

      expect(result.status).toBe(200);
      expect(fetch).toHaveBeenCalledTimes(3);
      // Second call should be to refresh-token
      expect(vi.mocked(fetch).mock.calls[1][0]).toContain('/v1/auth/refresh-token');
    });

    it('calls onUnauthorized when refresh fails', async () => {
      const onUnauth = vi.fn();
      setOnUnauthorized(onUnauth);

      // First call returns 401
      vi.mocked(fetch)
        .mockResolvedValueOnce(new Response('{}', { status: 401 }))
        // Refresh fails
        .mockResolvedValueOnce(new Response('{}', { status: 401 }));

      const result = await apiFetch('/v1/clientes');

      expect(result.status).toBe(401);
      expect(onUnauth).toHaveBeenCalled();
    });

    it('does not refresh on 401 for login endpoint', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response('{}', { status: 401 }));

      const result = await apiFetch('/v1/auth/login', { method: 'POST' });

      expect(result.status).toBe(401);
      expect(fetch).toHaveBeenCalledTimes(1); // No refresh attempt
    });

    it('does not trigger multiple concurrent refreshes', async () => {
      // Setup: both calls return 401
      vi.mocked(fetch)
        .mockResolvedValueOnce(new Response('{}', { status: 401 })) // call 1
        .mockResolvedValueOnce(new Response('{}', { status: 401 })) // call 2
        // Single refresh
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ accessToken: 'new-token', refreshToken: 'new-rt' }), { status: 200 }),
        )
        // Retries
        .mockResolvedValueOnce(new Response('{}', { status: 200 }))
        .mockResolvedValueOnce(new Response('{}', { status: 200 }));

      const [r1, r2] = await Promise.all([
        apiFetch('/v1/clientes'),
        apiFetch('/v1/obligaciones'),
      ]);

      expect(r1.status).toBe(200);
      expect(r2.status).toBe(200);
      // Should only have 1 refresh call, not 2
      const refreshCalls = vi.mocked(fetch).mock.calls.filter(
        (call) => String(call[0]).includes('/v1/auth/refresh-token'),
      );
      expect(refreshCalls.length).toBe(1);
    });
  });
});
