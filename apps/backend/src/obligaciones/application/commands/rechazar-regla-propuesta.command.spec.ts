import { RechazarReglaPropuestaHandler } from './rechazar-regla-propuesta.command';
import { ReglaVencimiento, ESTADO_REGLA } from '../../domain/entities/regla-vencimiento.entity';
import type { ReglaVencimientoEntityRepository } from '../../domain/repositories/regla-vencimiento.repository';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

function createMockRepo(
  reglas: ReglaVencimiento[] = [],
): jest.Mocked<ReglaVencimientoEntityRepository> {
  return {
    findById: jest
      .fn()
      .mockImplementation((id: string) => Promise.resolve(reglas.find((r) => r.id === id) ?? null)),
    findAll: jest.fn(),
    findActivas: jest.fn(),
    findByEstado: jest.fn(),
    findVigentes: jest.fn(),
    findActivasAsSummary: jest.fn(),
    createPropuestaFromScrape: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
}

describe('RechazarReglaPropuestaHandler', () => {
  it('should reject a PROPUESTA rule', async () => {
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

    const repo = createMockRepo([propuesta]);
    const handler = new RechazarReglaPropuestaHandler(repo);

    await handler.execute({ reglaId: propuesta.id });

    expect(propuesta.estado).toBe(ESTADO_REGLA.RECHAZADA);
    expect(repo.save).toHaveBeenCalledWith(propuesta);
  });

  it('should throw RecursoNoEncontradoError for unknown ID', async () => {
    const repo = createMockRepo([]);
    const handler = new RechazarReglaPropuestaHandler(repo);

    await expect(handler.execute({ reglaId: 'non-existent' })).rejects.toThrow(
      RecursoNoEncontradoError,
    );
  });

  it('should throw when trying to reject non-PROPUESTA rule', async () => {
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
    const handler = new RechazarReglaPropuestaHandler(repo);

    await expect(handler.execute({ reglaId: activa.id })).rejects.toThrow();
  });
});
