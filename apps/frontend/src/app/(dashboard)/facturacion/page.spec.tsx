import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    estudioActual: { id: 'est-1', nombre: 'Estudio Test', rol: 'SOCIO' },
    user: { id: 'u-1', email: 'admin@test.com', rol: 'SOCIO' },
    permisos: ['VER_FACTURACION'],
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
  facturado: 100000,
  cobrado: 80000,
  cobradoPorcentaje: 80,
  saldoPendiente: 20000,
  facturasVencidas: 1,
  porEstado: [],
  mensual: [],
};

import FacturacionPage from './page';

describe('FacturacionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiFetch = vi.fn().mockImplementation((path: string) => {
      if (path === '/v1/facturacion/stats') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: mockStats }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [] }) });
    });
  });

  it('renders page title', async () => {
    render(<FacturacionPage />);
    await waitFor(() => {
      expect(screen.getByText('Facturación')).toBeInTheDocument();
    });
  });

  it('calls /v1/facturacion/stats endpoint', async () => {
    render(<FacturacionPage />);
    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/v1/facturacion/stats', expect.any(Object));
    });
  });

  it('renders Nueva factura button that opens modal', async () => {
    render(<FacturacionPage />);
    await waitFor(() => {
      expect(screen.getByText('Nueva factura')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Nueva factura'));
    await waitFor(() => {
      expect(screen.getByText('Emitir una nueva factura al cliente.')).toBeInTheDocument();
    });
  });

  it('renders Exportar button', async () => {
    render(<FacturacionPage />);
    await waitFor(() => {
      expect(screen.getByText('Exportar')).toBeInTheDocument();
    });
  });
});
