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
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
}));

const mockStats = {
  asientosDelPeriodo: 42,
  librosRubricados: 2,
  totalLibros: 4,
  balanceCuadrado: true,
  libros: [
    { id: 'l1', tipo: 'IVA_COMPRAS', periodo: '2026-01', isRubricado: true, numeroRubrica: 'RUB-001' },
    { id: 'l2', tipo: 'IVA_VENTAS', periodo: '2026-01', isRubricado: true, numeroRubrica: 'RUB-002' },
    { id: 'l3', tipo: 'DIARIO', periodo: '2026-01', isRubricado: false },
    { id: 'l4', tipo: 'INVENTARIO_BALANCES', periodo: '2026-01', isRubricado: false },
  ],
  mensualDebeHaber: [
    { mes: '2026-01', debe: 50000, haber: 50000 },
    { mes: '2026-02', debe: 75000, haber: 75000 },
  ],
  asientosRecientes: [
    { id: 'a1', fecha: '2026-03-01', descripcion: 'Compra materiales', totalDebe: 5000, totalHaber: 5000 },
    { id: 'a2', fecha: '2026-02-28', descripcion: 'Pago proveedores', totalDebe: 3000, totalHaber: 3000 },
  ],
};

let mockApiFetch: ReturnType<typeof vi.fn>;

vi.mock('@/lib/api-client', () => ({
  apiFetch: (...args: any[]) => mockApiFetch(...args),
}));

import ContabilidadPage from './page';

describe('ContabilidadPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTienePermiso.mockReturnValue(true);
    mockEstudioActual = { id: 'est-1', nombre: 'Estudio Test', rol: 'SOCIO' };
    mockApiFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockStats }),
    });
  });

  it('should show loading state initially', () => {
    render(<ContabilidadPage />);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('should render page title', async () => {
    render(<ContabilidadPage />);
    await waitFor(() => {
      expect(screen.getByText('Contabilidad')).toBeInTheDocument();
    });
  });

  it('should show unauthorized message when lacking permission', async () => {
    mockTienePermiso.mockReturnValue(false);
    render(<ContabilidadPage />);
    await waitFor(() => {
      expect(screen.getByText(/No tiene permisos/)).toBeInTheDocument();
    });
  });

  it('should show message when no estudio selected', () => {
    mockEstudioActual = null;
    render(<ContabilidadPage />);
    expect(screen.getByText('Cargando estudio...')).toBeInTheDocument();
  });

  it('should render KPI cards', async () => {
    render(<ContabilidadPage />);
    await waitFor(() => {
      expect(screen.getByText('Asientos del Periodo')).toBeInTheDocument();
    });
    expect(screen.getByText('Libros Rubricados')).toBeInTheDocument();
    expect(screen.getByText('Balance')).toBeInTheDocument();
  });

  it('should show balance cuadrado in green', async () => {
    render(<ContabilidadPage />);
    await waitFor(() => {
      expect(screen.getByText('Cuadrado')).toBeInTheDocument();
    });
  });

  it('should show balance descuadrado in red', async () => {
    mockApiFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { ...mockStats, balanceCuadrado: false } }),
    });
    render(<ContabilidadPage />);
    await waitFor(() => {
      expect(screen.getByText('Descuadrado')).toBeInTheDocument();
    });
  });

  it('should render libros contables card list', async () => {
    render(<ContabilidadPage />);
    await waitFor(() => {
      expect(screen.getByText('Libros Contables')).toBeInTheDocument();
    });
    expect(screen.getByText('IVA Compras')).toBeInTheDocument();
    expect(screen.getByText('IVA Ventas')).toBeInTheDocument();
    expect(screen.getByText('Diario')).toBeInTheDocument();
  });

  it('should show rubricado badges on libros', async () => {
    render(<ContabilidadPage />);
    await waitFor(() => {
      const rubricados = screen.getAllByText('Rubricado');
      expect(rubricados.length).toBe(2);
    });
    const pendientes = screen.getAllByText('Pendiente');
    expect(pendientes.length).toBe(2);
  });

  it('should render bar chart section', async () => {
    render(<ContabilidadPage />);
    await waitFor(() => {
      expect(screen.getByText('Debe vs Haber por Mes')).toBeInTheDocument();
    });
  });

  it('should render recent asientos table', async () => {
    render(<ContabilidadPage />);
    await waitFor(() => {
      expect(screen.getByText('Compra materiales')).toBeInTheDocument();
    });
    expect(screen.getByText('Pago proveedores')).toBeInTheDocument();
  });

  it('should show error state on API failure', async () => {
    mockApiFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: 'Error' }),
    });
    render(<ContabilidadPage />);
    await waitFor(() => {
      expect(screen.getByText(/Error al cargar/)).toBeInTheDocument();
    });
  });

  it('should call apiFetch with correct path', async () => {
    render(<ContabilidadPage />);
    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/v1/contabilidad/stats');
    });
  });
});
