import type { ConfiguracionIngestaRepository } from '../../domain/repositories/configuracion-ingesta.repository';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';
import { DISPARADOR_INGESTA } from '../../domain/entities/ejecucion-ingesta.entity';
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
  /** Present when mode=async (Fargate task launched) */
  taskArn?: string;
  /** Present when mode=sync (scraper ran in-process) */
  ejecucionId?: string;
  reglasNuevas?: number;
  reglasModificadas?: number;
}

export class EjecutarIngestaManualHandler {
  constructor(
    private readonly configRepo: ConfiguracionIngestaRepository,
    private readonly procesarHandler: ProcesarResultadoScrapingHandler,
    private readonly scraperPort: CalendarioScraperPort | null,
    private readonly taskLauncher: FargateTaskLauncherPort | null = null,
  ) {}

  async execute(command: EjecutarIngestaManualCommand): Promise<EjecutarIngestaManualResult> {
    const config = await this.configRepo.findByFuente(command.fuente);
    if (!config) throw new RecursoNoEncontradoError('ConfiguracionIngesta');

    // Mode 1: in-process scraper available (test/local) — run synchronously
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

    // Mode 2: Fargate task launcher available — launch async
    if (this.taskLauncher) {
      const launched = await this.taskLauncher.launch(
        config.fuente as FuenteIngesta,
        command.disparadoPor,
      );

      return {
        mode: 'async',
        fuente: config.fuente,
        taskArn: launched.taskArn,
      };
    }

    // Mode 3: neither available — return instructions
    return {
      mode: 'async',
      fuente: config.fuente,
    };
  }
}
