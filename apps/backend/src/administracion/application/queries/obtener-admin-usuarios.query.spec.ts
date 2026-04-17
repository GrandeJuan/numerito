import { ObtenerAdminUsuariosHandler } from './obtener-admin-usuarios.query';

describe('ObtenerAdminUsuariosHandler', () => {
  let handler: ObtenerAdminUsuariosHandler;
  let mockUsuariosAdminListView: any;

  const mockListResult = {
    items: [
      {
        id: 'u1',
        email: 'juan@test.com',
        nombre: 'Juan',
        apellido: 'Perez',
        rol: 'ADMIN',
        provider: 'google',
        emailVerified: true,
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
      },
    ],
    total: 1,
    page: 1,
    limit: 20,
  };

  beforeEach(() => {
    mockUsuariosAdminListView = {
      execute: jest.fn().mockResolvedValue(mockListResult),
      getStats: jest.fn().mockResolvedValue({
        total: 50,
        activos: 30,
        verificados: 10,
        sinVerificar: 40,
      }),
    };
    handler = new ObtenerAdminUsuariosHandler(mockUsuariosAdminListView);
  });

  describe('execute', () => {
    it('should delegate to view with empty filters', async () => {
      const result = await handler.execute({});

      expect(mockUsuariosAdminListView.execute).toHaveBeenCalledWith({});
      expect(result).toEqual(mockListResult);
    });

    it('should pass search filter to view', async () => {
      await handler.execute({ search: 'juan' });

      expect(mockUsuariosAdminListView.execute).toHaveBeenCalledWith({ search: 'juan' });
    });

    it('should pass rol filter to view', async () => {
      await handler.execute({ rol: 'ADMIN' });

      expect(mockUsuariosAdminListView.execute).toHaveBeenCalledWith({ rol: 'ADMIN' });
    });

    it('should pass isActive filter to view', async () => {
      await handler.execute({ isActive: true });

      expect(mockUsuariosAdminListView.execute).toHaveBeenCalledWith({ isActive: true });
    });

    it('should pass page and limit to view', async () => {
      await handler.execute({ page: 2, limit: 10 });

      expect(mockUsuariosAdminListView.execute).toHaveBeenCalledWith({ page: 2, limit: 10 });
    });

    it('should return paginated users from view', async () => {
      const result = await handler.execute({});

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should return user fields from view', async () => {
      const result = await handler.execute({});

      expect(result.items[0]).toEqual(
        expect.objectContaining({
          id: 'u1',
          email: 'juan@test.com',
          nombre: 'Juan',
          apellido: 'Perez',
          rol: 'ADMIN',
          provider: 'google',
          emailVerified: true,
          isActive: true,
        }),
      );
    });
  });

  describe('getStats', () => {
    it('should delegate to view getStats', async () => {
      const result = await handler.getStats();

      expect(mockUsuariosAdminListView.getStats).toHaveBeenCalled();
      expect(result.total).toBe(50);
      expect(result.activos).toBe(30);
      expect(result.verificados).toBe(10);
      expect(result.sinVerificar).toBe(40);
    });
  });
});
