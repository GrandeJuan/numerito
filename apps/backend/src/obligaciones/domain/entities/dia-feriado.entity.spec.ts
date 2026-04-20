import { DiaFeriado, TIPO_FERIADO } from './dia-feriado.entity';

describe('DiaFeriado', () => {
  const defaultProps = {
    fecha: new Date('2026-05-01'),
    tipo: TIPO_FERIADO.NACIONAL as const,
    descripcion: 'Día del Trabajador',
  };

  describe('create', () => {
    it('should create with defaults (jurisdiccionAfectada null)', () => {
      const feriado = DiaFeriado.create(defaultProps);
      expect(feriado.id).toBeDefined();
      expect(feriado.fecha).toEqual(new Date('2026-05-01'));
      expect(feriado.tipo).toBe('NACIONAL');
      expect(feriado.descripcion).toBe('Día del Trabajador');
      expect(feriado.jurisdiccionAfectada).toBeNull();
    });

    it('should create with explicit jurisdiccionAfectada', () => {
      const feriado = DiaFeriado.create({
        fecha: new Date('2026-11-10'),
        tipo: TIPO_FERIADO.PROVINCIAL,
        descripcion: 'Día de la Tradición',
        jurisdiccionAfectada: 'ARBA',
      });
      expect(feriado.tipo).toBe('PROVINCIAL');
      expect(feriado.jurisdiccionAfectada).toBe('ARBA');
    });

    it('should create a BANCARIO feriado', () => {
      const feriado = DiaFeriado.create({
        fecha: new Date('2026-12-31'),
        tipo: TIPO_FERIADO.BANCARIO,
        descripcion: 'Feriado bancario fin de año',
      });
      expect(feriado.tipo).toBe('BANCARIO');
      expect(feriado.jurisdiccionAfectada).toBeNull();
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from persisted data', () => {
      const feriado = DiaFeriado.reconstitute(
        {
          fecha: new Date('2026-07-09'),
          tipo: TIPO_FERIADO.NACIONAL,
          descripcion: 'Día de la Independencia',
          jurisdiccionAfectada: null,
        },
        'fixed-id',
      );
      expect(feriado.id).toBe('fixed-id');
      expect(feriado.fecha).toEqual(new Date('2026-07-09'));
      expect(feriado.tipo).toBe('NACIONAL');
      expect(feriado.descripcion).toBe('Día de la Independencia');
      expect(feriado.jurisdiccionAfectada).toBeNull();
    });

    it('should not emit domain events on reconstitution', () => {
      const feriado = DiaFeriado.reconstitute(
        {
          fecha: new Date('2026-05-25'),
          tipo: TIPO_FERIADO.NACIONAL,
          descripcion: 'Revolución de Mayo',
          jurisdiccionAfectada: null,
        },
        'id-2',
      );
      expect(feriado.getDomainEvents()).toHaveLength(0);
    });

    it('should reconstitute with jurisdiccionAfectada', () => {
      const feriado = DiaFeriado.reconstitute(
        {
          fecha: new Date('2026-08-17'),
          tipo: TIPO_FERIADO.PROVINCIAL,
          descripcion: 'Paso a la Inmortalidad del Gral. San Martín (PBA)',
          jurisdiccionAfectada: 'ARBA',
        },
        'id-3',
      );
      expect(feriado.jurisdiccionAfectada).toBe('ARBA');
    });
  });

  describe('afecta', () => {
    it('NACIONAL affects all jurisdictions', () => {
      const feriado = DiaFeriado.create(defaultProps);
      expect(feriado.afecta('ARCA')).toBe(true);
      expect(feriado.afecta('ARBA')).toBe(true);
      expect(feriado.afecta('AGIP')).toBe(true);
    });

    it('BANCARIO affects all jurisdictions', () => {
      const feriado = DiaFeriado.create({
        fecha: new Date('2026-12-31'),
        tipo: TIPO_FERIADO.BANCARIO,
        descripcion: 'Feriado bancario',
      });
      expect(feriado.afecta('ARCA')).toBe(true);
      expect(feriado.afecta('ARBA')).toBe(true);
    });

    it('PROVINCIAL affects only its jurisdiccion', () => {
      const feriado = DiaFeriado.create({
        fecha: new Date('2026-11-10'),
        tipo: TIPO_FERIADO.PROVINCIAL,
        descripcion: 'Feriado provincial ARBA',
        jurisdiccionAfectada: 'ARBA',
      });
      expect(feriado.afecta('ARBA')).toBe(true);
      expect(feriado.afecta('ARCA')).toBe(false);
      expect(feriado.afecta('AGIP')).toBe(false);
    });

    it('MUNICIPAL affects only its jurisdiccion', () => {
      const feriado = DiaFeriado.create({
        fecha: new Date('2026-06-20'),
        tipo: TIPO_FERIADO.MUNICIPAL,
        descripcion: 'Feriado municipal AGIP',
        jurisdiccionAfectada: 'AGIP',
      });
      expect(feriado.afecta('AGIP')).toBe(true);
      expect(feriado.afecta('ARCA')).toBe(false);
    });
  });
});
