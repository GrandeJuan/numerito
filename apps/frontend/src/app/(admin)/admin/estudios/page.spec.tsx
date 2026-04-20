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

const mockEstudios = [
  {
    id: 'est-1',
    nombre: 'Estudio Alpha',
    cuit: '30-12345678-9',
    plan: 'Profesional',
    planCodigo: 'PRO',
    isActive: true,
    createdAt: '2026-01-01',
  },
];

import EstudiosAdminPage from './page';

describe('EstudiosAdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockEstudios, meta: { total: 1 } }),
    });
  });

  it('renders page title', async () => {
    render(<EstudiosAdminPage />);
    await waitFor(() => {
      expect(screen.getByText('Estudios')).toBeInTheDocument();
    });
  });

  it('calls /v1/admin/estudios endpoint', async () => {
    render(<EstudiosAdminPage />);
    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/v1/admin/estudios', expect.any(Object));
    });
  });

  it('renders estudio row', async () => {
    render(<EstudiosAdminPage />);
    await waitFor(() => {
      expect(screen.getByText('Estudio Alpha')).toBeInTheDocument();
    });
  });
});
