import { PgDashboardSnapshotRepository } from './pg-dashboard-snapshot.repository';
import type { AdminDashboardSnapshotStats } from '../../application/queries/obtener-admin-dashboard-stats.query';

function makeFakeStats(): AdminDashboardSnapshotStats {
  return {
    kpis: {
      mrr: {
        value: 5000,
        delta: '+11.1%',
        deltaUp: true,
        sparkline: [1000, 1500, 1800, 2000, 2500, 3000, 3200, 3500, 4000, 4200, 4500, 5000],
      },
      estudiosActivos: {
        value: 10,
        delta: '+11.1%',
        deltaUp: true,
        sparkline: [3, 4, 5, 5, 6, 6, 7, 7, 8, 9, 9, 10],
      },
    },
    growth: [{ month: 'Abr', mrr: 5000, newStudios: 1, churn: 0 }],
    planDistribution: [{ plan: 'Profesional', count: 5, percent: 50, tone: 'brand' }],
    topStudios: [
      {
        id: 'e1',
        nombre: 'Test',
        cuit: '30-11111111-1',
        initialsColor: 'brand',
        plan: 'pro',
        usuarios: 5,
        clientes: 10,
        mrr: 9999,
        actividad: 100,
        status: 'active',
      },
    ],
  };
}

describe('PgDashboardSnapshotRepository', () => {
  let repo: PgDashboardSnapshotRepository;
  let mockExecute: jest.Mock;
  let mockEm: any;

  beforeEach(() => {
    mockExecute = jest.fn().mockResolvedValue([]);
    mockEm = {
      getConnection: jest.fn().mockReturnValue({ execute: mockExecute }),
    };
    repo = new PgDashboardSnapshotRepository(mockEm);
  });

  describe('getLatest', () => {
    it('returns null when no rows exist', async () => {
      mockExecute.mockResolvedValue([]);

      const result = await repo.getLatest();

      expect(result).toBeNull();
    });

    it('returns null when row is unseeded (zeros + stale + empty sparklines)', async () => {
      mockExecute.mockResolvedValue([
        {
          mrr: 0,
          estudios_activos: 0,
          mrr_sparkline: '[]',
          estudios_sparkline: '[]',
          growth: '[]',
          plan_distribution: '[]',
          top_studios: '[]',
          computed_at: '2026-04-19T00:00:00Z',
          stale: true,
        },
      ]);

      const result = await repo.getLatest();

      expect(result).toBeNull();
    });

    it('returns snapshot when row has data (string JSON)', async () => {
      mockExecute.mockResolvedValue([
        {
          mrr: '5000',
          estudios_activos: 10,
          mrr_sparkline: JSON.stringify([
            1000, 2000, 3000, 3500, 4000, 4200, 4300, 4400, 4500, 4700, 4800, 5000,
          ]),
          estudios_sparkline: JSON.stringify([3, 4, 5, 5, 6, 6, 7, 7, 8, 9, 9, 10]),
          growth: JSON.stringify([{ month: 'Abr', mrr: 5000, newStudios: 1, churn: 0 }]),
          plan_distribution: JSON.stringify([
            { plan: 'Pro', count: 5, percent: 50, tone: 'brand' },
          ]),
          top_studios: JSON.stringify([]),
          computed_at: '2026-04-19T12:00:00Z',
          stale: false,
        },
      ]);

      const result = await repo.getLatest();

      expect(result).not.toBeNull();
      expect(result!.stale).toBe(false);
      expect(result!.stats.kpis.mrr.value).toBe(5000);
      expect(result!.stats.kpis.mrr.sparkline).toHaveLength(12);
      expect(result!.stats.kpis.estudiosActivos.value).toBe(10);
      expect(result!.stats.growth).toHaveLength(1);
      expect(result!.stats.planDistribution).toHaveLength(1);
    });

    it('handles JSONB values already parsed into objects', async () => {
      mockExecute.mockResolvedValue([
        {
          mrr: 5000,
          estudios_activos: 10,
          mrr_sparkline: Array(12).fill(5000),
          estudios_sparkline: Array(12).fill(10),
          growth: [],
          plan_distribution: [],
          top_studios: [],
          computed_at: '2026-04-19T12:00:00Z',
          stale: false,
        },
      ]);

      const result = await repo.getLatest();

      expect(result).not.toBeNull();
      expect(result!.stats.kpis.mrr.value).toBe(5000);
      expect(result!.stats.kpis.estudiosActivos.value).toBe(10);
    });
  });

  describe('save', () => {
    it('executes UPDATE with the reshaped columns', async () => {
      const stats = makeFakeStats();

      await repo.save(stats);

      expect(mockExecute).toHaveBeenCalledTimes(1);
      const [sql, params] = mockExecute.mock.calls[0];
      expect(sql).toContain('UPDATE "admin_dashboard_snapshot"');
      expect(sql).toContain('"growth"');
      expect(sql).toContain('"plan_distribution"');
      expect(sql).toContain('"top_studios"');
      expect(params).toHaveLength(7);
      expect(params[0]).toBe(5000);
      expect(params[1]).toBe(10);
    });
  });

  describe('markStale', () => {
    it('executes UPDATE setting stale = true', async () => {
      await repo.markStale();

      expect(mockExecute).toHaveBeenCalledTimes(1);
      const [sql] = mockExecute.mock.calls[0];
      expect(sql).toContain('"stale" = true');
    });
  });
});
