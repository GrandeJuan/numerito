import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

const mockEstudios = [
  {
    id: 'est-1',
    nombre: 'Estudio Contable ABC',
    cuit: '20-12345678-6',
    plan: 'Profesional',
    planCodigo: 'PROFESIONAL',
    isActive: true,
    createdAt: '2026-01-15T00:00:00.000Z',
  },
  {
    id: 'est-2',
    nombre: 'Estudio Lopez',
    cuit: '27-87654321-0',
    plan: 'Starter',
    planCodigo: 'STARTER',
    isActive: false,
    createdAt: '2026-02-20T00:00:00.000Z',
  },
];

vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn().mockResolvedValue({
    ok: true,
    json: () =>
      Promise.resolve({
        data: mockEstudios,
        meta: { total: 2, page: 1, limit: 20, totalPages: 1, timestamp: new Date().toISOString() },
      }),
  }),
}));

import AdminEstudiosPage from './page';
import { apiFetch } from '@/lib/api-client';

describe('AdminEstudiosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (apiFetch as any).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: mockEstudios,
          meta: { total: 2, page: 1, limit: 20, totalPages: 1, timestamp: new Date().toISOString() },
        }),
    });
  });

  it('should render page title', async () => {
    render(<AdminEstudiosPage />);
    await waitFor(() => {
      expect(screen.getByText('Gestión de Estudios')).toBeInTheDocument();
    });
  });

  it('should render loading state initially', () => {
    render(<AdminEstudiosPage />);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('should render estudio names in table', async () => {
    render(<AdminEstudiosPage />);
    await waitFor(() => {
      expect(screen.getByText('Estudio Contable ABC')).toBeInTheDocument();
    });
    expect(screen.getByText('Estudio Lopez')).toBeInTheDocument();
  });

  it('should render CUIT column', async () => {
    render(<AdminEstudiosPage />);
    await waitFor(() => {
      expect(screen.getByText('20-12345678-6')).toBeInTheDocument();
    });
  });

  it('should render plan badges', async () => {
    render(<AdminEstudiosPage />);
    await waitFor(() => {
      const badges = screen.getAllByText('Profesional');
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });
    const starterBadges = screen.getAllByText('Starter');
    expect(starterBadges.length).toBeGreaterThanOrEqual(1);
  });

  it('should render active/inactive badges', async () => {
    render(<AdminEstudiosPage />);
    await waitFor(() => {
      const activeBadges = screen.getAllByText('Activo');
      expect(activeBadges.length).toBeGreaterThanOrEqual(1);
    });
    const inactiveBadges = screen.getAllByText('Inactivo');
    expect(inactiveBadges.length).toBeGreaterThanOrEqual(1);
  });

  it('should render pagination info', async () => {
    render(<AdminEstudiosPage />);
    await waitFor(() => {
      expect(screen.getByText(/Mostrando 1-2 de 2 estudios/)).toBeInTheDocument();
    });
  });

  it('should have a search input', async () => {
    render(<AdminEstudiosPage />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Buscar por nombre o CUIT...')).toBeInTheDocument();
    });
  });

  it('should call apiFetch on mount', async () => {
    render(<AdminEstudiosPage />);
    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith(expect.stringContaining('/v1/admin/estudios'));
    });
  });

  it('should render table headers', async () => {
    render(<AdminEstudiosPage />);
    await waitFor(() => {
      expect(screen.getByText('Nombre')).toBeInTheDocument();
    });
    expect(screen.getByText('CUIT')).toBeInTheDocument();
    expect(screen.getByText('Plan')).toBeInTheDocument();
    expect(screen.getByText('Estado')).toBeInTheDocument();
    expect(screen.getByText('Creado')).toBeInTheDocument();
  });
});
