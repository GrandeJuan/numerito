import { NominaController } from './nomina.controller';
import { Empleado } from '../../domain/entities/empleado.entity';

const makeEmpleado = (overrides: Partial<{ id: string; estudioId: string }> = {}) =>
  Empleado.create({
    clienteId: 'cliente-1',
    estudioId: overrides.estudioId ?? 'estudio-1',
    nombre: 'Juan',
    apellido: 'Perez',
    cuil: '20-12345678-6',
    fechaIngreso: new Date('2024-01-01'),
    sueldoBasico: 500000,
    categoriaConvenio: 'CAT-A',
  }, overrides.id);

describe('NominaController', () => {
  let controller: NominaController;
  let mockEmpleadoRepo: any;

  beforeEach(() => {
    mockEmpleadoRepo = {
      findById: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
      findByClienteId: jest.fn().mockResolvedValue([]),
      findByEstudioId: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    };
    controller = new NominaController(mockEmpleadoRepo);
  });

  describe('list', () => {
    it('should return paginated empleados for estudio', async () => {
      const empleados = [makeEmpleado(), makeEmpleado()];
      mockEmpleadoRepo.findByEstudioId.mockResolvedValue(empleados);

      const result = await controller.list('estudio-1', 1, 20);
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
    });

    it('should use default page and limit when not provided', async () => {
      mockEmpleadoRepo.findByEstudioId.mockResolvedValue([]);

      const result = await controller.list('estudio-1');
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });
  });

  describe('create', () => {
    it('should create a new empleado', async () => {
      const dto = {
        clienteId: 'cliente-1',
        nombre: 'Maria',
        apellido: 'Lopez',
        cuil: '27-12345678-0',
        fechaIngreso: '2024-06-01',
        sueldoBasico: 600000,
        categoriaConvenio: 'CAT-B',
      };
      const result = await controller.create(dto as any, 'estudio-1');
      expect(result.id).toBeDefined();
      expect(mockEmpleadoRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should update empleado fields', async () => {
      const empleado = makeEmpleado();
      mockEmpleadoRepo.findById.mockResolvedValue(empleado);

      const result = await controller.update(empleado.id, {
        nombre: 'Carlos',
        apellido: 'Garcia',
        categoriaConvenio: 'CAT-C',
      } as any);
      expect(mockEmpleadoRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should throw when empleado not found', async () => {
      mockEmpleadoRepo.findById.mockResolvedValue(null);

      await expect(
        controller.update('bad-id', { nombre: 'X' } as any),
      ).rejects.toThrow('Empleado no encontrado');
    });
  });

  describe('darDeBaja', () => {
    it('should dar de baja an empleado', async () => {
      const empleado = makeEmpleado();
      mockEmpleadoRepo.findById.mockResolvedValue(empleado);

      await controller.darDeBaja(empleado.id, { fecha: '2026-03-15' } as any);
      expect(empleado.isActive).toBe(false);
      expect(mockEmpleadoRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should throw when empleado not found', async () => {
      mockEmpleadoRepo.findById.mockResolvedValue(null);

      await expect(
        controller.darDeBaja('bad-id', { fecha: '2026-03-15' } as any),
      ).rejects.toThrow('Empleado no encontrado');
    });
  });

  describe('actualizarSueldo', () => {
    it('should update sueldo', async () => {
      const empleado = makeEmpleado();
      mockEmpleadoRepo.findById.mockResolvedValue(empleado);

      await controller.actualizarSueldo(empleado.id, { sueldo: 700000 } as any);
      expect(empleado.sueldoBasico).toBe(700000);
      expect(mockEmpleadoRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should throw when empleado not found', async () => {
      mockEmpleadoRepo.findById.mockResolvedValue(null);

      await expect(
        controller.actualizarSueldo('bad-id', { sueldo: 700000 } as any),
      ).rejects.toThrow('Empleado no encontrado');
    });

    it('should throw when sueldo is invalid (via entity)', async () => {
      const empleado = makeEmpleado();
      mockEmpleadoRepo.findById.mockResolvedValue(empleado);

      await expect(
        controller.actualizarSueldo(empleado.id, { sueldo: -100 } as any),
      ).rejects.toThrow('El sueldo debe ser mayor a 0');
    });
  });
});
