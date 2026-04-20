import {
  ObtenerAdminDashboardStatsHandler,
  type AdminDashboardSnapshotStats,
} from './obtener-admin-dashboard-stats.query';
import type {
  DashboardSnapshotRepository,
  DashboardSnapshot,
} from '../../domain/repositories/dashboard-snapshot.repository';
import type { MaterializeDashboardSnapshotService } from '../services/materialize-dashboard-snapshot.service';
import type { DashboardStatsComputer } from '../services/dashboard-stats-computer';
import type { HealthCheckHandler } from './health-check.query';

function makeSnapshotStats(
  overrides: Partial<AdminDashboardSnapshotStats> = {},
): AdminDashboardSnapshotStats {
  return {
    kpis: {
      mrr: { value: 5000, delta: '+11.1%', deltaUp: true, sparkline: Array(12).fill(5000) },
      estudiosActivos: { value: 10, delta: '+11.1%', deltaUp: true, sparkline: Array(12).fill(10) },
    },
    growth: [],
    planDistribution: [],
    topStudios: [],
    ...overrides,
  };
}

function makeHealth(uptimePercent = 99.98) {
  return {
    uptimePercent,
    services: [
      {
        name: 'API Principal',
        status: 'operational' as const,
        latencyMs: 48,
        lastCheck: new Date().toISOString(),
      },
      {
        name: 'AFIP · Padrón',
        status: 'degraded' as const,
        latencyMs: 1800,
        lastCheck: new Date().toISOString(),
      },
    ],
  };
}

describe('ObtenerAdminDashboardStatsHandler', () => {
  let handler: ObtenerAdminDashboardStatsHandler;
  let mockSnapshotRepo: jest.Mocked<DashboardSnapshotRepository>;
  let mockMaterializer: jest.Mocked<MaterializeDashboardSnapshotService>;
  let mockComputer: jest.Mocked<DashboardStatsComputer>;
  let mockHealthCheck: jest.Mocked<HealthCheckHandler>;

  beforeEach(() => {
    mockSnapshotRepo = {
      getLatest: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      markStale: jest.fn().mockResolvedValue(undefined),
    };
    mockMaterializer = {
      refresh: jest.fn().mockResolvedValue(true),
      markStale: jest.fn().mockResolvedValue(undefined),
    } as any;
    mockComputer = { compute: jest.fn() } as any;
    mockHealthCheck = { execute: jest.fn().mockResolvedValue(makeHealth()) } as any;

    handler = new ObtenerAdminDashboardStatsHandler(
      mockSnapshotRepo,
      mockMaterializer,
      mockComputer,
      mockHealthCheck,
    );
  });

  it('returns fresh snapshot values without recomputing', async () => {
    const cached = makeSnapshotStats();
    const snapshot: DashboardSnapshot = { stats: cached, computedAt: new Date(), stale: false };
    mockSnapshotRepo.getLatest.mockResolvedValue(snapshot);

    const result = await handler.execute();

    expect(result.kpis.mrr).toBe(cached.kpis.mrr);
    expect(result.kpis.estudiosActivos).toBe(cached.kpis.estudiosActivos);
    expect(mockComputer.compute).not.toHaveBeenCalled();
  });

  it('computes fresh stats when snapshot is stale', async () => {
    mockSnapshotRepo.getLatest.mockResolvedValue({
      stats: makeSnapshotStats(),
      computedAt: new Date(),
      stale: true,
    });
    const fresh = makeSnapshotStats({
      growth: [{ month: 'Abr', mrr: 1000, newStudios: 3, churn: 2 }],
    });
    mockComputer.compute.mockResolvedValue(fresh);

    const result = await handler.execute();

    expect(result.growth).toEqual(fresh.growth);
    expect(mockComputer.compute).toHaveBeenCalledTimes(1);
  });

  it('computes fresh stats when no snapshot exists', async () => {
    mockSnapshotRepo.getLatest.mockResolvedValue(null);
    mockComputer.compute.mockResolvedValue(makeSnapshotStats());

    await handler.execute();

    expect(mockComputer.compute).toHaveBeenCalledTimes(1);
  });

  it('persists computed stats to snapshot repo', async () => {
    mockSnapshotRepo.getLatest.mockResolvedValue(null);
    const fresh = makeSnapshotStats();
    mockComputer.compute.mockResolvedValue(fresh);

    await handler.execute();
    await new Promise((r) => setTimeout(r, 0));

    expect(mockSnapshotRepo.save).toHaveBeenCalledWith(fresh);
  });

  it('does not crash if snapshot save fails', async () => {
    mockSnapshotRepo.getLatest.mockResolvedValue(null);
    mockComputer.compute.mockResolvedValue(makeSnapshotStats());
    mockSnapshotRepo.save.mockRejectedValue(new Error('DB error'));

    await expect(handler.execute()).resolves.toBeDefined();
  });

  it('enriches stats with fresh services + uptime from HealthCheckHandler', async () => {
    mockSnapshotRepo.getLatest.mockResolvedValue({
      stats: makeSnapshotStats(),
      computedAt: new Date(),
      stale: false,
    });

    const result = await handler.execute();

    expect(mockHealthCheck.execute).toHaveBeenCalledTimes(1);
    expect(result.services).toHaveLength(2);
    expect(result.services[0]).toMatchObject({ name: 'API Principal', status: 'ok' });
    expect(result.services[1]).toMatchObject({ name: 'AFIP · Padrón', status: 'warn' });
    expect(result.kpis.uptime.value).toBe(99.98);
    expect(result.kpis.uptime.dailyStatuses).toHaveLength(30);
    expect(result.kpis.uptime.incidents).toBe(1);
  });

  it('returns null dauMau + empty moduleUsage + empty activity (phase B placeholders)', async () => {
    mockSnapshotRepo.getLatest.mockResolvedValue({
      stats: makeSnapshotStats(),
      computedAt: new Date(),
      stale: false,
    });

    const result = await handler.execute();

    expect(result.kpis.dauMau).toBeNull();
    expect(result.moduleUsage).toEqual([]);
    expect(result.activity).toEqual([]);
  });
});
