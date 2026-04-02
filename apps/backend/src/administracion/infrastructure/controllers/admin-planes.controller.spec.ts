import { AdminPlanesController } from './admin-planes.controller';
import type { AdminPlanData } from '../../domain/repositories/admin-plan.repository';

describe('AdminPlanesController', () => {
  let controller: AdminPlanesController;
  let mockPlanRepo: any;

  const makePlan = (overrides: Partial<AdminPlanData> = {}): AdminPlanData => ({
    id: 1,
    codigo: 'PROFESIONAL',
    nombre: 'Profesional',
    descripcion: 'Plan profesional',
    maxClientes: 50,
    maxUsuarios: 5,
    precio: 9999,
    isPublico: true,
    isActivo: true,
    condiciones: null as any,
    ...overrides,
  });

  beforeEach(() => {
    mockPlanRepo = {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue(null),
      findByCodigo: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation((data: AdminPlanData) =>
        Promise.resolve({ ...data, id: data.id ?? 99 }),
      ),
    };
    controller = new AdminPlanesController(mockPlanRepo);
  });

  describe('list', () => {
    it('should return all plans', async () => {
      const plans = [makePlan(), makePlan({ id: 2, codigo: 'FREE', nombre: 'Free' })];
      mockPlanRepo.findAll.mockResolvedValue(plans);

      const result = await controller.list();
      expect(result.data).toHaveLength(2);
    });
  });

  describe('getById', () => {
    it('should return plan by id', async () => {
      mockPlanRepo.findById.mockResolvedValue(makePlan());

      const result = await controller.getById(1);
      expect(result.codigo).toBe('PROFESIONAL');
    });

    it('should throw when plan not found', async () => {
      await expect(controller.getById(999)).rejects.toThrow('Plan no encontrado');
    });
  });

  describe('create', () => {
    it('should create a new plan', async () => {
      const dto = {
        codigo: 'STARTER',
        nombre: 'Starter',
        maxClientes: 10,
        maxUsuarios: 2,
        precio: 4999,
      };
      const result = await controller.create(dto as any);
      expect(result.id).toBeDefined();
      expect(mockPlanRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should reject duplicate codigo', async () => {
      mockPlanRepo.findByCodigo.mockResolvedValue(makePlan());

      await expect(
        controller.create({ codigo: 'PROFESIONAL', nombre: 'X', maxClientes: 1, maxUsuarios: 1, precio: 0 } as any),
      ).rejects.toThrow('El código de plan ya existe');
    });
  });

  describe('update', () => {
    it('should update plan fields', async () => {
      mockPlanRepo.findById.mockResolvedValue(makePlan());

      const result = await controller.update(1, { nombre: 'Pro Plus', precio: 14999 } as any);
      expect(mockPlanRepo.save).toHaveBeenCalledTimes(1);
      const savedPlan = mockPlanRepo.save.mock.calls[0][0];
      expect(savedPlan.nombre).toBe('Pro Plus');
      expect(savedPlan.precio).toBe(14999);
    });

    it('should throw when plan not found', async () => {
      await expect(controller.update(999, { nombre: 'X' } as any)).rejects.toThrow('Plan no encontrado');
    });
  });

  describe('deactivate', () => {
    it('should set isActivo to false', async () => {
      mockPlanRepo.findById.mockResolvedValue(makePlan());

      await controller.deactivate(1);
      const savedPlan = mockPlanRepo.save.mock.calls[0][0];
      expect(savedPlan.isActivo).toBe(false);
    });

    it('should throw when plan not found', async () => {
      await expect(controller.deactivate(999)).rejects.toThrow('Plan no encontrado');
    });
  });
});
