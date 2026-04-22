import { EjecutarIngestaManualHandler } from './ejecutar-ingesta-manual.command';
import { ConfiguracionIngesta } from '../../domain/entities/configuracion-ingesta.entity';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';
import type { ConfiguracionIngestaRepository } from '../../domain/repositories/configuracion-ingesta.repository';
import type { EjecucionIngestaRepository } from '../../domain/repositories/ejecucion-ingesta.repository';
import type {
  CalendarioScraperPort,
  ResultadoScraping,
} from '../../domain/ports/calendario-scraper.port';
import type { FargateTaskLauncherPort } from '../../domain/ports/fargate-task-launcher.port';
import type { ProcesarResultadoScrapingHandler } from './procesar-resultado-scraping.command';

function buildConfig() {
  return ConfiguracionIngesta.create({ fuente: 'ARCA', habilitado: true, cadenciaDias: 7 });
}

function buildConfigRepo(config: ConfiguracionIngesta | null = buildConfig()) {
  return {
    findByFuente: jest.fn().mockResolvedValue(config),
    findById: jest.fn(),
    findAll: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<ConfiguracionIngestaRepository>;
}

function buildEjecucionRepo(): jest.Mocked<EjecucionIngestaRepository> {
  return {
    findById: jest.fn(),
    findByIngestaId: jest.fn().mockResolvedValue(null),
    findByFuente: jest.fn(),
    findEnCursoByFuente: jest.fn().mockResolvedValue(null),
    findAll: jest.fn(),
    save: jest.fn().mockResolvedValue(undefined),
  };
}

function buildProcesarHandler() {
  return {
    execute: jest.fn().mockResolvedValue({
      ejecucionId: 'ej-1',
      reglasNuevas: 3,
      reglasModificadas: 1,
      sinCambios: 0,
      errores: [],
      diff: [],
    }),
  } as unknown as jest.Mocked<ProcesarResultadoScrapingHandler>;
}

function buildScraperPort(): jest.Mocked<CalendarioScraperPort> {
  const resultado: ResultadoScraping = {
    fuente: 'ARCA',
    ejecutadoEn: '2026-04-20T10:00:00Z',
    reglas: [
      {
        tipoObligacion: 'IVA' as any,
        jurisdiccion: 'ARCA' as any,
        regimen: 'GENERAL',
        terminacionCuit: '0',
        diaVencimiento: 22,
        mesSiguiente: true,
        vigenciaDesde: '2026-01-01',
      },
    ],
    errores: [],
  };
  return { scrapear: jest.fn().mockResolvedValue(resultado) };
}

function buildTaskLauncher(): jest.Mocked<FargateTaskLauncherPort> {
  return {
    launch: jest.fn().mockResolvedValue({
      taskArn: 'arn:aws:ecs:us-east-1:123:task/abc-def',
      fuente: 'ARCA',
      launchedAt: '2026-04-20T10:00:00Z',
    }),
    getLogs: jest.fn().mockResolvedValue(''),
  };
}

describe('EjecutarIngestaManualHandler', () => {
  it('should throw RecursoNoEncontradoError if config not found', async () => {
    const handler = new EjecutarIngestaManualHandler(
      buildConfigRepo(null),
      buildEjecucionRepo(),
      buildProcesarHandler(),
      null,
      null,
    );

    await expect(handler.execute({ fuente: 'ARCA', disparadoPor: 'admin' })).rejects.toThrow(
      RecursoNoEncontradoError,
    );
  });

  it('should run synchronously when scraperPort is available', async () => {
    const scraper = buildScraperPort();
    const procesar = buildProcesarHandler();
    const handler = new EjecutarIngestaManualHandler(
      buildConfigRepo(),
      buildEjecucionRepo(),
      procesar,
      scraper,
      null,
    );

    const result = await handler.execute({ fuente: 'ARCA', disparadoPor: 'admin' });

    expect(result.mode).toBe('sync');
    expect(result.fuente).toBe('ARCA');
    expect(result.ejecucionId).toBe('ej-1');
    expect(result.reglasNuevas).toBe(3);
    expect(scraper.scrapear).toHaveBeenCalledWith('ARCA');
    expect(procesar.execute).toHaveBeenCalledTimes(1);
  });

  it('should prefer scraperPort over taskLauncher when both available', async () => {
    const scraper = buildScraperPort();
    const launcher = buildTaskLauncher();
    const handler = new EjecutarIngestaManualHandler(
      buildConfigRepo(),
      buildEjecucionRepo(),
      buildProcesarHandler(),
      scraper,
      launcher,
    );

    const result = await handler.execute({ fuente: 'ARCA', disparadoPor: 'admin' });

    expect(result.mode).toBe('sync');
    expect(scraper.scrapear).toHaveBeenCalled();
    expect(launcher.launch).not.toHaveBeenCalled();
  });

  it('should launch Fargate task when scraperPort is null but launcher available', async () => {
    const launcher = buildTaskLauncher();
    const handler = new EjecutarIngestaManualHandler(
      buildConfigRepo(),
      buildEjecucionRepo(),
      buildProcesarHandler(),
      null,
      launcher,
    );

    const result = await handler.execute({ fuente: 'ARCA', disparadoPor: 'admin' });

    expect(result.mode).toBe('async');
    expect(result.fuente).toBe('ARCA');
    expect(result.taskArn).toBe('arn:aws:ecs:us-east-1:123:task/abc-def');
    expect(launcher.launch).toHaveBeenCalledWith(
      'ARCA',
      expect.objectContaining({ disparadoPor: 'admin' }),
    );
  });

  it('should throw when neither scraperPort nor launcher is available', async () => {
    const handler = new EjecutarIngestaManualHandler(
      buildConfigRepo(),
      buildEjecucionRepo(),
      buildProcesarHandler(),
      null,
      null,
    );

    await expect(handler.execute({ fuente: 'ARCA', disparadoPor: 'admin' })).rejects.toThrow(
      /scraper ni task launcher/,
    );
  });

  it('should pass disparador=MANUAL to procesar handler in sync mode', async () => {
    const procesar = buildProcesarHandler();
    const handler = new EjecutarIngestaManualHandler(
      buildConfigRepo(),
      buildEjecucionRepo(),
      procesar,
      buildScraperPort(),
      null,
    );

    await handler.execute({ fuente: 'ARCA', disparadoPor: 'user-123' });

    const call = procesar.execute.mock.calls[0][0];
    expect(call.disparador).toBe('MANUAL');
    expect(call.disparadoPor).toBe('user-123');
  });

  it('should adopt an EN_CURSO ejecucion instead of launching a duplicate', async () => {
    const launcher = buildTaskLauncher();
    const ejecucionRepo = buildEjecucionRepo();
    const existing = {
      id: 'existing-ej-id',
    } as any;
    ejecucionRepo.findEnCursoByFuente.mockResolvedValue(existing);

    const handler = new EjecutarIngestaManualHandler(
      buildConfigRepo(),
      ejecucionRepo,
      buildProcesarHandler(),
      null,
      launcher,
    );

    const result = await handler.execute({ fuente: 'ARCA', disparadoPor: 'admin' });

    expect(result.mode).toBe('async');
    expect(result.ejecucionId).toBe('existing-ej-id');
    expect(result.alreadyRunning).toBe(true);
    expect(launcher.launch).not.toHaveBeenCalled();
  });
});
