import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/clientes',
}));

const mockPush = vi.fn();

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    estudioActual: { id: 'est-1', nombre: 'Estudio Test', rol: 'SOCIO' },
    user: { id: 'u-1', email: 'admin@test.com', rol: 'SOCIO' },
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

const mockClientes = [
  {
    id: 'c1',
    cuit: '20-12345678-6',
    razonSocial: 'Empresa Alpha SRL',
    tipo: 'PERSONA_JURIDICA',
    condicionIva: 'RESPONSABLE_INSCRIPTO',
    regimen: 'GENERAL',
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    estudioId: 'est-1',
  },
];

import ClientesPage from './page';

describe('ClientesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockClientes, meta: { total: 1 } }),
    });
  });

  it('renders page title', async () => {
    render(<ClientesPage />);
    await waitFor(() => {
      expect(screen.getByText('Clientes')).toBeInTheDocument();
    });
  });

  it('calls /v1/clientes endpoint', async () => {
    render(<ClientesPage />);
    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/v1/clientes', expect.any(Object));
    });
  });

  it('renders cliente row', async () => {
    render(<ClientesPage />);
    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha SRL')).toBeInTheDocument();
    });
  });

  it('row menu opens on click and shows actions', async () => {
    render(<ClientesPage />);
    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha SRL')).toBeInTheDocument();
    });

    const menuBtn = screen.getByLabelText('Acciones');
    fireEvent.click(menuBtn);

    expect(screen.getByText('Ver detalle')).toBeInTheDocument();
    expect(screen.getByText('Archivar')).toBeInTheDocument();
  });

  it('archivar calls PATCH desactivar endpoint', async () => {
    render(<ClientesPage />);
    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha SRL')).toBeInTheDocument();
    });

    const menuBtn = screen.getByLabelText('Acciones');
    fireEvent.click(menuBtn);
    fireEvent.click(screen.getByText('Archivar'));

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/v1/clientes/c1/desactivar', { method: 'PATCH' });
    });
  });

  it('export button is wired', async () => {
    render(<ClientesPage />);
    await waitFor(() => {
      expect(screen.getByText('Exportar')).toBeInTheDocument();
    });

    const exportBtn = screen.getByText('Exportar');
    expect(exportBtn.closest('button')).not.toBeNull();
  });

  it('shows pagination controls', async () => {
    render(<ClientesPage />);
    await waitFor(() => {
      expect(screen.getByLabelText('Página anterior')).toBeInTheDocument();
      expect(screen.getByLabelText('Página siguiente')).toBeInTheDocument();
    });
  });
});
