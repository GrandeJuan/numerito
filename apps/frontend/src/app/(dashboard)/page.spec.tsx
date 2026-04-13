import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock recharts
vi.mock('@/components/shared/page-state-guard', () => ({
  PageStateGuard: ({ estudioActual, loading, error, children }: any) => {
    if (!estudioActual) return <p>Cargando estudio...</p>;
    if (loading) return <p>Cargando...</p>;
    if (error) return <p className="text-red-500">{error}</p>;
    return <>{children}</>;
  },
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div />,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  CartesianGrid: () => <div />,
}));

const mockTienePermiso = vi.fn();
let mockEstudioActual: any = { id: 'est-1', nombre: 'Estudio Test', rol: 'SOCIO' };

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    get estudioActual() {
      return mockEstudioActual;
    },
    tienePermiso: mockTienePermiso,
  }),
}));

const fullStats = {
  kpis: {
    clientes: 25,
    vencimientosProximos: 8,
    facturacionMes: 120000,
    tareasActivas: 12,
  },
  vencimientosPorEstado: [
    { estado: 'Pendiente', cantidad: 5 },
    { estado: 'Cumplido', cantidad: 10 },
  ],
  facturacionMensual: [
    { mes: '2026-03', monto: 80000 },
    { mes: '2026-04', monto: 120000 },
  ],
  proximosVencimientos: [
    {
      id: 'v1',
      cliente: 'Cliente SA',
      obligacion: 'IVA',
      fecha: '2026-04-15',
      estado: 'Pendiente',
    },
  ],
  actividadReciente: [
    {
      tipo: 'tarea',
      descripcion: 'Tarea "Declaracion" actualizada',
      fecha: '2026-04-03',
      usuario: 'test@test.com',
    },
  ],
  cargaTrabajo: [{ usuario: 'ana@test.com', tareas: 5 }],
};

let mockFetchResult: { data: any; loading: boolean; error: string | null; refetch: () => void };

vi.mock('@/lib/use-fetch-with-estudio', () => ({
  useFetchWithEstudio: () => mockFetchResult,
}));

import DashboardPage from './page';

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTienePermiso.mockReturnValue(true);
    mockEstudioActual = { id: 'est-1', nombre: 'Estudio Test', rol: 'SOCIO' };
    mockFetchResult = { data: fullStats, loading: false, error: null, refetch: vi.fn() };
  });

  it('should show loading state initially', () => {
    mockFetchResult = { data: fullStats, loading: true, error: null, refetch: vi.fn() };
    render(<DashboardPage />);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('should render KPI cards with data', () => {
    render(<DashboardPage />);

    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('$120.000')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('should render KPI labels', () => {
    render(<DashboardPage />);

    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.getByText('Vencimientos Proximos')).toBeInTheDocument();
    expect(screen.getByText('Facturacion Mes')).toBeInTheDocument();
    expect(screen.getByText('Tareas Activas')).toBeInTheDocument();
  });

  it('should render vencimientos por estado chart section', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Vencimientos por Estado')).toBeInTheDocument();
  });

  it('should render facturacion mensual when permission granted', () => {
    mockTienePermiso.mockReturnValue(true);
    render(<DashboardPage />);
    expect(screen.getByText('Facturacion Mensual')).toBeInTheDocument();
  });

  it('should hide facturacion mensual when permission denied', () => {
    mockTienePermiso.mockReturnValue(false);
    render(<DashboardPage />);

    expect(screen.getByText('Vencimientos por Estado')).toBeInTheDocument();
    expect(screen.queryByText('Facturacion Mensual')).not.toBeInTheDocument();
  });

  it('should render proximos vencimientos table', () => {
    render(<DashboardPage />);

    expect(screen.getByText('Proximos Vencimientos')).toBeInTheDocument();
    expect(screen.getByText('Cliente SA')).toBeInTheDocument();
    expect(screen.getByText('IVA')).toBeInTheDocument();
    expect(screen.getByText('Ver todos')).toBeInTheDocument();
  });

  it('should render actividad reciente', () => {
    render(<DashboardPage />);

    expect(screen.getByText('Actividad Reciente')).toBeInTheDocument();
    expect(screen.getByText('Tarea "Declaracion" actualizada')).toBeInTheDocument();
  });

  it('should render carga de trabajo when data present', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Carga de Trabajo')).toBeInTheDocument();
  });

  it('should not render facturacion KPI when not in data', () => {
    const statsWithoutFacturacion = {
      ...fullStats,
      kpis: { clientes: 5, vencimientosProximos: 2, tareasActivas: 3 },
      facturacionMensual: undefined,
      cargaTrabajo: undefined,
    };
    mockFetchResult = {
      data: statsWithoutFacturacion,
      loading: false,
      error: null,
      refetch: vi.fn(),
    };

    render(<DashboardPage />);

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.queryByText('Facturacion Mes')).not.toBeInTheDocument();
    expect(screen.queryByText('Carga de Trabajo')).not.toBeInTheDocument();
  });
});

describe('DashboardPage — no estudio selected', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEstudioActual = null;
    mockTienePermiso.mockReturnValue(false);
    mockFetchResult = { data: fullStats, loading: false, error: null, refetch: vi.fn() };
  });

  it('should show message to select estudio', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Cargando estudio...')).toBeInTheDocument();
  });
});
