import { EstudioController } from './estudio.controller';
import { Estudio } from '../../domain/entities/estudio.entity';
import { NombreEstudio } from '../../domain/value-objects/nombre-estudio.vo';
import { PlanSubscripcion } from '../../domain/value-objects/plan-subscripcion.vo';
import { Subscripcion, EstadoSubscripcion, CicloFacturacion } from '../../domain/entities/subscripcion.entity';

const makeEstudio = (id?: string) =>
  Estudio.create({
    nombre: NombreEstudio.create('Estudio Test'),
    plan: PlanSubscripcion.create('PROFESIONAL', 50, 5),
    cuit: '20-12345678-6',
  }, id);

const makeSubscripcion = (estudioId: string) =>
  Subscripcion.create({
    estudioId,
    planId: '2',
    fechaInicio: new Date('2026-01-01'),
    fechaFin: new Date('2027-01-01'),
    estado: EstadoSubscripcion.ACTIVA,
    cicloFacturacion: CicloFacturacion.MENSUAL,
    autoRenovacion: true,
  });

describe('EstudioController', () => {
  let controller: EstudioController;
  let mockEstudioRepo: any;
  let mockSubscripcionRepo: any;

  beforeEach(() => {
    mockEstudioRepo = {
      findById: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
      findByCuit: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    };
    mockSubscripcionRepo = {
      findByEstudioId: jest.fn().mockResolvedValue([]),
      findActiva: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    };
    controller = new EstudioController(mockEstudioRepo, mockSubscripcionRepo);
  });

  describe('getById', () => {
    it('should return estudio', async () => {
      const estudio = makeEstudio('est-1');
      mockEstudioRepo.findById.mockResolvedValue(estudio);

      const result = await controller.getById('est-1');
      expect(result).toBeDefined();
    });

    it('should throw when not found', async () => {
      mockEstudioRepo.findById.mockResolvedValue(null);

      await expect(controller.getById('bad')).rejects.toThrow('Estudio no encontrado');
    });
  });

  describe('update', () => {
    it('should update nombre', async () => {
      const estudio = makeEstudio('est-1');
      mockEstudioRepo.findById.mockResolvedValue(estudio);

      await controller.update('est-1', { nombre: 'Nuevo Nombre' });
      expect(estudio.nombre.value).toBe('Nuevo Nombre');
      expect(mockEstudioRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should throw when not found', async () => {
      mockEstudioRepo.findById.mockResolvedValue(null);

      await expect(controller.update('bad', { nombre: 'X' })).rejects.toThrow('Estudio no encontrado');
    });

    it('should save without changes when dto has no nombre', async () => {
      const estudio = makeEstudio('est-1');
      mockEstudioRepo.findById.mockResolvedValue(estudio);
      const originalNombre = estudio.nombre.value;

      await controller.update('est-1', {} as any);
      expect(estudio.nombre.value).toBe(originalNombre);
      expect(mockEstudioRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('getSubscripcion', () => {
    it('should return active subscripcion', async () => {
      const sub = makeSubscripcion('est-1');
      mockSubscripcionRepo.findActiva.mockResolvedValue(sub);

      const result = await controller.getSubscripcion('est-1');
      expect(result).toBeDefined();
      expect(result.estado).toBe(EstadoSubscripcion.ACTIVA);
    });

    it('should throw when no active subscripcion', async () => {
      mockSubscripcionRepo.findActiva.mockResolvedValue(null);

      await expect(controller.getSubscripcion('est-1')).rejects.toThrow('Subscripcion no encontrad');
    });
  });

  describe('cambiarPlan', () => {
    it('should change plan of active subscripcion', async () => {
      const sub = makeSubscripcion('est-1');
      mockSubscripcionRepo.findActiva.mockResolvedValue(sub);

      await controller.cambiarPlan('est-1', { planId: '3' });
      expect(sub.planId).toBe('3');
      expect(mockSubscripcionRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should throw when no active subscripcion', async () => {
      mockSubscripcionRepo.findActiva.mockResolvedValue(null);

      await expect(controller.cambiarPlan('est-1', { planId: '3' })).rejects.toThrow('Subscripcion no encontrad');
    });
  });
});
