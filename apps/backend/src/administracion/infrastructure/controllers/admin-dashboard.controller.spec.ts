import { AdminDashboardController } from './admin-dashboard.controller';
import { ObtenerAdminDashboardStatsHandler } from '../../application/queries/obtener-admin-dashboard-stats.query';
import { DashboardStatsProjection } from '../../application/services/dashboard-stats-projection';
import { AdminGuard } from '../../../iam/infrastructure/guards/admin.guard';

describe('AdminDashboardController', () => {
  let controller: AdminDashboardController;
  let mockHandler: jest.Mocked<ObtenerAdminDashboardStatsHandler>;
  let projection: DashboardStatsProjection;

  const kpiFixture = { value: 0, delta: '+0%', deltaUp: true, sparkline: Array(12).fill(0) };

  const mockStats = {
    kpis: {
      estudiosActivos: { ...kpiFixture, value: 10 },
      totalUsuarios: { ...kpiFixture, value: 50 },
      subscripcionesActivas: { ...kpiFixture, value: 8 },
      mrr: { ...kpiFixture, value: 99900 },
      churnMensual: { ...kpiFixture, value: 2.4 },
      uptime: { ...kpiFixture, value: 99.98, delta: 'SLA OK' },
    },
    growthData: [{ mes: '2026-03', usuarios: 50, estudios: 10 }],
    revenueData: [{ mes: '2026-03', mrr: 99900, arr: 1198800 }],
    registrosMensuales: [{ mes: '2026-03', cantidad: 5 }],
    distribucionPlanes: [{ plan: 'Profesional', cantidad: 8 }],
    alertas: [{ tipo: 'warning', mensaje: 'Test alerta', fecha: '2026-04-01' }],
    estudiosRecientes: [
      { id: '1', nombre: 'Estudio X', plan: 'Profesional', estado: 'Activo', creadoEn: '2026-01-01' },
    ],
    topTenants: [
      { id: '1', nombre: 'Estudio X', plan: 'Profesional', usuarios: 5, clientes: 20, actividad: 100 },
    ],
    registrosRecientes: [
      { id: '1', nombre: 'Estudio X', plan: 'Trial', email: 'test@example.com', creadoEn: '2026-04-10' },
    ],
  };

  beforeEach(() => {
    mockHandler = {
      execute: jest.fn().mockResolvedValue(mockStats),
    } as any;
    projection = new DashboardStatsProjection();
    controller = new AdminDashboardController(mockHandler, projection);
  });

  describe('getStats', () => {
    it('should call handler and return wrapped response with realTimeDeltas', async () => {
      const result = await controller.getStats();

      expect(mockHandler.execute).toHaveBeenCalledTimes(1);
      expect(result.data).toHaveProperty('kpis');
      expect(result.data).toHaveProperty('realTimeDeltas');
      expect(result.data.realTimeDeltas).toEqual(projection.getDeltas());
      expect(result.meta).toHaveProperty('timestamp');
    });

    it('should include projection deltas reflecting event-driven updates', async () => {
      projection.incrementUsuarios();
      projection.incrementSubscripciones();
      projection.incrementChurn();

      const result = await controller.getStats();

      expect(result.data.realTimeDeltas.usuariosRegistrados).toBe(1);
      expect(result.data.realTimeDeltas.subscripcionesCreadas).toBe(1);
      expect(result.data.realTimeDeltas.churnEvents).toBe(1);
    });
  });

  it('should have AdminGuard applied', () => {
    const guards = Reflect.getMetadata('__guards__', AdminDashboardController);
    expect(guards).toBeDefined();
    expect(guards).toContain(AdminGuard);
  });
});
