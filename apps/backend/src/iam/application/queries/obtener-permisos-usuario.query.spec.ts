import { ObtenerPermisosUsuarioHandler } from './obtener-permisos-usuario.query';
import { Permiso } from '../../domain/value-objects/permiso.vo';

describe('ObtenerPermisosUsuarioHandler', () => {
  let handler: ObtenerPermisosUsuarioHandler;
  let mockUsuarioEstudioRepo: any;
  let mockRolPermisoRepo: any;

  beforeEach(() => {
    mockUsuarioEstudioRepo = {
      findByUsuarioAndEstudio: jest.fn(),
    };
    mockRolPermisoRepo = {
      findPermisosByRol: jest.fn(),
    };
    handler = new ObtenerPermisosUsuarioHandler(mockUsuarioEstudioRepo, mockRolPermisoRepo);
  });

  it('should return permissions for user role in estudio', async () => {
    const permisos = [Permiso.VER_CLIENTES, Permiso.GESTIONAR_CLIENTES];
    mockUsuarioEstudioRepo.findByUsuarioAndEstudio.mockResolvedValue({
      usuarioId: 'user-1',
      estudioId: 'est-1',
      rol: 'SOCIO',
      isActive: true,
    });
    mockRolPermisoRepo.findPermisosByRol.mockResolvedValue(permisos);

    const result = await handler.execute({ usuarioId: 'user-1', estudioId: 'est-1' });

    expect(result).toEqual(permisos);
    expect(mockUsuarioEstudioRepo.findByUsuarioAndEstudio).toHaveBeenCalledWith('user-1', 'est-1');
    expect(mockRolPermisoRepo.findPermisosByRol).toHaveBeenCalledWith('SOCIO');
  });

  it('should return empty array if user not found in estudio', async () => {
    mockUsuarioEstudioRepo.findByUsuarioAndEstudio.mockResolvedValue(null);

    const result = await handler.execute({ usuarioId: 'user-1', estudioId: 'est-1' });

    expect(result).toEqual([]);
    expect(mockRolPermisoRepo.findPermisosByRol).not.toHaveBeenCalled();
  });

  it('should return empty array if membership is inactive', async () => {
    mockUsuarioEstudioRepo.findByUsuarioAndEstudio.mockResolvedValue({
      usuarioId: 'user-1',
      estudioId: 'est-1',
      rol: 'EMPLEADO',
      isActive: false,
    });

    const result = await handler.execute({ usuarioId: 'user-1', estudioId: 'est-1' });

    expect(result).toEqual([]);
    expect(mockRolPermisoRepo.findPermisosByRol).not.toHaveBeenCalled();
  });

  it('should call findByUsuarioAndEstudio then findPermisosByRol in order', async () => {
    const callOrder: string[] = [];
    mockUsuarioEstudioRepo.findByUsuarioAndEstudio.mockImplementation(async () => {
      callOrder.push('findByUsuarioAndEstudio');
      return { usuarioId: 'user-1', estudioId: 'est-1', rol: 'RESPONSABLE', isActive: true };
    });
    mockRolPermisoRepo.findPermisosByRol.mockImplementation(async () => {
      callOrder.push('findPermisosByRol');
      return [Permiso.VER_CLIENTES];
    });

    await handler.execute({ usuarioId: 'user-1', estudioId: 'est-1' });

    expect(callOrder).toEqual(['findByUsuarioAndEstudio', 'findPermisosByRol']);
  });
});
