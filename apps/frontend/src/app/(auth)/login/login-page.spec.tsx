import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from './page';
import { AuthProvider } from '@/lib/auth-context';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock next/navigation
let mockSearchParams = new URLSearchParams();
vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}));

// Track window.location.href assignments
let locationHref = '';
const locationMock = {
  ...window.location,
  get href() { return locationHref; },
  set href(val: string) { locationHref = val; },
};

function fakeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fake-signature`;
}

function makeLoginResponse(rol: string) {
  const token = fakeJwt({
    sub: 'user-1',
    email: 'test@test.com',
    rol,
    exp: Math.floor(Date.now() / 1000) + 900,
  });
  return new Response(
    JSON.stringify({
      data: {
        accessToken: token,
        refreshToken: 'rt-123',
        usuario: { id: 'user-1', email: 'test@test.com', rol },
      },
    }),
    { status: 200 },
  );
}

function renderLoginPage() {
  return render(
    <AuthProvider>
      <LoginPage />
    </AuthProvider>,
  );
}

describe('LoginPage', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, NEXT_PUBLIC_API_URL: 'http://localhost:4000' };
    locationHref = '';
    mockSearchParams = new URLSearchParams();
    Object.defineProperty(window, 'location', { value: locationMock, writable: true });
    vi.stubGlobal('fetch', vi.fn());
    Object.defineProperty(document, 'cookie', { writable: true, value: '' });
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    vi.restoreAllMocks();
  });

  async function fillAndSubmitLogin(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText(/email/i), 'test@test.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /ingresar/i }));
  }

  describe('role-based redirect', () => {
    it('redirects SUPERADMIN to /admin', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(makeLoginResponse('SUPERADMIN'));
      renderLoginPage();
      const user = userEvent.setup();

      await fillAndSubmitLogin(user);

      await waitFor(() => {
        expect(locationHref).toBe('/admin');
      });
    });

    it('redirects CLIENTE to /portal', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(makeLoginResponse('CLIENTE'));
      renderLoginPage();
      const user = userEvent.setup();

      await fillAndSubmitLogin(user);

      await waitFor(() => {
        expect(locationHref).toBe('/portal');
      });
    });

    it('redirects SOCIO to /dashboard', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(makeLoginResponse('SOCIO'));
      renderLoginPage();
      const user = userEvent.setup();

      await fillAndSubmitLogin(user);

      await waitFor(() => {
        expect(locationHref).toBe('/dashboard');
      });
    });

    it('redirects RESPONSABLE to /dashboard', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(makeLoginResponse('RESPONSABLE'));
      renderLoginPage();
      const user = userEvent.setup();

      await fillAndSubmitLogin(user);

      await waitFor(() => {
        expect(locationHref).toBe('/dashboard');
      });
    });

    it('redirects EMPLEADO to /dashboard', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(makeLoginResponse('EMPLEADO'));
      renderLoginPage();
      const user = userEvent.setup();

      await fillAndSubmitLogin(user);

      await waitFor(() => {
        expect(locationHref).toBe('/dashboard');
      });
    });
  });

  describe('error handling', () => {
    it('shows error message on invalid credentials', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: 'Credenciales inválidas' } }), { status: 401 }),
      );
      renderLoginPage();
      const user = userEvent.setup();

      await fillAndSubmitLogin(user);

      await waitFor(() => {
        expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument();
      });
    });
  });

  describe('loading state', () => {
    it('shows loading text during submit', async () => {
      // Make fetch hang
      vi.mocked(fetch).mockImplementationOnce(() => new Promise(() => {}));
      renderLoginPage();
      const user = userEvent.setup();

      await fillAndSubmitLogin(user);

      expect(screen.getByText('Ingresando...')).toBeInTheDocument();
    });

    it('disables submit button during loading', async () => {
      vi.mocked(fetch).mockImplementationOnce(() => new Promise(() => {}));
      renderLoginPage();
      const user = userEvent.setup();

      await fillAndSubmitLogin(user);

      expect(screen.getByRole('button', { name: /ingresando/i })).toBeDisabled();
    });
  });

  describe('redirect param', () => {
    it('redirects to ?redirect param instead of default after login', async () => {
      mockSearchParams = new URLSearchParams('redirect=/obligaciones/123');
      vi.mocked(fetch).mockResolvedValueOnce(makeLoginResponse('SOCIO'));
      renderLoginPage();
      const user = userEvent.setup();

      await fillAndSubmitLogin(user);

      await waitFor(() => {
        expect(locationHref).toBe('/obligaciones/123');
      });
    });
  });

  describe('no dead links', () => {
    it('has no links pointing to #', () => {
      renderLoginPage();
      const allLinks = document.querySelectorAll('a[href]');
      const deadLinks = Array.from(allLinks).filter((a) => a.getAttribute('href') === '#');
      expect(deadLinks).toHaveLength(0);
    });
  });

  describe('SSO buttons', () => {
    it('Google button links to backend SSO endpoint', async () => {
      renderLoginPage();
      const googleBtn = screen.getByTestId('sso-google');
      expect(googleBtn.getAttribute('href')).toContain('/v1/auth/google');
    });

    it('Microsoft button links to backend SSO endpoint', async () => {
      renderLoginPage();
      const msBtn = screen.getByTestId('sso-microsoft');
      expect(msBtn.getAttribute('href')).toContain('/v1/auth/microsoft');
    });
  });
});
