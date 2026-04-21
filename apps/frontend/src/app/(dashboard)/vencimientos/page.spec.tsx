import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

let mockEstudioActual: { id: string; nombre: string; rol: string } | null = {
  id: 'est-1',
  nombre: 'Estudio Test',
  rol: 'SOCIO',
};

let mockSearchParamsValue = new URLSearchParams();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/vencimientos',
  useSearchParams: () => mockSearchParamsValue,
  useParams: () => ({}),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    get estudioActual() {
      return mockEstudioActual;
    },
    user: { id: 'u-1', email: 'admin@test.com', rol: 'SOCIO' },
    permisos: ['VER_FACTURACION'],
    tienePermiso: () => true,
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
    tipoObligacion: 'GANANCIAS',
    periodo: '2026-04',
    fechaVencimiento: '2026-04-15',
    descripcion: 'DDJJ Ganancias',
    estado: 'PRESENTADO',
  },
];

const mockClientes = [
  { id: 'c1', razonSocial: 'Empresa Alpha SRL', cuit: '20-12345678-6' },
  { id: 'c2', razonSocial: 'Juan Perez', cuit: '20-87654321-0' },
];

let mockApiFetch: ReturnType<typeof vi.fn>;

vi.mock('@/lib/api-client', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
  setEstudioId: vi.fn(),
  setOnUnauthorized: vi.fn(),
}));

import VencimientosPage from './page';

