import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const mockStats = {
  total: 50,
  activos: 40,
  verificados: 35,
  sinVerificar: 15,
};

const mockUsuarios = [
  {
    id: 'u1',
    email: 'juan@test.com',
    nombre: 'Juan',
    apellido: 'Perez',
    rol: 'ADMIN',
    provider: 'google',
    emailVerified: true,
    isActive: true,
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-04-01T10:00:00.000Z',
  },
  {
    id: 'u2',
    email: 'maria@test.com',
    nombre: 'Maria',
    apellido: 'Garcia',
    rol: 'SUPERADMIN',
    provider: null,
    emailVerified: false,
    isActive: true,
    createdAt: '2026-02-20T00:00:00.000Z',
    updatedAt: '2026-03-15T08:30:00.000Z',
  },
];

vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn().mockImplementation((path: string) => {
    if (path.includes('/stats')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockStats }),
      });
    }
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          data: mockUsuarios,
          meta: {
            total: 2,
            page: 1,
            limit: 20,
            totalPages: 1,
            timestamp: new Date().toISOString(),
          },
        }),
    });
  }),
}));

import AdminUsuariosPage from './page';
import { apiFetch } from '@/lib/api-client';

describe('AdminUsuariosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (apiFetch as any).mockImplementation((path: string) => {
      if (path.includes('/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockStats }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            data: mockUsuarios,
            meta: {
              total: 2,
              page: 1,
              limit: 20,
              totalPages: 1,
              timestamp: new Date().toISOString(),
            },
          }),
      });
    });
  });

  it('should render page title', async () => {
    render(<AdminUsuariosPage />);
    await waitFor(() => {
      expect(screen.getByText('Gestión de Usuarios')).toBeInTheDocument();
    });
  });

  it('should render loading state initially', () => {
    render(<AdminUsuariosPage />);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('should render KPI cards', async () => {
    render(<AdminUsuariosPage />);
    await waitFor(() => {
      expect(screen.getByText('Total Usuarios')).toBeInTheDocument();
    });
    expect(screen.getByText('Activos')).toBeInTheDocument();
    expect(screen.getByText('Verificados')).toBeInTheDocument();
    expect(screen.getByText('Sin Verificar')).toBeInTheDocument();
  });

  it('should render KPI values', async () => {
    render(<AdminUsuariosPage />);
    await waitFor(() => {
      expect(screen.getByText('50')).toBeInTheDocument();
    });
    expect(screen.getByText('40')).toBeInTheDocument();
    expect(screen.getByText('35')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('should render user names in table', async () => {
    render(<AdminUsuariosPage />);
    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    });
    expect(screen.getByText('Maria Garcia')).toBeInTheDocument();
  });

  it('should render email column', async () => {
    render(<AdminUsuariosPage />);
    await waitFor(() => {
      expect(screen.getByText('juan@test.com')).toBeInTheDocument();
    });
  });

  it('should render rol badges', async () => {
    render(<AdminUsuariosPage />);
    await waitFor(() => {
      expect(screen.getByText('ADMIN')).toBeInTheDocument();
    });
    expect(screen.getByText('Super Administrador')).toBeInTheDocument();
  });

  it('should render table headers', async () => {
    render(<AdminUsuariosPage />);
    await waitFor(() => {
      expect(screen.getByText('Nombre')).toBeInTheDocument();
    });
    // "Email" appears both as header and in email column data, so use getAllByText
    const emailElements = screen.getAllByText('Email');
    expect(emailElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Rol')).toBeInTheDocument();
    expect(screen.getByText('Provider')).toBeInTheDocument();
  });

  it('should have a search input', async () => {
    render(<AdminUsuariosPage />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Buscar por nombre o email...')).toBeInTheDocument();
    });
  });

  it('should call apiFetch for both stats and list', async () => {
    render(<AdminUsuariosPage />);
    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith(expect.stringContaining('/v1/admin/usuarios/stats'));
      expect(apiFetch).toHaveBeenCalledWith(expect.stringContaining('/v1/admin/usuarios?'));
    });
  });

  it('should render pagination info', async () => {
    render(<AdminUsuariosPage />);
    await waitFor(() => {
      expect(screen.getByText(/Mostrando 1-2 de 2 usuarios/)).toBeInTheDocument();
    });
  });
});
