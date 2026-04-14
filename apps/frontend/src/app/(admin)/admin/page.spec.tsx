import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock recharts to avoid canvas issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div />,
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
  growthData: [
    { mes: '2026-03', usuarios: 40, estudios: 10 },
    { mes: '2026-04', usuarios: 48, estudios: 12 },
  ],
  revenueData: [
    { mes: '2026-03', mrr: 100000, arr: 1200000 },
    { mes: '2026-04', mrr: 125000, arr: 1500000 },
  ],
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
  topTenants: [
    { id: 't1', nombre: 'Estudio Alpha', plan: 'Enterprise', usuarios: 15, clientes: 80, actividad: 95 },
    { id: 't2', nombre: 'Estudio Beta', plan: 'Profesional', usuarios: 8, clientes: 40, actividad: 60 },
  ],
  registrosRecientes: [
    { id: 'r1', nombre: 'Estudio Nuevo', plan: 'Trial', email: 'nuevo@test.com', creadoEn: '2026-04-13' },
    { id: 'r2', nombre: 'Estudio Reciente', plan: 'Profesional', email: 'reciente@test.com', creadoEn: '2026-04-12' },
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

  it('should render loading state initially', () => {
    render(<AdminPage />);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
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

  it('should render growth chart section', async () => {
    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Crecimiento de Usuarios y Estudios')).toBeInTheDocument();
    });

    expect(screen.getByText('Últimos 12 meses')).toBeInTheDocument();
  });

  it('should render plan distribution donut chart', async () => {
    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Distribución por Plan')).toBeInTheDocument();
    });

    expect(screen.getByText('12 estudios activos')).toBeInTheDocument();
  });

  it('should render revenue chart section', async () => {
    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Revenue: MRR y ARR')).toBeInTheDocument();
    });

    expect(screen.getByText('Evolución en pesos argentinos')).toBeInTheDocument();
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

  it('should render quick actions panel with all 6 buttons', async () => {
    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Acciones Rápidas')).toBeInTheDocument();
    });

    expect(screen.getByText('Crear Estudio')).toBeInTheDocument();
    expect(screen.getByText('Nuevo Usuario')).toBeInTheDocument();
    expect(screen.getByText('Ver Logs')).toBeInTheDocument();
    expect(screen.getByText('Configuración')).toBeInTheDocument();
    expect(screen.getByText('Notificaciones')).toBeInTheDocument();
    expect(screen.getByText('Backups')).toBeInTheDocument();
  });

  it('should render quick action buttons as links to correct routes', async () => {
    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Acciones Rápidas')).toBeInTheDocument();
    });

    const crearEstudio = screen.getByText('Crear Estudio').closest('a');
    expect(crearEstudio).toHaveAttribute('href', '/admin/estudios');

    const nuevoUsuario = screen.getByText('Nuevo Usuario').closest('a');
    expect(nuevoUsuario).toHaveAttribute('href', '/admin/usuarios');

    const verLogs = screen.getByText('Ver Logs').closest('a');
    expect(verLogs).toHaveAttribute('href', '/admin/logs');
  });

  it('should render quick action icons', async () => {
    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Acciones Rápidas')).toBeInTheDocument();
    });

    expect(screen.getByText('domain_add')).toBeInTheDocument();
    expect(screen.getByText('person_add')).toBeInTheDocument();
    expect(screen.getByText('receipt_long')).toBeInTheDocument();
    expect(screen.getByText('tune')).toBeInTheDocument();
    expect(screen.getByText('mail')).toBeInTheDocument();
    expect(screen.getByText('database')).toBeInTheDocument();
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
  });

  it('should render top tenants table with activity bars', async () => {
    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Estudio Alpha')).toBeInTheDocument();
    });

    expect(screen.getByText('Estudio Beta')).toBeInTheDocument();
    // Activity scores
    expect(screen.getByText('95')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();
  });

  it('should render top tenants plan badges', async () => {
    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Estudio Alpha')).toBeInTheDocument();
    });

    expect(screen.getByText('Enterprise')).toBeInTheDocument();
  });

  it('should render top tenants user and client counts', async () => {
    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Estudio Alpha')).toBeInTheDocument();
    });

    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
  });

  it('should render recent registrations with name and email', async () => {
    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Estudio Nuevo')).toBeInTheDocument();
    });

    expect(screen.getByText('nuevo@test.com')).toBeInTheDocument();
    expect(screen.getByText('Estudio Reciente')).toBeInTheDocument();
    expect(screen.getByText('reciente@test.com')).toBeInTheDocument();
  });

  it('should render recent registrations with plan and date', async () => {
    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Estudio Nuevo')).toBeInTheDocument();
    });

    expect(screen.getByText('Trial')).toBeInTheDocument();
    expect(screen.getByText('2026-04-13')).toBeInTheDocument();
    expect(screen.getByText('2026-04-12')).toBeInTheDocument();
  });

  it('should render chart legends for growth chart', async () => {
    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Crecimiento de Usuarios y Estudios')).toBeInTheDocument();
    });

    expect(screen.getByText('Usuarios')).toBeInTheDocument();
    expect(screen.getByText('Estudios')).toBeInTheDocument();
  });

  it('should render chart legends for revenue chart', async () => {
    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Revenue: MRR y ARR')).toBeInTheDocument();
    });

    // MRR and ARR legends (text content in legend spans)
    const mrrElements = screen.getAllByText('MRR');
    expect(mrrElements.length).toBeGreaterThanOrEqual(2); // KPI label + chart legend
    const arrElements = screen.getAllByText('ARR');
    expect(arrElements.length).toBeGreaterThanOrEqual(1);
  });

  it('should render page title and subtitle', async () => {
    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Panel de Administración')).toBeInTheDocument();
    });

    expect(screen.getByText('Vista general de la plataforma Numerito.')).toBeInTheDocument();
  });

  it('should show error state on fetch failure', async () => {
    const { apiFetch } = await import('@/lib/api-client');
    (apiFetch as any).mockRejectedValue(new Error('Network error'));

    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('should handle health check failure gracefully', async () => {
    const { apiFetch } = await import('@/lib/api-client');
    (apiFetch as any).mockImplementation((url: string) => {
      if (url.includes('/health')) {
        return Promise.reject(new Error('Health check unavailable'));
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockStats }),
      });
    });

    render(<AdminPage />);

    // Dashboard should still load without health data
    await waitFor(() => {
      expect(screen.getByText('Panel de Administración')).toBeInTheDocument();
    });

    // Health panel should not be visible
    expect(screen.queryByText('Estado del Sistema')).not.toBeInTheDocument();
  });

  it('should render plan distribution legend entries', async () => {
    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Distribución por Plan')).toBeInTheDocument();
    });

    // Plan names in legend
    const profEntries = screen.getAllByText('Profesional');
    expect(profEntries.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Starter')).toBeInTheDocument();

    // Plan counts in legend
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });
});
