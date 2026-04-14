import { PgDashboardSnapshotRepository } from './pg-dashboard-snapshot.repository';
import type { AdminDashboardStats } from '../../application/queries/obtener-admin-dashboard-stats.query';

function makeFakeStats(): AdminDashboardStats {
  return {
    kpis: {
      estudiosActivos: { value: 10, delta: '+11.1%', deltaUp: true, sparkline: [3, 4, 5, 5, 6, 6, 7, 7, 8, 9, 9, 10] },
      totalUsuarios: { value: 50, delta: '+4.2%', deltaUp: true, sparkline: [20, 25, 28, 30, 33, 36, 38, 40, 42, 45, 48, 50] },
      subscripcionesActivas: { value: 8, delta: '+14.3%', deltaUp: true, sparkline: [2, 3, 3, 4, 5, 5, 6, 6, 7, 7, 8, 8] },
      mrr: { value: 5000, delta: '+11.1%', deltaUp: true, sparkline: [1000, 1500, 1800, 2000, 2500, 3000, 3200, 3500, 4000, 4200, 4500, 5000] },
      churnMensual: { value: 0, delta: '+0%', deltaUp: true, sparkline: [10, 0, 7.14, 0, 6.25, 0, 0, 5, 0, 0, 4, 0] },
      uptime: { value: 99.98, delta: 'SLA OK', deltaUp: true, sparkline: Array(12).fill(99.98) },
    },
    growthData: [{ mes: '2026-04', usuarios: 50, estudios: 10 }],
    revenueData: [{ mes: '2026-04', mrr: 5000, arr: 60000 }],
    registrosMensuales: [{ mes: '2026-04', cantidad: 2 }],
    distribucionPlanes: [{ plan: 'Profesional', cantidad: 5 }],
    alertas: [{ tipo: 'warning', mensaje: 'Test', fecha: '2026-04-14' }],
    estudiosRecientes: [{ id: 'e1', nombre: 'Test', plan: 'Pro', estado: 'Activo', creadoEn: '2026-04-14' }],
    topTenants: [{ id: 'e1', nombre: 'Test', plan: 'Pro', usuarios: 5, clientes: 10, actividad: 100 }],
    registrosRecientes: [{ id: 'r1', nombre: 'Nuevo', plan: 'Trial', email: 'a@b.com', creadoEn: '2026-04-14' }],
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
    it('should return null when no rows exist', async () => {
      mockExecute.mockResolvedValue([]);

      const result = await repo.getLatest();

      expect(result).toBeNull();
    });

    it('should return null when row is unseeded (all zeros + stale + empty sparklines)', async () => {
      mockExecute.mockResolvedValue([{
        estudios_activos: 0,
        total_usuarios: 0,
        subscripciones_activas: 0,
        mrr: 0,
        churn_mensual: 0,
        uptime: 99.98,
        estudios_sparkline: '[]',
        usuarios_sparkline: '[]',
        subscripciones_sparkline: '[]',
        mrr_sparkline: '[]',
        churn_sparkline: '[]',
        growth_data: '[]',
        revenue_data: '[]',
        registros_mensuales: '[]',
        distribucion_planes: '[]',
        alertas: '[]',
        estudios_recientes: '[]',
        top_tenants: '[]',
        registros_recientes: '[]',
        computed_at: '2026-04-14T00:00:00Z',
        stale: true,
      }]);

      const result = await repo.getLatest();

      expect(result).toBeNull();
    });

    it('should return snapshot when row has data', async () => {
      mockExecute.mockResolvedValue([{
        estudios_activos: 10,
        total_usuarios: 50,
        subscripciones_activas: 8,
        mrr: '5000',
        churn_mensual: '2.5',
        uptime: '99.98',
        estudios_sparkline: JSON.stringify([3, 4, 5, 5, 6, 6, 7, 7, 8, 9, 9, 10]),
        usuarios_sparkline: JSON.stringify([20, 25, 28, 30, 33, 36, 38, 40, 42, 45, 48, 50]),
        subscripciones_sparkline: JSON.stringify([2, 3, 3, 4, 5, 5, 6, 6, 7, 7, 8, 8]),
        mrr_sparkline: JSON.stringify([1000, 1500, 1800, 2000, 2500, 3000, 3200, 3500, 4000, 4200, 4500, 5000]),
        churn_sparkline: JSON.stringify([10, 0, 7, 0, 6, 0, 0, 5, 0, 0, 4, 0]),
        growth_data: JSON.stringify([{ mes: '2026-04', usuarios: 50, estudios: 10 }]),
        revenue_data: JSON.stringify([{ mes: '2026-04', mrr: 5000, arr: 60000 }]),
        registros_mensuales: JSON.stringify([{ mes: '2026-04', cantidad: 2 }]),
        distribucion_planes: JSON.stringify([{ plan: 'Profesional', cantidad: 5 }]),
        alertas: JSON.stringify([]),
        estudios_recientes: JSON.stringify([]),
        top_tenants: JSON.stringify([]),
        registros_recientes: JSON.stringify([]),
        computed_at: '2026-04-14T12:00:00Z',
        stale: false,
      }]);

      const result = await repo.getLatest();

      expect(result).not.toBeNull();
      expect(result!.stale).toBe(false);
      expect(result!.stats.kpis.estudiosActivos.value).toBe(10);
      expect(result!.stats.kpis.totalUsuarios.value).toBe(50);
      expect(result!.stats.kpis.mrr.value).toBe(5000);
      expect(result!.stats.growthData).toHaveLength(1);
      expect(result!.stats.kpis.estudiosActivos.sparkline).toHaveLength(12);
    });

    it('should handle JSONB values that are already parsed objects', async () => {
      mockExecute.mockResolvedValue([{
        estudios_activos: 10,
        total_usuarios: 50,
        subscripciones_activas: 8,
        mrr: 5000,
        churn_mensual: 0,
        uptime: 99.98,
        estudios_sparkline: [3, 4, 5, 5, 6, 6, 7, 7, 8, 9, 9, 10],
        usuarios_sparkline: Array(12).fill(50),
        subscripciones_sparkline: Array(12).fill(8),
        mrr_sparkline: Array(12).fill(5000),
        churn_sparkline: Array(12).fill(0),
        growth_data: [],
        revenue_data: [],
        registros_mensuales: [],
        distribucion_planes: [],
        alertas: [],
        estudios_recientes: [],
        top_tenants: [],
        registros_recientes: [],
        computed_at: '2026-04-14T12:00:00Z',
        stale: false,
      }]);

      const result = await repo.getLatest();

      expect(result).not.toBeNull();
      expect(result!.stats.kpis.estudiosActivos.value).toBe(10);
    });
  });

  describe('save', () => {
    it('should execute UPDATE with all stats fields', async () => {
      const stats = makeFakeStats();

      await repo.save(stats);

      expect(mockExecute).toHaveBeenCalledTimes(1);
      const [sql, params] = mockExecute.mock.calls[0];
      expect(sql).toContain('UPDATE "admin_dashboard_snapshot"');
      expect(params).toHaveLength(19);
      expect(params[0]).toBe(10); // estudios_activos
      expect(params[1]).toBe(50); // total_usuarios
      expect(params[3]).toBe(5000); // mrr
    });
  });

  describe('markStale', () => {
    it('should execute UPDATE setting stale = true', async () => {
      await repo.markStale();

      expect(mockExecute).toHaveBeenCalledTimes(1);
      const [sql] = mockExecute.mock.calls[0];
      expect(sql).toContain('"stale" = true');
    });
  });
});
