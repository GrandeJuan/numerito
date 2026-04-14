import { Subscripcion, EstadoSubscripcion, CicloFacturacion } from './subscripcion.entity';
import { OperacionInvalidaError } from '../../../shared/domain/exceptions';
import { SubscripcionCreada } from '../events/subscripcion-creada.event';
import { SubscripcionRenovada } from '../events/subscripcion-renovada.event';
import { SubscripcionCancelada } from '../events/subscripcion-cancelada.event';
import { SubscripcionVencida } from '../events/subscripcion-vencida.event';

describe('Subscripcion Entity', () => {
  const futureDate = new Date('2027-01-01');
  const pastDate = new Date('2020-01-01');

  const createSubscripcion = (overrides?: Partial<{
    estudioId: string;
    planId: string;
    fechaInicio: Date;
    fechaFin: Date;
    estado: EstadoSubscripcion;
    cicloFacturacion: CicloFacturacion;
    autoRenovacion: boolean;
  }>) => {
    return Subscripcion.create({
      estudioId: 'estudio-1',
      planId: 'PROFESIONAL',
      fechaInicio: new Date('2026-04-01'),
      fechaFin: futureDate,
      estado: EstadoSubscripcion.TRIAL,
      cicloFacturacion: CicloFacturacion.MENSUAL,
      autoRenovacion: true,
      ...overrides,
    });
  };

  describe('create', () => {
    it('should create a subscripcion with valid data', () => {
      const sub = createSubscripcion();
      expect(sub.id).toBeDefined();
      expect(sub.estudioId).toBe('estudio-1');
      expect(sub.planId).toBe('PROFESIONAL');
      expect(sub.estado).toBe(EstadoSubscripcion.TRIAL);
      expect(sub.cicloFacturacion).toBe(CicloFacturacion.MENSUAL);
      expect(sub.autoRenovacion).toBe(true);
    });

    it('should allow creating with ACTIVA state', () => {
      const sub = createSubscripcion({ estado: EstadoSubscripcion.ACTIVA });
      expect(sub.estado).toBe(EstadoSubscripcion.ACTIVA);
    });
  });

  describe('renovar', () => {
    it('should extend fechaFin and set estado ACTIVA', () => {
      const sub = createSubscripcion({ estado: EstadoSubscripcion.ACTIVA });
      const nuevaFecha = new Date('2028-01-01');
      sub.renovar(nuevaFecha);
      expect(sub.fechaFin).toEqual(nuevaFecha);
      expect(sub.estado).toBe(EstadoSubscripcion.ACTIVA);
    });

    it('should allow renovar from TRIAL', () => {
      const sub = createSubscripcion({ estado: EstadoSubscripcion.TRIAL });
      const nuevaFecha = new Date('2028-01-01');
      sub.renovar(nuevaFecha);
      expect(sub.estado).toBe(EstadoSubscripcion.ACTIVA);
    });

    it('should throw if CANCELADA', () => {
      const sub = createSubscripcion({ estado: EstadoSubscripcion.ACTIVA });
      sub.cancelar();
      expect(() => sub.renovar(new Date('2028-01-01'))).toThrow(OperacionInvalidaError);
    });
  });

  describe('cancelar', () => {
    it('should set estado to CANCELADA from ACTIVA', () => {
      const sub = createSubscripcion({ estado: EstadoSubscripcion.ACTIVA });
      sub.cancelar();
      expect(sub.estado).toBe(EstadoSubscripcion.CANCELADA);
    });

    it('should set estado to CANCELADA from TRIAL', () => {
      const sub = createSubscripcion({ estado: EstadoSubscripcion.TRIAL });
      sub.cancelar();
      expect(sub.estado).toBe(EstadoSubscripcion.CANCELADA);
    });

    it('should throw if already CANCELADA', () => {
      const sub = createSubscripcion({ estado: EstadoSubscripcion.ACTIVA });
      sub.cancelar();
      expect(() => sub.cancelar()).toThrow(OperacionInvalidaError);
    });
  });

  describe('suspender', () => {
    it('should set estado to SUSPENDIDA from ACTIVA', () => {
      const sub = createSubscripcion({ estado: EstadoSubscripcion.ACTIVA });
      sub.suspender();
      expect(sub.estado).toBe(EstadoSubscripcion.SUSPENDIDA);
    });

    it('should throw if not ACTIVA', () => {
      const sub = createSubscripcion({ estado: EstadoSubscripcion.TRIAL });
      expect(() => sub.suspender()).toThrow(OperacionInvalidaError);
    });
  });

  describe('reactivar', () => {
    it('should set estado to ACTIVA from SUSPENDIDA', () => {
      const sub = createSubscripcion({ estado: EstadoSubscripcion.ACTIVA });
      sub.suspender();
      sub.reactivar();
      expect(sub.estado).toBe(EstadoSubscripcion.ACTIVA);
    });

    it('should throw if not SUSPENDIDA', () => {
      const sub = createSubscripcion({ estado: EstadoSubscripcion.ACTIVA });
      expect(() => sub.reactivar()).toThrow(OperacionInvalidaError);
    });
  });

  describe('marcarVencida', () => {
    it('should set estado to VENCIDA from ACTIVA', () => {
      const sub = createSubscripcion({ estado: EstadoSubscripcion.ACTIVA });
      sub.marcarVencida();
      expect(sub.estado).toBe(EstadoSubscripcion.VENCIDA);
    });

    it('should set estado to VENCIDA from TRIAL', () => {
      const sub = createSubscripcion({ estado: EstadoSubscripcion.TRIAL });
      sub.marcarVencida();
      expect(sub.estado).toBe(EstadoSubscripcion.VENCIDA);
    });

    it('should throw if already CANCELADA', () => {
      const sub = createSubscripcion({ estado: EstadoSubscripcion.ACTIVA });
      sub.cancelar();
      expect(() => sub.marcarVencida()).toThrow(OperacionInvalidaError);
    });
  });

  describe('cambiarPlan', () => {
    it('should change planId', () => {
      const sub = createSubscripcion({ estado: EstadoSubscripcion.ACTIVA });
      sub.cambiarPlan('ENTERPRISE');
      expect(sub.planId).toBe('ENTERPRISE');
    });

    it('should throw if not ACTIVA or TRIAL', () => {
      const sub = createSubscripcion({ estado: EstadoSubscripcion.ACTIVA });
      sub.cancelar();
      expect(() => sub.cambiarPlan('ENTERPRISE')).toThrow(OperacionInvalidaError);
    });
  });

  describe('isActiva', () => {
    it('should return true for ACTIVA', () => {
      const sub = createSubscripcion({ estado: EstadoSubscripcion.ACTIVA });
      expect(sub.isActiva()).toBe(true);
    });

    it('should return true for TRIAL', () => {
      const sub = createSubscripcion({ estado: EstadoSubscripcion.TRIAL });
      expect(sub.isActiva()).toBe(true);
    });

    it('should return false for SUSPENDIDA', () => {
      const sub = createSubscripcion({ estado: EstadoSubscripcion.ACTIVA });
      sub.suspender();
      expect(sub.isActiva()).toBe(false);
    });

    it('should return false for CANCELADA', () => {
      const sub = createSubscripcion({ estado: EstadoSubscripcion.ACTIVA });
      sub.cancelar();
      expect(sub.isActiva()).toBe(false);
    });
  });

  describe('diasRestantes', () => {
    it('should return positive days for future fechaFin', () => {
      const sub = createSubscripcion({ fechaFin: futureDate });
      expect(sub.diasRestantes()).toBeGreaterThan(0);
    });

    it('should return 0 for past fechaFin', () => {
      const sub = createSubscripcion({ fechaFin: pastDate });
      expect(sub.diasRestantes()).toBe(0);
    });
  });

  describe('domain events', () => {
    it('should emit SubscripcionCreada on create', () => {
      const sub = createSubscripcion();
      const events = sub.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(SubscripcionCreada);
      const event = events[0] as SubscripcionCreada;
      expect(event.subscripcionId).toBe(sub.id);
      expect(event.estudioId).toBe('estudio-1');
      expect(event.planId).toBe('PROFESIONAL');
      expect(event.eventName).toBe('estudio.subscripcion-creada');
    });

    it('should emit SubscripcionRenovada on renovar', () => {
      const sub = createSubscripcion({ estado: EstadoSubscripcion.ACTIVA });
      sub.clearDomainEvents();
      const nuevaFecha = new Date('2028-01-01');
      sub.renovar(nuevaFecha);
      const events = sub.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(SubscripcionRenovada);
      const event = events[0] as SubscripcionRenovada;
      expect(event.subscripcionId).toBe(sub.id);
      expect(event.nuevaFechaFin).toEqual(nuevaFecha);
    });

    it('should emit SubscripcionCancelada on cancelar', () => {
      const sub = createSubscripcion({ estado: EstadoSubscripcion.ACTIVA });
      sub.clearDomainEvents();
      sub.cancelar();
      const events = sub.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(SubscripcionCancelada);
      expect((events[0] as SubscripcionCancelada).estudioId).toBe('estudio-1');
    });

    it('should emit SubscripcionVencida on marcarVencida', () => {
      const sub = createSubscripcion({ estado: EstadoSubscripcion.ACTIVA });
      sub.clearDomainEvents();
      sub.marcarVencida();
      const events = sub.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(SubscripcionVencida);
      expect((events[0] as SubscripcionVencida).estudioId).toBe('estudio-1');
    });

    it('should accumulate events across operations', () => {
      const sub = createSubscripcion({ estado: EstadoSubscripcion.ACTIVA });
      sub.renovar(new Date('2028-01-01'));
      // create + renovar = 2 events
      expect(sub.getDomainEvents()).toHaveLength(2);
    });
  });
});
