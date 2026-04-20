import { ProcesarResultadoScrapingHandler } from './procesar-resultado-scraping.command';
import { ReglaVencimiento, ESTADO_REGLA, ORIGEN_REGLA } from '../../../obligaciones/domain/entities/regla-vencimiento.entity';
import { EjecucionIngesta, DISPARADOR_INGESTA } from '../../domain/entities/ejecucion-ingesta.entity';
import type { ReglaVencimientoEntityRepository } from '../../../obligaciones/domain/repositories/regla-vencimiento.repository';
import type { EjecucionIngestaRepository } from '../../domain/repositories/ejecucion-ingesta.repository';
import type { ConfiguracionIngestaRepository } from '../../domain/repositories/configuracion-ingesta.repository';
import type { ResultadoScrapingDto } from '../dtos/resultado-scraping.dto';

function createMockReglaRepo(activas: ReglaVencimiento[] = []): jest.Mocked<ReglaVencimientoEntityRepository> {
  return {
    findById: jest.fn(),
    findAll: jest.fn(),
    findActivas: jest.fn().mockResolvedValue(activas),
    findByEstado: jest.fn(),
    findVigentes: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
}

function createMockEjecucionRepo(): jest.Mocked<EjecucionIngestaRepository> {
  return {
    findById: jest.fn(),
    findByIngestaId: jest.fn().mockResolvedValue(null),
    findByFuente: jest.fn(),
    findAll: jest.fn(),
    save: jest.fn(),
  };
}

function createMockConfigRepo(): jest.Mocked<ConfiguracionIngestaRepository> {
  return {
    findById: jest.fn(),
    findByFuente: jest.fn().mockResolvedValue(null),
    findAll: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
}

describe('ProcesarResultadoScrapingHandler', () => {
  const baseResultado: ResultadoScrapingDto = {
    fuente: 'ARCA',
    ejecutadoEn: '2026-04-20T10:00:00Z',
    reglas: [],
    errores: [],
  };

  it('should create PROPUESTA rules for new rules (no active match)', async () => {
    const reglaRepo = createMockReglaRepo([]);
    const handler = new ProcesarResultadoScrapingHandler(
      reglaRepo,
      createMockEjecucionRepo(),
      createMockConfigRepo(),
    );

    const result = await handler.execute({
      resultado: {
        ...baseResultado,
        reglas: [
          {
            tipoObligacion: 'IVA',
            jurisdiccion: 'ARCA',
            regimen: 'GENERAL',
            terminacionCuit: '0',
            diaVencimiento: 22,
            mesSiguiente: true,
            vigenciaDesde: '2026-01-01',
            vigenciaHasta: null,
          },
        ],
      },
    });

    expect(result.reglasNuevas).toBe(1);
    expect(result.reglasModificadas).toBe(0);
    expect(result.sinCambios).toBe(0);
    expect(result.diff[0].tipo).toBe('NUEVA');
    expect(reglaRepo.save).toHaveBeenCalledTimes(1);
    const savedRegla = (reglaRepo.save as jest.Mock).mock.calls[0][0] as ReglaVencimiento;
    expect(savedRegla.estado).toBe(ESTADO_REGLA.PROPUESTA);
    expect(savedRegla.origen).toBe(ORIGEN_REGLA.SCRAPING_OFICIAL);
  });

  it('should detect MODIFICADA when diaVencimiento differs', async () => {
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

    const reglaRepo = createMockReglaRepo([activa]);
    const handler = new ProcesarResultadoScrapingHandler(
      reglaRepo,
      createMockEjecucionRepo(),
      createMockConfigRepo(),
    );

    const result = await handler.execute({
      resultado: {
        ...baseResultado,
        reglas: [
          {
            tipoObligacion: 'IVA',
            jurisdiccion: 'ARCA',
            regimen: 'GENERAL',
            terminacionCuit: '0',
            diaVencimiento: 22,
            mesSiguiente: true,
            vigenciaDesde: '2026-04-01',
          },
        ],
      },
    });

    expect(result.reglasModificadas).toBe(1);
    expect(result.reglasNuevas).toBe(0);
    expect(result.diff[0].tipo).toBe('MODIFICADA');
    expect(result.diff[0].cambios).toContain('diaVencimiento: 20 → 22');
  });

  it('should detect SIN_CAMBIOS when rule matches active', async () => {
    const activa = ReglaVencimiento.create({
      tipoObligacion: 'IVA' as any,
      jurisdiccion: 'ARCA' as any,
      regimen: 'GENERAL',
      terminacionCuit: '5',
      diaVencimiento: 18,
      mesSiguiente: true,
      vigenciaDesde: new Date('2026-01-01'),
    });

    const reglaRepo = createMockReglaRepo([activa]);
    const handler = new ProcesarResultadoScrapingHandler(
      reglaRepo,
      createMockEjecucionRepo(),
      createMockConfigRepo(),
    );

    const result = await handler.execute({
      resultado: {
        ...baseResultado,
        reglas: [
          {
            tipoObligacion: 'IVA',
            jurisdiccion: 'ARCA',
            regimen: 'GENERAL',
            terminacionCuit: '5',
            diaVencimiento: 18,
            mesSiguiente: true,
            vigenciaDesde: '2026-01-01',
          },
        ],
      },
    });

    expect(result.sinCambios).toBe(1);
    expect(result.reglasNuevas).toBe(0);
    expect(result.reglasModificadas).toBe(0);
    // No save for SIN_CAMBIOS
    expect(reglaRepo.save).not.toHaveBeenCalled();
  });

  it('should record EjecucionIngesta as EXITOSA', async () => {
    const ejecucionRepo = createMockEjecucionRepo();
    const handler = new ProcesarResultadoScrapingHandler(
      createMockReglaRepo([]),
      ejecucionRepo,
      createMockConfigRepo(),
    );

    await handler.execute({ resultado: baseResultado });

    expect(ejecucionRepo.save).toHaveBeenCalledTimes(1);
    const saved = (ejecucionRepo.save as jest.Mock).mock.calls[0][0];
    expect(saved.estado).toBe('EXITOSA');
  });

  it('should record EjecucionIngesta as FALLIDA when all reglas error out', async () => {
    const reglaRepo = createMockReglaRepo([]);
    reglaRepo.save.mockRejectedValue(new Error('DB error'));

    const ejecucionRepo = createMockEjecucionRepo();
    const handler = new ProcesarResultadoScrapingHandler(
      reglaRepo,
      ejecucionRepo,
      createMockConfigRepo(),
    );

    const result = await handler.execute({
      resultado: {
        ...baseResultado,
        reglas: [
          {
            tipoObligacion: 'IVA',
            jurisdiccion: 'ARCA',
            regimen: 'GENERAL',
            terminacionCuit: '0',
            diaVencimiento: 22,
            mesSiguiente: true,
            vigenciaDesde: '2026-01-01',
          },
        ],
      },
    });

    expect(result.errores.length).toBeGreaterThan(0);
    const saved = (ejecucionRepo.save as jest.Mock).mock.calls[0][0];
    expect(saved.estado).toBe('FALLIDA');
  });

  it('should handle multiple reglas with mixed results', async () => {
    const activa = ReglaVencimiento.create({
      tipoObligacion: 'IVA' as any,
      jurisdiccion: 'ARCA' as any,
      regimen: 'GENERAL',
      terminacionCuit: '0',
      diaVencimiento: 20,
      mesSiguiente: true,
      vigenciaDesde: new Date('2026-01-01'),
    });

    const reglaRepo = createMockReglaRepo([activa]);
    const handler = new ProcesarResultadoScrapingHandler(
      reglaRepo,
      createMockEjecucionRepo(),
      createMockConfigRepo(),
    );

    const result = await handler.execute({
      resultado: {
        ...baseResultado,
        reglas: [
          // SIN_CAMBIOS — same as active
          {
            tipoObligacion: 'IVA',
            jurisdiccion: 'ARCA',
            regimen: 'GENERAL',
            terminacionCuit: '0',
            diaVencimiento: 20,
            mesSiguiente: true,
            vigenciaDesde: '2026-01-01',
          },
          // NUEVA — different terminacion
          {
            tipoObligacion: 'IVA',
            jurisdiccion: 'ARCA',
            regimen: 'GENERAL',
            terminacionCuit: '1',
            diaVencimiento: 21,
            mesSiguiente: true,
            vigenciaDesde: '2026-01-01',
          },
        ],
      },
    });

    expect(result.sinCambios).toBe(1);
    expect(result.reglasNuevas).toBe(1);
  });

  it('should pass disparador and disparadoPor to EjecucionIngesta', async () => {
    const ejecucionRepo = createMockEjecucionRepo();
    const handler = new ProcesarResultadoScrapingHandler(
      createMockReglaRepo([]),
      ejecucionRepo,
      createMockConfigRepo(),
    );

    await handler.execute({
      resultado: baseResultado,
      disparador: DISPARADOR_INGESTA.MANUAL,
      disparadoPor: 'admin-123',
    });

    const saved = (ejecucionRepo.save as jest.Mock).mock.calls[0][0];
    expect(saved.disparador).toBe('MANUAL');
    expect(saved.disparadoPor).toBe('admin-123');
  });

  it('should detect mesSiguiente change as MODIFICADA', async () => {
    const activa = ReglaVencimiento.create({
      tipoObligacion: 'SICOSS' as any,
      jurisdiccion: 'ARCA' as any,
      regimen: 'GENERAL',
      terminacionCuit: '3',
      diaVencimiento: 15,
      mesSiguiente: false,
      vigenciaDesde: new Date('2026-01-01'),
    });

    const handler = new ProcesarResultadoScrapingHandler(
      createMockReglaRepo([activa]),
      createMockEjecucionRepo(),
      createMockConfigRepo(),
    );

    const result = await handler.execute({
      resultado: {
        ...baseResultado,
        reglas: [
          {
            tipoObligacion: 'SICOSS',
            jurisdiccion: 'ARCA',
            regimen: 'GENERAL',
            terminacionCuit: '3',
            diaVencimiento: 15,
            mesSiguiente: true,
            vigenciaDesde: '2026-04-01',
          },
        ],
      },
    });

    expect(result.reglasModificadas).toBe(1);
    expect(result.diff[0].cambios).toContain('mesSiguiente: false → true');
  });

  it('should return existing result when duplicate ingestaId is provided', async () => {
    const ejecucionRepo = createMockEjecucionRepo();
    const existing = EjecucionIngesta.create({
      fuente: 'ARCA' as any,
      disparador: DISPARADOR_INGESTA.SCHEDULE,
      ingestaId: 'unique-ingesta-1',
    });
    existing.completarExitosa(3, 1);
    ejecucionRepo.findByIngestaId.mockResolvedValue(existing);

    const reglaRepo = createMockReglaRepo([]);
    const handler = new ProcesarResultadoScrapingHandler(
      reglaRepo,
      ejecucionRepo,
      createMockConfigRepo(),
    );

    const result = await handler.execute({
      resultado: {
        ...baseResultado,
        ingestaId: 'unique-ingesta-1',
        reglas: [
          {
            tipoObligacion: 'IVA',
            jurisdiccion: 'ARCA',
            regimen: 'GENERAL',
            terminacionCuit: '0',
            diaVencimiento: 22,
            mesSiguiente: true,
            vigenciaDesde: '2026-01-01',
          },
        ],
      },
    });

    expect(result.duplicado).toBe(true);
    expect(result.ejecucionId).toBe(existing.id);
    expect(result.reglasNuevas).toBe(3);
    expect(result.reglasModificadas).toBe(1);
    // Should NOT have processed any reglas or saved a new ejecucion
    expect(reglaRepo.findActivas).not.toHaveBeenCalled();
    expect(ejecucionRepo.save).not.toHaveBeenCalled();
  });

  it('should process normally when ingestaId is new (not duplicate)', async () => {
    const ejecucionRepo = createMockEjecucionRepo();
    ejecucionRepo.findByIngestaId.mockResolvedValue(null);

    const handler = new ProcesarResultadoScrapingHandler(
      createMockReglaRepo([]),
      ejecucionRepo,
      createMockConfigRepo(),
    );

    const result = await handler.execute({
      resultado: {
        ...baseResultado,
        ingestaId: 'new-ingesta-1',
        reglas: [],
      },
    });

    expect(result.duplicado).toBeUndefined();
    expect(ejecucionRepo.save).toHaveBeenCalledTimes(1);
    const saved = (ejecucionRepo.save as jest.Mock).mock.calls[0][0];
    expect(saved.ingestaId).toBe('new-ingesta-1');
  });

  it('should process normally when no ingestaId is provided', async () => {
    const ejecucionRepo = createMockEjecucionRepo();
    const handler = new ProcesarResultadoScrapingHandler(
      createMockReglaRepo([]),
      ejecucionRepo,
      createMockConfigRepo(),
    );

    const result = await handler.execute({
      resultado: baseResultado,
    });

    expect(result.duplicado).toBeUndefined();
    expect(ejecucionRepo.findByIngestaId).not.toHaveBeenCalled();
    expect(ejecucionRepo.save).toHaveBeenCalledTimes(1);
  });
});
