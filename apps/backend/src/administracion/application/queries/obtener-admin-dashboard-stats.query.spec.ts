import { ObtenerAdminDashboardStatsHandler, type AdminDashboardStats } from './obtener-admin-dashboard-stats.query';
import type { DashboardSnapshotRepository, DashboardSnapshot } from '../../domain/repositories/dashboard-snapshot.repository';
import type { MaterializeDashboardSnapshotService } from '../services/materialize-dashboard-snapshot.service';
import type { DashboardStatsComputer } from '../services/dashboard-stats-computer';

function makeFakeStats(overrides: Partial<AdminDashboardStats> = {}): AdminDashboardStats {
  return {
    kpis: {
      estudiosActivos: { value: 10, delta: '+11.1%', deltaUp: true, sparkline: Array(12).fill(10) },
      totalUsuarios: { value: 50, delta: '+4.2%', deltaUp: true, sparkline: Array(12).fill(50) },
      subscripcionesActivas: { value: 8, delta: '+14.3%', deltaUp: true, sparkline: Array(12).fill(8) },
      mrr: { value: 5000, delta: '+11.1%', deltaUp: true, sparkline: Array(12).fill(5000) },
      churnMensual: { value: 0, delta: '+0%', deltaUp: true, sparkline: Array(12).fill(0) },
      uptime: { value: 99.98, delta: 'SLA OK', deltaUp: true, sparkline: Array(12).fill(99.98) },
    },
    growthData: [],
    revenueData: [],
    registrosMensuales: [],
    distribucionPlanes: [],
    alertas: [],
    estudiosRecientes: [],
    topTenants: [],
    registrosRecientes: [],
    ...overrides,
  };
}

describe('ObtenerAdminDashboardStatsHandler', () => {
  let handler: ObtenerAdminDashboardStatsHandler;
  let mockSnapshotRepo: jest.Mocked<DashboardSnapshotRepository>;
  let mockMaterializer: jest.Mocked<MaterializeDashboardSnapshotService>;
  let mockComputer: jest.Mocked<DashboardStatsComputer>;

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
    mockComputer = {
      compute: jest.fn(),
    } as any;

    handler = new ObtenerAdminDashboardStatsHandler(
      mockSnapshotRepo,
      mockMaterializer,
      mockComputer,
    );
  });

  it('should return stats from fresh snapshot without computing', async () => {
    const stats = makeFakeStats();
    const snapshot: DashboardSnapshot = {
      stats,
      computedAt: new Date(),
      stale: false,
    };
    mockSnapshotRepo.getLatest.mockResolvedValue(snapshot);

    const result = await handler.execute();

    expect(result).toBe(stats);
    expect(mockComputer.compute).not.toHaveBeenCalled();
  });

  it('should compute fresh stats when snapshot is stale', async () => {
    const staleSnapshot: DashboardSnapshot = {
      stats: makeFakeStats(),
      computedAt: new Date(),
      stale: true,
    };
    mockSnapshotRepo.getLatest.mockResolvedValue(staleSnapshot);
    const freshStats = makeFakeStats({ growthData: [{ mes: '2026-04', usuarios: 100, estudios: 20 }] });
    mockComputer.compute.mockResolvedValue(freshStats);

    const result = await handler.execute();

    expect(result).toBe(freshStats);
    expect(mockComputer.compute).toHaveBeenCalledTimes(1);
  });

  it('should compute fresh stats when no snapshot exists', async () => {
    mockSnapshotRepo.getLatest.mockResolvedValue(null);
    const freshStats = makeFakeStats();
    mockComputer.compute.mockResolvedValue(freshStats);

    const result = await handler.execute();

    expect(result).toBe(freshStats);
    expect(mockComputer.compute).toHaveBeenCalledTimes(1);
  });

  it('should persist computed stats to snapshot repo', async () => {
    mockSnapshotRepo.getLatest.mockResolvedValue(null);
    const freshStats = makeFakeStats();
    mockComputer.compute.mockResolvedValue(freshStats);

    await handler.execute();

    // Give the async save a tick to run
    await new Promise((r) => setTimeout(r, 0));

    expect(mockSnapshotRepo.save).toHaveBeenCalledWith(freshStats);
  });

  it('should not crash if snapshot save fails', async () => {
    mockSnapshotRepo.getLatest.mockResolvedValue(null);
    const freshStats = makeFakeStats();
    mockComputer.compute.mockResolvedValue(freshStats);
    mockSnapshotRepo.save.mockRejectedValue(new Error('DB error'));

    const result = await handler.execute();

    expect(result).toBe(freshStats);
  });

  it('should return correct stats shape from snapshot', async () => {
    const stats = makeFakeStats();
    mockSnapshotRepo.getLatest.mockResolvedValue({ stats, computedAt: new Date(), stale: false });

    const result = await handler.execute();

    expect(result).toHaveProperty('kpis');
    expect(result).toHaveProperty('growthData');
    expect(result).toHaveProperty('revenueData');
    expect(result).toHaveProperty('registrosMensuales');
    expect(result).toHaveProperty('distribucionPlanes');
    expect(result).toHaveProperty('alertas');
    expect(result).toHaveProperty('estudiosRecientes');
    expect(result).toHaveProperty('topTenants');
    expect(result).toHaveProperty('registrosRecientes');
  });

  it('should return 6 KPIs with sparkline data from snapshot', async () => {
    const stats = makeFakeStats();
    mockSnapshotRepo.getLatest.mockResolvedValue({ stats, computedAt: new Date(), stale: false });

    const result = await handler.execute();

    const kpiKeys = ['estudiosActivos', 'totalUsuarios', 'subscripcionesActivas', 'mrr', 'churnMensual', 'uptime'];
    for (const key of kpiKeys) {
      const kpi = (result.kpis as any)[key];
      expect(kpi).toHaveProperty('value');
      expect(kpi).toHaveProperty('delta');
      expect(kpi).toHaveProperty('deltaUp');
      expect(kpi).toHaveProperty('sparkline');
      expect(kpi.sparkline).toHaveLength(12);
    }
  });
});
