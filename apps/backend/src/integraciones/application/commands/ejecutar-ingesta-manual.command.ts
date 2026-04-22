import type { ConfiguracionIngestaRepository } from '../../domain/repositories/configuracion-ingesta.repository';
import type { EjecucionIngestaRepository } from '../../domain/repositories/ejecucion-ingesta.repository';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';
import {
  DISPARADOR_INGESTA,
  EjecucionIngesta,
} from '../../domain/entities/ejecucion-ingesta.entity';
import type { FuenteIngesta } from '../../domain/entities/configuracion-ingesta.entity';
import type { CalendarioScraperPort } from '../../domain/ports/calendario-scraper.port';
import type { FargateTaskLauncherPort } from '../../domain/ports/fargate-task-launcher.port';
import type { ProcesarResultadoScrapingHandler } from './procesar-resultado-scraping.command';

export interface EjecutarIngestaManualCommand {
  fuente: string;
  disparadoPor: string;
}

export interface EjecutarIngestaManualResult {
  mode: 'sync' | 'async';
  fuente: string;
  /** Always present — correlation id of the ejecucion_ingesta record. */
  ejecucionId: string;
  /** Present when mode=async and the launcher returns an external id (Fargate arn / docker container id). */
  taskArn?: string;
  /** True when a previous EN_CURSO run was adopted instead of launching a new one. */
  alreadyRunning?: boolean;
  /** Present when mode=sync — results are immediately available. */
  reglasNuevas?: number;
  reglasModificadas?: number;
}

/**
 * Drives manual ingesta execution via one of three modes:
 *   sync   — in-process scraper (local test runs)
 *   async  — external runner (Fargate or Docker daemon) spawns scraper container
 *
 * In async mode an `EjecucionIngesta` record is created in EN_CURSO state
 * *before* launching so the frontend can poll it for progress. The scraper
 * container receives the ejecucionId via env and the webhook updates the
 * same record on completion (instead of creating a duplicate).
 */
export class EjecutarIngestaManualHandler {
  constructor(
    private readonly configRepo: ConfiguracionIngestaRepository,
    private readonly ejecucionRepo: EjecucionIngestaRepository,
    private readonly procesarHandler: ProcesarResultadoScrapingHandler,
    private readonly scraperPort: CalendarioScraperPort | null,
    private readonly taskLauncher: FargateTaskLauncherPort | null = null,
  ) {}

  async execute(command: EjecutarIngestaManualCommand): Promise<EjecutarIngestaManualResult> {
    const config = await this.configRepo.findByFuente(command.fuente);
    if (!config) throw new RecursoNoEncontradoError('ConfiguracionIngesta');

    if (this.scraperPort) {
      const resultado = await this.scraperPort.scrapear(config.fuente);
      const procesado = await this.procesarHandler.execute({
        resultado: {
          fuente: resultado.fuente,
          ejecutadoEn: resultado.ejecutadoEn,
          reglas: resultado.reglas.map((r) => ({
            ...r,
            vigenciaHasta: r.vigenciaHasta ?? null,
          })),
          feriados: resultado.feriados ?? [],
          errores: resultado.errores,
        },
        disparador: DISPARADOR_INGESTA.MANUAL,
        disparadoPor: command.disparadoPor,
      });

      return {
        mode: 'sync',
        fuente: config.fuente,
        ejecucionId: procesado.ejecucionId,
        reglasNuevas: procesado.reglasNuevas,
        reglasModificadas: procesado.reglasModificadas,
      };
    }

    if (!this.taskLauncher) {
      throw new Error(
        'No hay scraper ni task launcher configurado en este entorno. ' +
          'En dev seteá SCRAPER_IMAGE + INGESTA_SECRET; en prod, ECS_CLUSTER_ARN.',
      );
    }

    // Single-flight per fuente: if an EN_CURSO already exists, adopt it
    // instead of launching a second container. Frontend sees the same
    // ejecucionId and keeps polling it.
    const existing = await this.ejecucionRepo.findEnCursoByFuente(config.fuente as FuenteIngesta);
    if (existing) {
      return {
        mode: 'async',
        fuente: config.fuente,
        ejecucionId: existing.id,
        alreadyRunning: true,
      };
    }

    const ejecucion = EjecucionIngesta.create({
      fuente: config.fuente as FuenteIngesta,
      disparador: DISPARADOR_INGESTA.MANUAL,
      disparadoPor: command.disparadoPor,
    });
    await this.ejecucionRepo.save(ejecucion);

    try {
      const launched = await this.taskLauncher.launch(config.fuente as FuenteIngesta, {
        ejecucionId: ejecucion.id,
        disparadoPor: command.disparadoPor,
      });
      ejecucion.asignarLauncherTaskId(launched.taskArn);
      await this.ejecucionRepo.save(ejecucion);
      return {
        mode: 'async',
        fuente: config.fuente,
        ejecucionId: ejecucion.id,
        taskArn: launched.taskArn,
      };
    } catch (err) {
      ejecucion.completarFallida([`Fallo al lanzar scraper: ${(err as Error).message}`]);
      await this.ejecucionRepo.save(ejecucion);
      throw err;
    }
  }
}
