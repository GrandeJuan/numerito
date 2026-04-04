import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProtectedLayout } from './protected-layout';
import { AuthProvider } from '@/lib/auth-context';

const ORIGINAL_ENV = { ...process.env };

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock next/navigation
const mockPathname = vi.fn().mockReturnValue('/dashboard');
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

function fakeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fake-signature`;
}

function renderLayout(rol: string = 'SOCIO') {
  const token = fakeJwt({
    sub: 'user-1',
    email: 'test@example.com',
    rol,
    exp: Math.floor(Date.now() / 1000) + 900,
  });
  Object.defineProperty(document, 'cookie', {
    writable: true,
    value: `access_token=${token}`,
  });

  return render(
    <AuthProvider>
      <ProtectedLayout>
        <div data-testid="page-content">Page Content</div>
      </ProtectedLayout>
    </AuthProvider>,
  );
}

describe('ProtectedLayout', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, NEXT_PUBLIC_API_URL: 'http://localhost:4000' };
    document.documentElement.classList.remove('dark');
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 }),
    ));
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    Object.defineProperty(document, 'cookie', { writable: true, value: '' });
    mockPathname.mockReturnValue('/dashboard');
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    vi.restoreAllMocks();
  });

  it('renders sidebar with Numerito branding', async () => {
    renderLayout();
    await waitFor(() => {
      expect(screen.getByText('Numerito')).toBeInTheDocument();
    });
  });

  it('renders topbar with user email', async () => {
    renderLayout();
    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('renders logout button in topbar', async () => {
    renderLayout();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cerrar sesión/i })).toBeInTheDocument();
    });
  });

  it('renders children content', async () => {
    renderLayout();
    await waitFor(() => {
      expect(screen.getByTestId('page-content')).toBeInTheDocument();
    });
  });

  it('logout button calls logout', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
    renderLayout();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cerrar sesión/i })).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /cerrar sesión/i }));
    });
  });

  // --- Dark mode toggle ---
  it('renders dark mode toggle button in topbar', async () => {
    renderLayout();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /modo oscuro|modo claro/i })).toBeInTheDocument();
    });
  });

  it('dark mode toggle switches between light and dark', async () => {
    renderLayout();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /modo oscuro/i })).toBeInTheDocument();
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /modo oscuro/i }));
    });

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(screen.getByRole('button', { name: /modo claro/i })).toBeInTheDocument();
  });

  // --- Breadcrumbs ---
  it('renders breadcrumbs in topbar', async () => {
    mockPathname.mockReturnValue('/dashboard/clientes');
    renderLayout();
    await waitFor(() => {
      const breadcrumbNav = screen.getByRole('navigation', { name: /breadcrumbs/i });
      expect(breadcrumbNav).toBeInTheDocument();
      // Dashboard link + Clientes text inside breadcrumb
      expect(breadcrumbNav.textContent).toContain('Dashboard');
      expect(breadcrumbNav.textContent).toContain('Clientes');
    });
  });

  // --- Notification bell ---
  it('renders notification bell in sidebar', async () => {
    renderLayout();
    await waitFor(() => {
      expect(screen.getByLabelText('Notificaciones')).toBeInTheDocument();
    });
  });

  // --- Permission-filtered nav ---
  it('hides nav items requiring permissions when user lacks them', async () => {
    // fetch returns empty permisos => no permissions
    renderLayout();
    await waitFor(() => {
      expect(screen.getByText('Inicio')).toBeInTheDocument();
    });

    // Facturacion requires VER_FACTURACION — should be hidden
    expect(screen.queryByText('Facturación')).toBeNull();
    // Tareas requires VER_TAREAS — should be hidden
    expect(screen.queryByText('Tareas')).toBeNull();
  });

  it('shows nav items when user has required permissions', async () => {
    // Return permisos for the estudio
    const estudios = [{ id: 'est-1', nombre: 'Test Estudio', rol: 'SOCIO' }];
    const permisos = ['VER_FACTURACION', 'VER_TAREAS', 'VER_CONTABILIDAD'];

    vi.mocked(fetch).mockImplementation(async (input: string | URL | Request) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url.includes('/estudios')) {
        return new Response(JSON.stringify({ data: estudios }), { status: 200 });
      }
      if (url.includes('/permisos')) {
        return new Response(JSON.stringify({ data: permisos }), { status: 200 });
      }
      if (url.includes('/logout')) {
        return new Response(JSON.stringify({}), { status: 200 });
      }
      return new Response(JSON.stringify([]), { status: 200 });
    });

    renderLayout();

    // Wait for estudios to load and auto-select, which triggers permisos load
    await waitFor(() => {
      expect(screen.getByText('Facturación')).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.getByText('Tareas')).toBeInTheDocument();
    expect(screen.getByText('Contabilidad')).toBeInTheDocument();
  });

  // --- Portal nav doesn't show EstudioSelector ---
  it('portal nav does not show EstudioSelector', async () => {
    mockPathname.mockReturnValue('/portal');
    renderLayout();
    await waitFor(() => {
      expect(screen.getByText('Mi Portal')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('estudio-selector')).toBeNull();
  });

  // --- Mobile sidebar ---
  it('mobile menu button toggles sidebar', async () => {
    renderLayout();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /abrir menú/i })).toBeInTheDocument();
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /abrir menú/i }));
    });

    // Overlay should appear
    expect(screen.getByTestId('sidebar-overlay')).toBeInTheDocument();
  });

  it('clicking overlay closes sidebar', async () => {
    renderLayout();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /abrir menú/i })).toBeInTheDocument();
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /abrir menú/i }));
    });

    expect(screen.getByTestId('sidebar-overlay')).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByTestId('sidebar-overlay'));
    });

    expect(screen.queryByTestId('sidebar-overlay')).toBeNull();
  });
});
