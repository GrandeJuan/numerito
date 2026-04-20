import { CatalogoObligacion } from './catalogo-obligacion.entity';
import { TIPO_OBLIGACION, JURISDICCION, FRECUENCIA_OBLIGACION } from '@numerito/shared';

describe('CatalogoObligacion Entity', () => {
  const defaults = {
    nombre: 'IVA Mensual (ARCA)',
    tipoObligacion: TIPO_OBLIGACION.IVA,
    jurisdiccion: JURISDICCION.ARCA,
    frecuencia: FRECUENCIA_OBLIGACION.MENSUAL,
  } as const;

  it('should create with default activo=true', () => {
    const c = CatalogoObligacion.create(defaults);
    expect(c.id).toBeDefined();
    expect(c.nombre).toBe('IVA Mensual (ARCA)');
    expect(c.tipoObligacion).toBe(TIPO_OBLIGACION.IVA);
    expect(c.jurisdiccion).toBe(JURISDICCION.ARCA);
    expect(c.frecuencia).toBe(FRECUENCIA_OBLIGACION.MENSUAL);
    expect(c.activo).toBe(true);
  });

  it('should create with explicit activo=false', () => {
    const c = CatalogoObligacion.create({ ...defaults, activo: false });
    expect(c.activo).toBe(false);
  });

  it('should update nombre', () => {
    const c = CatalogoObligacion.create(defaults);
    c.actualizar({ nombre: 'IVA Mensual Renombrado' });
    expect(c.nombre).toBe('IVA Mensual Renombrado');
  });

  it('should desactivar', () => {
    const c = CatalogoObligacion.create(defaults);
    c.desactivar();
    expect(c.activo).toBe(false);
  });

  it('should activar', () => {
    const c = CatalogoObligacion.create({ ...defaults, activo: false });
    c.activar();
    expect(c.activo).toBe(true);
  });

  it('should reconstitute from persisted state', () => {
    const c = CatalogoObligacion.reconstitute(
      {
        nombre: 'SICOSS',
        tipoObligacion: TIPO_OBLIGACION.SICOSS,
        jurisdiccion: JURISDICCION.ARCA,
        frecuencia: FRECUENCIA_OBLIGACION.MENSUAL,
        activo: true,
      },
      'reconstituted-id',
    );
    expect(c.id).toBe('reconstituted-id');
    expect(c.tipoObligacion).toBe(TIPO_OBLIGACION.SICOSS);
  });
});
