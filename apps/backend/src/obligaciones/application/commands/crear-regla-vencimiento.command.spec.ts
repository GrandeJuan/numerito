import { CrearReglaVencimientoHandler } from './crear-regla-vencimiento.command';
import {
  ReglaVencimiento,
  ESTADO_REGLA,
  ORIGEN_REGLA,
} from '../../domain/entities/regla-vencimiento.entity';
import { ReglaVencimientoService } from '../../domain/services/regla-vencimiento.service';
import type { ReglaVencimientoEntityRepository } from '../../domain/repositories/regla-vencimiento.repository';
import { OperacionInvalidaError } from '../../../shared/domain/exceptions';

function createMockRepo(): jest.Mocked<ReglaVencimientoEntityRepository> {
  return {
    findById: jest.fn(),
    findAll: jest.fn(),
    findActivas: jest.fn().mockResolvedValue([]),
    findByEstado: jest.fn(),
    findVigentes: jest.fn(),
    findActivasAsSummary: jest.fn(),
    createPropuestaFromScrape: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
}

describe('CrearReglaVencimientoHandler', () => {
  let repo: jest.Mocked<ReglaVencimientoEntityRepository>;
  let service: ReglaVencimientoService;
  let handler: CrearReglaVencimientoHandler;

  beforeEach(() => {
    repo = createMockRepo();
    service = new ReglaVencimientoService(repo);
    handler = new CrearReglaVencimientoHandler(repo, service);
  });

  it('should create a regla and return its id', async () => {
    const result = await handler.execute({
      tipoObligacion: 'IVA',
      jurisdiccion: 'ARCA',
      regimen: 'GENERAL',
      terminacionCuit: '0',
      diaVencimiento: 18,
      mesSiguiente: true,
      vigenciaDesde: '2026-01-01',
    });

    expect(result.id).toBeDefined();
    expect(repo.save).toHaveBeenCalledTimes(1);

    const saved = repo.save.mock.calls[0][0];
    expect(saved).toBeInstanceOf(ReglaVencimiento);
    expect(saved.tipoObligacion).toBe('IVA');
    expect(saved.jurisdiccion).toBe('ARCA');
    expect(saved.regimen).toBe('GENERAL');
    expect(saved.terminacionCuit).toBe('0');
    expect(saved.diaVencimiento).toBe(18);
    expect(saved.mesSiguiente).toBe(true);
  });

  it('should default origen to MANUAL and estado to ACTIVA', async () => {
    await handler.execute({
      tipoObligacion: 'IVA',
      jurisdiccion: 'ARCA',
      regimen: 'GENERAL',
      terminacionCuit: '5',
      diaVencimiento: 20,
      mesSiguiente: true,
      vigenciaDesde: '2026-01-01',
    });

    const saved = repo.save.mock.calls[0][0];
    expect(saved.origen).toBe(ORIGEN_REGLA.MANUAL);
    expect(saved.estado).toBe(ESTADO_REGLA.ACTIVA);
  });

  it('should accept explicit origen and estado', async () => {
    await handler.execute({
      tipoObligacion: 'IIBB',
      jurisdiccion: 'ARBA',
      regimen: 'CONV_MULT',
      terminacionCuit: '3',
      diaVencimiento: 15,
      mesSiguiente: false,
      vigenciaDesde: '2026-01-01',
      origen: 'SCRAPING_OFICIAL',
      estado: 'PROPUESTA',
    });

    const saved = repo.save.mock.calls[0][0];
    expect(saved.origen).toBe(ORIGEN_REGLA.SCRAPING_OFICIAL);
    expect(saved.estado).toBe(ESTADO_REGLA.PROPUESTA);
  });

  it('should parse vigenciaDesde as Date', async () => {
    await handler.execute({
      tipoObligacion: 'IVA',
      jurisdiccion: 'ARCA',
      regimen: 'GENERAL',
      terminacionCuit: '0',
      diaVencimiento: 18,
      mesSiguiente: true,
      vigenciaDesde: '2026-04-01',
    });

    const saved = repo.save.mock.calls[0][0];
    expect(saved.vigenciaDesde).toEqual(new Date('2026-04-01'));
  });

  it('should parse vigenciaHasta when provided', async () => {
    await handler.execute({
      tipoObligacion: 'IVA',
      jurisdiccion: 'ARCA',
      regimen: 'GENERAL',
      terminacionCuit: '0',
      diaVencimiento: 18,
      mesSiguiente: true,
      vigenciaDesde: '2026-01-01',
      vigenciaHasta: '2026-12-31',
    });

    const saved = repo.save.mock.calls[0][0];
    expect(saved.vigenciaHasta).toEqual(new Date('2026-12-31'));
  });

  it('should set vigenciaHasta to null when not provided', async () => {
    await handler.execute({
      tipoObligacion: 'IVA',
      jurisdiccion: 'ARCA',
      regimen: 'GENERAL',
      terminacionCuit: '0',
      diaVencimiento: 18,
      mesSiguiente: true,
      vigenciaDesde: '2026-01-01',
    });

    const saved = repo.save.mock.calls[0][0];
    expect(saved.vigenciaHasta).toBeNull();
  });

  it('should throw OperacionInvalidaError when conflicting rule exists', async () => {
    const existing = ReglaVencimiento.create({
      tipoObligacion: 'IVA' as any,
      jurisdiccion: 'ARCA' as any,
      regimen: 'GENERAL',
      terminacionCuit: '0',
      diaVencimiento: 20,
      mesSiguiente: true,
      vigenciaDesde: new Date('2026-01-01'),
      estado: ESTADO_REGLA.ACTIVA,
    });

    repo.findActivas.mockResolvedValue([existing]);

    await expect(
      handler.execute({
        tipoObligacion: 'IVA',
        jurisdiccion: 'ARCA',
        regimen: 'GENERAL',
        terminacionCuit: '0',
        diaVencimiento: 18,
        mesSiguiente: true,
        vigenciaDesde: '2026-06-01',
      }),
    ).rejects.toThrow(OperacionInvalidaError);

    expect(repo.save).not.toHaveBeenCalled();
  });

  it('should allow creation when no conflict exists (different terminacion)', async () => {
    const existing = ReglaVencimiento.create({
      tipoObligacion: 'IVA' as any,
      jurisdiccion: 'ARCA' as any,
      regimen: 'GENERAL',
      terminacionCuit: '5',
      diaVencimiento: 20,
      mesSiguiente: true,
      vigenciaDesde: new Date('2026-01-01'),
      estado: ESTADO_REGLA.ACTIVA,
    });

    repo.findActivas.mockResolvedValue([existing]);

    const result = await handler.execute({
      tipoObligacion: 'IVA',
      jurisdiccion: 'ARCA',
      regimen: 'GENERAL',
      terminacionCuit: '0',
      diaVencimiento: 18,
      mesSiguiente: true,
      vigenciaDesde: '2026-06-01',
    });

    expect(result.id).toBeDefined();
    expect(repo.save).toHaveBeenCalledTimes(1);
  });
});
