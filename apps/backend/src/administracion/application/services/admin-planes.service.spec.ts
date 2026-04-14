import { AdminPlanesService } from './admin-planes.service';
import type { AdminPlanData, AdminPlanRepository } from '../../domain/repositories/admin-plan.repository';

describe('AdminPlanesService', () => {
  let service: AdminPlanesService;
  let mockRepo: jest.Mocked<AdminPlanRepository>;

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
    mockRepo = {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue(null),
      findByCodigo: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation((data: AdminPlanData) =>
        Promise.resolve({ ...data, id: data.id ?? 99 }),
      ),
    };
    service = new AdminPlanesService(mockRepo);
  });

  describe('findAll', () => {
    it('should return all plans from repository', async () => {
      const plans = [makePlan(), makePlan({ id: 2, codigo: 'FREE' })];
      mockRepo.findAll.mockResolvedValue(plans);

      const result = await service.findAll();
      expect(result).toHaveLength(2);
      expect(mockRepo.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('should return plan when found', async () => {
      mockRepo.findById.mockResolvedValue(makePlan());

      const result = await service.findById(1);
      expect(result.codigo).toBe('PROFESIONAL');
    });

    it('should throw RecursoNoEncontradoError when not found', async () => {
      await expect(service.findById(999)).rejects.toThrow('Plan no encontrado');
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
      } as any;

      const result = await service.create(dto);
      expect(result.id).toBeDefined();
      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          codigo: 'STARTER',
          nombre: 'Starter',
          isActivo: true,
          isPublico: true,
        }),
      );
    });

    it('should reject duplicate codigo', async () => {
      mockRepo.findByCodigo.mockResolvedValue(makePlan());

      await expect(
        service.create({ codigo: 'PROFESIONAL', nombre: 'X', maxClientes: 1, maxUsuarios: 1, precio: 0 } as any),
      ).rejects.toThrow('El código de plan ya existe');
    });

    it('should use provided isPublico value', async () => {
      const dto = {
        codigo: 'PRIVATE',
        nombre: 'Private',
        maxClientes: 5,
        maxUsuarios: 1,
        precio: 1000,
        isPublico: false,
      } as any;

      await service.create(dto);
      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ isPublico: false }),
      );
    });
  });

  describe('update', () => {
    it('should update plan fields', async () => {
      mockRepo.findById.mockResolvedValue(makePlan());

      await service.update(1, { nombre: 'Pro Plus', precio: 14999 } as any);
      const savedPlan = mockRepo.save.mock.calls[0][0];
      expect(savedPlan.nombre).toBe('Pro Plus');
      expect(savedPlan.precio).toBe(14999);
    });

    it('should not modify fields not in dto', async () => {
      mockRepo.findById.mockResolvedValue(makePlan());

      await service.update(1, { nombre: 'Pro Plus' } as any);
      const savedPlan = mockRepo.save.mock.calls[0][0];
      expect(savedPlan.precio).toBe(9999);
      expect(savedPlan.maxClientes).toBe(50);
    });

    it('should throw when plan not found', async () => {
      await expect(service.update(999, { nombre: 'X' } as any)).rejects.toThrow('Plan no encontrado');
    });
  });

  describe('deactivate', () => {
    it('should set isActivo to false', async () => {
      mockRepo.findById.mockResolvedValue(makePlan());

      await service.deactivate(1);
      const savedPlan = mockRepo.save.mock.calls[0][0];
      expect(savedPlan.isActivo).toBe(false);
    });

    it('should throw when plan not found', async () => {
      await expect(service.deactivate(999)).rejects.toThrow('Plan no encontrado');
    });
  });
});
