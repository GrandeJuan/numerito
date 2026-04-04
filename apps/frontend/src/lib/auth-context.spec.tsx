import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './auth-context';

// Helper component to test the hook
function TestConsumer() {
  const { user, isAuthenticated, isLoading, login, logout, estudioActual, switchEstudio, permisos, tienePermiso } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="user">{user ? JSON.stringify(user) : 'null'}</span>
      <span data-testid="estudio">{estudioActual ? JSON.stringify(estudioActual) : 'null'}</span>
      <span data-testid="permisos">{JSON.stringify(permisos)}</span>
      <span data-testid="tiene-ver-clientes">{String(tienePermiso('VER_CLIENTES'))}</span>
      <span data-testid="tiene-editar-clientes">{String(tienePermiso('EDITAR_CLIENTES'))}</span>
      <button
        data-testid="login-btn"
        onClick={() => login('test@test.com', 'pass123').catch(() => {})}
      >
        Login
      </button>
      <button data-testid="logout-btn" onClick={() => logout()}>
        Logout
      </button>
      <button data-testid="switch-btn" onClick={() => switchEstudio({ id: 'est-2', nombre: 'Otro Estudio', rol: 'EMPLEADO' })}>
        Switch
      </button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>,
  );
}

// Helper: create a fake JWT with given payload
function fakeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fake-signature`;
}

describe('AuthContext', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, NEXT_PUBLIC_API_URL: 'http://localhost:4000' };
    vi.stubGlobal('fetch', vi.fn());
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    vi.restoreAllMocks();
  });

  describe('initial state (no cookie)', () => {
    it('resolves to isAuthenticated=false and isLoading=false', async () => {
      renderWithProvider();
      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
        expect(screen.getByTestId('authenticated').textContent).toBe('false');
      });
    });

    it('has user=null when no cookie', async () => {
      renderWithProvider();
      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('null');
      });
    });
  });

  describe('hydration from cookie', () => {
    it('hydrates user from existing access_token cookie', async () => {
      const token = fakeJwt({
        sub: 'user-1',
        email: 'test@example.com',
        rol: 'SOCIO',
        exp: Math.floor(Date.now() / 1000) + 900,
      });
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: `access_token=${token}`,
      });

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
        expect(screen.getByTestId('authenticated').textContent).toBe('true');
        const user = JSON.parse(screen.getByTestId('user').textContent!);
        expect(user.email).toBe('test@example.com');
        expect(user.rol).toBe('SOCIO');
      });
    });

    it('does not hydrate from expired token', async () => {
      const token = fakeJwt({
        sub: 'user-1',
        email: 'test@example.com',
        rol: 'SOCIO',
        exp: Math.floor(Date.now() / 1000) - 100, // expired
      });
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: `access_token=${token}`,
      });

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
        expect(screen.getByTestId('authenticated').textContent).toBe('false');
        expect(screen.getByTestId('user').textContent).toBe('null');
      });
    });
  });

  describe('login()', () => {
    it('calls API and sets user on success', async () => {
      const mockToken = fakeJwt({
        sub: 'user-1',
        email: 'login@test.com',
        rol: 'EMPLEADO',
        exp: Math.floor(Date.now() / 1000) + 900,
      });
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              accessToken: mockToken,
              refreshToken: 'rt-123',
              usuario: { id: 'user-1', email: 'login@test.com', rol: 'EMPLEADO' },
            },
          }),
          { status: 200 },
        ),
      );

      renderWithProvider();
      const user = userEvent.setup();

      await act(async () => {
        await user.click(screen.getByTestId('login-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('true');
        const userData = JSON.parse(screen.getByTestId('user').textContent!);
        expect(userData.email).toBe('login@test.com');
        expect(userData.rol).toBe('EMPLEADO');
      });
    });

    it('throws on failed login', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: { message: 'Credenciales inválidas' } }),
          { status: 401 },
        ),
      );

      const loginPromise: { reject?: (e: Error) => void } = {};

      function TestLoginError() {
        const { login } = useAuth();
        const [error, setError] = React.useState('');
        return (
          <div>
            <span data-testid="error">{error}</span>
            <button
              data-testid="login-err"
              onClick={() => login('bad@test.com', 'wrong').catch((e) => setError(e.message))}
            >
              Login
            </button>
          </div>
        );
      }

      render(
        <AuthProvider>
          <TestLoginError />
        </AuthProvider>,
      );

      const user = userEvent.setup();
      await act(async () => {
        await user.click(screen.getByTestId('login-err'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('error').textContent).toBe('Credenciales inválidas');
      });
    });
  });

  describe('logout()', () => {
    it('resets state and calls backend logout', async () => {
      const token = fakeJwt({
        sub: 'user-1',
        email: 'test@example.com',
        rol: 'SOCIO',
        exp: Math.floor(Date.now() / 1000) + 900,
      });
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: `access_token=${token}`,
      });

      // Mock the backend logout call
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'ok' }), { status: 200 }),
      );

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('true');
      });

      const user = userEvent.setup();
      await act(async () => {
        await user.click(screen.getByTestId('logout-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('false');
        expect(screen.getByTestId('user').textContent).toBe('null');
      });

      // Verify backend was called
      const logoutCall = vi.mocked(fetch).mock.calls.find(
        (call) => String(call[0]).includes('/v1/auth/logout'),
      );
      expect(logoutCall).toBeTruthy();
    });
  });
  describe('estudio management', () => {
    it('starts with estudioActual=null', async () => {
      renderWithProvider();
      await waitFor(() => {
        expect(screen.getByTestId('estudio').textContent).toBe('null');
      });
    });

    it('switchEstudio updates estudioActual', async () => {
      const token = fakeJwt({
        sub: 'user-1',
        email: 'test@example.com',
        rol: 'SOCIO',
        exp: Math.floor(Date.now() / 1000) + 900,
      });
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: `access_token=${token}`,
      });

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('true');
      });

      const user = userEvent.setup();
      await act(async () => {
        await user.click(screen.getByTestId('switch-btn'));
      });

      await waitFor(() => {
        const estudio = JSON.parse(screen.getByTestId('estudio').textContent!);
        expect(estudio.id).toBe('est-2');
        expect(estudio.nombre).toBe('Otro Estudio');
      });
    });

    it('persists estudioActual in localStorage', async () => {
      const token = fakeJwt({
        sub: 'user-1',
        email: 'test@example.com',
        rol: 'SOCIO',
        exp: Math.floor(Date.now() / 1000) + 900,
      });
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: `access_token=${token}`,
      });

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('true');
      });

      const user = userEvent.setup();
      await act(async () => {
        await user.click(screen.getByTestId('switch-btn'));
      });

      await waitFor(() => {
        const stored = localStorage.getItem('numerito_estudio_actual');
        expect(stored).toBeTruthy();
        const parsed = JSON.parse(stored!);
        expect(parsed.id).toBe('est-2');
      });
    });
  });

  describe('permisos', () => {
    it('starts with empty permisos array', async () => {
      renderWithProvider();
      await waitFor(() => {
        expect(screen.getByTestId('permisos').textContent).toBe('[]');
      });
    });

    it('tienePermiso returns false when no permisos loaded', async () => {
      renderWithProvider();
      await waitFor(() => {
        expect(screen.getByTestId('tiene-ver-clientes').textContent).toBe('false');
      });
    });

    it('loads permisos from API when switchEstudio is called', async () => {
      const token = fakeJwt({
        sub: 'user-1',
        email: 'test@example.com',
        rol: 'SOCIO',
        exp: Math.floor(Date.now() / 1000) + 900,
      });
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: `access_token=${token}`,
      });

      // First call: logout endpoint (if any), second: permisos endpoint
      vi.mocked(fetch).mockImplementation(async (input) => {
        const url = String(input);
        if (url.includes('/v1/usuarios/me/permisos')) {
          return new Response(
            JSON.stringify({ data: ['VER_CLIENTES', 'EDITAR_CLIENTES'] }),
            { status: 200 },
          );
        }
        return new Response(JSON.stringify({}), { status: 200 });
      });

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('true');
      });

      const user = userEvent.setup();
      await act(async () => {
        await user.click(screen.getByTestId('switch-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('tiene-ver-clientes').textContent).toBe('true');
        expect(screen.getByTestId('tiene-editar-clientes').textContent).toBe('true');
      });

      // Verify the API was called with correct estudioId
      const permisosCall = vi.mocked(fetch).mock.calls.find(
        (call) => String(call[0]).includes('/v1/usuarios/me/permisos'),
      );
      expect(permisosCall).toBeTruthy();
      expect(String(permisosCall![0])).toContain('estudioId=est-2');
    });

    it('tienePermiso returns false for permissions not in the list', async () => {
      const token = fakeJwt({
        sub: 'user-1',
        email: 'test@example.com',
        rol: 'SOCIO',
        exp: Math.floor(Date.now() / 1000) + 900,
      });
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: `access_token=${token}`,
      });

      vi.mocked(fetch).mockImplementation(async (input) => {
        const url = String(input);
        if (url.includes('/v1/usuarios/me/permisos')) {
          return new Response(
            JSON.stringify({ data: ['VER_CLIENTES'] }),
            { status: 200 },
          );
        }
        return new Response(JSON.stringify({}), { status: 200 });
      });

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('true');
      });

      const user = userEvent.setup();
      await act(async () => {
        await user.click(screen.getByTestId('switch-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('tiene-ver-clientes').textContent).toBe('true');
        expect(screen.getByTestId('tiene-editar-clientes').textContent).toBe('false');
      });
    });

    it('clears permisos on logout', async () => {
      const token = fakeJwt({
        sub: 'user-1',
        email: 'test@example.com',
        rol: 'SOCIO',
        exp: Math.floor(Date.now() / 1000) + 900,
      });
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: `access_token=${token}`,
      });

      vi.mocked(fetch).mockImplementation(async (input) => {
        const url = String(input);
        if (url.includes('/v1/usuarios/me/permisos')) {
          return new Response(
            JSON.stringify({ data: ['VER_CLIENTES'] }),
            { status: 200 },
          );
        }
        return new Response(JSON.stringify({}), { status: 200 });
      });

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('true');
      });

      const user = userEvent.setup();

      // Switch estudio to load permisos
      await act(async () => {
        await user.click(screen.getByTestId('switch-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('tiene-ver-clientes').textContent).toBe('true');
      });

      // Now logout
      await act(async () => {
        await user.click(screen.getByTestId('logout-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('permisos').textContent).toBe('[]');
        expect(screen.getByTestId('tiene-ver-clientes').textContent).toBe('false');
      });
    });

    it('loads permisos on hydration when estudio is restored from localStorage', async () => {
      const token = fakeJwt({
        sub: 'user-1',
        email: 'test@example.com',
        rol: 'SOCIO',
        exp: Math.floor(Date.now() / 1000) + 900,
      });
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: `access_token=${token}`,
      });

      // Pre-store estudio in localStorage
      localStorage.setItem(
        'numerito_estudio_actual',
        JSON.stringify({ id: 'est-1', nombre: 'Estudio Uno', rol: 'SOCIO' }),
      );

      vi.mocked(fetch).mockImplementation(async (input) => {
        const url = String(input);
        if (url.includes('/v1/usuarios/me/permisos')) {
          return new Response(
            JSON.stringify({ data: ['VER_CLIENTES', 'VER_OBLIGACIONES'] }),
            { status: 200 },
          );
        }
        return new Response(JSON.stringify({}), { status: 200 });
      });

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('tiene-ver-clientes').textContent).toBe('true');
      });

      const permisosCall = vi.mocked(fetch).mock.calls.find(
        (call) => String(call[0]).includes('/v1/usuarios/me/permisos'),
      );
      expect(permisosCall).toBeTruthy();
      expect(String(permisosCall![0])).toContain('estudioId=est-1');
    });
  });
});

// Need React import for the inline component in the error test
import React from 'react';
