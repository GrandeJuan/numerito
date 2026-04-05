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

const mockClientes = [
  {
    id: 'c1',
    razonSocial: 'Empresa Alpha SRL',
    cuit: '30-12345678-9',
    tipo: 'PERSONA_JURIDICA',
    condicionIva: 'RESPONSABLE_INSCRIPTO',
    responsable: { id: 'u1', nombre: 'Ana Garcia' },
    vencimientosPendientes: 3,
    vencimientosVencidos: 1,
    saldoPendiente: 45000,
    isActive: true,
  },
  {
    id: 'c2',
    razonSocial: 'Juan Perez',
    cuit: '20-98765432-1',
    tipo: 'PERSONA_FISICA',
    condicionIva: 'MONOTRIBUTO',
    responsable: null,
    vencimientosPendientes: 0,
    vencimientosVencidos: 0,
    saldoPendiente: 0,
    isActive: true,
  },
];

const mockSummary = {
  total: 2,
  porCondicionIva: {
    RESPONSABLE_INSCRIPTO: 1,
    MONOTRIBUTO: 1,
  },
};

let mockApiFetch: ReturnType<typeof vi.fn>;

vi.mock('@/lib/api-client', () => ({
  apiFetch: (...args: any[]) => mockApiFetch(...args),
}));

import ClientesPage from './page';

describe('ClientesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTienePermiso.mockReturnValue(true);
    mockEstudioActual = { id: 'est-1', nombre: 'Estudio Test', rol: 'SOCIO' };
    mockApiFetch = vi.fn().mockImplementation((path: string) => {
      if (path.includes('/v1/clientes/summary')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockSummary }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockClientes, meta: { total: 2, page: 1, limit: 20 } }),
      });
    });
  });

  it('should show loading state initially', () => {
    render(<ClientesPage />);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('should render page title', async () => {
    render(<ClientesPage />);
    await waitFor(() => {
      expect(screen.getByText('Clientes')).toBeInTheDocument();
    });
  });

  it('should render summary cards', async () => {
    render(<ClientesPage />);
    await waitFor(() => {
      expect(screen.getByText('Total Clientes')).toBeInTheDocument();
    });
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should render clientes table with data', async () => {
    render(<ClientesPage />);
    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha SRL')).toBeInTheDocument();
    });
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    expect(screen.getByText('30-12345678-9')).toBeInTheDocument();
    expect(screen.getByText('20-98765432-1')).toBeInTheDocument();
  });

  it('should show tipo badge', async () => {
    render(<ClientesPage />);
    await waitFor(() => {
      // Text appears in table badge and in dropdown option
      const matches = screen.getAllByText('Persona Juridica');
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });
    const fisicaMatches = screen.getAllByText('Persona Fisica');
    expect(fisicaMatches.length).toBeGreaterThanOrEqual(1);
  });

  it('should show condicion IVA badge', async () => {
    render(<ClientesPage />);
    await waitFor(() => {
      // Text appears in summary card, table badge, and dropdown
      const matches = screen.getAllByText('Responsable Inscripto');
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });
    const monoMatches = screen.getAllByText('Monotributista');
    expect(monoMatches.length).toBeGreaterThanOrEqual(1);
  });

  it('should show responsable name', async () => {
    render(<ClientesPage />);
    await waitFor(() => {
      expect(screen.getByText('Ana Garcia')).toBeInTheDocument();
    });
  });

  it('should show vencimientos pendientes count with red for overdue', async () => {
    render(<ClientesPage />);
    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha SRL')).toBeInTheDocument();
    });
    // 3 pendientes + 1 vencido => the vencidos count should have red styling
    const vencidosBadge = screen.getByText('1 vencidos');
    expect(vencidosBadge).toBeInTheDocument();
    expect(vencidosBadge.className).toContain('red');
  });

  it('should show saldo pendiente formatted', async () => {
    render(<ClientesPage />);
    await waitFor(() => {
      expect(screen.getByText('$45.000')).toBeInTheDocument();
    });
  });

  it('should show pagination info', async () => {
    render(<ClientesPage />);
    await waitFor(() => {
      expect(screen.getByText(/Mostrando 1-2 de 2 clientes/)).toBeInTheDocument();
    });
  });

  it('should show message when no estudio selected', () => {
    mockEstudioActual = null;
    render(<ClientesPage />);
    expect(screen.getByText('Seleccione un estudio para ver los clientes.')).toBeInTheDocument();
  });

  it('should show error state on API failure', async () => {
    mockApiFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: 'Error' }),
    });
    render(<ClientesPage />);
    await waitFor(() => {
      expect(screen.getByText('Error al cargar clientes')).toBeInTheDocument();
    });
  });

  it('should render search input', async () => {
    render(<ClientesPage />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Buscar por razon social o CUIT...')).toBeInTheDocument();
    });
  });

  it('should filter clientes by search text', async () => {
    render(<ClientesPage />);
    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha SRL')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Buscar por razon social o CUIT...');
    fireEvent.change(searchInput, { target: { value: 'Alpha' } });

    expect(screen.getByText('Empresa Alpha SRL')).toBeInTheDocument();
    expect(screen.queryByText('Juan Perez')).not.toBeInTheDocument();
  });

  it('should filter by tipo dropdown', async () => {
    render(<ClientesPage />);
    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha SRL')).toBeInTheDocument();
    });

    const tipoSelect = screen.getByDisplayValue('Todos los tipos');
    fireEvent.change(tipoSelect, { target: { value: 'PERSONA_FISICA' } });

    expect(screen.queryByText('Empresa Alpha SRL')).not.toBeInTheDocument();
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
  });
});
