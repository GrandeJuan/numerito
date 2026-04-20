import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'fact-1' }),
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

const mockFactura = {
  id: 'fact-1',
  numero: 'A-001-00000001',
  tipo: 'A',
  fecha: '2026-04-01',
  fechaEmision: '2026-04-01',
  fechaVencimiento: '2026-05-01',
  cliente: 'Acme S.A.',
  total: 50000,
  saldo: 50000,
  estado: 'PENDIENTE',
};

import FacturaDetallePage from './page';

describe('FacturaDetallePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockFactura }),
    });
  });

  it('renders factura number', async () => {
    render(<FacturaDetallePage />);
    await waitFor(() => {
      expect(screen.getByText('Factura A-001-00000001')).toBeInTheDocument();
    });
  });

  it('fetches factura detail endpoint', async () => {
    render(<FacturaDetallePage />);
    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/v1/facturacion/facturas/fact-1',
        expect.any(Object),
      );
    });
  });

  it('shows action buttons for non-paid factura', async () => {
    render(<FacturaDetallePage />);
    await waitFor(() => {
      expect(screen.getByText('Registrar pago')).toBeInTheDocument();
      expect(screen.getByText('Anular factura')).toBeInTheDocument();
    });
  });
});
