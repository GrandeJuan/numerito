import { AprobarReglaPropuestaHandler } from './aprobar-regla-propuesta.command';
import { ReglaVencimiento, ESTADO_REGLA, ORIGEN_REGLA } from '../../domain/entities/regla-vencimiento.entity';
import type { ReglaVencimientoEntityRepository } from '../../domain/repositories/regla-vencimiento.repository';
import { RecursoNoEncontradoError, OperacionInvalidaError } from '../../../shared/domain/exceptions';

function createMockRepo(reglas: ReglaVencimiento[] = []): jest.Mocked<ReglaVencimientoEntityRepository> {
  return {
    findById: jest.fn().mockImplementation((id: string) =>
      Promise.resolve(reglas.find((r) => r.id === id) ?? null),
    ),
    findAll: jest.fn(),
    findActivas: jest.fn().mockResolvedValue(reglas.filter((r) => r.estado === ESTADO_REGLA.ACTIVA)),
    findByEstado: jest.fn(),
    findVigentes: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
}

describe('AprobarReglaPropuestaHandler', () => {
  it('should approve a PROPUESTA rule', async () => {
    const propuesta = ReglaVencimiento.create({
      tipoObligacion: 'IVA' as any,
      jurisdiccion: 'ARCA' as any,
      regimen: 'GENERAL',
      terminacionCuit: '0',
      diaVencimiento: 22,
      mesSiguiente: true,
      vigenciaDesde: new Date('2026-04-01'),
      origen: ORIGEN_REGLA.SCRAPING_OFICIAL,
      estado: ESTADO_REGLA.PROPUESTA,
    });

    const repo = createMockRepo([propuesta]);
    const handler = new AprobarReglaPropuestaHandler(repo);

    await handler.execute({ reglaId: propuesta.id });

    expect(propuesta.estado).toBe(ESTADO_REGLA.ACTIVA);
    expect(repo.save).toHaveBeenCalledWith(propuesta);
  });

  it('should close vigencia of conflicting active rule', async () => {
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

    const propuesta = ReglaVencimiento.create({
      tipoObligacion: 'IVA' as any,
      jurisdiccion: 'ARCA' as any,
      regimen: 'GENERAL',
      terminacionCuit: '0',
      diaVencimiento: 22,
      mesSiguiente: true,
      vigenciaDesde: new Date('2026-04-01'),
      origen: ORIGEN_REGLA.SCRAPING_OFICIAL,
      estado: ESTADO_REGLA.PROPUESTA,
    });

    const repo = createMockRepo([activa, propuesta]);
    const handler = new AprobarReglaPropuestaHandler(repo);

    await handler.execute({ reglaId: propuesta.id });

    // Active rule's vigencia should be closed to day before propuesta starts
    expect(activa.vigenciaHasta).toEqual(new Date('2026-03-31'));
    expect(propuesta.estado).toBe(ESTADO_REGLA.ACTIVA);
    // Should save both the active (closed) and the propuesta (approved)
    expect(repo.save).toHaveBeenCalledTimes(2);
  });

  it('should throw RecursoNoEncontradoError for unknown ID', async () => {
    const repo = createMockRepo([]);
    const handler = new AprobarReglaPropuestaHandler(repo);

    await expect(
      handler.execute({ reglaId: 'non-existent' }),
    ).rejects.toThrow(RecursoNoEncontradoError);
  });

  it('should throw OperacionInvalidaError for non-PROPUESTA rule', async () => {
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
    const handler = new AprobarReglaPropuestaHandler(repo);

    await expect(
      handler.execute({ reglaId: activa.id }),
    ).rejects.toThrow(OperacionInvalidaError);
  });

  it('should not close vigencia of rules for different natural key', async () => {
    const activa = ReglaVencimiento.create({
      tipoObligacion: 'IVA' as any,
      jurisdiccion: 'ARCA' as any,
      regimen: 'GENERAL',
      terminacionCuit: '5',  // different terminacion
      diaVencimiento: 18,
      mesSiguiente: true,
      vigenciaDesde: new Date('2026-01-01'),
      estado: ESTADO_REGLA.ACTIVA,
    });

    const propuesta = ReglaVencimiento.create({
      tipoObligacion: 'IVA' as any,
      jurisdiccion: 'ARCA' as any,
      regimen: 'GENERAL',
      terminacionCuit: '0',
      diaVencimiento: 22,
      mesSiguiente: true,
      vigenciaDesde: new Date('2026-04-01'),
      estado: ESTADO_REGLA.PROPUESTA,
    });

    const repo = createMockRepo([activa, propuesta]);
    const handler = new AprobarReglaPropuestaHandler(repo);

    await handler.execute({ reglaId: propuesta.id });

    // Active rule for terminacion '5' should NOT be closed
    expect(activa.vigenciaHasta).toBeNull();
    // Only the propuesta is saved (no matching active to close)
    expect(repo.save).toHaveBeenCalledTimes(1);
  });
});
