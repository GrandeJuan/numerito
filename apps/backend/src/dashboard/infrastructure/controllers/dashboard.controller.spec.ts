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
import { ObtenerCumplimientoSocioHandler } from '../../application/queries/obtener-cumplimiento-socio.query';

describe('DashboardController', () => {
  let controller: DashboardController;
  let mockHandler: jest.Mocked<ObtenerDashboardStatsHandler>;
  let mockCumplimientoHandler: jest.Mocked<ObtenerCumplimientoSocioHandler>;

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

  const mockCumplimientoResult = {
    periodo: '2026-04',
    resumenGeneral: {
      total: 15,
      presentados: 10,
      vencidos: 2,
      prorrogados: 1,
      pendientes: 2,
      enRiesgo: 1,
      porcentajeCumplimiento: 67,
    },
    porResponsable: [],
  };

  beforeEach(() => {
    mockHandler = {
      execute: jest.fn().mockResolvedValue(mockStats),
    } as any;
    const mockActividadHandler = {
      execute: jest.fn().mockResolvedValue([]),
    } as any;
    mockCumplimientoHandler = {
      execute: jest.fn().mockResolvedValue(mockCumplimientoResult),
    } as any;
    controller = new DashboardController(mockHandler, mockActividadHandler, mockCumplimientoHandler);
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

  describe('getCumplimientoSocio', () => {
    it('should call handler with estudioId, usuarioId, and optional filters', async () => {
      await controller.getCumplimientoSocio(
        'estudio-1', 'user-1', '2026-04', '5', 'cli-1', 'resp-1', '7',
      );

      expect(mockCumplimientoHandler.execute).toHaveBeenCalledWith({
        estudioId: 'estudio-1',
        usuarioId: 'user-1',
        periodo: '2026-04',
        tipoObligacionId: 5,
        clienteId: 'cli-1',
        responsableId: 'resp-1',
        diasRiesgo: 7,
      });
    });

    it('should pass undefined for omitted query params', async () => {
      await controller.getCumplimientoSocio('estudio-1', 'user-1');

      expect(mockCumplimientoHandler.execute).toHaveBeenCalledWith({
        estudioId: 'estudio-1',
        usuarioId: 'user-1',
        periodo: undefined,
        tipoObligacionId: undefined,
        clienteId: undefined,
        responsableId: undefined,
        diasRiesgo: undefined,
      });
    });

    it('should return wrapped response with data and meta', async () => {
      const result = await controller.getCumplimientoSocio('estudio-1', 'user-1');

      expect(result.data).toEqual(mockCumplimientoResult);
      expect(result.meta).toHaveProperty('timestamp');
    });
  });
});
