import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    estudioActual: { id: 'est-1', nombre: 'Estudio Test', rol: 'SOCIO' },
    user: { id: 'u-1', email: 'admin@test.com', rol: 'SOCIO' },
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

const mockStats = {
  asientosDelPeriodo: 42,
  librosRubricados: 3,
  totalLibros: 5,
  balanceCuadrado: true,
  libros: [],
  mensualDebeHaber: [],
  asientosRecientes: [],
};

import ContabilidadPage from './page';

describe('ContabilidadPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockStats }),
    });
  });

  it('renders page title', async () => {
    render(<ContabilidadPage />);
    await waitFor(() => {
      expect(screen.getByText('Contabilidad')).toBeInTheDocument();
    });
  });

  it('calls /v1/contabilidad/stats endpoint', async () => {
    render(<ContabilidadPage />);
    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/v1/contabilidad/stats', expect.any(Object));
    });
  });
});
