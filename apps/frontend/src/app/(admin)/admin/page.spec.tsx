import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// Mock recharts to avoid canvas issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  CartesianGrid: () => <div />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div />,
  Cell: () => <div />,
  Legend: () => <div />,
}));

const sparkline12 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const mockStats = {
  kpis: {
    estudiosActivos: { value: 12, delta: '+8.3%', deltaUp: true, sparkline: sparkline12 },
    totalUsuarios: { value: 48, delta: '+5%', deltaUp: true, sparkline: sparkline12 },
    subscripcionesActivas: { value: 10, delta: '+10%', deltaUp: true, sparkline: sparkline12 },
    mrr: { value: 125000, delta: '+18.7%', deltaUp: true, sparkline: sparkline12 },
    churnMensual: { value: 2.4, delta: '-0.3%', deltaUp: true, sparkline: sparkline12 },
    uptime: { value: 99.98, delta: 'SLA OK', deltaUp: true, sparkline: Array(12).fill(99.98) },
  },
  registrosMensuales: [
    { mes: '2026-03', cantidad: 5 },
    { mes: '2026-04', cantidad: 8 },
  ],
  distribucionPlanes: [
    { plan: 'Profesional', cantidad: 8 },
    { plan: 'Starter', cantidad: 4 },
  ],
  alertas: [{ tipo: 'warning', mensaje: '3 subscripciones por vencer', fecha: '2026-04-01' }],
  estudiosRecientes: [
    {
      id: '1',
      nombre: 'Estudio Contable X',
      plan: 'Profesional',
      estado: 'Activo',
      creadoEn: '2026-01-15',
    },
  ],
};

const mockHealth = {
  services: [
    { name: 'API Principal', status: 'operational', latencyMs: 1, lastCheck: '2026-04-13T00:00:00Z' },
    { name: 'Base de Datos', status: 'operational', latencyMs: 5, lastCheck: '2026-04-13T00:00:00Z' },
    { name: 'Queue Workers', status: 'operational', latencyMs: 0, lastCheck: '2026-04-13T00:00:00Z' },
    { name: 'ARCA Integration', status: 'degraded', latencyMs: 2500, lastCheck: '2026-04-13T00:00:00Z' },
    { name: 'Storage S3', status: 'down', latencyMs: 5000, lastCheck: '2026-04-13T00:00:00Z' },
  ],
  uptimePercent: 99.95,
};

vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn((url: string) => {
    if (url.includes('/health')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockHealth }),
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: mockStats }),
    });
  }),
}));

import AdminPage from './page';

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render KPI cards with data', async () => {
    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    expect(screen.getByText('48')).toBeInTheDocument();
    expect(screen.getByText('$125.000')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('should render all 6 KPI labels', async () => {
    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Estudios Activos')).toBeInTheDocument();
    });

    expect(screen.getByText('Usuarios Totales')).toBeInTheDocument();
    expect(screen.getByText('Suscripciones Activas')).toBeInTheDocument();
    expect(screen.getByText('MRR')).toBeInTheDocument();
    expect(screen.getByText('Churn Mensual')).toBeInTheDocument();
    expect(screen.getByText('Uptime')).toBeInTheDocument();
  });

  it('should render delta values for KPIs', async () => {
    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('+8.3%')).toBeInTheDocument();
    });

    expect(screen.getByText('SLA OK')).toBeInTheDocument();
  });

  it('should render loading state initially', () => {
    render(<AdminPage />);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('should render chart sections', async () => {
    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Registros de Estudios')).toBeInTheDocument();
    });

    expect(screen.getByText('Distribución de Planes')).toBeInTheDocument();
  });

  it('should render alertas section', async () => {
    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Alertas del Sistema')).toBeInTheDocument();
    });

    expect(screen.getByText('3 subscripciones por vencer')).toBeInTheDocument();
  });

  it('should render estudios recientes table', async () => {
    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Estudio Contable X')).toBeInTheDocument();
    });

    expect(screen.getByText('Profesional')).toBeInTheDocument();
  });

  it('should render system status panel with service names', async () => {
    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Estado del Sistema')).toBeInTheDocument();
    });

    expect(screen.getByText('API Principal')).toBeInTheDocument();
    expect(screen.getByText('Base de Datos')).toBeInTheDocument();
    expect(screen.getByText('Queue Workers')).toBeInTheDocument();
    expect(screen.getByText('ARCA Integration')).toBeInTheDocument();
    expect(screen.getByText('Storage S3')).toBeInTheDocument();
  });

  it('should show uptime percentage in status panel', async () => {
    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('99.95%')).toBeInTheDocument();
    });
  });

  it('should show status labels for each service', async () => {
    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Estado del Sistema')).toBeInTheDocument();
    });

    // 3 operational, 1 degraded, 1 down
    const operativos = screen.getAllByText('Operativo');
    expect(operativos).toHaveLength(3);
    expect(screen.getByText('Degradado')).toBeInTheDocument();
    expect(screen.getByText('Caído')).toBeInTheDocument();
  });

  it('should show latency for services with non-zero latency', async () => {
    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('5ms')).toBeInTheDocument();
    });

    expect(screen.getByText('2500ms')).toBeInTheDocument();
    expect(screen.getByText('5000ms')).toBeInTheDocument();
  });
});
