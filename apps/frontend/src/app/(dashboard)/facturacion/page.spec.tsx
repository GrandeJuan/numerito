import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const mockTienePermiso = vi.fn();
let mockEstudioActual: any = { id: 'est-1', nombre: 'Estudio Test', rol: 'SOCIO' };

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    get estudioActual() { return mockEstudioActual; },
    tienePermiso: mockTienePermiso,
  }),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }: any) => <div>{children}</div>,
  Cell: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
}));

const mockStats = {
  facturado: 500000,
  cobrado: 350000,
  cobradoPorcentaje: 70,
  saldoPendiente: 150000,
  facturasVencidas: 3,
  porEstado: [
    { estado: 'EMITIDA', cantidad: 5 },
    { estado: 'PAGADA', cantidad: 8 },
    { estado: 'VENCIDA', cantidad: 3 },
  ],
  mensual: [
    { mes: '2026-01', facturado: 200000, cobrado: 150000 },
    { mes: '2026-02', facturado: 300000, cobrado: 200000 },
  ],
};

const mockFacturas = [
  {
    id: 'f1',
    numero: 'FAC-001',
    clienteId: 'c1',
    fechaEmision: '2026-01-15',
    total: 121000,
    estado: 'EMITIDA',
    totalPagado: 0,
  },
  {
    id: 'f2',
    numero: 'FAC-002',
    clienteId: 'c2',
    fechaEmision: '2026-02-10',
    total: 242000,
    estado: 'PAGADA',
    totalPagado: 242000,
  },
];

let mockApiFetch: ReturnType<typeof vi.fn>;

vi.mock('@/lib/api-client', () => ({
  apiFetch: (...args: any[]) => mockApiFetch(...args),
}));

import FacturacionPage from './page';

describe('FacturacionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTienePermiso.mockReturnValue(true);
    mockEstudioActual = { id: 'est-1', nombre: 'Estudio Test', rol: 'SOCIO' };
    mockApiFetch = vi.fn().mockImplementation((path: string) => {
      if (path.includes('/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockStats }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockFacturas, meta: { total: 2, page: 1, limit: 20 } }),
      });
    });
  });

  it('should show loading state initially', () => {
    render(<FacturacionPage />);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('should render page title', async () => {
    render(<FacturacionPage />);
    await waitFor(() => {
      expect(screen.getByText('Facturacion')).toBeInTheDocument();
    });
  });

  it('should show unauthorized message when lacking permission', async () => {
    mockTienePermiso.mockReturnValue(false);
    render(<FacturacionPage />);
    await waitFor(() => {
      expect(screen.getByText(/No tiene permisos/)).toBeInTheDocument();
    });
  });

  it('should show message when no estudio selected', () => {
    mockEstudioActual = null;
    render(<FacturacionPage />);
    expect(screen.getByText('Cargando estudio...')).toBeInTheDocument();
  });

  it('should render KPI cards with stats', async () => {
    render(<FacturacionPage />);
    await waitFor(() => {
      expect(screen.getByText('Facturado')).toBeInTheDocument();
    });
    expect(screen.getByText('Cobrado')).toBeInTheDocument();
    expect(screen.getByText('Saldo Pendiente')).toBeInTheDocument();
    expect(screen.getByText('Facturas Vencidas')).toBeInTheDocument();
  });

  it('should render area chart section', async () => {
    render(<FacturacionPage />);
    await waitFor(() => {
      expect(screen.getByText('Facturacion vs Cobranzas')).toBeInTheDocument();
    });
  });

  it('should render pie chart section', async () => {
    render(<FacturacionPage />);
    await waitFor(() => {
      expect(screen.getByText('Estado de Facturas')).toBeInTheDocument();
    });
  });

  it('should render facturas table', async () => {
    render(<FacturacionPage />);
    await waitFor(() => {
      expect(screen.getByText('FAC-001')).toBeInTheDocument();
    });
    expect(screen.getByText('FAC-002')).toBeInTheDocument();
  });

  it('should show estado badges', async () => {
    render(<FacturacionPage />);
    await waitFor(() => {
      expect(screen.getByText('Emitida')).toBeInTheDocument();
    });
    expect(screen.getByText('Pagada')).toBeInTheDocument();
  });

  it('should show pagination info', async () => {
    render(<FacturacionPage />);
    await waitFor(() => {
      expect(screen.getByText(/Mostrando/)).toBeInTheDocument();
    });
  });

  it('should show error state on API failure', async () => {
    mockApiFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: 'Error' }),
    });
    render(<FacturacionPage />);
    await waitFor(() => {
      expect(screen.getByText(/Error al cargar/)).toBeInTheDocument();
    });
  });

  it('should call apiFetch with correct paths', async () => {
    render(<FacturacionPage />);
    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/v1/facturacion/stats');
      expect(mockApiFetch).toHaveBeenCalledWith('/v1/facturacion/facturas?page=1&limit=20');
    });
  });
});
