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

import { ObtenerDashboardStatsHandler } from './obtener-dashboard-stats.query';
import type { UsuarioEstudioRepository } from '../../../iam/domain/repositories/usuario-estudio.repository';
import type { RolPermisoRepository } from '../../../iam/domain/repositories/rol-permiso.repository';
import { UsuarioEstudio } from '../../../iam/domain/entities/usuario-estudio.entity';
import { Permiso } from '../../../iam/domain/value-objects/permiso.vo';

describe('ObtenerDashboardStatsHandler', () => {
  let handler: ObtenerDashboardStatsHandler;
  let mockEm: any;
  let mockUeRepo: jest.Mocked<UsuarioEstudioRepository>;
  let mockRpRepo: jest.Mocked<RolPermisoRepository>;
  let mockExecute: jest.Mock;

  const estudioId = 'estudio-uuid';
  const usuarioId = 'usuario-uuid';

  beforeEach(() => {
    mockExecute = jest.fn().mockResolvedValue([]);
    mockEm = {
      count: jest.fn().mockResolvedValue(0),
      find: jest.fn().mockResolvedValue([]),
      getConnection: jest.fn().mockReturnValue({ execute: mockExecute }),
    };
    mockUeRepo = {
      findByUsuarioAndEstudio: jest.fn(),
      findByUsuarioId: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    mockRpRepo = {
      findPermisosByRol: jest.fn().mockResolvedValue([]),
      asignarPermiso: jest.fn(),
      revocarPermiso: jest.fn(),
      tienePermiso: jest.fn(),
    };
  });

  function createHandler() {
    handler = new ObtenerDashboardStatsHandler(mockEm, mockUeRepo, mockRpRepo);
  }

  function createMembership(rol: string) {
    return UsuarioEstudio.create({ usuarioId, estudioId, rol: rol as any });
  }

  describe('when user has no membership', () => {
    it('should throw error', async () => {
      mockUeRepo.findByUsuarioAndEstudio.mockResolvedValue(null);
      createHandler();

      await expect(handler.execute({ estudioId, usuarioId })).rejects.toThrow();
    });
  });

  describe('SOCIO role', () => {
    beforeEach(() => {
      mockUeRepo.findByUsuarioAndEstudio.mockResolvedValue(createMembership('SOCIO'));
      mockRpRepo.findPermisosByRol.mockResolvedValue([
        Permiso.VER_FACTURACION,
        Permiso.VER_CLIENTES,
        Permiso.VER_TAREAS,
      ]);
      // facturacion mensual query
      mockExecute.mockResolvedValue([]);
      createHandler();
    });

    it('should return all stats including facturacion and cargaTrabajo', async () => {
      const result = await handler.execute({ estudioId, usuarioId });

      expect(result).toHaveProperty('kpis');
      expect(result).toHaveProperty('vencimientosPorEstado');
      expect(result).toHaveProperty('facturacionMensual');
      expect(result).toHaveProperty('proximosVencimientos');
      expect(result).toHaveProperty('actividadReciente');
      expect(result).toHaveProperty('cargaTrabajo');
      expect(result.kpis).toHaveProperty('facturacionMes');
    });

    it('should count all clientes in the estudio', async () => {
      mockEm.count.mockResolvedValueOnce(15); // clientes
      const result = await handler.execute({ estudioId, usuarioId });
      expect(result.kpis.clientes).toBe(15);
    });
  });

  describe('RESPONSABLE role without VER_FACTURACION', () => {
    beforeEach(() => {
      mockUeRepo.findByUsuarioAndEstudio.mockResolvedValue(createMembership('RESPONSABLE'));
      mockRpRepo.findPermisosByRol.mockResolvedValue([Permiso.VER_CLIENTES, Permiso.VER_TAREAS]);
      createHandler();
    });

    it('should return cargaTrabajo but not facturacion', async () => {
      const result = await handler.execute({ estudioId, usuarioId });

      expect(result.cargaTrabajo).toBeDefined();
      expect(result.facturacionMensual).toBeUndefined();
      expect(result.kpis.facturacionMes).toBeUndefined();
    });
  });

  describe('RESPONSABLE role with VER_FACTURACION', () => {
    beforeEach(() => {
      mockUeRepo.findByUsuarioAndEstudio.mockResolvedValue(createMembership('RESPONSABLE'));
      mockRpRepo.findPermisosByRol.mockResolvedValue([
        Permiso.VER_CLIENTES,
        Permiso.VER_TAREAS,
        Permiso.VER_FACTURACION,
      ]);
      mockExecute.mockResolvedValue([]);
      createHandler();
    });

    it('should include facturacion and cargaTrabajo', async () => {
      const result = await handler.execute({ estudioId, usuarioId });

      expect(result.facturacionMensual).toBeDefined();
      expect(result.kpis.facturacionMes).toBeDefined();
      expect(result.cargaTrabajo).toBeDefined();
    });
  });

  describe('EMPLEADO role', () => {
    beforeEach(() => {
      mockUeRepo.findByUsuarioAndEstudio.mockResolvedValue(createMembership('EMPLEADO'));
      mockRpRepo.findPermisosByRol.mockResolvedValue([Permiso.VER_CLIENTES, Permiso.VER_TAREAS]);
      createHandler();
    });

    it('should not return facturacion or cargaTrabajo', async () => {
      const result = await handler.execute({ estudioId, usuarioId });

      expect(result.facturacionMensual).toBeUndefined();
      expect(result.kpis.facturacionMes).toBeUndefined();
      expect(result.cargaTrabajo).toBeUndefined();
    });

    it('should return basic stats', async () => {
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
      mockUeRepo.findByUsuarioAndEstudio.mockResolvedValue(createMembership('SOCIO'));
      mockRpRepo.findPermisosByRol.mockResolvedValue([Permiso.VER_FACTURACION]);
      mockExecute.mockResolvedValue([]);
      createHandler();
    });

    it('should return zero KPIs', async () => {
      const result = await handler.execute({ estudioId, usuarioId });

      expect(result.kpis.clientes).toBe(0);
      expect(result.kpis.vencimientosProximos).toBe(0);
      expect(result.kpis.tareasActivas).toBe(0);
      expect(result.kpis.facturacionMes).toBe(0);
    });

    it('should return empty arrays', async () => {
      const result = await handler.execute({ estudioId, usuarioId });

      expect(result.vencimientosPorEstado).toEqual([]);
      expect(result.facturacionMensual).toEqual([]);
      expect(result.proximosVencimientos).toEqual([]);
      expect(result.actividadReciente).toEqual([]);
      expect(result.cargaTrabajo).toEqual([]);
    });
  });
});
