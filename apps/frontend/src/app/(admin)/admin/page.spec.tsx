import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/admin',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
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

const mockStats = {
  kpis: {
    mrr: { value: 150000, delta: '+12%', deltaUp: true, sparkline: [100, 120, 140, 150] },
    estudiosActivos: { value: 42, delta: '+3', deltaUp: true, sparkline: [30, 35, 38, 42] },
    dauMau: null,
    uptime: {
      value: 99.95,
      delta: '0.01%',
      deltaUp: true,
      sparkline: [99.9, 99.95],
      incidents: 0,
      totalDowntimeSec: 0,
      dailyStatuses: [],
    },
  },
  growth: [
    { month: 'Ene', mrr: 80000, newStudios: 5, churn: 1 },
    { month: 'Feb', mrr: 100000, newStudios: 8, churn: 2 },
    { month: 'Mar', mrr: 150000, newStudios: 10, churn: 1 },
  ],
  planDistribution: [{ plan: 'Pro', count: 30, percent: 71, tone: 'brand' }],
  moduleUsage: [],
  activity: [],
  services: [],
  topStudios: [
    {
      id: 'est-1',
      nombre: 'Studio Alpha',
      cuit: '30-12345678-9',
      initialsColor: 'brand',
      plan: 'pro',
      usuarios: 5,
      clientes: 20,
      mrr: 5000,
      actividad: 80,
      status: 'active',
    },
    {
      id: 'est-2',
      nombre: 'Studio Beta',
      cuit: '30-99999999-0',
      initialsColor: 'indigo',
      plan: 'trial',
      usuarios: 2,
      clientes: 5,
      mrr: null,
      actividad: 30,
      status: 'trial',
    },
  ],
};

import AdminDashboardPage from './page';

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockStats }),
    });
  });

  it('renders page title and KPIs', async () => {
    render(<AdminDashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Panel de control')).toBeInTheDocument();
    });
  });

  it('fetches with period query param', async () => {
    render(<AdminDashboardPage />);
    await waitFor(() => {
      const url = mockApiFetch.mock.calls[0][0] as string;
      expect(url).toContain('/v1/admin/dashboard/stats?period=30d');
    });
  });

  it('changing period refetches with new param', async () => {
    render(<AdminDashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Panel de control')).toBeInTheDocument();
    });

    // Click the "7d" period button
    const btn7d = screen.getByText('7d');
    fireEvent.click(btn7d);

    await waitFor(() => {
      const lastUrl = mockApiFetch.mock.calls[mockApiFetch.mock.calls.length - 1][0] as string;
      expect(lastUrl).toContain('period=7d');
    });
  });

  it('chip filters affect displayed studios', async () => {
    render(<AdminDashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Studio Alpha')).toBeInTheDocument();
      expect(screen.getByText('Studio Beta')).toBeInTheDocument();
    });

    // Click "Trial" chip (there are multiple "Trial" texts — pick the clickable button/chip)
    const trialChips = screen.getAllByText('Trial');
    const trialChip =
      trialChips.find((el) => el.tagName === 'BUTTON' || el.closest('button') !== null) ??
      trialChips[0];
    fireEvent.click(trialChip);

    await waitFor(() => {
      expect(screen.queryByText('Studio Alpha')).not.toBeInTheDocument();
      expect(screen.getByText('Studio Beta')).toBeInTheDocument();
    });
  });

  it('search filters studios by name', async () => {
    render(<AdminDashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Studio Alpha')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Buscar por nombre, CUIT o ID…');
    fireEvent.change(input, { target: { value: 'Beta' } });

    await waitFor(() => {
      expect(screen.queryByText('Studio Alpha')).not.toBeInTheDocument();
      expect(screen.getByText('Studio Beta')).toBeInTheDocument();
    });
  });

  it('Ver todos navigates to /admin/estudios', async () => {
    render(<AdminDashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Studio Alpha')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Ver todos'));
    expect(mockPush).toHaveBeenCalledWith('/admin/estudios');
  });

  it('Ver button on studio row navigates to detail', async () => {
    render(<AdminDashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Studio Alpha')).toBeInTheDocument();
    });

    const verBtns = screen.getAllByTitle('Ver');
    fireEvent.click(verBtns[0]);
    expect(mockPush).toHaveBeenCalledWith('/admin/estudios/est-1');
  });
});
