import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// Mock recharts to avoid canvas issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
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

const mockStats = {
  kpis: {
    estudiosActivos: 12,
    totalUsuarios: 48,
    mrr: 125000,
    subscripcionesPorVencer: 3,
  },
  registrosMensuales: [
    { mes: '2026-03', cantidad: 5 },
    { mes: '2026-04', cantidad: 8 },
  ],
  distribucionPlanes: [
    { plan: 'Profesional', cantidad: 8 },
    { plan: 'Starter', cantidad: 4 },
  ],
  alertas: [
    { tipo: 'warning', mensaje: '3 subscripciones por vencer', fecha: '2026-04-01' },
  ],
  estudiosRecientes: [
    { id: '1', nombre: 'Estudio Contable X', plan: 'Profesional', estado: 'Activo', creadoEn: '2026-01-15' },
  ],
};

vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ data: mockStats }),
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
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should render KPI labels', async () => {
    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Estudios Activos')).toBeInTheDocument();
    });

    expect(screen.getByText('Usuarios Totales')).toBeInTheDocument();
    expect(screen.getByText('MRR')).toBeInTheDocument();
    expect(screen.getByText('Por Vencer')).toBeInTheDocument();
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
      expect(screen.getByText('Estudios Recientes')).toBeInTheDocument();
    });

    expect(screen.getByText('Estudio Contable X')).toBeInTheDocument();
  });
});
