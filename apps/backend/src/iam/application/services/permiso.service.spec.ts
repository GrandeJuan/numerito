import { PermisoService } from './permiso.service';
import { ROL } from '@numerito/shared';
import { Permiso } from '../../domain/value-objects/permiso.vo';

describe('PermisoService', () => {
  let service: PermisoService;
  let mockRepo: {
    tienePermiso: jest.Mock;
    findPermisosByRol: jest.Mock;
    asignarPermiso: jest.Mock;
    revocarPermiso: jest.Mock;
  };

  beforeEach(() => {
    mockRepo = {
      tienePermiso: jest.fn(),
      findPermisosByRol: jest.fn(),
      asignarPermiso: jest.fn(),
      revocarPermiso: jest.fn(),
    };
    service = new PermisoService(mockRepo);
  });

  it('should check if rol has permiso', async () => {
    mockRepo.tienePermiso.mockResolvedValue(true);
    const result = await service.tienePermiso(ROL.SOCIO, Permiso.GESTIONAR_USUARIOS);
    expect(result).toBe(true);
    expect(mockRepo.tienePermiso).toHaveBeenCalledWith(ROL.SOCIO, Permiso.GESTIONAR_USUARIOS);
  });

  it('should return false when rol lacks permiso', async () => {
    mockRepo.tienePermiso.mockResolvedValue(false);
    const result = await service.tienePermiso(ROL.CLIENTE, Permiso.GESTIONAR_USUARIOS);
    expect(result).toBe(false);
  });

  it('should get permisos by rol', async () => {
    const permisos = [Permiso.VER_USUARIOS, Permiso.GESTIONAR_USUARIOS];
    mockRepo.findPermisosByRol.mockResolvedValue(permisos);
    const result = await service.getPermisosByRol(ROL.SOCIO);
    expect(result).toEqual(permisos);
    expect(mockRepo.findPermisosByRol).toHaveBeenCalledWith(ROL.SOCIO);
  });

  it('should assign permiso to rol', async () => {
    mockRepo.asignarPermiso.mockResolvedValue(undefined);
    await service.asignarPermiso(ROL.RESPONSABLE, Permiso.VER_CLIENTES);
    expect(mockRepo.asignarPermiso).toHaveBeenCalledWith(ROL.RESPONSABLE, Permiso.VER_CLIENTES);
  });

  it('should revoke permiso from rol', async () => {
    mockRepo.revocarPermiso.mockResolvedValue(undefined);
    await service.revocarPermiso(ROL.RESPONSABLE, Permiso.VER_CLIENTES);
    expect(mockRepo.revocarPermiso).toHaveBeenCalledWith(ROL.RESPONSABLE, Permiso.VER_CLIENTES);
  });
});
