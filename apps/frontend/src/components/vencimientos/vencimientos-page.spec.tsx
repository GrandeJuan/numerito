import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'u-1', email: 'socio@test.com', rol: 'SOCIO' },
    estudioActual: 'est-1',
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

const mockVencimientos = [
  {
    id: 'v-1',
    clienteId: 'c-1',
    cliente: 'Acme S.A.',
    tipoObligacion: 'IVA',
    periodo: '2026-04',
    fechaVencimiento: '2026-04-20',
    estado: 'PENDIENTE' as const,
  },
  {
    id: 'v-2',
    clienteId: 'c-2',
    cliente: 'Beta SRL',
    tipoObligacion: 'GANANCIAS',
    periodo: '2026-04',
    fechaVencimiento: '2026-04-25',
    estado: 'PRESENTADO' as const,
  },
];

import { VencimientosPage } from './vencimientos-page';

describe('VencimientosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockVencimientos }),
    });
  });

  it('renders page title and vencimiento rows', async () => {
    render(<VencimientosPage />);
    await waitFor(() => {
      expect(screen.getByText('Vencimientos')).toBeInTheDocument();
    });
    expect(screen.getByText('Acme S.A.')).toBeInTheDocument();
    expect(screen.getByText('Beta SRL')).toBeInTheDocument();
  });

  it('shows Presentar button only for PENDIENTE vencimientos', async () => {
    render(<VencimientosPage />);
    await waitFor(() => {
      expect(screen.getByText('Acme S.A.')).toBeInTheDocument();
    });
    const presentarButtons = screen.getAllByRole('button', { name: 'Presentar' });
    expect(presentarButtons).toHaveLength(1);
  });

  it('calls PATCH /v1/vencimientos/:id/presentar on click and refetches', async () => {
    const user = userEvent.setup();
    render(<VencimientosPage />);

    await waitFor(() => {
      expect(screen.getByText('Acme S.A.')).toBeInTheDocument();
    });

    // Reset mock to track the presentar call separately
    mockApiFetch.mockClear();
    mockApiFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: {} }),
    });
    // The refetch call after success
    mockApiFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: mockVencimientos.map((v) =>
            v.id === 'v-1' ? { ...v, estado: 'PRESENTADO' } : v,
          ),
        }),
    });

    const presentarBtn = screen.getByRole('button', { name: 'Presentar' });
    await user.click(presentarBtn);

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/v1/vencimientos/v-1/presentar', {
        method: 'PATCH',
      });
    });

    // Success message shown
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(
        'Vencimiento de IVA (2026-04) presentado correctamente.',
      );
    });
  });

  it('shows error message when presentar fails', async () => {
    const user = userEvent.setup();
    render(<VencimientosPage />);

    await waitFor(() => {
      expect(screen.getByText('Acme S.A.')).toBeInTheDocument();
    });

    mockApiFetch.mockClear();
    mockApiFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () =>
        Promise.resolve({ message: 'No se puede presentar un vencimiento ya vencido' }),
    });

    const presentarBtn = screen.getByRole('button', { name: 'Presentar' });
    await user.click(presentarBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'No se puede presentar un vencimiento ya vencido',
      );
    });
  });

  it('disables button and shows loading text while presentar is in-flight', async () => {
    const user = userEvent.setup();
    render(<VencimientosPage />);

    await waitFor(() => {
      expect(screen.getByText('Acme S.A.')).toBeInTheDocument();
    });

    // Create a promise we control to keep the request pending
    let resolvePresent!: (v: Response) => void;
    const pendingPromise = new Promise<Response>((resolve) => {
      resolvePresent = resolve;
    });

    mockApiFetch.mockClear();
    mockApiFetch.mockReturnValueOnce(pendingPromise);

    const presentarBtn = screen.getByRole('button', { name: 'Presentar' });
    await user.click(presentarBtn);

    await waitFor(() => {
      expect(screen.getByText('Presentando…')).toBeInTheDocument();
    });
    expect(screen.getByText('Presentando…').closest('button')).toBeDisabled();

    // Resolve the pending request
    resolvePresent({
      ok: true,
      json: () => Promise.resolve({ data: {} }),
    } as Response);

    // After resolve, the refetch call
    mockApiFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockVencimientos }),
    });

    await waitFor(() => {
      expect(screen.queryByText('Presentando…')).not.toBeInTheDocument();
    });
  });
});
