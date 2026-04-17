import { NominaController } from './nomina.controller';
import { Empleado } from '../../domain/entities/empleado.entity';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';

const principal: EstudioPrincipal = { estudioId: 'estudio-1', userId: 'user-1', roles: [] };

const makeEmpleado = (overrides: Partial<{ id: string; estudioId: string }> = {}) =>
  Empleado.create(
    {
      clienteId: 'cliente-1',
      estudioId: overrides.estudioId ?? 'estudio-1',
      nombre: 'Juan',
      apellido: 'Perez',
      cuil: '20-12345678-6',
      fechaIngreso: new Date('2024-01-01'),
      sueldoBasico: 500000,
      categoriaConvenio: 'CAT-A',
    },
    overrides.id,
  );

describe('NominaController', () => {
  let controller: NominaController;
  let mockEmpleadoRepo: any;

  beforeEach(() => {
    mockEmpleadoRepo = {
      findById: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
      findByClienteId: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    };
    controller = new NominaController(mockEmpleadoRepo);
  });

  describe('list', () => {
    it('should return paginated empleados for estudio', async () => {
      const empleados = [makeEmpleado(), makeEmpleado()];
      mockEmpleadoRepo.findAll.mockResolvedValue(empleados);

      const result = await controller.list(principal, 1, 20);
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(mockEmpleadoRepo.findAll).toHaveBeenCalledWith(principal);
    });

    it('should use default page and limit when not provided', async () => {
      mockEmpleadoRepo.findAll.mockResolvedValue([]);

      const result = await controller.list(principal);
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
      const result = await controller.create(dto as any, principal);
      expect(result.id).toBeDefined();
      expect(result.estudioId).toBe('estudio-1');
      expect(mockEmpleadoRepo.save).toHaveBeenCalledTimes(1);
      expect(mockEmpleadoRepo.save).toHaveBeenCalledWith(principal, expect.any(Empleado));
    });
  });

  describe('update', () => {
    it('should update empleado fields', async () => {
      const empleado = makeEmpleado();
      mockEmpleadoRepo.findById.mockResolvedValue(empleado);

      await controller.update(principal, empleado.id, {
        nombre: 'Carlos',
        apellido: 'Garcia',
        categoriaConvenio: 'CAT-C',
      } as any);
      expect(mockEmpleadoRepo.findById).toHaveBeenCalledWith(principal, empleado.id);
      expect(mockEmpleadoRepo.save).toHaveBeenCalledWith(principal, empleado);
    });

    it('should throw when empleado not found', async () => {
      mockEmpleadoRepo.findById.mockResolvedValue(null);

      await expect(controller.update(principal, 'bad-id', { nombre: 'X' } as any)).rejects.toThrow(
        'Empleado no encontrado',
      );
    });
  });

  describe('darDeBaja', () => {
    it('should dar de baja an empleado', async () => {
      const empleado = makeEmpleado();
      mockEmpleadoRepo.findById.mockResolvedValue(empleado);

      await controller.darDeBaja(principal, empleado.id, { fecha: '2026-03-15' } as any);
      expect(empleado.isActive).toBe(false);
      expect(mockEmpleadoRepo.findById).toHaveBeenCalledWith(principal, empleado.id);
      expect(mockEmpleadoRepo.save).toHaveBeenCalledWith(principal, empleado);
    });

    it('should throw when empleado not found', async () => {
      mockEmpleadoRepo.findById.mockResolvedValue(null);

      await expect(controller.darDeBaja(principal, 'bad-id', { fecha: '2026-03-15' } as any)).rejects.toThrow(
        'Empleado no encontrado',
      );
    });
  });

  describe('actualizarSueldo', () => {
    it('should update sueldo', async () => {
      const empleado = makeEmpleado();
      mockEmpleadoRepo.findById.mockResolvedValue(empleado);

      await controller.actualizarSueldo(principal, empleado.id, { sueldo: 700000 } as any);
      expect(empleado.sueldoBasico).toBe(700000);
      expect(mockEmpleadoRepo.findById).toHaveBeenCalledWith(principal, empleado.id);
      expect(mockEmpleadoRepo.save).toHaveBeenCalledWith(principal, empleado);
    });

    it('should throw when empleado not found', async () => {
      mockEmpleadoRepo.findById.mockResolvedValue(null);

      await expect(
        controller.actualizarSueldo(principal, 'bad-id', { sueldo: 700000 } as any),
      ).rejects.toThrow('Empleado no encontrado');
    });

    it('should throw when sueldo is invalid (via entity)', async () => {
      const empleado = makeEmpleado();
      mockEmpleadoRepo.findById.mockResolvedValue(empleado);

      await expect(
        controller.actualizarSueldo(principal, empleado.id, { sueldo: -100 } as any),
      ).rejects.toThrow('El sueldo debe ser mayor a 0');
    });
  });
});
