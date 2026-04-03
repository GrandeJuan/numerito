import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EstudioSelector } from './estudio-selector';
import { AuthProvider } from '@/lib/auth-context';

function fakeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fake-signature`;
}

describe('EstudioSelector', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, NEXT_PUBLIC_API_URL: 'http://localhost:4000' };
    vi.stubGlobal('fetch', vi.fn());
    Object.defineProperty(document, 'cookie', { writable: true, value: '' });
    localStorage.clear();
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    vi.restoreAllMocks();
  });

  function renderWithAuth(rol: string = 'SOCIO') {
    const token = fakeJwt({
      sub: 'user-1',
      email: 'test@test.com',
      rol,
      exp: Math.floor(Date.now() / 1000) + 900,
    });
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: `access_token=${token}`,
    });

    return render(
      <AuthProvider>
        <EstudioSelector />
      </AuthProvider>,
    );
  }

  it('loads and displays estudios', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          { id: 'est-1', nombre: 'Estudio Perez', rol: 'SOCIO' },
          { id: 'est-2', nombre: 'Estudio Garcia', rol: 'EMPLEADO' },
        ]),
        { status: 200 },
      ),
    );

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText('Estudio Perez')).toBeInTheDocument();
    });
  });

  it('auto-selects when user has single estudio', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify([{ id: 'est-1', nombre: 'Estudio Unico', rol: 'SOCIO' }]),
        { status: 200 },
      ),
    );

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText('Estudio Unico')).toBeInTheDocument();
    });
  });

  it('does not render for user with 0 estudios', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify([]), { status: 200 }),
    );

    const { container } = renderWithAuth('SUPERADMIN');

    await waitFor(() => {
      // Should not have any estudio selector content
      expect(container.querySelector('[data-testid="estudio-selector"]')).toBeNull();
    });
  });
});
