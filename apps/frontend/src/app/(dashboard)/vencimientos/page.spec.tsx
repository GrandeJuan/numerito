import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

let mockEstudioActual: { id: string; nombre: string; rol: string } | null = {
  id: 'est-1',
  nombre: 'Estudio Test',
  rol: 'SOCIO',
};

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    get estudioActual() {
      return mockEstudioActual;
    },
    user: { id: 'u-1', email: 'admin@test.com', rol: 'SOCIO' },
    permisos: ['VER_FACTURACION'],
    tienePermiso: () => true,
  }),
}));

const mockVencimientos = [
  {
    id: 'v1',
    cliente: 'Empresa Alpha SRL',
    clienteId: 'c1',
    tipoObligacion: 'IVA',
    periodo: '2026-04',
    fechaVencimiento: '2026-04-20',
    descripcion: 'DDJJ IVA Abril',
    estado: 'PENDIENTE',
  },
  {
    id: 'v2',
    cliente: 'Juan Perez',
    clienteId: 'c2',
    tipoObligacion: 'GANANCIAS',
    periodo: '2026-04',
    fechaVencimiento: '2026-04-15',
    descripcion: 'DDJJ Ganancias',
    estado: 'PRESENTADO',
  },
];

let mockApiFetch: ReturnType<typeof vi.fn>;

vi.mock('@/lib/api-client', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
  setEstudioId: vi.fn(),
  setOnUnauthorized: vi.fn(),
}));

import VencimientosPage from './page';

describe('VencimientosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEstudioActual = { id: 'est-1', nombre: 'Estudio Test', rol: 'SOCIO' };
    mockApiFetch = vi.fn().mockImplementation((path: string) => {
      if (path === '/v1/vencimientos') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockVencimientos, meta: { total: 2 } }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [] }) });
    });
  });

  it('renders page title', async () => {
    render(<VencimientosPage />);
    await waitFor(() => {
      const headings = screen.getAllByText('Vencimientos');
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  it('calls /v1/vencimientos endpoint', async () => {
    render(<VencimientosPage />);
    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/v1/vencimientos', expect.any(Object));
    });
  });

  it('renders KPI labels', async () => {
    render(<VencimientosPage />);
    await waitFor(() => {
      expect(screen.getByText('Pendientes')).toBeInTheDocument();
    });
    expect(screen.getByText('Vencidos')).toBeInTheDocument();
    expect(screen.getByText('Presentados mes')).toBeInTheDocument();
    expect(screen.getByText('Próximo')).toBeInTheDocument();
  });

  it('renders cliente rows in table', async () => {
    render(<VencimientosPage />);
    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha SRL')).toBeInTheDocument();
    });
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
  });
});
