import { ReglaVencimientoMapper } from './regla-vencimiento.mapper';
import { ReglaVencimiento } from '../../domain/entities/regla-vencimiento.entity';
import {
  TIPO_OBLIGACION,
  JURISDICCION,
  ESTADO_REGLA,
  ORIGEN_REGLA,
} from '@numerito/shared';

describe('ReglaVencimientoMapper', () => {
  const mapper = new ReglaVencimientoMapper();

  const validPersistence = {
    id: '42',
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
  };

  it('should map persistence → domain', () => {
    const domain = mapper.toDomain(validPersistence);
    expect(domain.id).toBe('42');
    expect(domain.tipoObligacion).toBe(TIPO_OBLIGACION.IVA);
    expect(domain.jurisdiccion).toBe(JURISDICCION.ARCA);
    expect(domain.regimen).toBe('GENERAL');
    expect(domain.terminacionCuit).toBe('6');
    expect(domain.diaVencimiento).toBe(18);
    expect(domain.mesSiguiente).toBe(true);
    expect(domain.estado).toBe(ESTADO_REGLA.ACTIVA);
    expect(domain.origen).toBe(ORIGEN_REGLA.MANUAL);
    expect(domain.vigenciaHasta).toBeNull();
  });

  it('should map domain → persistence', () => {
    const domain = ReglaVencimiento.create({
      tipoObligacion: TIPO_OBLIGACION.IVA,
      jurisdiccion: JURISDICCION.ARCA,
      regimen: 'GENERAL',
      terminacionCuit: '7',
      diaVencimiento: 21,
      mesSiguiente: true,
      vigenciaDesde: new Date('2026-01-01'),
    });
    const persistence = mapper.toPersistence(domain);
    expect(persistence.terminacionCuit).toBe('7');
    expect(persistence.diaVencimiento).toBe(21);
    expect(persistence.estado).toBe(ESTADO_REGLA.ACTIVA);
  });

  it('should round-trip toPersistence → toDomain', () => {
    const original = ReglaVencimiento.create({
      tipoObligacion: TIPO_OBLIGACION.SICOSS,
      jurisdiccion: JURISDICCION.ARCA,
      regimen: 'GENERAL',
      terminacionCuit: '0',
      diaVencimiento: 10,
      mesSiguiente: true,
      vigenciaDesde: new Date('2026-01-01'),
      vigenciaHasta: new Date('2026-12-31'),
      origen: ORIGEN_REGLA.SCRAPING_OFICIAL,
      estado: ESTADO_REGLA.PROPUESTA,
    });
    const persistence = mapper.toPersistence(original);
    const reconstituted = mapper.toDomain(persistence);
    expect(reconstituted.id).toBe(original.id);
    expect(reconstituted.tipoObligacion).toBe(original.tipoObligacion);
    expect(reconstituted.estado).toBe(ESTADO_REGLA.PROPUESTA);
    expect(reconstituted.origen).toBe(ORIGEN_REGLA.SCRAPING_OFICIAL);
  });

  it('should map fromSchema (ORM entity with FK)', () => {
    const ormEntity = {
      id: 99,
      tipoObligacion: { id: 1, codigo: 'IVA', nombre: 'IVA', periodicidad: 'MENSUAL' },
      terminacionCuit: '3',
      diaVencimiento: 19,
      mesSiguiente: true,
      jurisdiccion: 'ARCA',
      regimen: 'GENERAL',
      vigenciaDesde: new Date('2026-01-01'),
      vigenciaHasta: null,
      origen: 'MANUAL',
      estado: 'ACTIVA',
    };
    const persistence = mapper.fromSchema(ormEntity as any);
    expect(persistence.id).toBe('99');
    expect(persistence.tipoObligacion).toBe('IVA');
    expect(persistence.jurisdiccion).toBe('ARCA');
  });
});
