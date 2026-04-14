import { MaterializeDashboardSnapshotService } from './materialize-dashboard-snapshot.service';
import type { DashboardSnapshotRepository } from '../../domain/repositories/dashboard-snapshot.repository';
import type { DashboardStatsComputer } from './dashboard-stats-computer';
import type { AdminDashboardStats } from '../queries/obtener-admin-dashboard-stats.query';

function makeFakeStats(): AdminDashboardStats {
  return {
    kpis: {
      estudiosActivos: { value: 10, delta: '+0%', deltaUp: true, sparkline: [] },
      totalUsuarios: { value: 50, delta: '+0%', deltaUp: true, sparkline: [] },
      subscripcionesActivas: { value: 8, delta: '+0%', deltaUp: true, sparkline: [] },
      mrr: { value: 5000, delta: '+0%', deltaUp: true, sparkline: [] },
      churnMensual: { value: 0, delta: '+0%', deltaUp: true, sparkline: [] },
      uptime: { value: 99.98, delta: 'SLA OK', deltaUp: true, sparkline: [] },
    },
    growthData: [],
    revenueData: [],
    registrosMensuales: [],
    distribucionPlanes: [],
    alertas: [],
    estudiosRecientes: [],
    topTenants: [],
    registrosRecientes: [],
  };
}

describe('MaterializeDashboardSnapshotService', () => {
  let service: MaterializeDashboardSnapshotService;
  let mockComputer: jest.Mocked<DashboardStatsComputer>;
  let mockRepo: jest.Mocked<DashboardSnapshotRepository>;

  beforeEach(() => {
    mockComputer = { compute: jest.fn() } as any;
    mockRepo = {
      getLatest: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      markStale: jest.fn().mockResolvedValue(undefined),
    };

    service = new MaterializeDashboardSnapshotService(mockComputer, mockRepo);
  });

  it('should compute and save stats on refresh', async () => {
    const stats = makeFakeStats();
    mockComputer.compute.mockResolvedValue(stats);

    const result = await service.refresh();

    expect(result).toBe(true);
    expect(mockComputer.compute).toHaveBeenCalledTimes(1);
    expect(mockRepo.save).toHaveBeenCalledWith(stats);
  });

  it('should return false when compute fails', async () => {
    mockComputer.compute.mockRejectedValue(new Error('DB unavailable'));

    const result = await service.refresh();

    expect(result).toBe(false);
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('should throttle rapid refresh calls', async () => {
    const stats = makeFakeStats();
    mockComputer.compute.mockResolvedValue(stats);

    const first = await service.refresh();
    const second = await service.refresh();

    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(mockComputer.compute).toHaveBeenCalledTimes(1);
  });

  it('should not run concurrent refreshes', async () => {
    const stats = makeFakeStats();
    let resolveCompute: (v: AdminDashboardStats) => void;
    mockComputer.compute.mockReturnValue(
      new Promise((r) => { resolveCompute = r; }),
    );

    const firstPromise = service.refresh();
    const second = await service.refresh();

    expect(second).toBe(false);

    resolveCompute!(stats);
    const first = await firstPromise;
    expect(first).toBe(true);
    expect(mockComputer.compute).toHaveBeenCalledTimes(1);
  });

  it('should mark snapshot as stale', async () => {
    await service.markStale();

    expect(mockRepo.markStale).toHaveBeenCalledTimes(1);
  });

  it('should not throw when markStale fails', async () => {
    mockRepo.markStale.mockRejectedValue(new Error('DB error'));

    await expect(service.markStale()).resolves.not.toThrow();
  });
});
