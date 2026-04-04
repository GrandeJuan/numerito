// Mock entities to avoid ESM import issues
jest.mock('../../../estudio/infrastructure/persistence/estudio.schema', () => ({
  EstudioEntity: class EstudioEntity {},
}));
jest.mock('../../../iam/infrastructure/persistence/usuario.schema', () => ({
  UsuarioEntity: class UsuarioEntity {},
}));
jest.mock('../../../estudio/infrastructure/persistence/subscripcion.schema', () => ({
  SubscripcionEntity: class SubscripcionEntity {},
}));

import { AdminDashboardController } from './admin-dashboard.controller';
import { ObtenerAdminDashboardStatsHandler } from '../../application/queries/obtener-admin-dashboard-stats.query';
import { SuperAdminGuard } from '../guards/superadmin.guard';

describe('AdminDashboardController', () => {
  let controller: AdminDashboardController;
  let mockHandler: jest.Mocked<ObtenerAdminDashboardStatsHandler>;

  const mockStats = {
    kpis: {
      estudiosActivos: 10,
      totalUsuarios: 50,
      mrr: 99900,
      subscripcionesPorVencer: 3,
    },
    registrosMensuales: [{ mes: '2026-03', cantidad: 5 }],
    distribucionPlanes: [{ plan: 'Profesional', cantidad: 8 }],
    alertas: [{ tipo: 'warning', mensaje: 'Test alerta', fecha: '2026-04-01' }],
    estudiosRecientes: [
      { id: '1', nombre: 'Estudio X', plan: 'Profesional', estado: 'Activo', creadoEn: '2026-01-01' },
    ],
  };

  beforeEach(() => {
    mockHandler = {
      execute: jest.fn().mockResolvedValue(mockStats),
    } as any;
    controller = new AdminDashboardController(mockHandler);
  });

  describe('getStats', () => {
    it('should call handler and return wrapped response', async () => {
      const result = await controller.getStats();

      expect(mockHandler.execute).toHaveBeenCalledTimes(1);
      expect(result.data).toEqual(mockStats);
      expect(result.meta).toHaveProperty('timestamp');
    });
  });

  it('should have SuperAdminGuard applied', () => {
    const guards = Reflect.getMetadata('__guards__', AdminDashboardController);
    expect(guards).toBeDefined();
    expect(guards).toContain(SuperAdminGuard);
  });
});
