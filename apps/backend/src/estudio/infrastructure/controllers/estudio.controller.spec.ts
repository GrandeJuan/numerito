import { EstudioController } from './estudio.controller';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import { Estudio } from '../../domain/entities/estudio.entity';
import { NombreEstudio } from '../../domain/value-objects/nombre-estudio.vo';
import { PlanSubscripcion } from '../../domain/value-objects/plan-subscripcion.vo';
import {
  Subscripcion,
  EstadoSubscripcion,
  CicloFacturacion,
} from '../../domain/entities/subscripcion.entity';

const principal: EstudioPrincipal = {
  estudioId: 'est-1',
  userId: 'user-1',
  roles: ['SOCIO'],
};

const makeEstudio = (id?: string) =>
  Estudio.create(
    {
      nombre: NombreEstudio.create('Estudio Test'),
      plan: PlanSubscripcion.create('PROFESIONAL', 50, 5),
      cuit: '20-12345678-6',
    },
    id,
  );

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
  let mockEquipoView: any;
  let mockRenovarHandler: any;
  let mockCancelarHandler: any;
  let mockMarcarVencidaHandler: any;
  let mockCambiarPlanHandler: any;

  beforeEach(() => {
    mockEstudioRepo = {
      findById: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
      findByCuit: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    };
    mockSubscripcionRepo = {
      findAll: jest.fn().mockResolvedValue([]),
      findActiva: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    };
    mockEquipoView = { execute: jest.fn().mockResolvedValue([]) };
    mockRenovarHandler = { execute: jest.fn() };
    mockCancelarHandler = { execute: jest.fn() };
    mockMarcarVencidaHandler = { execute: jest.fn() };
    mockCambiarPlanHandler = { execute: jest.fn() };

    controller = new EstudioController(
      mockEstudioRepo,
      mockSubscripcionRepo,
      mockEquipoView,
      mockRenovarHandler,
      mockCancelarHandler,
      mockMarcarVencidaHandler,
      mockCambiarPlanHandler,
    );
  });

  describe('getMine', () => {
    it('should return current estudio using principal', async () => {
      const estudio = makeEstudio('est-1');
      mockEstudioRepo.findById.mockResolvedValue(estudio);

      const result = await controller.getMine(principal);
      expect(result).toBeDefined();
      expect(mockEstudioRepo.findById).toHaveBeenCalledWith(principal.estudioId);
    });
  });

  describe('getEquipo', () => {
    it('should delegate to equipoView with estudioId from principal', async () => {
      const mockTeam = [
        {
          usuarioId: 'usr-1',
          email: 'juan@estudio.com',
          nombre: 'Juan',
          apellido: 'Perez',
          rol: 'SOCIO',
          verificado: true,
          creadoEl: '2026-01-15T10:00:00.000Z',
        },
      ];
      mockEquipoView.execute.mockResolvedValue(mockTeam);

      const result = await controller.getEquipo(principal);

      expect(mockEquipoView.execute).toHaveBeenCalledWith({ estudioId: 'est-1' });
      expect(result).toEqual(mockTeam);
    });

    it('should return empty array when no team members', async () => {
      mockEquipoView.execute.mockResolvedValue([]);

      const result = await controller.getEquipo(principal);

      expect(result).toEqual([]);
    });
  });

  describe('getPlan', () => {
    it('should pass principal to subscripcionRepo.findActiva', async () => {
      const estudio = makeEstudio('est-1');
      mockEstudioRepo.findById.mockResolvedValue(estudio);

      await controller.getPlan(principal);
      expect(mockSubscripcionRepo.findActiva).toHaveBeenCalledWith(principal);
    });
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

      await expect(controller.update('bad', { nombre: 'X' })).rejects.toThrow(
        'Estudio no encontrado',
      );
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
    it('should pass principal to findActiva', async () => {
      const sub = makeSubscripcion('est-1');
      mockSubscripcionRepo.findActiva.mockResolvedValue(sub);

      const result = await controller.getSubscripcion(principal, 'est-1');
      expect(result).toBeDefined();
      expect(result.estado).toBe(EstadoSubscripcion.ACTIVA);
      expect(mockSubscripcionRepo.findActiva).toHaveBeenCalledWith(principal);
    });

    it('should throw when no active subscripcion', async () => {
      mockSubscripcionRepo.findActiva.mockResolvedValue(null);

      await expect(controller.getSubscripcion(principal, 'est-1')).rejects.toThrow(
        'Subscripcion no encontrad',
      );
    });
  });

  describe('cambiarPlan', () => {
    it('should delegate to CambiarPlanSubscripcionHandler with principal', async () => {
      const sub = makeSubscripcion('est-1');
      mockCambiarPlanHandler.execute.mockResolvedValue(sub);

      await controller.cambiarPlan(principal, 'est-1', { planId: '3' });

      expect(mockCambiarPlanHandler.execute).toHaveBeenCalledWith(principal, { planId: '3' });
    });
  });

  describe('renovar', () => {
    it('should delegate to RenovarSubscripcionHandler with principal', async () => {
      const sub = makeSubscripcion('est-1');
      mockRenovarHandler.execute.mockResolvedValue(sub);

      await controller.renovar(principal, 'est-1', { nuevaFechaFin: '2028-01-01' });

      expect(mockRenovarHandler.execute).toHaveBeenCalledWith(principal, { nuevaFechaFin: '2028-01-01' });
    });
  });

  describe('cancelar', () => {
    it('should delegate to CancelarSubscripcionHandler with principal', async () => {
      const sub = makeSubscripcion('est-1');
      mockCancelarHandler.execute.mockResolvedValue(sub);

      await controller.cancelar(principal, 'est-1');

      expect(mockCancelarHandler.execute).toHaveBeenCalledWith(principal);
    });
  });

  describe('marcarVencida', () => {
    it('should delegate to MarcarSubscripcionVencidaHandler with principal', async () => {
      const sub = makeSubscripcion('est-1');
      mockMarcarVencidaHandler.execute.mockResolvedValue(sub);

      await controller.marcarVencida(principal, 'est-1');

      expect(mockMarcarVencidaHandler.execute).toHaveBeenCalledWith(principal, { subscripcionId: 'est-1' });
    });
  });
});
