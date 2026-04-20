import { AdminDashboardController } from './admin-dashboard.controller';
import { ObtenerAdminDashboardStatsHandler } from '../../application/queries/obtener-admin-dashboard-stats.query';
import { DashboardStatsProjection } from '../../application/services/dashboard-stats-projection';
import { AdminGuard } from '../../../iam/infrastructure/guards/admin.guard';

describe('AdminDashboardController', () => {
  let controller: AdminDashboardController;
  let mockHandler: jest.Mocked<ObtenerAdminDashboardStatsHandler>;
  let projection: DashboardStatsProjection;

  const kpi = (value: number) => ({
    value,
    delta: '+0%',
    deltaUp: true,
    sparkline: Array(12).fill(value),
  });

  const mockStats = {
    kpis: {
      mrr: kpi(99900),
      estudiosActivos: kpi(10),
      dauMau: null,
      uptime: {
        ...kpi(99.98),
        delta: 'SLA OK',
        incidents: 0,
        totalDowntimeSec: 0,
        dailyStatuses: Array(30).fill('ok' as const),
      },
    },
    growth: [{ month: 'Mar', mrr: 99900, newStudios: 2, churn: 0 }],
    planDistribution: [{ plan: 'Profesional', count: 8, percent: 80, tone: 'brand' as const }],
    moduleUsage: [],
    activity: [],
    services: [
      {
        name: 'API Principal',
        detail: 'p50 · 48ms',
        uptime: '99.98%',
        status: 'ok' as const,
      },
    ],
    topStudios: [],
  };

  beforeEach(() => {
    mockHandler = { execute: jest.fn().mockResolvedValue(mockStats) } as any;
    projection = new DashboardStatsProjection();
    controller = new AdminDashboardController(mockHandler, projection);
  });

  describe('getStats', () => {
    it('calls handler and returns wrapped response with realTimeDeltas', async () => {
      const result = await controller.getStats();

      expect(mockHandler.execute).toHaveBeenCalledTimes(1);
      expect(result.data).toHaveProperty('kpis');
      expect(result.data).toHaveProperty('services');
      expect(result.data).toHaveProperty('topStudios');
      expect(result.data).toHaveProperty('realTimeDeltas');
      expect(result.data.realTimeDeltas).toEqual(projection.getDeltas());
      expect(result.meta).toHaveProperty('timestamp');
    });

    it('includes projection deltas reflecting event-driven updates', async () => {
      projection.incrementUsuarios();
      projection.incrementSubscripciones();
      projection.incrementChurn();

      const result = await controller.getStats();

      expect(result.data.realTimeDeltas.usuariosRegistrados).toBe(1);
      expect(result.data.realTimeDeltas.subscripcionesCreadas).toBe(1);
      expect(result.data.realTimeDeltas.churnEvents).toBe(1);
    });
  });

  it('has AdminGuard applied', () => {
    const guards = Reflect.getMetadata('__guards__', AdminDashboardController);
    expect(guards).toBeDefined();
    expect(guards).toContain(AdminGuard);
  });
});
