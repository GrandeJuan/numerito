import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

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
      json: () => Promise.resolve({ data: mockUsuarios, meta: { total: 1 } }),
    });
  });

  it('renders page title', async () => {
    render(<UsuariosAdminPage />);
    await waitFor(() => {
      expect(screen.getByText('Usuarios')).toBeInTheDocument();
    });
  });

  it('calls /v1/admin/usuarios endpoint', async () => {
    render(<UsuariosAdminPage />);
    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/v1/admin/usuarios', expect.any(Object));
    });
  });

  it('renders usuario row', async () => {
    render(<UsuariosAdminPage />);
    await waitFor(() => {
      expect(screen.getByText('admin@demo.com')).toBeInTheDocument();
    });
  });
});
