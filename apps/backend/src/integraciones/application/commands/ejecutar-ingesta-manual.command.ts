import type { ConfiguracionIngestaRepository } from '../../domain/repositories/configuracion-ingesta.repository';
import { RecursoNoEncontradoError, OperacionInvalidaError } from '../../../shared/domain/exceptions';
import { DISPARADOR_INGESTA } from '../../domain/entities/ejecucion-ingesta.entity';
import type { CalendarioScraperPort } from '../../domain/ports/calendario-scraper.port';
import type { ProcesarResultadoScrapingHandler } from './procesar-resultado-scraping.command';

export interface EjecutarIngestaManualCommand {
  fuente: string;
  disparadoPor: string;
}

export class EjecutarIngestaManualHandler {
  constructor(
    private readonly configRepo: ConfiguracionIngestaRepository,
    private readonly procesarHandler: ProcesarResultadoScrapingHandler,
    private readonly scraperPort: CalendarioScraperPort | null,
  ) {}

  async execute(command: EjecutarIngestaManualCommand) {
    const config = await this.configRepo.findByFuente(command.fuente);
    if (!config) throw new RecursoNoEncontradoError('ConfiguracionIngesta');

    // If no scraper port available, the Fargate task will push results asynchronously.
    // This handler just validates the config exists and returns a placeholder.
    if (!this.scraperPort) {
      throw new OperacionInvalidaError(
        'Scraper no disponible en este entorno. Use el endpoint POST /resultado para enviar resultados desde Fargate.',
      );
    }

    const resultado = await this.scraperPort.scrapear(config.fuente);

    return this.procesarHandler.execute({
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
  }
}