describe('VencimientosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEstudioActual = { id: 'est-1', nombre: 'Estudio Test', rol: 'SOCIO' };
    mockSearchParamsValue = new URLSearchParams();
    mockApiFetch = vi.fn().mockImplementation((path: string) => {
      if (path.startsWith('/v1/vencimientos')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockVencimientos, meta: { total: 2 } }),
        });
      }
      if (path === '/v1/clientes') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockClientes, meta: { total: 2 } }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [] }) });
    });
  });

  it('renders page title', async () => {
    render(<VencimientosPage />);
    await waitFor(() => {
      const headings = screen.getAllByText('Vencimientos');
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  it('calls /v1/vencimientos endpoint', async () => {
    render(<VencimientosPage />);
    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/v1/vencimientos', expect.any(Object));
    });
  });

  it('renders KPI labels', async () => {
    render(<VencimientosPage />);
    await waitFor(() => {
      expect(screen.getByText('Pendientes')).toBeInTheDocument();
    });
    expect(screen.getByText('Vencidos')).toBeInTheDocument();
    expect(screen.getByText('Presentados mes')).toBeInTheDocument();
    expect(screen.getByText('Próximo')).toBeInTheDocument();
  });

  it('renders cliente rows in table', async () => {
    render(<VencimientosPage />);
    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha SRL')).toBeInTheDocument();
    });
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
  });

  it('nuevo vencimiento button opens modal', async () => {
    render(<VencimientosPage />);
    await waitFor(() => {
      expect(screen.getByText('Nuevo vencimiento')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Nuevo vencimiento'));

    await waitFor(() => {
      expect(screen.getByText('Crear un nuevo vencimiento fiscal.')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Cliente')).toBeInTheDocument();
    expect(screen.getByLabelText('Tipo de obligación')).toBeInTheDocument();
  });

  it('nuevo vencimiento modal submits to POST /v1/vencimientos', async () => {
    mockApiFetch = vi.fn().mockImplementation((path: string, opts?: any) => {
      if (path === '/v1/vencimientos' && opts?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { id: 'v3' } }),
        });
      }
      if (path.startsWith('/v1/vencimientos')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockVencimientos, meta: { total: 2 } }),
        });
      }
      if (path === '/v1/clientes') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockClientes, meta: { total: 2 } }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [] }) });
    });

    render(<VencimientosPage />);
    await waitFor(() => {
      expect(screen.getByText('Nuevo vencimiento')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Nuevo vencimiento'));

    await waitFor(() => {
      expect(screen.getByLabelText('Cliente')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: 'c1' } });
    fireEvent.change(screen.getByLabelText('Tipo de obligación'), { target: { value: 'IVA' } });
    fireEvent.change(screen.getByLabelText('Período'), { target: { value: '2026-05' } });
    fireEvent.change(screen.getByLabelText('Fecha vencimiento'), { target: { value: '2026-05-20' } });
    fireEvent.change(screen.getByLabelText('Descripción'), { target: { value: 'DDJJ IVA Mayo' } });

    fireEvent.click(screen.getByText('Crear vencimiento'));

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/v1/vencimientos', {
        method: 'POST',
        body: JSON.stringify({
          clienteId: 'c1',
          tipoObligacion: 'IVA',
          periodo: '2026-05',
          fechaVencimiento: '2026-05-20',
          descripcion: 'DDJJ IVA Mayo',
        }),
      });
    });
  });

  it('export button is wired', async () => {
    render(<VencimientosPage />);
    await waitFor(() => {
      expect(screen.getByText('Exportar')).toBeInTheDocument();
    });

    const exportBtn = screen.getByText('Exportar');
    expect(exportBtn.closest('button')).not.toBeNull();
  });

  describe('drilldown filter params', () => {
    it('calls API with responsableId and periodo when URL params present', async () => {
      mockSearchParamsValue = new URLSearchParams({
        responsableId: 'u-42',
        periodo: '2026-03',
        responsable: 'María García',
      });

      render(<VencimientosPage />);
      await waitFor(() => {
        expect(mockApiFetch).toHaveBeenCalledWith(
          '/v1/vencimientos?responsableId=u-42&periodo=2026-03',
          expect.any(Object),
        );
      });
    });

    it('shows filter banner with responsable name pill', async () => {
      mockSearchParamsValue = new URLSearchParams({
        responsableId: 'u-42',
        periodo: '2026-03',
        responsable: 'María García',
      });

      render(<VencimientosPage />);
      await waitFor(() => {
        expect(screen.getByText('Filtros activos:')).toBeInTheDocument();
      });
      expect(screen.getByText('María García')).toBeInTheDocument();
    });

    it('shows filter banner with periodo pill', async () => {
      mockSearchParamsValue = new URLSearchParams({
        responsableId: 'u-42',
        periodo: '2026-03',
        responsable: 'María García',
      });

      render(<VencimientosPage />);
      await waitFor(() => {
        expect(screen.getByText('2026-03')).toBeInTheDocument();
      });
    });

    it('shows Limpiar filtros link pointing to /vencimientos', async () => {
      mockSearchParamsValue = new URLSearchParams({
        responsableId: 'u-42',
        periodo: '2026-03',
      });

      render(<VencimientosPage />);
      await waitFor(() => {
        const link = screen.getByText('Limpiar filtros');
        expect(link).toBeInTheDocument();
        expect(link.closest('a')).toHaveAttribute('href', '/vencimientos');
      });
    });

    it('does not show filter banner when no URL params', async () => {
      mockSearchParamsValue = new URLSearchParams();
      render(<VencimientosPage />);
      await waitFor(() => {
        expect(screen.getByText('Vencimientos')).toBeInTheDocument();
      });
      expect(screen.queryByText('Filtros activos:')).not.toBeInTheDocument();
    });

    it('calls API with only responsableId when periodo is absent', async () => {
      mockSearchParamsValue = new URLSearchParams({ responsableId: 'u-42' });

      render(<VencimientosPage />);
      await waitFor(() => {
        expect(mockApiFetch).toHaveBeenCalledWith(
          '/v1/vencimientos?responsableId=u-42',
          expect.any(Object),
        );
      });
    });

    it('calls API with only periodo when responsableId is absent', async () => {
      mockSearchParamsValue = new URLSearchParams({ periodo: '2026-03' });

      render(<VencimientosPage />);
      await waitFor(() => {
        expect(mockApiFetch).toHaveBeenCalledWith(
          '/v1/vencimientos?periodo=2026-03',
          expect.any(Object),
        );
      });
    });
  });
});
