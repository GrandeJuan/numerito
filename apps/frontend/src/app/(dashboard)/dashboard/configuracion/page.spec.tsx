import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

const mockTienePermiso = vi.fn();
let mockEstudioActual: any = { id: 'est-1', nombre: 'Estudio Test', rol: 'SOCIO' };

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    get estudioActual() { return mockEstudioActual; },
    user: { id: 'u1', email: 'socio@test.com', rol: mockEstudioActual?.rol ?? 'SOCIO' },
    tienePermiso: mockTienePermiso,
  }),
}));

const mockEstudioInfo = {
  nombre: 'Estudio Contable Rossi',
  cuit: '30-71234567-9',
  condicionIva: 'RESPONSABLE_INSCRIPTO',
};

const mockEquipo = [
  { id: 'u1', nombre: 'Federico Rossi', email: 'fede@test.com', rol: 'SOCIO', estado: 'ACTIVO' },
  { id: 'u2', nombre: 'Ana Garcia', email: 'ana@test.com', rol: 'RESPONSABLE', estado: 'ACTIVO' },
  { id: 'u3', nombre: 'Carlos Lopez', email: 'carlos@test.com', rol: 'EMPLEADO', estado: 'INACTIVO' },
];

const mockPlan = {
  nombre: 'Profesional',
  estado: 'ACTIVO',
  clientesActuales: 15,
  clientesMax: 50,
  usuariosActuales: 3,
  usuariosMax: 10,
};

let mockApiFetch: ReturnType<typeof vi.fn>;

vi.mock('@/lib/api-client', () => ({
  apiFetch: (...args: any[]) => mockApiFetch(...args),
}));

import ConfiguracionPage from './page';

describe('ConfiguracionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTienePermiso.mockReturnValue(true);
    mockEstudioActual = { id: 'est-1', nombre: 'Estudio Test', rol: 'SOCIO' };
    mockApiFetch = vi.fn().mockImplementation((path: string) => {
      if (path.includes('/v1/estudios/me')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockEstudioInfo }),
        });
      }
      if (path.includes('/v1/estudios/equipo')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockEquipo }),
        });
      }
      if (path.includes('/v1/estudios/plan')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockPlan }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: {} }) });
    });
  });

  it('should deny access to non-SOCIO users', () => {
    mockEstudioActual = { id: 'est-1', nombre: 'Estudio Test', rol: 'EMPLEADO' };
    render(<ConfiguracionPage />);
    expect(screen.getByText('Acceso denegado')).toBeInTheDocument();
  });

  it('should render page title for SOCIO', async () => {
    render(<ConfiguracionPage />);
    await waitFor(() => {
      expect(screen.getByText('Configuracion')).toBeInTheDocument();
    });
  });

  it('should render tab buttons', async () => {
    render(<ConfiguracionPage />);
    await waitFor(() => {
      expect(screen.getByText('General')).toBeInTheDocument();
    });
    expect(screen.getByText('Equipo')).toBeInTheDocument();
    expect(screen.getByText('Plan')).toBeInTheDocument();
    expect(screen.getByText('Permisos')).toBeInTheDocument();
  });

  it('should show General tab by default with studio info', async () => {
    render(<ConfiguracionPage />);
    await waitFor(() => {
      expect(screen.getByText('Estudio Contable Rossi')).toBeInTheDocument();
    });
    expect(screen.getByText('30-71234567-9')).toBeInTheDocument();
  });

  it('should switch to Equipo tab and show team members', async () => {
    render(<ConfiguracionPage />);
    await waitFor(() => {
      expect(screen.getByText('General')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Equipo'));

    await waitFor(() => {
      expect(screen.getByText('Federico Rossi')).toBeInTheDocument();
    });
    expect(screen.getByText('Ana Garcia')).toBeInTheDocument();
    expect(screen.getByText('Carlos Lopez')).toBeInTheDocument();
    expect(screen.getByText('fede@test.com')).toBeInTheDocument();
  });

  it('should show role badges in Equipo tab', async () => {
    render(<ConfiguracionPage />);
    await waitFor(() => {
      expect(screen.getByText('General')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Equipo'));

    await waitFor(() => {
      expect(screen.getByText('Socio')).toBeInTheDocument();
    });
    expect(screen.getByText('Responsable')).toBeInTheDocument();
    expect(screen.getByText('Empleado')).toBeInTheDocument();
  });

  it('should show estado badges in Equipo tab', async () => {
    render(<ConfiguracionPage />);
    await waitFor(() => {
      expect(screen.getByText('General')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Equipo'));

    await waitFor(() => {
      const activoBadges = screen.getAllByText('Activo');
      expect(activoBadges.length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getByText('Inactivo')).toBeInTheDocument();
  });

  it('should switch to Plan tab and show plan info', async () => {
    render(<ConfiguracionPage />);
    await waitFor(() => {
      expect(screen.getByText('General')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Plan'));

    await waitFor(() => {
      expect(screen.getByText('Profesional')).toBeInTheDocument();
    });
    expect(screen.getByText(/15/)).toBeInTheDocument();
    expect(screen.getByText(/50/)).toBeInTheDocument();
  });

  it('should switch to Permisos tab and show permission matrix', async () => {
    render(<ConfiguracionPage />);
    await waitFor(() => {
      expect(screen.getByText('General')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Permisos'));

    await waitFor(() => {
      expect(screen.getByText('Usuarios')).toBeInTheDocument();
    });
    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.getByText('Tareas')).toBeInTheDocument();
  });

  it('should show no estudio message when none selected', () => {
    mockEstudioActual = null;
    render(<ConfiguracionPage />);
    expect(screen.getByText('Seleccione un estudio para ver la configuracion.')).toBeInTheDocument();
  });
});
