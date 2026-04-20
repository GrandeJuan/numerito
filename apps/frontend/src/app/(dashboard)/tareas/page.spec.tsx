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

import TareasPage from './page';

describe('TareasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });
  });

  it('renders page title', async () => {
    render(<TareasPage />);
    await waitFor(() => {
      expect(screen.getByText('Tareas')).toBeInTheDocument();
    });
  });

  it('calls /v1/tareas endpoint', async () => {
    render(<TareasPage />);
    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/v1/tareas', expect.any(Object));
    });
  });
});
