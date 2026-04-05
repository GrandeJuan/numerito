import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
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
    get estudioActual() { return mockEstudioActual; },
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
    { id: 'v1', cliente: 'Cliente SA', obligacion: 'IVA', fecha: '2026-04-15', estado: 'Pendiente' },
  ],
  actividadReciente: [
    { tipo: 'tarea', descripcion: 'Tarea "Declaracion" actualizada', fecha: '2026-04-03', usuario: 'test@test.com' },
  ],
  cargaTrabajo: [
    { usuario: 'ana@test.com', tareas: 5 },
  ],
};

let mockApiFetch: ReturnType<typeof vi.fn>;

vi.mock('@/lib/api-client', () => ({
  apiFetch: (...args: any[]) => mockApiFetch(...args),
}));

import DashboardPage from './page';

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTienePermiso.mockReturnValue(true);
    mockApiFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: fullStats }),
    });
    mockEstudioActual = { id: 'est-1', nombre: 'Estudio Test', rol: 'SOCIO' };
  });

  it('should show loading state initially', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('should render KPI cards with data', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument();
    });

    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('$120.000')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('should render KPI labels', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Clientes')).toBeInTheDocument();
    });

    expect(screen.getByText('Vencimientos Proximos')).toBeInTheDocument();
    expect(screen.getByText('Facturacion Mes')).toBeInTheDocument();
    expect(screen.getByText('Tareas Activas')).toBeInTheDocument();
  });

  it('should render vencimientos por estado chart section', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Vencimientos por Estado')).toBeInTheDocument();
    });
  });

  it('should render facturacion mensual when permission granted', async () => {
    mockTienePermiso.mockReturnValue(true);
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Facturacion Mensual')).toBeInTheDocument();
    });
  });

  it('should hide facturacion mensual when permission denied', async () => {
    mockTienePermiso.mockReturnValue(false);
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Vencimientos por Estado')).toBeInTheDocument();
    });

    expect(screen.queryByText('Facturacion Mensual')).not.toBeInTheDocument();
  });

  it('should render proximos vencimientos table', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Proximos Vencimientos')).toBeInTheDocument();
    });

    expect(screen.getByText('Cliente SA')).toBeInTheDocument();
    expect(screen.getByText('IVA')).toBeInTheDocument();
    expect(screen.getByText('Ver todos')).toBeInTheDocument();
  });

  it('should render actividad reciente', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Actividad Reciente')).toBeInTheDocument();
    });

    expect(screen.getByText('Tarea "Declaracion" actualizada')).toBeInTheDocument();
  });

  it('should render carga de trabajo when data present', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Carga de Trabajo')).toBeInTheDocument();
    });
  });

  it('should not render facturacion KPI when not in data', async () => {
    const statsWithoutFacturacion = {
      ...fullStats,
      kpis: { clientes: 5, vencimientosProximos: 2, tareasActivas: 3 },
      facturacionMensual: undefined,
      cargaTrabajo: undefined,
    };
    mockApiFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: statsWithoutFacturacion }),
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    expect(screen.queryByText('Facturacion Mes')).not.toBeInTheDocument();
    expect(screen.queryByText('Carga de Trabajo')).not.toBeInTheDocument();
  });
});

describe('DashboardPage — no estudio selected', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEstudioActual = null;
    mockTienePermiso.mockReturnValue(false);
  });

  it('should show message to select estudio', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Cargando estudio...')).toBeInTheDocument();
  });
});
