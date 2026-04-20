import { CatalogoObligacionMapper } from './catalogo-obligacion.mapper';
import { CatalogoObligacion } from '../../domain/entities/catalogo-obligacion.entity';
import { TIPO_OBLIGACION, JURISDICCION, FRECUENCIA_OBLIGACION } from '@numerito/shared';

describe('CatalogoObligacionMapper', () => {
  const mapper = new CatalogoObligacionMapper();

  const validPersistence = {
    id: 'test-uuid',
    nombre: 'IVA Mensual (ARCA)',
    tipoObligacion: TIPO_OBLIGACION.IVA,
    jurisdiccion: JURISDICCION.ARCA,
    frecuencia: FRECUENCIA_OBLIGACION.MENSUAL,
    activo: true,
  };

  it('should map persistence → domain', () => {
    const domain = mapper.toDomain(validPersistence);
    expect(domain.id).toBe('test-uuid');
    expect(domain.nombre).toBe('IVA Mensual (ARCA)');
    expect(domain.tipoObligacion).toBe(TIPO_OBLIGACION.IVA);
    expect(domain.jurisdiccion).toBe(JURISDICCION.ARCA);
    expect(domain.frecuencia).toBe(FRECUENCIA_OBLIGACION.MENSUAL);
    expect(domain.activo).toBe(true);
  });

  it('should map domain → persistence', () => {
    const domain = CatalogoObligacion.create({
      nombre: 'SICOSS',
      tipoObligacion: TIPO_OBLIGACION.SICOSS,
      jurisdiccion: JURISDICCION.ARCA,
      frecuencia: FRECUENCIA_OBLIGACION.MENSUAL,
    });
    const persistence = mapper.toPersistence(domain);
    expect(persistence.nombre).toBe('SICOSS');
    expect(persistence.tipoObligacion).toBe(TIPO_OBLIGACION.SICOSS);
    expect(persistence.id).toBe(domain.id);
  });

  it('should round-trip toPersistence → toDomain', () => {
    const original = CatalogoObligacion.create({
      nombre: 'IIBB ARBA',
      tipoObligacion: TIPO_OBLIGACION.IIBB_ARBA,
      jurisdiccion: JURISDICCION.ARBA,
      frecuencia: FRECUENCIA_OBLIGACION.MENSUAL,
    });
    const persistence = mapper.toPersistence(original);
    const reconstituted = mapper.toDomain(persistence);
    expect(reconstituted.id).toBe(original.id);
    expect(reconstituted.nombre).toBe(original.nombre);
    expect(reconstituted.jurisdiccion).toBe(original.jurisdiccion);
  });

  it('should map fromSchema (ORM entity)', () => {
    const ormEntity = {
      id: 'orm-id',
      nombre: 'Test',
      tipoObligacion: 'IVA',
      jurisdiccion: 'ARCA',
      frecuencia: 'MENSUAL',
      activo: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const persistence = mapper.fromSchema(ormEntity as any);
    expect(persistence.id).toBe('orm-id');
    expect(persistence.activo).toBe(false);
  });
});
