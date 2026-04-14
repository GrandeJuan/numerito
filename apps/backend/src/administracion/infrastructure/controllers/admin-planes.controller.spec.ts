import { AdminPlanesController } from './admin-planes.controller';
import type { AdminPlanData } from '../../domain/repositories/admin-plan.repository';

describe('AdminPlanesController', () => {
  let controller: AdminPlanesController;
  let mockPlanesService: any;

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
    mockPlanesService = {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue(makePlan()),
      create: jest.fn().mockImplementation((dto: any) =>
        Promise.resolve({ ...dto, id: 99, isActivo: true, isPublico: dto.isPublico ?? true }),
      ),
      update: jest.fn().mockImplementation((_id: number, dto: any) =>
        Promise.resolve({ ...makePlan(), ...dto }),
      ),
      deactivate: jest.fn().mockResolvedValue(makePlan({ isActivo: false })),
    };
    controller = new AdminPlanesController(mockPlanesService);
  });

  describe('list', () => {
    it('should return all plans', async () => {
      const plans = [makePlan(), makePlan({ id: 2, codigo: 'FREE', nombre: 'Free' })];
      mockPlanesService.findAll.mockResolvedValue(plans);

      const result = await controller.list();
      expect(result.data).toHaveLength(2);
    });
  });

  describe('getById', () => {
    it('should return plan by id', async () => {
      const result = await controller.getById(1);
      expect(result.codigo).toBe('PROFESIONAL');
      expect(mockPlanesService.findById).toHaveBeenCalledWith(1);
    });
  });

  describe('create', () => {
    it('should delegate to service', async () => {
      const dto = {
        codigo: 'STARTER',
        nombre: 'Starter',
        maxClientes: 10,
        maxUsuarios: 2,
        precio: 4999,
      };
      const result = await controller.create(dto as any);
      expect(result.id).toBeDefined();
      expect(mockPlanesService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('should delegate to service', async () => {
      await controller.update(1, { nombre: 'Pro Plus', precio: 14999 } as any);
      expect(mockPlanesService.update).toHaveBeenCalledWith(1, { nombre: 'Pro Plus', precio: 14999 });
    });
  });

  describe('deactivate', () => {
    it('should delegate to service', async () => {
      const result = await controller.deactivate(1);
      expect(result.isActivo).toBe(false);
      expect(mockPlanesService.deactivate).toHaveBeenCalledWith(1);
    });
  });
});
