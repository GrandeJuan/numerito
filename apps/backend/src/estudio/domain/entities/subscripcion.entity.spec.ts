import { Subscripcion, EstadoSubscripcion, CicloFacturacion } from './subscripcion.entity';
import { OperacionInvalidaError } from '../../../shared/domain/exceptions';

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
});
