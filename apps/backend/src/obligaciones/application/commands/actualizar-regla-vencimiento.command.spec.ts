import { ActualizarReglaVencimientoHandler } from './actualizar-regla-vencimiento.command';
import { ReglaVencimiento, ESTADO_REGLA, ORIGEN_REGLA } from '../../domain/entities/regla-vencimiento.entity';
import type { ReglaVencimientoEntityRepository } from '../../domain/repositories/regla-vencimiento.repository';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

function createMockRepo(
  reglas: ReglaVencimiento[] = [],
): jest.Mocked<ReglaVencimientoEntityRepository> {
  return {
    findById: jest.fn().mockImplementation((id: string) =>
      Promise.resolve(reglas.find((r) => r.id === id) ?? null),
    ),
    findAll: jest.fn(),
    findActivas: jest.fn(),
    findByEstado: jest.fn(),
    findVigentes: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
}

function createPropuesta(overrides?: Partial<Parameters<typeof ReglaVencimiento.create>[0]>) {
  return ReglaVencimiento.create({
    tipoObligacion: 'IVA' as any,
    jurisdiccion: 'ARCA' as any,
    regimen: 'GENERAL',
    terminacionCuit: '0',
    diaVencimiento: 18,
    mesSiguiente: true,
    vigenciaDesde: new Date('2026-01-01'),
    origen: ORIGEN_REGLA.SCRAPING_OFICIAL,
    estado: ESTADO_REGLA.PROPUESTA,
    ...overrides,
  });
}

describe('ActualizarReglaVencimientoHandler', () => {
  it('should throw RecursoNoEncontradoError for unknown ID', async () => {
    const repo = createMockRepo([]);
    const handler = new ActualizarReglaVencimientoHandler(repo);

    await expect(
      handler.execute({ id: 'non-existent' }),
    ).rejects.toThrow(RecursoNoEncontradoError);
  });

  it('should approve a PROPUESTA rule by setting estado to ACTIVA', async () => {
    const propuesta = createPropuesta();
    const repo = createMockRepo([propuesta]);
    const handler = new ActualizarReglaVencimientoHandler(repo);

    await handler.execute({ id: propuesta.id, estado: 'ACTIVA' });

    expect(propuesta.estado).toBe(ESTADO_REGLA.ACTIVA);
    expect(repo.save).toHaveBeenCalledWith(propuesta);
  });

  it('should reject a PROPUESTA rule by setting estado to RECHAZADA', async () => {
    const propuesta = createPropuesta();
    const repo = createMockRepo([propuesta]);
    const handler = new ActualizarReglaVencimientoHandler(repo);

    await handler.execute({ id: propuesta.id, estado: 'RECHAZADA' });

    expect(propuesta.estado).toBe(ESTADO_REGLA.RECHAZADA);
    expect(repo.save).toHaveBeenCalledWith(propuesta);
  });

  it('should close vigencia with a specific date', async () => {
    const activa = ReglaVencimiento.create({
      tipoObligacion: 'IVA' as any,
      jurisdiccion: 'ARCA' as any,
      regimen: 'GENERAL',
      terminacionCuit: '0',
      diaVencimiento: 20,
      mesSiguiente: true,
      vigenciaDesde: new Date('2026-01-01'),
      estado: ESTADO_REGLA.ACTIVA,
    });

    const repo = createMockRepo([activa]);
    const handler = new ActualizarReglaVencimientoHandler(repo);

    await handler.execute({ id: activa.id, vigenciaHasta: '2026-06-30' });

    expect(activa.vigenciaHasta).toEqual(new Date('2026-06-30'));
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('should set vigenciaHasta to far future when null is passed', async () => {
    const activa = ReglaVencimiento.create({
      tipoObligacion: 'IVA' as any,
      jurisdiccion: 'ARCA' as any,
      regimen: 'GENERAL',
      terminacionCuit: '0',
      diaVencimiento: 20,
      mesSiguiente: true,
      vigenciaDesde: new Date('2026-01-01'),
      estado: ESTADO_REGLA.ACTIVA,
    });

    const repo = createMockRepo([activa]);
    const handler = new ActualizarReglaVencimientoHandler(repo);

    await handler.execute({ id: activa.id, vigenciaHasta: null });

    expect(activa.vigenciaHasta).toEqual(new Date('9999-12-31'));
  });

  it('should preserve entity ID after update', async () => {
    const propuesta = createPropuesta();
    const originalId = propuesta.id;
    const repo = createMockRepo([propuesta]);
    const handler = new ActualizarReglaVencimientoHandler(repo);

    const result = await handler.execute({ id: originalId, estado: 'ACTIVA' });

    expect(result.id).toBe(originalId);
  });

  it('should not change estado when same estado is set', async () => {
    const activa = ReglaVencimiento.create({
      tipoObligacion: 'IVA' as any,
      jurisdiccion: 'ARCA' as any,
      regimen: 'GENERAL',
      terminacionCuit: '0',
      diaVencimiento: 20,
      mesSiguiente: true,
      vigenciaDesde: new Date('2026-01-01'),
      estado: ESTADO_REGLA.ACTIVA,
    });

    const repo = createMockRepo([activa]);
    const handler = new ActualizarReglaVencimientoHandler(repo);

    await handler.execute({ id: activa.id, estado: 'ACTIVA' });

    expect(activa.estado).toBe(ESTADO_REGLA.ACTIVA);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('should not call save if entity is not found', async () => {
    const repo = createMockRepo([]);
    const handler = new ActualizarReglaVencimientoHandler(repo);

    await expect(handler.execute({ id: 'bad-id' })).rejects.toThrow();

    expect(repo.save).not.toHaveBeenCalled();
  });
});
