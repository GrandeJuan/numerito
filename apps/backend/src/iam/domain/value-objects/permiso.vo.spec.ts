import { Permiso } from './permiso.vo';
import { PermisoService } from '../../application/services/permiso.service';
import { ROL } from '@numerito/shared';

describe('Permiso System', () => {
  describe('Permiso enum', () => {
    it('should have all expected permissions defined', () => {
      expect(Permiso.GESTIONAR_USUARIOS).toBe('GESTIONAR_USUARIOS');
      expect(Permiso.VER_CLIENTES).toBe('VER_CLIENTES');
      expect(Permiso.VER_PROPIOS_DATOS).toBe('VER_PROPIOS_DATOS');
    });
  });

  describe('PermisoService (DB-based)', () => {
    let service: PermisoService;
    let mockRepo: any;

    beforeEach(() => {
      mockRepo = {
        findPermisosByRol: jest.fn(),
        asignarPermiso: jest.fn().mockResolvedValue(undefined),
        revocarPermiso: jest.fn().mockResolvedValue(undefined),
        tienePermiso: jest.fn(),
      };
      service = new PermisoService(mockRepo);
    });

    it('should check permission via repository', async () => {
      mockRepo.tienePermiso.mockResolvedValue(true);
      const result = await service.tienePermiso(ROL.SOCIO, Permiso.GESTIONAR_USUARIOS);
      expect(result).toBe(true);
      expect(mockRepo.tienePermiso).toHaveBeenCalledWith(ROL.SOCIO, Permiso.GESTIONAR_USUARIOS);
    });

    it('should return false when permission not assigned', async () => {
      mockRepo.tienePermiso.mockResolvedValue(false);
      const result = await service.tienePermiso(ROL.CLIENTE, Permiso.GESTIONAR_USUARIOS);
      expect(result).toBe(false);
    });

    it('should get all permissions for a role', async () => {
      const permisos = [Permiso.VER_PROPIOS_DATOS, Permiso.VER_PROPIOS_DOCUMENTOS];
      mockRepo.findPermisosByRol.mockResolvedValue(permisos);
      const result = await service.getPermisosByRol(ROL.CLIENTE);
      expect(result).toEqual(permisos);
    });

    it('should assign a new permission to a role', async () => {
      await service.asignarPermiso(ROL.EMPLEADO, Permiso.GESTIONAR_TAREAS);
      expect(mockRepo.asignarPermiso).toHaveBeenCalledWith(ROL.EMPLEADO, Permiso.GESTIONAR_TAREAS);
    });

    it('should revoke a permission from a role', async () => {
      await service.revocarPermiso(ROL.RESPONSABLE, Permiso.VER_FACTURACION);
      expect(mockRepo.revocarPermiso).toHaveBeenCalledWith(ROL.RESPONSABLE, Permiso.VER_FACTURACION);
    });
  });
});
