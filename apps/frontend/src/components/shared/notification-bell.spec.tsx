import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationBell } from './notification-bell';

// Mock auth context
const mockEstudioActual = { id: 'est-1', nombre: 'Test Estudio', rol: 'SOCIO' };
const mockUser = { id: 'user-1', email: 'test@example.com', rol: 'SOCIO' };

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: mockUser,
    estudioActual: mockEstudioActual,
  }),
}));

// Mock api-client
vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '@/lib/api-client';

function mockUnreadCount(count: number) {
  vi.mocked(apiFetch).mockImplementation(async (path: string) => {
    if (path.includes('/unread-count')) {
      return new Response(JSON.stringify({ count }), { status: 200 });
    }
    if (path.includes('/notificaciones') && !path.includes('/leer')) {
      return new Response(JSON.stringify({
        data: [
          { id: 'n-1', tipo: 'VENCIMIENTO_PROXIMO', mensaje: 'Vencimiento IVA en 3 dias', leida: false, createdAt: new Date().toISOString() },
          { id: 'n-2', tipo: 'TAREA_ASIGNADA', mensaje: 'Nueva tarea asignada', leida: false, createdAt: new Date().toISOString() },
        ],
        total: 2,
      }), { status: 200 });
    }
    if (path.includes('/leer')) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
    return new Response(JSON.stringify({}), { status: 200 });
  });
}

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockUnreadCount(3);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('fetches and displays unread count on mount', async () => {
    vi.useRealTimers();
    render(<NotificationBell />);

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('shows 0 badge when no unread', async () => {
    vi.useRealTimers();
    vi.mocked(apiFetch).mockImplementation(async (path: string) => {
      if (path.includes('/unread-count')) {
        return new Response(JSON.stringify({ count: 0 }), { status: 200 });
      }
      return new Response(JSON.stringify({ data: [], total: 0 }), { status: 200 });
    });

    render(<NotificationBell />);

    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  it('opens dropdown when bell is clicked', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    render(<NotificationBell />);

    await waitFor(() => {
      expect(screen.getByLabelText('Notificaciones')).toBeInTheDocument();
    });

    await act(async () => {
      await user.click(screen.getByLabelText('Notificaciones'));
    });

    await waitFor(() => {
      expect(screen.getByText('Vencimiento IVA en 3 dias')).toBeInTheDocument();
      expect(screen.getByText('Nueva tarea asignada')).toBeInTheDocument();
    });
  });

  it('marks notification as read when clicking the button', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    render(<NotificationBell />);

    await waitFor(() => {
      expect(screen.getByLabelText('Notificaciones')).toBeInTheDocument();
    });

    await act(async () => {
      await user.click(screen.getByLabelText('Notificaciones'));
    });

    await waitFor(() => {
      expect(screen.getByText('Vencimiento IVA en 3 dias')).toBeInTheDocument();
    });

    const markButtons = screen.getAllByLabelText('Marcar como leida');
    await act(async () => {
      await user.click(markButtons[0]);
    });

    // Should have called the PATCH endpoint
    expect(apiFetch).toHaveBeenCalledWith('/v1/notificaciones/n-1/leer', { method: 'PATCH' });
  });

  it('renders the bell button with aria-label', () => {
    render(<NotificationBell />);
    expect(screen.getByLabelText('Notificaciones')).toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <NotificationBell />
      </div>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Notificaciones')).toBeInTheDocument();
    });

    await act(async () => {
      await user.click(screen.getByLabelText('Notificaciones'));
    });

    await waitFor(() => {
      expect(screen.getByText('Vencimiento IVA en 3 dias')).toBeInTheDocument();
    });

    await act(async () => {
      await user.click(screen.getByTestId('outside'));
    });

    await waitFor(() => {
      expect(screen.queryByText('Vencimiento IVA en 3 dias')).not.toBeInTheDocument();
    });
  });
});
