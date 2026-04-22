import { AdminSearchController } from './admin-search.controller';
import { AdminSearchHandler } from '../../application/queries/admin-search.query';
import { AdminGuard } from '../../../shared/infrastructure/guards/admin.guard';

describe('AdminSearchController', () => {
  let controller: AdminSearchController;
  let mockHandler: jest.Mocked<AdminSearchHandler>;

  const mockResult = {
    estudios: [
      {
        id: 'est-1',
        nombre: 'Estudio Perez',
        cuit: '20-12345678-9',
        plan: 'Profesional',
        isActive: true,
      },
    ],
    usuarios: [
      {
        id: 'usr-1',
        email: 'juan@perez.com',
        nombre: 'Juan',
        apellido: 'Perez',
        rol: 'SOCIO',
        isActive: true,
      },
    ],
  };

  beforeEach(() => {
    mockHandler = {
      execute: jest.fn().mockResolvedValue(mockResult),
    } as any;
    controller = new AdminSearchController(mockHandler);
  });

  describe('search', () => {
    it('should call handler with query and return wrapped response', async () => {
      const result = await controller.search('perez');

      expect(mockHandler.execute).toHaveBeenCalledWith('perez');
      expect(result.data).toEqual(mockResult);
      expect(result.meta).toHaveProperty('timestamp');
    });

    it('should handle empty query parameter', async () => {
      mockHandler.execute.mockResolvedValue({ estudios: [], usuarios: [] });

      const result = await controller.search('');

      expect(mockHandler.execute).toHaveBeenCalledWith('');
      expect(result.data).toEqual({ estudios: [], usuarios: [] });
    });

    it('should handle undefined query parameter', async () => {
      mockHandler.execute.mockResolvedValue({ estudios: [], usuarios: [] });

      await controller.search(undefined as any);

      expect(mockHandler.execute).toHaveBeenCalledWith('');
    });
  });

  it('should have AdminGuard applied', () => {
    const guards = Reflect.getMetadata('__guards__', AdminSearchController);
    expect(guards).toBeDefined();
    expect(guards).toContain(AdminGuard);
  });
});
