import { AdminEstudiosService } from './admin-estudios.service';

describe('AdminEstudiosService', () => {
  let service: AdminEstudiosService;
  let mockEstudiosAdminListView: any;

  const mockResult = {
    items: [
      {
        id: 'est-1',
        nombre: 'Estudio Demo',
        cuit: '20-12345678-6',
        plan: 'Profesional',
        planCodigo: 'PROFESIONAL',
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'est-2',
        nombre: 'Estudio Test',
        cuit: '20-99999999-0',
        plan: 'Sin plan',
        planCodigo: null,
        isActive: false,
        createdAt: '2026-02-15T00:00:00.000Z',
      },
    ],
    total: 2,
    page: 1,
    limit: 20,
  };

  beforeEach(() => {
    mockEstudiosAdminListView = {
      execute: jest.fn().mockResolvedValue(mockResult),
    };
    service = new AdminEstudiosService(mockEstudiosAdminListView);
  });

  describe('list', () => {
    it('should delegate to view with empty filters', async () => {
      const result = await service.list({});

      expect(mockEstudiosAdminListView.execute).toHaveBeenCalledWith({});
      expect(result).toEqual(mockResult);
    });

    it('should pass search filter to view', async () => {
      await service.list({ search: 'demo' });

      expect(mockEstudiosAdminListView.execute).toHaveBeenCalledWith({ search: 'demo' });
    });

    it('should pass plan filter to view', async () => {
      await service.list({ plan: 'PROFESIONAL' });

      expect(mockEstudiosAdminListView.execute).toHaveBeenCalledWith({ plan: 'PROFESIONAL' });
    });

    it('should pass isActive filter to view', async () => {
      await service.list({ isActive: true });

      expect(mockEstudiosAdminListView.execute).toHaveBeenCalledWith({ isActive: true });
    });

    it('should pass date range filters to view', async () => {
      await service.list({ from: '2026-01-01', to: '2026-12-31' });

      expect(mockEstudiosAdminListView.execute).toHaveBeenCalledWith({
        from: '2026-01-01',
        to: '2026-12-31',
      });
    });

    it('should pass page and limit to view', async () => {
      await service.list({ page: 3, limit: 5 });

      expect(mockEstudiosAdminListView.execute).toHaveBeenCalledWith({ page: 3, limit: 5 });
    });

    it('should return paginated results from view', async () => {
      const result = await service.list({});

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });
});
