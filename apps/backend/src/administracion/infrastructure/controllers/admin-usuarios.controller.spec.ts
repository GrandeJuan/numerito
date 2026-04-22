jest.mock('../../../iam/infrastructure/persistence/usuario.schema', () => ({
  UsuarioEntity: class UsuarioEntity {},
}));
jest.mock('../../../shared/infrastructure/persistence/rol.schema', () => ({
  RolEntity: class RolEntity {},
}));

import { AdminUsuariosController } from './admin-usuarios.controller';
import { ObtenerAdminUsuariosHandler } from '../../application/queries/obtener-admin-usuarios.query';
import { AdminGuard } from '../../../shared/infrastructure/guards/admin.guard';

describe('AdminUsuariosController', () => {
  let controller: AdminUsuariosController;
  let mockHandler: jest.Mocked<ObtenerAdminUsuariosHandler>;

  const mockItems = [
    {
      id: 'u1',
      email: 'test@example.com',
      nombre: 'Test',
      apellido: 'User',
      rol: 'ADMIN',
      provider: null,
      emailVerified: true,
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
    },
  ];

  const mockStats = {
    total: 50,
    activos: 40,
    verificados: 35,
    sinVerificar: 15,
  };

  let mockInvitarHandler: any;

  beforeEach(() => {
    mockHandler = {
      execute: jest.fn().mockResolvedValue({ items: mockItems, total: 1, page: 1, limit: 20 }),
      getStats: jest.fn().mockResolvedValue(mockStats),
    } as any;
    mockInvitarHandler = {
      execute: jest.fn().mockResolvedValue({
        id: 'inv-1',
        email: 'new@admin.com',
        nombre: 'New Admin',
        rol: 'SUPERADMIN',
      }),
    };
    controller = new AdminUsuariosController(mockHandler, mockInvitarHandler);
  });

  describe('list', () => {
    it('should return paginated users wrapped in successResponse', async () => {
      const result = await controller.list({});

      expect(mockHandler.execute).toHaveBeenCalledWith({});
      expect(result.data).toEqual(mockItems);
      expect(result.meta).toHaveProperty('total', 1);
      expect(result.meta).toHaveProperty('page', 1);
      expect(result.meta).toHaveProperty('limit', 20);
    });

    it('should pass query params to handler', async () => {
      const query = { search: 'juan', rol: 'ADMIN', isActive: 'true', page: '2', limit: '10' };
      await controller.list(query);

      expect(mockHandler.execute).toHaveBeenCalledWith({
        search: 'juan',
        rol: 'ADMIN',
        isActive: true,
        page: 2,
        limit: 10,
      });
    });

    it('should handle isActive=false', async () => {
      await controller.list({ isActive: 'false' });

      expect(mockHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
    });
  });

  describe('stats', () => {
    it('should return stats wrapped in successResponse', async () => {
      const result = await controller.stats();

      expect(mockHandler.getStats).toHaveBeenCalledTimes(1);
      expect(result.data).toEqual(mockStats);
      expect(result.meta).toHaveProperty('timestamp');
    });
  });

  describe('invite', () => {
    it('should invite user via handler and return result', async () => {
      const body = { email: 'new@admin.com', nombre: 'New Admin', rol: 'SUPERADMIN' as const };
      const result = await controller.invite(body);

      expect(mockInvitarHandler.execute).toHaveBeenCalledWith(body);
      expect(result.data).toHaveProperty('id', 'inv-1');
      expect(result.data).toHaveProperty('email', 'new@admin.com');
      expect(result.data).toHaveProperty('rol', 'SUPERADMIN');
    });

    it('should pass optional nombre to handler', async () => {
      const body = { email: 'noname@admin.com', rol: 'SOCIO' as const };
      await controller.invite(body);

      expect(mockInvitarHandler.execute).toHaveBeenCalledWith(body);
    });
  });

  it('should have AdminGuard applied', () => {
    const guards = Reflect.getMetadata('__guards__', AdminUsuariosController);
    expect(guards).toBeDefined();
    expect(guards).toContain(AdminGuard);
  });
});
