import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

let mockUser: any = { id: 'u1', email: 'cliente@test.com', rol: 'CLIENTE' };

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

const mockStats = {
  clienteNombre: 'Mi Empresa SRL',
  kpis: {
    vencimientosPendientes: 3,
    facturasPendientes: 2,
    documentos: 10,
  },
  vencimientosRecientes: [
    { id: 'v1', obligacion: 'IVA', fecha: '2026-04-15', estado: 'Pendiente' },
    { id: 'v2', obligacion: 'Ganancias', fecha: '2026-04-20', estado: 'Cumplido' },
  ],
  facturasRecientes: [
    { id: 'f1', numero: 'A-0001-00001', monto: 5000, estado: 'Pendiente', fecha: '2026-04-01' },
  ],
  documentosRecientes: [
    { id: 'd1', nombre: 'Balance.pdf', tipo: 'PDF', fecha: '2026-04-01' },
  ],
};

let mockApiFetch: ReturnType<typeof vi.fn>;

vi.mock('@/lib/api-client', () => ({
  apiFetch: (...args: any[]) => mockApiFetch(...args),
}));

import PortalPage from './page';

describe('PortalPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { id: 'u1', email: 'cliente@test.com', rol: 'CLIENTE' };
    mockApiFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockStats }),
    });
  });

  it('should show loading state initially', () => {
    render(<PortalPage />);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('should render welcome banner with client name', async () => {
    render(<PortalPage />);
    await waitFor(() => {
      expect(screen.getByText(/Mi Empresa SRL/)).toBeInTheDocument();
    });
  });

  it('should render 3 KPI cards', async () => {
    render(<PortalPage />);
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Vencimientos Pendientes')).toBeInTheDocument();
    expect(screen.getByText('Facturas Pendientes')).toBeInTheDocument();
    expect(screen.getByText('Documentos')).toBeInTheDocument();
  });

  it('should render proximos vencimientos list', async () => {
    render(<PortalPage />);
    await waitFor(() => {
      expect(screen.getByText('Proximos Vencimientos')).toBeInTheDocument();
    });
    expect(screen.getByText('IVA')).toBeInTheDocument();
    expect(screen.getByText('Ganancias')).toBeInTheDocument();
  });

  it('should render ultimas facturas list', async () => {
    render(<PortalPage />);
    await waitFor(() => {
      expect(screen.getByText('Ultimas Facturas')).toBeInTheDocument();
    });
    expect(screen.getByText('A-0001-00001')).toBeInTheDocument();
  });

  it('should render documentos recientes', async () => {
    render(<PortalPage />);
    await waitFor(() => {
      expect(screen.getByText('Documentos Recientes')).toBeInTheDocument();
    });
    expect(screen.getByText('Balance.pdf')).toBeInTheDocument();
  });

  it('should have "Ver todos" links', async () => {
    render(<PortalPage />);
    await waitFor(() => {
      const links = screen.getAllByText('Ver todos');
      expect(links.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('should show error when API fails', async () => {
    mockApiFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'Error' } }),
    });
    render(<PortalPage />);
    await waitFor(() => {
      expect(screen.getByText(/Error al cargar/)).toBeInTheDocument();
    });
  });

  it('should call portal dashboard stats endpoint', async () => {
    render(<PortalPage />);
    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/v1/portal/dashboard/stats');
    });
  });
});
