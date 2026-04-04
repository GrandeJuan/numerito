// Mock entities to avoid ESM import issues
jest.mock('../../../clientes/infrastructure/persistence/cliente.schema', () => ({
  ClienteEntity: class ClienteEntity {},
}));
jest.mock('../../../obligaciones/infrastructure/persistence/vencimiento.schema', () => ({
  VencimientoEntity: class VencimientoEntity {},
}));
jest.mock('../../../facturacion/infrastructure/persistence/factura.schema', () => ({
  FacturaEntity: class FacturaEntity {},
}));
jest.mock('../../../tareas/infrastructure/persistence/tarea.schema', () => ({
  TareaEntity: class TareaEntity {},
}));

import { DashboardController } from './dashboard.controller';
import { ObtenerDashboardStatsHandler } from '../../application/queries/obtener-dashboard-stats.query';

describe('DashboardController', () => {
  let controller: DashboardController;
  let mockHandler: jest.Mocked<ObtenerDashboardStatsHandler>;

  const mockStats = {
    kpis: {
      clientes: 10,
      vencimientosProximos: 5,
      facturacionMes: 50000,
      tareasActivas: 8,
    },
    vencimientosPorEstado: [{ estado: 'Pendiente', cantidad: 3 }],
    facturacionMensual: [{ mes: '2026-04', monto: 50000 }],
    proximosVencimientos: [],
    actividadReciente: [],
    cargaTrabajo: [{ usuario: 'test@test.com', tareas: 3 }],
  };

  beforeEach(() => {
    mockHandler = {
      execute: jest.fn().mockResolvedValue(mockStats),
    } as any;
    controller = new DashboardController(mockHandler);
  });

  describe('getStats', () => {
    it('should call handler with estudioId and usuarioId', async () => {
      await controller.getStats('estudio-1', 'user-1');

      expect(mockHandler.execute).toHaveBeenCalledWith({
        estudioId: 'estudio-1',
        usuarioId: 'user-1',
      });
    });

    it('should return wrapped response with data and meta', async () => {
      const result = await controller.getStats('estudio-1', 'user-1');

      expect(result.data).toEqual(mockStats);
      expect(result.meta).toHaveProperty('timestamp');
    });
  });
});
