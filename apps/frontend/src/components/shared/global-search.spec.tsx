import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlobalSearch } from './global-search';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock api-client
vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn(),
}));

// Mock parse-api-response
vi.mock('@/lib/parse-api-response', () => ({
  parseApiResponse: vi.fn(),
}));

import { apiFetch } from '@/lib/api-client';
import { parseApiResponse } from '@/lib/parse-api-response';

const mockSearchResults = {
  estudios: [
    { id: 'est-1', nombre: 'Estudio Contable Perez', cuit: '20-12345678-9', plan: 'Profesional', isActive: true },
    { id: 'est-2', nombre: 'Estudio Garcia', cuit: '30-98765432-1', plan: 'Enterprise', isActive: false },
  ],
  usuarios: [
    { id: 'usr-1', email: 'juan@perez.com', nombre: 'Juan', apellido: 'Perez', rol: 'SOCIO', isActive: true },
  ],
};

const emptyResults = { estudios: [], usuarios: [] };

function setupMock(data = mockSearchResults) {
  vi.mocked(apiFetch).mockResolvedValue(new Response('', { status: 200 }));
  vi.mocked(parseApiResponse).mockResolvedValue({ data });
}

describe('GlobalSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockPush.mockClear();
    vi.mocked(apiFetch).mockClear();
    vi.mocked(parseApiResponse).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders the search input with placeholder', () => {
    render(<GlobalSearch />);
    expect(screen.getByPlaceholderText('Buscar estudios, usuarios...')).toBeInTheDocument();
  });

  it('renders with correct aria attributes', () => {
    render(<GlobalSearch />);
    const input = screen.getByRole('combobox');
    expect(input).toHaveAttribute('aria-label', 'Buscar estudios y usuarios');
  });

  it('does not call API for empty input', async () => {
    render(<GlobalSearch />);
    const input = screen.getByRole('combobox');

    await act(async () => {
      await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).type(input, '   ');
      vi.advanceTimersByTime(350);
    });

    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('debounces search input (300ms)', async () => {
    setupMock();
    render(<GlobalSearch />);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByRole('combobox');

    await act(async () => {
      await user.type(input, 'per');
    });

    // Should not have called yet (before debounce)
    expect(apiFetch).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    // Should have called after debounce
    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalled();
    });
  });

  it('calls API with encoded query parameter', async () => {
    setupMock();
    render(<GlobalSearch />);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByRole('combobox');

    await act(async () => {
      await user.type(input, 'perez');
      vi.advanceTimersByTime(350);
    });

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith(
        '/v1/admin/search?q=perez',
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });
  });

  it('displays grouped results (Estudios and Usuarios)', async () => {
    setupMock();
    vi.useRealTimers();
    render(<GlobalSearch />);
    const user = userEvent.setup();
    const input = screen.getByRole('combobox');

    await act(async () => {
      await user.type(input, 'perez');
    });

    await waitFor(() => {
      expect(screen.getByText('Estudios')).toBeInTheDocument();
      expect(screen.getByText('Usuarios')).toBeInTheDocument();
      expect(screen.getByText('Estudio Contable Perez')).toBeInTheDocument();
      expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    });
  });

  it('shows estudio details (CUIT and plan)', async () => {
    setupMock();
    vi.useRealTimers();
    render(<GlobalSearch />);
    const user = userEvent.setup();
    const input = screen.getByRole('combobox');

    await act(async () => {
      await user.type(input, 'perez');
    });

    await waitFor(() => {
      expect(screen.getByText(/CUIT: 20-12345678-9/)).toBeInTheDocument();
      expect(screen.getByText(/Profesional/)).toBeInTheDocument();
    });
  });

  it('shows usuario details (email and rol)', async () => {
    setupMock();
    vi.useRealTimers();
    render(<GlobalSearch />);
    const user = userEvent.setup();
    const input = screen.getByRole('combobox');

    await act(async () => {
      await user.type(input, 'perez');
    });

    await waitFor(() => {
      expect(screen.getByText(/juan@perez.com/)).toBeInTheDocument();
      expect(screen.getByText(/SOCIO/)).toBeInTheDocument();
    });
  });

  it('shows inactive badge for inactive entities', async () => {
    setupMock();
    vi.useRealTimers();
    render(<GlobalSearch />);
    const user = userEvent.setup();
    const input = screen.getByRole('combobox');

    await act(async () => {
      await user.type(input, 'perez');
    });

    await waitFor(() => {
      expect(screen.getByText('Inactivo')).toBeInTheDocument();
    });
  });

  it('shows empty state when no results match', async () => {
    setupMock(emptyResults);
    vi.useRealTimers();
    render(<GlobalSearch />);
    const user = userEvent.setup();
    const input = screen.getByRole('combobox');

    await act(async () => {
      await user.type(input, 'zzzzz');
    });

    await waitFor(() => {
      expect(screen.getByText('No se encontraron resultados')).toBeInTheDocument();
    });
  });

  it('navigates when clicking a result', async () => {
    setupMock();
    vi.useRealTimers();
    render(<GlobalSearch />);
    const user = userEvent.setup();
    const input = screen.getByRole('combobox');

    await act(async () => {
      await user.type(input, 'perez');
    });

    await waitFor(() => {
      expect(screen.getByText('Estudio Contable Perez')).toBeInTheDocument();
    });

    await act(async () => {
      await user.click(screen.getByText('Estudio Contable Perez'));
    });

    expect(mockPush).toHaveBeenCalledWith('/admin/estudios');
  });

  it('closes dropdown when clicking outside', async () => {
    setupMock();
    vi.useRealTimers();
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <GlobalSearch />
      </div>,
    );
    const user = userEvent.setup();
    const input = screen.getByRole('combobox');

    await act(async () => {
      await user.type(input, 'perez');
    });

    await waitFor(() => {
      expect(screen.getByText('Estudio Contable Perez')).toBeInTheDocument();
    });

    await act(async () => {
      await user.click(screen.getByTestId('outside'));
    });

    await waitFor(() => {
      expect(screen.queryByText('Estudio Contable Perez')).not.toBeInTheDocument();
    });
  });
});
