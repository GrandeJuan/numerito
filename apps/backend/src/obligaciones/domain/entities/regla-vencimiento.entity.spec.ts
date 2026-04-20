import { ReglaVencimiento, ESTADO_REGLA, ORIGEN_REGLA } from './regla-vencimiento.entity';
import { TIPO_OBLIGACION, JURISDICCION } from '@numerito/shared';

describe('ReglaVencimiento Entity', () => {
  const baseProps = {
    tipoObligacion: TIPO_OBLIGACION.IVA,
    jurisdiccion: JURISDICCION.ARCA,
    regimen: 'GENERAL',
    terminacionCuit: '6',
    diaVencimiento: 18,
    mesSiguiente: true,
    vigenciaDesde: new Date('2026-01-01'),
  } as const;

  describe('create', () => {
    it('should create with defaults (ACTIVA, MANUAL)', () => {
      const r = ReglaVencimiento.create(baseProps);
      expect(r.id).toBeDefined();
      expect(r.tipoObligacion).toBe(TIPO_OBLIGACION.IVA);
      expect(r.jurisdiccion).toBe(JURISDICCION.ARCA);
      expect(r.regimen).toBe('GENERAL');
      expect(r.terminacionCuit).toBe('6');
      expect(r.diaVencimiento).toBe(18);
      expect(r.mesSiguiente).toBe(true);
      expect(r.estado).toBe(ESTADO_REGLA.ACTIVA);
      expect(r.origen).toBe(ORIGEN_REGLA.MANUAL);
      expect(r.vigenciaHasta).toBeNull();
    });

    it('should create as PROPUESTA', () => {
      const r = ReglaVencimiento.create({ ...baseProps, estado: ESTADO_REGLA.PROPUESTA });
      expect(r.estado).toBe(ESTADO_REGLA.PROPUESTA);
    });

    it('should reject invalid terminacion (not single digit)', () => {
      expect(() =>
        ReglaVencimiento.create({ ...baseProps, terminacionCuit: '66' }),
      ).toThrow('Terminación de CUIT debe ser un solo dígito');
    });

    it('should reject diaVencimiento out of range', () => {
      expect(() =>
        ReglaVencimiento.create({ ...baseProps, diaVencimiento: 32 }),
      ).toThrow('Día de vencimiento debe estar entre 1 y 31');
    });

    it('should reject vigenciaHasta before vigenciaDesde', () => {
      expect(() =>
        ReglaVencimiento.create({
          ...baseProps,
          vigenciaHasta: new Date('2025-01-01'),
        }),
      ).toThrow('vigenciaHasta no puede ser anterior a vigenciaDesde');
    });
  });

  describe('isVigenteAt', () => {
    it('should be vigente when date is within range', () => {
      const r = ReglaVencimiento.create(baseProps);
      expect(r.isVigenteAt(new Date('2026-06-01'))).toBe(true);
    });

    it('should not be vigente before vigenciaDesde', () => {
      const r = ReglaVencimiento.create(baseProps);
      expect(r.isVigenteAt(new Date('2025-12-31'))).toBe(false);
    });

    it('should not be vigente after vigenciaHasta', () => {
      const r = ReglaVencimiento.create({
        ...baseProps,
        vigenciaHasta: new Date('2026-06-30'),
      });
      expect(r.isVigenteAt(new Date('2026-07-01'))).toBe(false);
    });

    it('should not be vigente if PROPUESTA', () => {
      const r = ReglaVencimiento.create({ ...baseProps, estado: ESTADO_REGLA.PROPUESTA });
      expect(r.isVigenteAt(new Date('2026-06-01'))).toBe(false);
    });
  });

  describe('conflictsWith', () => {
    it('should detect conflict between two ACTIVA rules with same key and overlapping vigencia', () => {
      const r1 = ReglaVencimiento.create(baseProps);
      const r2 = ReglaVencimiento.create(baseProps);
      expect(r1.conflictsWith(r2)).toBe(true);
    });

    it('should not conflict if different tipoObligacion', () => {
      const r1 = ReglaVencimiento.create(baseProps);
      const r2 = ReglaVencimiento.create({
        ...baseProps,
        tipoObligacion: TIPO_OBLIGACION.MONOTRIBUTO,
      });
      expect(r1.conflictsWith(r2)).toBe(false);
    });

    it('should not conflict if different jurisdiccion', () => {
      const r1 = ReglaVencimiento.create(baseProps);
      const r2 = ReglaVencimiento.create({
        ...baseProps,
        jurisdiccion: JURISDICCION.ARBA,
      });
      expect(r1.conflictsWith(r2)).toBe(false);
    });

    it('should not conflict if different regimen', () => {
      const r1 = ReglaVencimiento.create(baseProps);
      const r2 = ReglaVencimiento.create({ ...baseProps, regimen: 'MONOTRIBUTO' });
      expect(r1.conflictsWith(r2)).toBe(false);
    });

    it('should not conflict if different terminacion', () => {
      const r1 = ReglaVencimiento.create(baseProps);
      const r2 = ReglaVencimiento.create({ ...baseProps, terminacionCuit: '7' });
      expect(r1.conflictsWith(r2)).toBe(false);
    });

    it('should not conflict if one is PROPUESTA', () => {
      const r1 = ReglaVencimiento.create(baseProps);
      const r2 = ReglaVencimiento.create({ ...baseProps, estado: ESTADO_REGLA.PROPUESTA });
      expect(r1.conflictsWith(r2)).toBe(false);
    });

    it('should not conflict with itself', () => {
      const r1 = ReglaVencimiento.create(baseProps);
      expect(r1.conflictsWith(r1)).toBe(false);
    });

    it('should not conflict if vigencias do not overlap', () => {
      const r1 = ReglaVencimiento.create({
        ...baseProps,
        vigenciaDesde: new Date('2026-01-01'),
        vigenciaHasta: new Date('2026-06-30'),
      });
      const r2 = ReglaVencimiento.create({
        ...baseProps,
        vigenciaDesde: new Date('2026-07-01'),
      });
      expect(r1.conflictsWith(r2)).toBe(false);
    });
  });

  describe('state transitions', () => {
    it('should approve PROPUESTA → ACTIVA', () => {
      const r = ReglaVencimiento.create({ ...baseProps, estado: ESTADO_REGLA.PROPUESTA });
      r.aprobar();
      expect(r.estado).toBe(ESTADO_REGLA.ACTIVA);
    });

    it('should reject PROPUESTA → RECHAZADA', () => {
      const r = ReglaVencimiento.create({ ...baseProps, estado: ESTADO_REGLA.PROPUESTA });
      r.rechazar();
      expect(r.estado).toBe(ESTADO_REGLA.RECHAZADA);
    });

    it('should not approve if already ACTIVA', () => {
      const r = ReglaVencimiento.create(baseProps);
      expect(() => r.aprobar()).toThrow('Solo se pueden aprobar reglas en estado PROPUESTA');
    });

    it('should not reject if already ACTIVA', () => {
      const r = ReglaVencimiento.create(baseProps);
      expect(() => r.rechazar()).toThrow('Solo se pueden rechazar reglas en estado PROPUESTA');
    });
  });

  describe('calcularFecha', () => {
    it('should calculate due date for IVA marzo with mesSiguiente=true', () => {
      const r = ReglaVencimiento.create(baseProps);
      const fecha = r.calcularFecha('2026-03');
      expect(fecha.getDate()).toBe(18);
      expect(fecha.getMonth()).toBe(3); // April (0-indexed)
      expect(fecha.getFullYear()).toBe(2026);
    });

    it('should calculate due date for mesSiguiente=false', () => {
      const r = ReglaVencimiento.create({ ...baseProps, mesSiguiente: false });
      const fecha = r.calcularFecha('2026-03');
      expect(fecha.getDate()).toBe(18);
      expect(fecha.getMonth()).toBe(2); // March
      expect(fecha.getFullYear()).toBe(2026);
    });

    it('should handle December periodo with mesSiguiente=true (rolls to January)', () => {
      const r = ReglaVencimiento.create(baseProps);
      const fecha = r.calcularFecha('2026-12');
      expect(fecha.getDate()).toBe(18);
      expect(fecha.getMonth()).toBe(0); // January next year
      expect(fecha.getFullYear()).toBe(2027);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from persisted state', () => {
      const r = ReglaVencimiento.reconstitute(
        {
          tipoObligacion: TIPO_OBLIGACION.IVA,
          jurisdiccion: JURISDICCION.ARCA,
          regimen: 'GENERAL',
          terminacionCuit: '6',
          diaVencimiento: 18,
          mesSiguiente: true,
          vigenciaDesde: new Date('2026-01-01'),
          vigenciaHasta: null,
          origen: ORIGEN_REGLA.MANUAL,
          estado: ESTADO_REGLA.ACTIVA,
        },
        'test-id',
      );
      expect(r.id).toBe('test-id');
      expect(r.tipoObligacion).toBe(TIPO_OBLIGACION.IVA);
      expect(r.jurisdiccion).toBe(JURISDICCION.ARCA);
      expect(r.estado).toBe(ESTADO_REGLA.ACTIVA);
    });
  });

  describe('cerrarVigencia', () => {
    it('should close vigencia', () => {
      const r = ReglaVencimiento.create(baseProps);
      const endDate = new Date('2026-12-31');
      r.cerrarVigencia(endDate);
      expect(r.vigenciaHasta).toEqual(endDate);
    });
  });
});
