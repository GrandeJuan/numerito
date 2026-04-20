import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'u-1', email: 'super@test.com', rol: 'SUPERADMIN' },
    estudioActual: null,
    permisos: [],
    tienePermiso: () => true,
  }),
}));

let mockApiFetch: ReturnType<typeof vi.fn>;
vi.mock('@/lib/api-client', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
  setEstudioId: vi.fn(),
  setOnUnauthorized: vi.fn(),
}));

const mockUsuarios = [
  {
    id: 'u-1',
    email: 'admin@demo.com',
    nombre: 'Admin',
    apellido: 'Demo',
    rol: 'SOCIO',
    provider: null,
    emailVerified: true,
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
];

import UsuariosAdminPage from './page';

describe('UsuariosAdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: mockUsuarios,
          meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
        }),
    });
  });

  it('renders page title', async () => {
    render(<UsuariosAdminPage />);
    await waitFor(() => {
      expect(screen.getByText('Usuarios')).toBeInTheDocument();
    });
  });

  it('calls /v1/admin/usuarios endpoint with pagination params', async () => {
    render(<UsuariosAdminPage />);
    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/admin/usuarios'),
        expect.any(Object),
      );
      const url = mockApiFetch.mock.calls[0][0] as string;
      expect(url).toContain('page=1');
      expect(url).toContain('limit=20');
    });
  });

  it('renders usuario row', async () => {
    render(<UsuariosAdminPage />);
    await waitFor(() => {
      expect(screen.getByText('admin@demo.com')).toBeInTheDocument();
    });
  });

  it('renders search input', async () => {
    render(<UsuariosAdminPage />);
    expect(screen.getByPlaceholderText('Buscar por nombre o email…')).toBeInTheDocument();
  });

  it('search changes the fetch URL', async () => {
    render(<UsuariosAdminPage />);
    await waitFor(() => {
      expect(screen.getByText('admin@demo.com')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Buscar por nombre o email…');
    fireEvent.change(input, { target: { value: 'admin' } });

    await waitFor(() => {
      const lastCall = mockApiFetch.mock.calls[mockApiFetch.mock.calls.length - 1][0] as string;
      expect(lastCall).toContain('search=admin');
    });
  });
});
