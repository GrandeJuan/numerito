import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'cli-1' }),
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    estudioActual: { id: 'est-1', nombre: 'Estudio Test', rol: 'SOCIO' },
    user: { id: 'u-1', email: 'admin@test.com', rol: 'SOCIO' },
    permisos: ['VER_CLIENTES'],
    tienePermiso: () => true,
  }),
}));

let mockApiFetch: ReturnType<typeof vi.fn>;
vi.mock('@/lib/api-client', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
  setEstudioId: vi.fn(),
  setOnUnauthorized: vi.fn(),
}));

const mockCliente = {
  id: 'cli-1',
  razonSocial: 'Empresa Test SRL',
  cuit: '20-12345678-6',
  condicionIva: 'RESPONSABLE_INSCRIPTO',
  tipo: 'PERSONA_JURIDICA',
  isActive: true,
  responsable: null,
  inscripciones: [
    { jurisdiccion: 'ARCA', regimen: 'GENERAL', activa: true, desde: '2024-01-01' },
  ],
};

const mockVencimientos = {
  data: [
    {
      id: 'v-1',
      tipo: 'IVA',
      periodo: '2026-05',
      fecha: '2026-05-20',
      estado: 'PENDIENTE',
      cliente: 'Empresa Test SRL',
    },
  ],
  meta: { total: 1, page: 1, limit: 100 },
};

import ClienteDetallePage from './page';

describe('ClienteDetallePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/v1/clientes/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockCliente }),
        });
      }
      if (url.includes('/v1/vencimientos')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockVencimientos),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: null }),
      });
    });
  });

  it('renders client name', async () => {
    render(<ClienteDetallePage />);
    await waitFor(() => {
      expect(screen.getByText('Empresa Test SRL')).toBeInTheDocument();
    });
  });

  it('shows proyectar calendario button', async () => {
    render(<ClienteDetallePage />);
    await waitFor(() => {
      expect(screen.getByText('Proyectar calendario')).toBeInTheDocument();
    });
  });

  it('displays perfil fiscal inscripciones', async () => {
    render(<ClienteDetallePage />);
    await waitFor(() => {
      expect(screen.getByText('ARCA')).toBeInTheDocument();
      expect(screen.getByText('GENERAL')).toBeInTheDocument();
    });
  });
});
