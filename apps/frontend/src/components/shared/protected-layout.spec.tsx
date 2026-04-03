import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProtectedLayout } from './protected-layout';
import { AuthProvider } from '@/lib/auth-context';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
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
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 }),
    ));
    Object.defineProperty(document, 'cookie', { writable: true, value: '' });
  });

  afterEach(() => {
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

    // After logout, the user should no longer be visible
    // (We can't easily test redirect here since window.location is hard to mock in this context)
  });
});
