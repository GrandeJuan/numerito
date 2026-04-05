import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

const mockTienePermiso = vi.fn();
let mockEstudioActual: any = { id: 'est-1', nombre: 'Estudio Test', rol: 'SOCIO' };

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    get estudioActual() { return mockEstudioActual; },
    tienePermiso: mockTienePermiso,
  }),
}));

const mockVencimientos = [
  {
    id: 'v1',
    cliente: 'Empresa Alpha SRL',
    clienteId: 'c1',
    tipoObligacion: 'IVA',
    periodo: '2026-04',
    fechaVencimiento: '2026-04-20',
    descripcion: 'DDJJ IVA Abril',
    estado: 'PENDIENTE',
  },
  {
    id: 'v2',
    cliente: 'Juan Perez',
    clienteId: 'c2',
    tipoObligacion: 'Ganancias',
    periodo: '2026-04',
    fechaVencimiento: '2026-04-15',
    descripcion: 'DDJJ Ganancias',
    estado: 'PRESENTADO',
  },
  {
    id: 'v3',
    cliente: 'Corp Beta SA',
    clienteId: 'c3',
    tipoObligacion: 'IIBB',
    periodo: '2026-03',
    fechaVencimiento: '2026-03-20',
    descripcion: 'DDJJ IIBB Marzo',
    estado: 'VENCIDO',
  },
];

const mockKpis = {
  pendientes: 5,
  vencidos: 2,
  presentadosEsteMes: 10,
  proximoVencimiento: '2026-04-15',
};

let mockApiFetch: ReturnType<typeof vi.fn>;

vi.mock('@/lib/api-client', () => ({
  apiFetch: (...args: any[]) => mockApiFetch(...args),
}));

import ObligacionesPage from './page';

describe('ObligacionesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTienePermiso.mockReturnValue(true);
    mockEstudioActual = { id: 'est-1', nombre: 'Estudio Test', rol: 'SOCIO' };
    mockApiFetch = vi.fn().mockImplementation((path: string) => {
      if (path.includes('/v1/obligaciones/kpis')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockKpis }),
        });
      }
      if (path.includes('/v1/obligaciones/calendario/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockVencimientos }),
        });
      }
      if (path.includes('/v1/obligaciones/vencimientos') && !path.includes('presentar')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockVencimientos, meta: { total: 3, page: 1, limit: 20 } }),
        });
      }
      // presentar endpoint
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: { ...mockVencimientos[0], estado: 'PRESENTADO' } }),
      });
    });
  });

  it('should show loading state initially', () => {
    render(<ObligacionesPage />);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('should render page title', async () => {
    render(<ObligacionesPage />);
    await waitFor(() => {
      expect(screen.getByText('Obligaciones')).toBeInTheDocument();
    });
  });

  it('should render 4 KPI cards', async () => {
    render(<ObligacionesPage />);
    await waitFor(() => {
      expect(screen.getByText('Pendientes')).toBeInTheDocument();
    });
    expect(screen.getByText('Vencidos')).toBeInTheDocument();
    expect(screen.getByText('Presentados este mes')).toBeInTheDocument();
    expect(screen.getByText('Proximo vencimiento')).toBeInTheDocument();
  });

  it('should render KPI values', async () => {
    render(<ObligacionesPage />);
    await waitFor(() => {
      // KPI value "5" may also appear as calendar day, so use getAllByText
      const matches = screen.getAllByText('5');
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });
    const twoMatches = screen.getAllByText('2');
    expect(twoMatches.length).toBeGreaterThanOrEqual(1);
    const tenMatches = screen.getAllByText('10');
    expect(tenMatches.length).toBeGreaterThanOrEqual(1);
    const dateMatches = screen.getAllByText('15/04/2026');
    expect(dateMatches.length).toBeGreaterThanOrEqual(1);
  });

  it('should render calendar section', async () => {
    render(<ObligacionesPage />);
    await waitFor(() => {
      expect(screen.getByText('Calendario de Vencimientos')).toBeInTheDocument();
    });
  });

  it('should render calendar navigation buttons', async () => {
    render(<ObligacionesPage />);
    await waitFor(() => {
      expect(screen.getByLabelText('Mes anterior')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Mes siguiente')).toBeInTheDocument();
  });

  it('should render day-of-week headers in calendar', async () => {
    render(<ObligacionesPage />);
    await waitFor(() => {
      expect(screen.getByText('Lun')).toBeInTheDocument();
    });
    expect(screen.getByText('Mar')).toBeInTheDocument();
    expect(screen.getByText('Mie')).toBeInTheDocument();
    expect(screen.getByText('Jue')).toBeInTheDocument();
    expect(screen.getByText('Vie')).toBeInTheDocument();
    expect(screen.getByText('Sab')).toBeInTheDocument();
    expect(screen.getByText('Dom')).toBeInTheDocument();
  });

  it('should render vencimientos table', async () => {
    render(<ObligacionesPage />);
    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha SRL')).toBeInTheDocument();
    });
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    expect(screen.getByText('Corp Beta SA')).toBeInTheDocument();
  });

  it('should show estado badges', async () => {
    render(<ObligacionesPage />);
    await waitFor(() => {
      expect(screen.getByText('Pendiente')).toBeInTheDocument();
    });
    expect(screen.getByText('Presentado')).toBeInTheDocument();
    expect(screen.getByText('Vencido')).toBeInTheDocument();
  });

  it('should show Presentar button for pendiente vencimientos', async () => {
    render(<ObligacionesPage />);
    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha SRL')).toBeInTheDocument();
    });
    const presentarButtons = screen.getAllByText('Presentar');
    expect(presentarButtons.length).toBeGreaterThan(0);
  });

  it('should call presentar endpoint when Presentar button clicked', async () => {
    render(<ObligacionesPage />);
    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha SRL')).toBeInTheDocument();
    });

    const presentarButtons = screen.getAllByText('Presentar');
    fireEvent.click(presentarButtons[0]);

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/v1/obligaciones/vencimientos/v1/presentar',
        expect.objectContaining({ method: 'PATCH' }),
      );
    });
  });

  it('should show pagination info', async () => {
    render(<ObligacionesPage />);
    await waitFor(() => {
      expect(screen.getByText(/Mostrando 1-3 de 3 vencimientos/)).toBeInTheDocument();
    });
  });

  it('should show message when no estudio selected', () => {
    mockEstudioActual = null;
    render(<ObligacionesPage />);
    expect(screen.getByText('Seleccione un estudio para ver las obligaciones.')).toBeInTheDocument();
  });

  it('should show error on API failure', async () => {
    mockApiFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: 'Error' }),
    });
    render(<ObligacionesPage />);
    await waitFor(() => {
      expect(screen.getByText('Error al cargar obligaciones')).toBeInTheDocument();
    });
  });
});
