import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'u-1', email: 'socio@test.com', rol: 'SOCIO' },
    estudioActual: { id: 'est-1', nombre: 'Estudio Pini', rol: 'SOCIO' },
    permisos: [],
    tienePermiso: () => true,
  }),
}));

let mockApiFetch: ReturnType<typeof vi.fn>;
vi.mock('@/lib/api-client', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
  setEstudioId: vi.fn(),
  setOnUnauthorized: vi.fn(),
}));

const mockData = {
  periodo: '2026-04',
  resumenGeneral: {
    total: 20,
    presentados: 12,
    vencidos: 3,
    prorrogados: 1,
    pendientes: 4,
    enRiesgo: 2,
    porcentajeCumplimiento: 60,
  },
  porResponsable: [
    {
      responsableId: 'u-1',
      responsableNombre: 'Juan Pérez',
      total: 12,
      presentados: 8,
      vencidos: 2,
      prorrogados: 0,
      pendientes: 2,
      enRiesgo: 1,
      porcentajeCumplimiento: 67,
    },
    {
      responsableId: 'u-2',
      responsableNombre: 'María López',
      total: 8,
      presentados: 4,
      vencidos: 1,
      prorrogados: 1,
      pendientes: 2,
      enRiesgo: 1,
      porcentajeCumplimiento: 50,
    },
  ],
};

import { CumplimientoSocioPage } from './cumplimiento-socio-page';

describe('CumplimientoSocioPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockData }),
    });
  });

  it('renders page title and subtitle', async () => {
    render(<CumplimientoSocioPage />);
    await waitFor(() => {
      expect(screen.getByText('Cumplimiento por Responsable')).toBeInTheDocument();
    });
  });

  it('renders KPI cards with correct values', async () => {
    render(<CumplimientoSocioPage />);
    await waitFor(() => {
      expect(screen.getByText('60%')).toBeInTheDocument();
    });
    expect(screen.getByText('12')).toBeInTheDocument(); // presentados
    expect(screen.getByText('4')).toBeInTheDocument(); // pendientes
  });

  it('renders responsable table with names', async () => {
    render(<CumplimientoSocioPage />);
    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });
    expect(screen.getByText('María López')).toBeInTheDocument();
  });

  it('shows en riesgo pill when count > 0', async () => {
    render(<CumplimientoSocioPage />);
    await waitFor(() => {
      expect(screen.getByText('2 en riesgo')).toBeInTheDocument();
    });
  });

  it('shows vencidos KPI with rose tone when count > 0', async () => {
    render(<CumplimientoSocioPage />);
    await waitFor(() => {
      expect(screen.getByText('requieren atención')).toBeInTheDocument();
    });
  });

  it('shows debajo de meta when cumplimiento < 80%', async () => {
    render(<CumplimientoSocioPage />);
    await waitFor(() => {
      expect(screen.getByText('debajo de meta')).toBeInTheDocument();
    });
  });

  it('navigates to previous period when clicking left chevron', async () => {
    const user = userEvent.setup();
    render(<CumplimientoSocioPage />);

    await waitFor(() => {
      expect(screen.getByText('Cumplimiento por Responsable')).toBeInTheDocument();
    });

    // Find the left arrow button (first ghost button with chevron)
    const buttons = screen.getAllByRole('button');
    const prevBtn = buttons[0]; // First button is the left chevron

    mockApiFetch.mockClear();
    mockApiFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { ...mockData, periodo: '2026-03' } }),
    });

    await user.click(prevBtn);

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        expect.stringContaining('periodo=2026-03'),
        expect.anything(),
      );
    });
  });

  it('shows footer with responsable count', async () => {
    render(<CumplimientoSocioPage />);
    await waitFor(() => {
      expect(screen.getByText('2 responsables')).toBeInTheDocument();
    });
  });

  it('renders empty state when no data for period', async () => {
    mockApiFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            periodo: '2026-04',
            resumenGeneral: {
              total: 0,
              presentados: 0,
              vencidos: 0,
              prorrogados: 0,
              pendientes: 0,
              enRiesgo: 0,
              porcentajeCumplimiento: 0,
            },
            porResponsable: [],
          },
        }),
    });

    render(<CumplimientoSocioPage />);
    await waitFor(() => {
      expect(
        screen.getByText('Sin datos de cumplimiento para este período.'),
      ).toBeInTheDocument();
    });
  });

  it('calls API with correct endpoint including periodo', async () => {
    render(<CumplimientoSocioPage />);
    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/v1\/dashboard\/cumplimiento-socio\?periodo=\d{4}-\d{2}/),
        expect.anything(),
      );
    });
  });

  it('renders distribution card with status breakdown', async () => {
    render(<CumplimientoSocioPage />);
    await waitFor(() => {
      expect(screen.getByText('Distribución por Estado')).toBeInTheDocument();
    });
    expect(screen.getByText('Presentados')).toBeInTheDocument();
    expect(screen.getByText('Vencidos')).toBeInTheDocument();
    expect(screen.getByText('Prorrogados')).toBeInTheDocument();
    expect(screen.getByText('Pendientes')).toBeInTheDocument();
  });

  it('shows cumplimiento percentage per responsable in table', async () => {
    render(<CumplimientoSocioPage />);
    await waitFor(() => {
      expect(screen.getByText('67%')).toBeInTheDocument();
    });
    expect(screen.getByText('50%')).toBeInTheDocument();
  });
});
