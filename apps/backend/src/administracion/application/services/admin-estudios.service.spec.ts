jest.mock('@mikro-orm/core', () => ({}));
jest.mock('../../../estudio/infrastructure/persistence/estudio.schema', () => ({
  EstudioEntity: class EstudioEntity {},
}));
jest.mock('../../../shared/infrastructure/persistence/plan.schema', () => ({
  PlanEntity: class PlanEntity {},
}));

import { AdminEstudiosService } from './admin-estudios.service';

describe('AdminEstudiosService', () => {
  let service: AdminEstudiosService;
  let mockEm: any;

  const mockEstudioEntities = [
    {
      id: 'est-1',
      nombre: 'Estudio Demo',
      cuit: '20-12345678-6',
      plan: { nombre: 'Profesional', codigo: 'PROFESIONAL' },
      isActive: true,
      createdAt: new Date('2026-01-01'),
    },
    {
      id: 'est-2',
      nombre: 'Estudio Test',
      cuit: '20-99999999-0',
      plan: null,
      isActive: false,
      createdAt: new Date('2026-02-15'),
    },
  ];

  beforeEach(() => {
    mockEm = {
      findAndCount: jest.fn().mockResolvedValue([mockEstudioEntities, 2]),
    };
    service = new AdminEstudiosService(mockEm);
  });

  describe('list', () => {
    it('should return paginated estudios with defaults', async () => {
      const result = await service.list({});

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should map estudio fields correctly', async () => {
      const result = await service.list({});

      expect(result.items[0]).toEqual({
        id: 'est-1',
        nombre: 'Estudio Demo',
        cuit: '20-12345678-6',
        plan: 'Profesional',
        planCodigo: 'PROFESIONAL',
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      });
    });

    it('should handle estudio without plan', async () => {
      const result = await service.list({});

      expect(result.items[1].plan).toBe('Sin plan');
      expect(result.items[1].planCodigo).toBeNull();
    });

    it('should apply search filter with $or on nombre and cuit', async () => {
      await service.list({ search: 'demo' });

      const where = mockEm.findAndCount.mock.calls[0][1];
      expect(where.$or).toBeDefined();
      expect(where.$or).toHaveLength(2);
      expect(where.$or[0].nombre.$ilike).toBe('%demo%');
      expect(where.$or[1].cuit.$ilike).toBe('%demo%');
    });

    it('should apply plan filter', async () => {
      await service.list({ plan: 'PROFESIONAL' });

      const where = mockEm.findAndCount.mock.calls[0][1];
      expect(where.plan).toEqual({ codigo: 'PROFESIONAL' });
    });

    it('should apply isActive filter', async () => {
      await service.list({ isActive: true });

      const where = mockEm.findAndCount.mock.calls[0][1];
      expect(where.isActive).toBe(true);
    });

    it('should apply date range filters', async () => {
      await service.list({ from: '2026-01-01', to: '2026-12-31' });

      const where = mockEm.findAndCount.mock.calls[0][1];
      expect(where.createdAt.$gte).toEqual(new Date('2026-01-01'));
      expect(where.createdAt.$lte).toEqual(new Date('2026-12-31'));
    });

    it('should respect page and limit', async () => {
      await service.list({ page: 3, limit: 5 });

      expect(mockEm.findAndCount).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Object),
        expect.objectContaining({ limit: 5, offset: 10 }),
      );
    });

    it('should order by createdAt DESC', async () => {
      await service.list({});

      expect(mockEm.findAndCount).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Object),
        expect.objectContaining({ orderBy: { createdAt: 'DESC' } }),
      );
    });

    it('should populate plan relation', async () => {
      await service.list({});

      expect(mockEm.findAndCount).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Object),
        expect.objectContaining({ populate: ['plan'] }),
      );
    });
  });
});
