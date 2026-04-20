import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    estudioActual: { id: 'est-1', nombre: 'Estudio Test', rol: 'SOCIO' },
    user: { id: 'u-1', email: 'admin@test.com', rol: 'SOCIO' },
    permisos: ['usuarios.invitar'],
    tienePermiso: (p: string) => p === 'usuarios.invitar',
  }),
}));

vi.mock('@/components/shared/can', () => ({
  Can: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockEquipo = [
  {
    id: 'ue-1',
    nombre: 'Ana García',
    email: 'ana@test.com',
    rol: 'SOCIO',
    estado: 'ACTIVO' as const,
    ultimoAcceso: '2026-04-19',
  },
  {
    id: 'ue-2',
    nombre: 'Carlos López',
    email: 'carlos@test.com',
    rol: 'EMPLEADO',
    estado: 'INVITADO' as const,
  },
];

let mockApiFetch: ReturnType<typeof vi.fn>;
vi.mock('@/lib/api-client', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
  setEstudioId: vi.fn(),
  setOnUnauthorized: vi.fn(),
}));

import UsuariosConfigPage from './page';

describe('UsuariosConfigPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiFetch = vi.fn().mockImplementation((path: string) => {
      if (path === '/v1/estudios/equipo') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockEquipo }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: {} }) });
    });
  });

  it('renders page title', async () => {
    render(<UsuariosConfigPage />);
    await waitFor(() => {
      expect(screen.getByText('Usuarios')).toBeInTheDocument();
    });
  });

  it('renders team members', async () => {
    render(<UsuariosConfigPage />);
    await waitFor(() => {
      expect(screen.getByText('Ana García')).toBeInTheDocument();
      expect(screen.getByText('Carlos López')).toBeInTheDocument();
    });
  });

  it('invitar usuario button opens modal', async () => {
    render(<UsuariosConfigPage />);
    await waitFor(() => {
      expect(screen.getByText('Invitar usuario')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Invitar usuario'));

    await waitFor(() => {
      expect(screen.getByText('Enviar invitación a un nuevo miembro del estudio.')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Rol')).toBeInTheDocument();
  });

  it('invitar modal submits to POST endpoint', async () => {
    mockApiFetch = vi.fn().mockImplementation((path: string, opts?: any) => {
      if (path === '/v1/estudios/equipo/invitar' && opts?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { id: 'ue-3' } }),
        });
      }
      if (path === '/v1/estudios/equipo') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockEquipo }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: {} }) });
    });

    render(<UsuariosConfigPage />);
    await waitFor(() => {
      expect(screen.getByText('Invitar usuario')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Invitar usuario'));

    await waitFor(() => {
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'nuevo@test.com' } });
    fireEvent.click(screen.getByText('Enviar invitación'));

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/v1/estudios/equipo/invitar', expect.objectContaining({
        method: 'POST',
      }));
    });
  });

  it('editar button opens role change modal', async () => {
    render(<UsuariosConfigPage />);
    await waitFor(() => {
      expect(screen.getByText('Ana García')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Editar');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Editar rol')).toBeInTheDocument();
      expect(screen.getByText(/ana@test\.com/)).toBeInTheDocument();
    });
  });

  it('editar modal submits role change to PATCH endpoint', async () => {
    mockApiFetch = vi.fn().mockImplementation((path: string, opts?: any) => {
      if (path.includes('/rol') && opts?.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: {} }),
        });
      }
      if (path === '/v1/estudios/equipo') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockEquipo }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: {} }) });
    });

    render(<UsuariosConfigPage />);
    await waitFor(() => {
      expect(screen.getByText('Ana García')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Editar');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByLabelText('Rol')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Rol'), { target: { value: 'RESPONSABLE' } });
    fireEvent.click(screen.getByText('Guardar cambios'));

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/v1/estudios/equipo/ue-1/rol', expect.objectContaining({
        method: 'PATCH',
      }));
    });
  });
});
