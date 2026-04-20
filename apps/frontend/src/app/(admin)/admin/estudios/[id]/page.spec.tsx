import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: 'est-1' }),
}));

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'u-1', email: 'super@test.com', rol: 'SUPERADMIN' },
    estudioActual: null,
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

const mockEstudio = {
  id: 'est-1',
  nombre: 'Estudio Alpha',
  cuit: '30-12345678-9',
  plan: 'PROFESIONAL',
  maxClientes: 50,
  maxUsuarios: 5,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

import Page from './page';

describe('EstudioDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockEstudio, meta: {} }),
    });
  });

  it('renders estudio details', async () => {
    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText('Estudio Alpha')).toBeInTheDocument();
    });
    expect(screen.getByText('30-12345678-9')).toBeInTheDocument();
    expect(screen.getByText('PROFESIONAL')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
  });

  it('calls correct endpoint', async () => {
    render(<Page />);

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/admin/estudios/est-1'),
        expect.any(Object),
      );
    });
  });

  it('shows suspend button for active estudio', async () => {
    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText('Suspender')).toBeInTheDocument();
    });
  });

  it('calls suspend endpoint on click', async () => {
    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText('Suspender')).toBeInTheDocument();
    });

    // Reset mock to track subsequent calls
    mockApiFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { ...mockEstudio, isActive: false } }),
    });

    fireEvent.click(screen.getByText('Suspender'));

    await waitFor(() => {
      const calls = mockApiFetch.mock.calls;
      const suspendCall = calls.find(
        (c: any) => typeof c[0] === 'string' && c[0].includes('/suspend'),
      );
      expect(suspendCall).toBeDefined();
    });
  });

  it('back button navigates to estudios list', async () => {
    render(<Page />);

    fireEvent.click(screen.getByText('← Volver'));
    expect(mockPush).toHaveBeenCalledWith('/admin/estudios');
  });
});
