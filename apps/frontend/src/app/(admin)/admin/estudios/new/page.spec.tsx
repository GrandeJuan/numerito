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

import NuevoEstudioPage from './page';

describe('NuevoEstudioPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: { id: 'new-est-1', nombre: 'Test', cuit: '20-111-0', plan: 'Profesional', subscripcionId: 'sub-1' },
        }),
    });
  });

  it('renders form with required fields', () => {
    render(<NuevoEstudioPage />);
    expect(screen.getByText('Nuevo estudio')).toBeInTheDocument();
    expect(screen.getByLabelText('Razón social')).toBeInTheDocument();
    expect(screen.getByLabelText('CUIT')).toBeInTheDocument();
    expect(screen.getByLabelText('Plan')).toBeInTheDocument();
    expect(screen.getByLabelText('Días de trial')).toBeInTheDocument();
  });

  it('submits form and redirects on success', async () => {
    render(<NuevoEstudioPage />);

    fireEvent.change(screen.getByLabelText('Razón social'), { target: { value: 'Estudio García' } });
    fireEvent.change(screen.getByLabelText('CUIT'), { target: { value: '20-12345678-6' } });

    fireEvent.click(screen.getByText('Crear estudio'));

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/v1/admin/estudios', expect.objectContaining({
        method: 'POST',
      }));
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/estudios/new-est-1');
    });
  });

  it('shows error on failed submission', async () => {
    mockApiFetch.mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ error: { message: 'CUIT ya registrado' } }),
    });

    render(<NuevoEstudioPage />);

    fireEvent.change(screen.getByLabelText('Razón social'), { target: { value: 'Estudio Test' } });
    fireEvent.change(screen.getByLabelText('CUIT'), { target: { value: '20-99999999-0' } });
    fireEvent.click(screen.getByText('Crear estudio'));

    await waitFor(() => {
      expect(screen.getByText('CUIT ya registrado')).toBeInTheDocument();
    });
  });

  it('cancel navigates back to estudios list', () => {
    render(<NuevoEstudioPage />);

    const cancelButtons = screen.getAllByText('Cancelar');
    fireEvent.click(cancelButtons[0]);

    expect(mockPush).toHaveBeenCalledWith('/admin/estudios');
  });
});
