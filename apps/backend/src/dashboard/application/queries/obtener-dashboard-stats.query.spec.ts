// Mock entities to avoid ESM import issues
jest.mock('../../../obligaciones/infrastructure/persistence/vencimiento.schema', () => ({
  VencimientoEntity: class VencimientoEntity {},
}));
jest.mock('../../../facturacion/infrastructure/persistence/factura.schema', () => ({
  FacturaEntity: class FacturaEntity {},
}));
jest.mock('../../../tareas/infrastructure/persistence/tarea.schema', () => ({
  TareaEntity: class TareaEntity {},
}));

import { ObtenerDashboardStatsHandler } from './obtener-dashboard-stats.query';

describe('ObtenerDashboardStatsHandler', () => {
  let handler: ObtenerDashboardStatsHandler;
  let mockEm: any;
  let mockExecute: jest.Mock;
  let mockClienteSummary: any;

  const estudioId = 'estudio-uuid';
  const usuarioId = 'usuario-uuid';

  beforeEach(() => {
    mockExecute = jest.fn().mockResolvedValue([]);
    mockEm = {
      count: jest.fn().mockResolvedValue(0),
      find: jest.fn().mockResolvedValue([]),
      getConnection: jest.fn().mockReturnValue({ execute: mockExecute }),
    };
    mockClienteSummary = {
      execute: jest.fn().mockResolvedValue({ totalClientes: 0 }),
    };
  });

  function createHandler() {
    handler = new ObtenerDashboardStatsHandler(mockEm, mockClienteSummary);
  }

  function mockMembership(rol: string) {
    mockExecute.mockResolvedValueOnce([{ is_active: true, rol }]);
  }

  function mockPermisos(permisos: string[]) {
    mockExecute.mockResolvedValueOnce(permisos.map((codigo) => ({ codigo })));
  }

  describe('when user has no membership', () => {
    it('should throw error', async () => {
      mockExecute.mockResolvedValueOnce([]);
      createHandler();

      await expect(handler.execute({ estudioId, usuarioId })).rejects.toThrow();
    });
  });

  describe('when membership is inactive', () => {
    it('should throw error', async () => {
      mockExecute.mockResolvedValueOnce([{ is_active: false, rol: 'SOCIO' }]);
      createHandler();

      await expect(handler.execute({ estudioId, usuarioId })).rejects.toThrow();
    });
  });

  describe('SOCIO role', () => {
    beforeEach(() => {
      createHandler();
    });

    it('should return all stats including facturacion and cargaTrabajo', async () => {
      mockMembership('SOCIO');
      mockPermisos(['VER_FACTURACION', 'VER_CLIENTES', 'VER_TAREAS']);

      const result = await handler.execute({ estudioId, usuarioId });

      expect(result).toHaveProperty('kpis');
      expect(result).toHaveProperty('vencimientosPorEstado');
      expect(result).toHaveProperty('facturacionMensual');
      expect(result).toHaveProperty('proximosVencimientos');
      expect(result).toHaveProperty('actividadReciente');
      expect(result).toHaveProperty('cargaTrabajo');
      expect(result.kpis).toHaveProperty('facturacionMes');
    });

    it('should count all clientes in the estudio via clienteSummary view', async () => {
      mockMembership('SOCIO');
      mockPermisos(['VER_FACTURACION', 'VER_CLIENTES', 'VER_TAREAS']);
      mockClienteSummary.execute.mockResolvedValueOnce({ totalClientes: 15 });

      const result = await handler.execute({ estudioId, usuarioId });
      expect(result.kpis.clientes).toBe(15);
      expect(mockClienteSummary.execute).toHaveBeenCalledWith({
        estudioId,
      });
    });
  });

  describe('RESPONSABLE role without VER_FACTURACION', () => {
    beforeEach(() => {
      createHandler();
    });

    it('should return cargaTrabajo but not facturacion', async () => {
      mockMembership('RESPONSABLE');
      mockPermisos(['VER_CLIENTES', 'VER_TAREAS']);

      const result = await handler.execute({ estudioId, usuarioId });

      expect(result.cargaTrabajo).toBeDefined();
      expect(result.facturacionMensual).toBeUndefined();
      expect(result.kpis.facturacionMes).toBeUndefined();
    });
  });

  describe('RESPONSABLE role with VER_FACTURACION', () => {
    beforeEach(() => {
      createHandler();
    });

    it('should include facturacion and cargaTrabajo', async () => {
      mockMembership('RESPONSABLE');
      mockPermisos(['VER_CLIENTES', 'VER_TAREAS', 'VER_FACTURACION']);

      const result = await handler.execute({ estudioId, usuarioId });

      expect(result.facturacionMensual).toBeDefined();
      expect(result.kpis.facturacionMes).toBeDefined();
      expect(result.cargaTrabajo).toBeDefined();
    });
  });

  describe('EMPLEADO role', () => {
    beforeEach(() => {
      createHandler();
    });

    it('should not return facturacion or cargaTrabajo', async () => {
      mockMembership('EMPLEADO');
      mockPermisos(['VER_CLIENTES', 'VER_TAREAS']);

      const result = await handler.execute({ estudioId, usuarioId });

      expect(result.facturacionMensual).toBeUndefined();
      expect(result.kpis.facturacionMes).toBeUndefined();
      expect(result.cargaTrabajo).toBeUndefined();
    });

    it('should return basic stats', async () => {
      mockMembership('EMPLEADO');
      mockPermisos(['VER_CLIENTES', 'VER_TAREAS']);

      const result = await handler.execute({ estudioId, usuarioId });

      expect(result).toHaveProperty('kpis');
      expect(result.kpis).toHaveProperty('clientes');
      expect(result.kpis).toHaveProperty('vencimientosProximos');
      expect(result.kpis).toHaveProperty('tareasActivas');
      expect(result).toHaveProperty('vencimientosPorEstado');
      expect(result).toHaveProperty('proximosVencimientos');
      expect(result).toHaveProperty('actividadReciente');
    });
  });

  describe('defaults when tables are empty', () => {
    beforeEach(() => {
      createHandler();
    });

    it('should return zero KPIs', async () => {
      mockMembership('SOCIO');
      mockPermisos(['VER_FACTURACION']);

      const result = await handler.execute({ estudioId, usuarioId });

      expect(result.kpis.clientes).toBe(0);
      expect(result.kpis.vencimientosProximos).toBe(0);
      expect(result.kpis.tareasActivas).toBe(0);
      expect(result.kpis.facturacionMes).toBe(0);
    });

    it('should return empty arrays', async () => {
      mockMembership('SOCIO');
      mockPermisos(['VER_FACTURACION']);

      const result = await handler.execute({ estudioId, usuarioId });

      expect(result.vencimientosPorEstado).toEqual([]);
      expect(result.facturacionMensual).toEqual([]);
      expect(result.proximosVencimientos).toEqual([]);
      expect(result.actividadReciente).toEqual([]);
      expect(result.cargaTrabajo).toEqual([]);
    });
  });
});
