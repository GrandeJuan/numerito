import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

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

let mockFetchResults: Record<
  string,
  { data: any; loading: boolean; error: string | null; refetch: () => void }
>;

vi.mock('@/lib/use-fetch-with-estudio', () => ({
  useFetchWithEstudio: (endpoint: string) => {
    if (endpoint.includes('/v1/clientes/summary')) {
      return mockFetchResults.summary;
    }
    return mockFetchResults.clientes;
  },
}));

import ClientesPage from './page';

describe('ClientesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTienePermiso.mockReturnValue(true);
    mockEstudioActual = { id: 'est-1', nombre: 'Estudio Test', rol: 'SOCIO' };
    mockFetchResults = {
      clientes: { data: mockClientes, loading: false, error: null, refetch: vi.fn() },
      summary: { data: mockSummary, loading: false, error: null, refetch: vi.fn() },
    };
  });

  it('should show loading state initially', () => {
    mockFetchResults.clientes = { data: null, loading: true, error: null, refetch: vi.fn() };
    render(<ClientesPage />);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('should render page title', () => {
    render(<ClientesPage />);
    expect(screen.getByText('Clientes')).toBeInTheDocument();
  });

  it('should render summary cards', () => {
    render(<ClientesPage />);
    expect(screen.getByText('Total Clientes')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should render clientes table with data', () => {
    render(<ClientesPage />);
    expect(screen.getByText('Empresa Alpha SRL')).toBeInTheDocument();
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    expect(screen.getByText('30-12345678-9')).toBeInTheDocument();
    expect(screen.getByText('20-98765432-1')).toBeInTheDocument();
  });

  it('should show tipo badge', () => {
    render(<ClientesPage />);
    const matches = screen.getAllByText('Persona Juridica');
    expect(matches.length).toBeGreaterThanOrEqual(1);
    const fisicaMatches = screen.getAllByText('Persona Fisica');
    expect(fisicaMatches.length).toBeGreaterThanOrEqual(1);
  });

  it('should show condicion IVA badge', () => {
    render(<ClientesPage />);
    const matches = screen.getAllByText('Responsable Inscripto');
    expect(matches.length).toBeGreaterThanOrEqual(1);
    const monoMatches = screen.getAllByText('Monotributista');
    expect(monoMatches.length).toBeGreaterThanOrEqual(1);
  });

  it('should show responsable name', () => {
    render(<ClientesPage />);
    expect(screen.getByText('Ana Garcia')).toBeInTheDocument();
  });

  it('should show vencimientos pendientes count with red for overdue', () => {
    render(<ClientesPage />);
    expect(screen.getByText('Empresa Alpha SRL')).toBeInTheDocument();
    const vencidosBadge = screen.getByText('1 vencidos');
    expect(vencidosBadge).toBeInTheDocument();
    expect(vencidosBadge.className).toContain('red');
  });

  it('should show saldo pendiente formatted', () => {
    render(<ClientesPage />);
    expect(screen.getByText('$45.000')).toBeInTheDocument();
  });

  it('should show pagination info', () => {
    render(<ClientesPage />);
    expect(screen.getByText('2 clientes')).toBeInTheDocument();
  });

  it('should show message when no estudio selected', () => {
    mockEstudioActual = null;
    mockFetchResults.clientes = { data: null, loading: false, error: null, refetch: vi.fn() };
    render(<ClientesPage />);
    expect(screen.getByText('Cargando estudio...')).toBeInTheDocument();
  });

  it('should show error state on API failure', () => {
    mockFetchResults.clientes = {
      data: null,
      loading: false,
      error: 'Error 500',
      refetch: vi.fn(),
    };
    render(<ClientesPage />);
    expect(screen.getByText('Error 500')).toBeInTheDocument();
  });

  it('should render search input', () => {
    render(<ClientesPage />);
    expect(screen.getByPlaceholderText('Buscar por razon social o CUIT...')).toBeInTheDocument();
  });

  it('should filter clientes by search text', () => {
    render(<ClientesPage />);
    expect(screen.getByText('Empresa Alpha SRL')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText('Buscar por razon social o CUIT...');
    fireEvent.change(searchInput, { target: { value: 'Alpha' } });

    expect(screen.getByText('Empresa Alpha SRL')).toBeInTheDocument();
    expect(screen.queryByText('Juan Perez')).not.toBeInTheDocument();
  });

  it('should filter by tipo dropdown', () => {
    render(<ClientesPage />);
    expect(screen.getByText('Empresa Alpha SRL')).toBeInTheDocument();

    const tipoSelect = screen.getByDisplayValue('Todos los tipos');
    fireEvent.change(tipoSelect, { target: { value: 'PERSONA_FISICA' } });

    expect(screen.queryByText('Empresa Alpha SRL')).not.toBeInTheDocument();
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
  });
});
