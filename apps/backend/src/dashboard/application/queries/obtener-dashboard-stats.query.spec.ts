import { ObtenerDashboardStatsHandler } from './obtener-dashboard-stats.query';

describe('ObtenerDashboardStatsHandler', () => {
  let handler: ObtenerDashboardStatsHandler;
  let mockClienteSummary: any;
  let mockVencimientosProximos: any;
  let mockTareasPendientes: any;
  let mockVencimientosPorEstado: any;
  let mockProximosVencimientosDetalle: any;
  let mockCargaTrabajo: any;
  let mockFacturacionMes: any;
  let mockFacturacionMensual: any;
  let mockMembershipView: any;
  let mockActividadTareas: any;
  let mockActividadVencimientos: any;

  const estudioId = 'estudio-uuid';
  const usuarioId = 'usuario-uuid';

  beforeEach(() => {
    mockClienteSummary = {
      execute: jest.fn().mockResolvedValue({ totalClientes: 0 }),
    };
    mockVencimientosProximos = {
      execute: jest.fn().mockResolvedValue({ totalVencimientosProximos: 0 }),
    };
    mockTareasPendientes = {
      execute: jest.fn().mockResolvedValue({ totalTareasPendientes: 0 }),
    };
    mockVencimientosPorEstado = {
      execute: jest.fn().mockResolvedValue([]),
    };
    mockProximosVencimientosDetalle = {
      execute: jest.fn().mockResolvedValue([]),
    };
    mockCargaTrabajo = {
      execute: jest.fn().mockResolvedValue([]),
    };
    mockFacturacionMes = {
      execute: jest.fn().mockResolvedValue({ total: 0 }),
    };
    mockFacturacionMensual = {
      execute: jest.fn().mockResolvedValue([]),
    };
    mockMembershipView = {
      execute: jest.fn().mockResolvedValue(null),
    };
    mockActividadTareas = {
      execute: jest.fn().mockResolvedValue([]),
    };
    mockActividadVencimientos = {
      execute: jest.fn().mockResolvedValue([]),
    };
  });

  function createHandler() {
    handler = new ObtenerDashboardStatsHandler(
      mockClienteSummary,
      mockVencimientosProximos,
      mockTareasPendientes,
      mockVencimientosPorEstado,
      mockProximosVencimientosDetalle,
      mockCargaTrabajo,
      mockFacturacionMes,
      mockFacturacionMensual,
      mockMembershipView,
      mockActividadTareas,
      mockActividadVencimientos,
    );
  }

  function mockMembership(rol: string, permisos: string[] = []) {
    mockMembershipView.execute.mockResolvedValueOnce({
      isActive: true,
      rol,
      permisos,
    });
  }

  describe('when user has no membership', () => {
    it('should throw error', async () => {
      mockMembershipView.execute.mockResolvedValueOnce(null);
      createHandler();

      await expect(handler.execute({ estudioId, usuarioId })).rejects.toThrow();
    });
  });

  describe('when membership is inactive', () => {
    it('should throw error', async () => {
      mockMembershipView.execute.mockResolvedValueOnce({
        isActive: false,
        rol: 'SOCIO',
        permisos: [],
      });
      createHandler();

      await expect(handler.execute({ estudioId, usuarioId })).rejects.toThrow();
    });
  });

  describe('SOCIO role', () => {
    beforeEach(() => {
      createHandler();
    });

    it('should return all stats including facturacion and cargaTrabajo', async () => {
      mockMembership('SOCIO', ['VER_FACTURACION', 'VER_CLIENTES', 'VER_TAREAS']);

      const result = await handler.execute({ estudioId, usuarioId });

      expect(result).toHaveProperty('kpis');
      expect(result).toHaveProperty('vencimientosPorEstado');
      expect(result).toHaveProperty('facturacionMensual');
      expect(result).toHaveProperty('proximosVencimientos');
      expect(result).toHaveProperty('actividadReciente');
      expect(result).toHaveProperty('cargaTrabajo');
      expect(result.kpis).toHaveProperty('facturacionMes');
    });

    it('should delegate membership check to view', async () => {
      mockMembership('SOCIO', ['VER_FACTURACION']);

      await handler.execute({ estudioId, usuarioId });

      expect(mockMembershipView.execute).toHaveBeenCalledWith({ usuarioId, estudioId });
    });

    it('should count all clientes in the estudio via clienteSummary view', async () => {
      mockMembership('SOCIO', ['VER_FACTURACION', 'VER_CLIENTES', 'VER_TAREAS']);
      mockClienteSummary.execute.mockResolvedValueOnce({ totalClientes: 15 });

      const result = await handler.execute({ estudioId, usuarioId });
      expect(result.kpis.clientes).toBe(15);
      expect(mockClienteSummary.execute).toHaveBeenCalledWith({
        estudioId,
      });
    });

    it('should count vencimientos proximos via vencimientosProximos view', async () => {
      mockMembership('SOCIO', ['VER_FACTURACION', 'VER_CLIENTES', 'VER_TAREAS']);
      mockVencimientosProximos.execute.mockResolvedValueOnce({ totalVencimientosProximos: 8 });

      const result = await handler.execute({ estudioId, usuarioId });
      expect(result.kpis.vencimientosProximos).toBe(8);
      expect(mockVencimientosProximos.execute).toHaveBeenCalledWith({
        estudioId,
      });
    });

    it('should count tareas activas via tareasPendientes view', async () => {
      mockMembership('SOCIO', ['VER_FACTURACION', 'VER_CLIENTES', 'VER_TAREAS']);
      mockTareasPendientes.execute.mockResolvedValueOnce({ totalTareasPendientes: 11 });

      const result = await handler.execute({ estudioId, usuarioId });
      expect(result.kpis.tareasActivas).toBe(11);
      expect(mockTareasPendientes.execute).toHaveBeenCalledWith({
        estudioId,
      });
    });

    it('should delegate vencimientosPorEstado to view', async () => {
      mockMembership('SOCIO', ['VER_FACTURACION']);
      mockVencimientosPorEstado.execute.mockResolvedValueOnce([
        { estado: 'PENDIENTE', cantidad: 10 },
      ]);

      const result = await handler.execute({ estudioId, usuarioId });

      expect(result.vencimientosPorEstado).toEqual([{ estado: 'PENDIENTE', cantidad: 10 }]);
      expect(mockVencimientosPorEstado.execute).toHaveBeenCalledWith({ estudioId });
    });

    it('should delegate proximosVencimientos to view', async () => {
      mockMembership('SOCIO', ['VER_FACTURACION']);
      mockProximosVencimientosDetalle.execute.mockResolvedValueOnce([
        { id: 'v-1', cliente: 'Acme', obligacion: 'IVA', fecha: '2026-05-01', estado: 'PENDIENTE' },
      ]);

      const result = await handler.execute({ estudioId, usuarioId });

      expect(result.proximosVencimientos).toEqual([
        { id: 'v-1', cliente: 'Acme', obligacion: 'IVA', fecha: '2026-05-01', estado: 'PENDIENTE' },
      ]);
      expect(mockProximosVencimientosDetalle.execute).toHaveBeenCalledWith({ estudioId });
    });

    it('should delegate facturacionMes to view', async () => {
      mockMembership('SOCIO', ['VER_FACTURACION']);
      mockFacturacionMes.execute.mockResolvedValueOnce({ total: 250000 });

      const result = await handler.execute({ estudioId, usuarioId });

      expect(result.kpis.facturacionMes).toBe(250000);
      expect(mockFacturacionMes.execute).toHaveBeenCalledWith({ estudioId });
    });

    it('should delegate facturacionMensual to view', async () => {
      mockMembership('SOCIO', ['VER_FACTURACION']);
      mockFacturacionMensual.execute.mockResolvedValueOnce([
        { mes: '2026-03', monto: 100000 },
      ]);

      const result = await handler.execute({ estudioId, usuarioId });

      expect(result.facturacionMensual).toEqual([{ mes: '2026-03', monto: 100000 }]);
      expect(mockFacturacionMensual.execute).toHaveBeenCalledWith({ estudioId });
    });

    it('should delegate cargaTrabajo to view', async () => {
      mockMembership('SOCIO', ['VER_FACTURACION']);
      mockCargaTrabajo.execute.mockResolvedValueOnce([
        { usuario: 'alice@test.com', tareas: 5 },
      ]);

      const result = await handler.execute({ estudioId, usuarioId });

      expect(result.cargaTrabajo).toEqual([{ usuario: 'alice@test.com', tareas: 5 }]);
      expect(mockCargaTrabajo.execute).toHaveBeenCalledWith({ estudioId });
    });

    it('should compose actividadReciente from tareas + vencimientos views', async () => {
      mockMembership('SOCIO', ['VER_FACTURACION']);
      mockActividadTareas.execute.mockResolvedValueOnce([
        { tipo: 'tarea', descripcion: 'Tarea "Test" actualizada', fecha: '2026-04-15 10:00:00', usuario: 'a@test.com' },
      ]);
      mockActividadVencimientos.execute.mockResolvedValueOnce([
        { tipo: 'vencimiento', descripcion: 'Vencimiento de Acme', fecha: '2026-04-16 09:00:00' },
      ]);

      const result = await handler.execute({ estudioId, usuarioId });

      expect(result.actividadReciente).toHaveLength(2);
      // sorted by fecha DESC
      expect(result.actividadReciente[0].tipo).toBe('vencimiento');
      expect(result.actividadReciente[1].tipo).toBe('tarea');
    });
  });

  describe('RESPONSABLE role without VER_FACTURACION', () => {
    beforeEach(() => {
      createHandler();
    });

    it('should return cargaTrabajo but not facturacion', async () => {
      mockMembership('RESPONSABLE', ['VER_CLIENTES', 'VER_TAREAS']);

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
      mockMembership('RESPONSABLE', ['VER_CLIENTES', 'VER_TAREAS', 'VER_FACTURACION']);

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
      mockMembership('EMPLEADO', ['VER_CLIENTES', 'VER_TAREAS']);

      const result = await handler.execute({ estudioId, usuarioId });

      expect(result.facturacionMensual).toBeUndefined();
      expect(result.kpis.facturacionMes).toBeUndefined();
      expect(result.cargaTrabajo).toBeUndefined();
    });

    it('should return basic stats', async () => {
      mockMembership('EMPLEADO', ['VER_CLIENTES', 'VER_TAREAS']);

      const result = await handler.execute({ estudioId, usuarioId });

      expect(result).toHaveProperty('kpis');
      expect(result.kpis).toHaveProperty('clientes');
      expect(result.kpis).toHaveProperty('vencimientosProximos');
      expect(result.kpis).toHaveProperty('tareasActivas');
      expect(result).toHaveProperty('vencimientosPorEstado');
      expect(result).toHaveProperty('proximosVencimientos');
      expect(result).toHaveProperty('actividadReciente');
    });

    it('should pass responsableId to tareasPendientes view', async () => {
      mockMembership('EMPLEADO', ['VER_CLIENTES', 'VER_TAREAS']);

      await handler.execute({ estudioId, usuarioId });

      expect(mockTareasPendientes.execute).toHaveBeenCalledWith({
        estudioId,
        responsableId: usuarioId,
      });
    });

    it('should pass responsableId to actividadTareas view', async () => {
      mockMembership('EMPLEADO', ['VER_CLIENTES', 'VER_TAREAS']);

      await handler.execute({ estudioId, usuarioId });

      expect(mockActividadTareas.execute).toHaveBeenCalledWith({
        estudioId,
        responsableId: usuarioId,
      });
    });
  });

  describe('defaults when tables are empty', () => {
    beforeEach(() => {
      createHandler();
    });

    it('should return zero KPIs', async () => {
      mockMembership('SOCIO', ['VER_FACTURACION']);

      const result = await handler.execute({ estudioId, usuarioId });

      expect(result.kpis.clientes).toBe(0);
      expect(result.kpis.vencimientosProximos).toBe(0);
      expect(result.kpis.tareasActivas).toBe(0);
      expect(result.kpis.facturacionMes).toBe(0);
    });

    it('should return empty arrays', async () => {
      mockMembership('SOCIO', ['VER_FACTURACION']);

      const result = await handler.execute({ estudioId, usuarioId });

      expect(result.vencimientosPorEstado).toEqual([]);
      expect(result.facturacionMensual).toEqual([]);
      expect(result.proximosVencimientos).toEqual([]);
      expect(result.actividadReciente).toEqual([]);
      expect(result.cargaTrabajo).toEqual([]);
    });
  });
});
