jest.mock('@mikro-orm/core', () => ({}));
jest.mock('../../../estudio/infrastructure/persistence/estudio.schema', () => ({
  EstudioEntity: class EstudioEntity {},
}));
jest.mock('../../../shared/infrastructure/persistence/plan.schema', () => ({
  PlanEntity: class PlanEntity {},
}));

import { AdminEstudiosController } from './admin-estudios.controller';

describe('AdminEstudiosController', () => {
  let controller: AdminEstudiosController;
  let mockEstudioRepo: any;
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
  ];

  const makeEstudio = (overrides: any = {}) => ({
    id: 'est-1',
    nombre: { value: 'Estudio Demo' },
    cuit: '20-12345678-6',
    isActive: true,
    plan: { value: 'PROFESIONAL', maxClientes: 50, maxUsuarios: 5 },
    deactivate: jest.fn().mockImplementation(function (this: any) { this.isActive = false; }),
    activate: jest.fn().mockImplementation(function (this: any) { this.isActive = true; }),
    ...overrides,
  });

  beforeEach(() => {
    mockEm = {
      findAndCount: jest.fn().mockResolvedValue([mockEstudioEntities, 1]),
    };
    mockEstudioRepo = {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(undefined),
    };
    controller = new AdminEstudiosController(mockEstudioRepo, mockEm);
  });

  describe('list', () => {
    it('should return paginated estudios', async () => {
      const result = await controller.list({});

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toHaveProperty('nombre', 'Estudio Demo');
      expect(result.meta).toHaveProperty('total', 1);
      expect(result.meta).toHaveProperty('page', 1);
    });

    it('should apply search filter', async () => {
      await controller.list({ search: 'demo' });

      const where = mockEm.findAndCount.mock.calls[0][1];
      expect(where.$or).toBeDefined();
      expect(where.$or).toHaveLength(2);
    });

    it('should apply plan filter', async () => {
      await controller.list({ plan: 'PROFESIONAL' });

      const where = mockEm.findAndCount.mock.calls[0][1];
      expect(where.plan).toEqual({ codigo: 'PROFESIONAL' });
    });

    it('should apply isActive filter', async () => {
      await controller.list({ isActive: 'true' });

      const where = mockEm.findAndCount.mock.calls[0][1];
      expect(where.isActive).toBe(true);
    });

    it('should apply date range filters', async () => {
      await controller.list({ from: '2026-01-01', to: '2026-12-31' });

      const where = mockEm.findAndCount.mock.calls[0][1];
      expect(where.createdAt.$gte).toEqual(new Date('2026-01-01'));
      expect(where.createdAt.$lte).toEqual(new Date('2026-12-31'));
    });

    it('should respect page and limit', async () => {
      await controller.list({ page: '3', limit: '5' });

      expect(mockEm.findAndCount).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Object),
        expect.objectContaining({ limit: 5, offset: 10 }),
      );
    });

    it('should map estudio fields correctly', async () => {
      const result = await controller.list({});

      expect(result.data[0]).toEqual({
        id: 'est-1',
        nombre: 'Estudio Demo',
        cuit: '20-12345678-6',
        plan: 'Profesional',
        planCodigo: 'PROFESIONAL',
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      });
    });
  });

  describe('getById', () => {
    it('should return estudio by id', async () => {
      const estudio = makeEstudio();
      mockEstudioRepo.findById.mockResolvedValue(estudio);

      const result = await controller.getById('est-1');
      expect(result.id).toBe('est-1');
    });

    it('should throw when not found', async () => {
      await expect(controller.getById('bad')).rejects.toThrow('Estudio no encontrado');
    });
  });

  describe('suspend', () => {
    it('should deactivate estudio', async () => {
      const estudio = makeEstudio();
      mockEstudioRepo.findById.mockResolvedValue(estudio);

      await controller.suspend('est-1');
      expect(estudio.deactivate).toHaveBeenCalled();
      expect(mockEstudioRepo.save).toHaveBeenCalledWith(estudio);
    });

    it('should throw when not found', async () => {
      await expect(controller.suspend('bad')).rejects.toThrow('Estudio no encontrado');
    });
  });

  describe('reactivate', () => {
    it('should activate estudio', async () => {
      const estudio = makeEstudio({ isActive: false });
      mockEstudioRepo.findById.mockResolvedValue(estudio);

      await controller.reactivate('est-1');
      expect(estudio.activate).toHaveBeenCalled();
      expect(mockEstudioRepo.save).toHaveBeenCalledWith(estudio);
    });

    it('should throw when not found', async () => {
      await expect(controller.reactivate('bad')).rejects.toThrow('Estudio no encontrado');
    });
  });
});
