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

const mockTareas = [
  {
    id: 't1',
    titulo: 'Declaracion IVA',
    clienteNombre: 'Empresa Alpha SRL',
    prioridad: 'ALTA',
    estado: 'PENDIENTE',
    responsableNombre: 'Ana Garcia',
    fechaVencimiento: '2026-04-10',
    horasRegistradas: 2.5,
  },
  {
    id: 't2',
    titulo: 'Liquidacion sueldos',
    clienteNombre: 'Beta SA',
    prioridad: 'MEDIA',
    estado: 'EN_PROGRESO',
    responsableNombre: 'Carlos Lopez',
    fechaVencimiento: '2026-04-20',
    horasRegistradas: 5,
  },
  {
    id: 't3',
    titulo: 'Balance anual',
    clienteNombre: 'Gamma SRL',
    prioridad: 'URGENTE',
    estado: 'COMPLETADO',
    responsableNombre: 'Ana Garcia',
    fechaVencimiento: '2026-03-01',
    horasRegistradas: 10,
  },
  {
    id: 't4',
    titulo: 'Tarea vencida',
    clienteNombre: 'Delta SA',
    prioridad: 'BAJA',
    estado: 'PENDIENTE',
    responsableNombre: null,
    fechaVencimiento: '2026-03-15',
    horasRegistradas: 0,
  },
];

let mockApiFetch: ReturnType<typeof vi.fn>;

vi.mock('@/lib/api-client', () => ({
  apiFetch: (...args: any[]) => mockApiFetch(...args),
}));

import TareasPage from './page';

describe('TareasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTienePermiso.mockReturnValue(true);
    mockEstudioActual = { id: 'est-1', nombre: 'Estudio Test', rol: 'SOCIO' };
    mockApiFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockTareas }),
    });
  });

  it('should show loading state initially', () => {
    render(<TareasPage />);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('should render page title', async () => {
    render(<TareasPage />);
    await waitFor(() => {
      expect(screen.getByText('Tareas')).toBeInTheDocument();
    });
  });

  it('should render kanban columns', async () => {
    render(<TareasPage />);
    await waitFor(() => {
      expect(screen.getByText('Pendiente')).toBeInTheDocument();
    });
    expect(screen.getByText('En Progreso')).toBeInTheDocument();
    expect(screen.getByText('Completada')).toBeInTheDocument();
  });

  it('should render task cards in correct columns', async () => {
    render(<TareasPage />);
    await waitFor(() => {
      expect(screen.getByText('Declaracion IVA')).toBeInTheDocument();
    });
    expect(screen.getByText('Liquidacion sueldos')).toBeInTheDocument();
    expect(screen.getByText('Balance anual')).toBeInTheDocument();
  });

  it('should show client name on task card', async () => {
    render(<TareasPage />);
    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha SRL')).toBeInTheDocument();
    });
  });

  it('should show priority badge', async () => {
    render(<TareasPage />);
    await waitFor(() => {
      // "Alta" appears in card badge + filter dropdown, so use getAllByText
      const altaMatches = screen.getAllByText('Alta');
      expect(altaMatches.length).toBeGreaterThanOrEqual(1);
    });
    const mediaMatches = screen.getAllByText('Media');
    expect(mediaMatches.length).toBeGreaterThanOrEqual(1);
    const urgenteMatches = screen.getAllByText('Urgente');
    expect(urgenteMatches.length).toBeGreaterThanOrEqual(1);
  });

  it('should show hours logged', async () => {
    render(<TareasPage />);
    await waitFor(() => {
      expect(screen.getByText(/2\.5h/)).toBeInTheDocument();
    });
  });

  it('should toggle to list view', async () => {
    render(<TareasPage />);
    await waitFor(() => {
      expect(screen.getByText('Declaracion IVA')).toBeInTheDocument();
    });

    const listButton = screen.getByLabelText('Vista lista');
    fireEvent.click(listButton);

    // In list view, we should see table headers
    expect(screen.getByText('Titulo')).toBeInTheDocument();
    expect(screen.getByText('Estado')).toBeInTheDocument();
  });

  it('should show message when no estudio selected', () => {
    mockEstudioActual = null;
    render(<TareasPage />);
    expect(screen.getByText('Seleccione un estudio para ver las tareas.')).toBeInTheDocument();
  });

  it('should show error state on API failure', async () => {
    mockApiFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: 'Error' }),
    });
    render(<TareasPage />);
    await waitFor(() => {
      expect(screen.getByText('Error al cargar tareas')).toBeInTheDocument();
    });
  });

  it('should render filter dropdowns', async () => {
    render(<TareasPage />);
    await waitFor(() => {
      expect(screen.getByDisplayValue('Todas las prioridades')).toBeInTheDocument();
    });
  });

  it('should show kanban column counts', async () => {
    render(<TareasPage />);
    await waitFor(() => {
      // Pendiente column has 2 tasks (t1, t4)
      const pendienteHeader = screen.getByTestId('column-PENDIENTE');
      expect(pendienteHeader).toHaveTextContent('2');
    });
  });

  it('should have grab cursor style on task cards', async () => {
    render(<TareasPage />);
    await waitFor(() => {
      expect(screen.getByText('Declaracion IVA')).toBeInTheDocument();
    });
    const card = screen.getByTestId('task-card-t1');
    expect(card.className).toContain('cursor-grab');
  });
});
