import { DiaFeriadoMapper } from './dia-feriado.mapper';
import { DiaFeriado, TIPO_FERIADO } from '../../domain/entities/dia-feriado.entity';

describe('DiaFeriadoMapper', () => {
  const mapper = new DiaFeriadoMapper();

  const validPersistence = {
    id: 'test-uuid',
    fecha: new Date('2026-05-01'),
    tipo: TIPO_FERIADO.NACIONAL,
    descripcion: 'Día del Trabajador',
    jurisdiccionAfectada: null,
  };

  it('should map persistence → domain', () => {
    const domain = mapper.toDomain(validPersistence);
    expect(domain.id).toBe('test-uuid');
    expect(domain.fecha).toEqual(new Date('2026-05-01'));
    expect(domain.tipo).toBe('NACIONAL');
    expect(domain.descripcion).toBe('Día del Trabajador');
    expect(domain.jurisdiccionAfectada).toBeNull();
  });

  it('should map domain → persistence', () => {
    const domain = DiaFeriado.create({
      fecha: new Date('2026-07-09'),
      tipo: TIPO_FERIADO.NACIONAL,
      descripcion: 'Día de la Independencia',
    });
    const persistence = mapper.toPersistence(domain);
    expect(persistence.fecha).toEqual(new Date('2026-07-09'));
    expect(persistence.tipo).toBe('NACIONAL');
    expect(persistence.id).toBe(domain.id);
    expect(persistence.jurisdiccionAfectada).toBeNull();
  });

  it('should round-trip toPersistence → toDomain', () => {
    const original = DiaFeriado.create({
      fecha: new Date('2026-11-10'),
      tipo: TIPO_FERIADO.PROVINCIAL,
      descripcion: 'Día de la Tradición',
      jurisdiccionAfectada: 'ARBA',
    });
    const persistence = mapper.toPersistence(original);
    const reconstituted = mapper.toDomain(persistence);
    expect(reconstituted.id).toBe(original.id);
    expect(reconstituted.fecha).toEqual(original.fecha);
    expect(reconstituted.tipo).toBe(original.tipo);
    expect(reconstituted.descripcion).toBe(original.descripcion);
    expect(reconstituted.jurisdiccionAfectada).toBe(original.jurisdiccionAfectada);
  });

  it('should map fromSchema (ORM entity)', () => {
    const ormEntity = {
      id: 'orm-id',
      fecha: new Date('2026-12-31'),
      tipo: 'BANCARIO',
      descripcion: 'Feriado bancario fin de año',
      jurisdiccionAfectada: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const persistence = mapper.fromSchema(ormEntity as any);
    expect(persistence.id).toBe('orm-id');
    expect(persistence.tipo).toBe('BANCARIO');
    expect(persistence.jurisdiccionAfectada).toBeNull();
  });
});
