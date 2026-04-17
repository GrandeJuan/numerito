import { UsuariosAdminListView } from './usuarios-admin-list.view';

describe('UsuariosAdminListView', () => {
  let view: UsuariosAdminListView;
  let mockEm: any;

  const mockUsuarios = [
    {
      id: 'u1',
      email: 'juan@test.com',
      nombre: 'Juan',
      apellido: 'Perez',
      isActive: true,
      emailVerified: true,
      provider: 'google',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-03-01'),
      rol: { codigo: 'ADMIN', nombre: 'Administrador' },
    },
  ];

  beforeEach(() => {
    mockEm = {
      findAndCount: jest.fn().mockResolvedValue([mockUsuarios, 1]),
      count: jest.fn().mockResolvedValue(0),
    };
    view = new UsuariosAdminListView(mockEm);
  });

  describe('execute', () => {
    it('should return paginated users with default params', async () => {
      const result = await view.execute({});

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should call findAndCount with correct options', async () => {
      await view.execute({});

      expect(mockEm.findAndCount).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Object),
        expect.objectContaining({
          populate: ['rol'],
          orderBy: { createdAt: 'DESC' },
          limit: 20,
          offset: 0,
        }),
      );
    });

    it('should apply search filter on nombre, apellido, and email', async () => {
      await view.execute({ search: 'juan' });

      const where = mockEm.findAndCount.mock.calls[0][1];
      expect(where.$or).toBeDefined();
      expect(where.$or).toHaveLength(3);
    });

    it('should apply rol filter', async () => {
      await view.execute({ rol: 'ADMIN' });

      const where = mockEm.findAndCount.mock.calls[0][1];
      expect(where.rol).toEqual({ codigo: 'ADMIN' });
    });

    it('should apply isActive filter', async () => {
      await view.execute({ isActive: true });

      const where = mockEm.findAndCount.mock.calls[0][1];
      expect(where.isActive).toBe(true);
    });

    it('should respect page and limit params', async () => {
      await view.execute({ page: 2, limit: 10 });

      expect(mockEm.findAndCount).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Object),
        expect.objectContaining({ limit: 10, offset: 10 }),
      );
    });

    it('should map usuario fields correctly', async () => {
      const result = await view.execute({});

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
    it('should return stats with correct shape', async () => {
      mockEm.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(10);

      const result = await view.getStats();

      expect(result.total).toBe(50);
      expect(result.activos).toBe(30);
      expect(result.verificados).toBe(10);
      expect(result.sinVerificar).toBe(40);
    });
  });
});
