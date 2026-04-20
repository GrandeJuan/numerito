import type { ReglaVencimientoEntityRepository } from '../../../obligaciones/domain/repositories/regla-vencimiento.repository';
import type { EjecucionIngestaRepository } from '../../domain/repositories/ejecucion-ingesta.repository';
import type { ConfiguracionIngestaRepository } from '../../domain/repositories/configuracion-ingesta.repository';
import { EjecucionIngesta, DISPARADOR_INGESTA } from '../../domain/entities/ejecucion-ingesta.entity';
import { ReglaVencimiento, ESTADO_REGLA, ORIGEN_REGLA } from '../../../obligaciones/domain/entities/regla-vencimiento.entity';
import type { ResultadoScrapingDto, ReglaPropuestaScrapeadaDto } from '../dtos/resultado-scraping.dto';
import type { TipoObligacion, Jurisdiccion } from '@numerito/shared';
import type { DisparadorIngesta } from '../../domain/entities/ejecucion-ingesta.entity';

export interface ProcesarResultadoScrapingCommand {
  resultado: ResultadoScrapingDto;
  disparador?: DisparadorIngesta;
  disparadoPor?: string | null;
}

export interface DiffRegla {
  tipo: 'NUEVA' | 'MODIFICADA' | 'SIN_CAMBIOS';
  propuesta: ReglaPropuestaScrapeadaDto;
  reglaActivaId?: string;
  cambios?: string[];
}

export interface ProcesarResultadoScrapingResult {
  ejecucionId: string;
  reglasNuevas: number;
  reglasModificadas: number;
  sinCambios: number;
  errores: string[];
  diff: DiffRegla[];
  duplicado?: boolean;
}

export class ProcesarResultadoScrapingHandler {
  constructor(
    private readonly reglaRepo: ReglaVencimientoEntityRepository,
    private readonly ejecucionRepo: EjecucionIngestaRepository,
    private readonly configRepo: ConfiguracionIngestaRepository,
  ) {}

  async execute(command: ProcesarResultadoScrapingCommand): Promise<ProcesarResultadoScrapingResult> {
    const { resultado, disparador, disparadoPor } = command;

    // Idempotency: if ingestaId was provided and already processed, return existing result
    if (resultado.ingestaId) {
      const existing = await this.ejecucionRepo.findByIngestaId(resultado.ingestaId);
      if (existing) {
        return {
          ejecucionId: existing.id,
          reglasNuevas: existing.reglasNuevas,
          reglasModificadas: existing.reglasModificadas,
          sinCambios: 0,
          errores: existing.errores,
          diff: [],
          duplicado: true,
        };
      }
    }

    const ejecucion = EjecucionIngesta.create({
      fuente: resultado.fuente,
      disparador: disparador ?? DISPARADOR_INGESTA.SCHEDULE,
      disparadoPor: disparadoPor ?? null,
      ingestaId: resultado.ingestaId ?? null,
    });

    const reglasActivas = await this.reglaRepo.findActivas();
    const diff: DiffRegla[] = [];
    let nuevas = 0;
    let modificadas = 0;
    let sinCambios = 0;
    const errores: string[] = [...resultado.errores];

    for (const reglaDto of resultado.reglas) {
      try {
        const diffItem = this.clasificarRegla(reglaDto, reglasActivas);
        diff.push(diffItem);

        if (diffItem.tipo === 'NUEVA') {
          const propuesta = ReglaVencimiento.create({
            tipoObligacion: reglaDto.tipoObligacion as TipoObligacion,
            jurisdiccion: reglaDto.jurisdiccion as Jurisdiccion,
            regimen: reglaDto.regimen,
            terminacionCuit: reglaDto.terminacionCuit,
            diaVencimiento: reglaDto.diaVencimiento,
            mesSiguiente: reglaDto.mesSiguiente,
            vigenciaDesde: new Date(reglaDto.vigenciaDesde),
            vigenciaHasta: reglaDto.vigenciaHasta ? new Date(reglaDto.vigenciaHasta) : null,
            origen: ORIGEN_REGLA.SCRAPING_OFICIAL,
            estado: ESTADO_REGLA.PROPUESTA,
          });
          await this.reglaRepo.save(propuesta);
          nuevas++;
        } else if (diffItem.tipo === 'MODIFICADA') {
          const propuesta = ReglaVencimiento.create({
            tipoObligacion: reglaDto.tipoObligacion as TipoObligacion,
            jurisdiccion: reglaDto.jurisdiccion as Jurisdiccion,
            regimen: reglaDto.regimen,
            terminacionCuit: reglaDto.terminacionCuit,
            diaVencimiento: reglaDto.diaVencimiento,
            mesSiguiente: reglaDto.mesSiguiente,
            vigenciaDesde: new Date(reglaDto.vigenciaDesde),
            vigenciaHasta: reglaDto.vigenciaHasta ? new Date(reglaDto.vigenciaHasta) : null,
            origen: ORIGEN_REGLA.SCRAPING_OFICIAL,
            estado: ESTADO_REGLA.PROPUESTA,
          });
          await this.reglaRepo.save(propuesta);
          modificadas++;
        } else {
          sinCambios++;
        }
      } catch (err) {
        const errorMsg = `Error procesando regla ${reglaDto.tipoObligacion}/${reglaDto.terminacionCuit}: ${(err as Error).message}`;
        errores.push(errorMsg);
        ejecucion.agregarError(errorMsg);
      }
    }

    if (errores.length > 0 && nuevas === 0 && modificadas === 0 && sinCambios === 0) {
      ejecucion.completarFallida(errores);
    } else {
      ejecucion.completarExitosa(nuevas, modificadas);
    }

    await this.ejecucionRepo.save(ejecucion);

    // Update ConfiguracionIngesta with execution record
    const config = await this.configRepo.findByFuente(resultado.fuente);
    if (config) {
      const resumenMsg = `OK: ${nuevas} nuevas, ${modificadas} modificadas, ${sinCambios} sin cambios`;
      config.registrarEjecucion(errores.length > 0 ? `${resumenMsg} (${errores.length} errores)` : resumenMsg);
      await this.configRepo.save(config);
    }

    return {
      ejecucionId: ejecucion.id,
      reglasNuevas: nuevas,
      reglasModificadas: modificadas,
      sinCambios,
      errores,
      diff,
    };
  }

  private clasificarRegla(
    dto: ReglaPropuestaScrapeadaDto,
    reglasActivas: ReglaVencimiento[],
  ): DiffRegla {
    const match = reglasActivas.find(
      (r) =>
        r.tipoObligacion === dto.tipoObligacion &&
        r.jurisdiccion === dto.jurisdiccion &&
        r.regimen === dto.regimen &&
        r.terminacionCuit === dto.terminacionCuit,
    );

    if (!match) {
      return { tipo: 'NUEVA', propuesta: dto };
    }

    const cambios: string[] = [];
    if (match.diaVencimiento !== dto.diaVencimiento) {
      cambios.push(`diaVencimiento: ${match.diaVencimiento} → ${dto.diaVencimiento}`);
    }
    if (match.mesSiguiente !== dto.mesSiguiente) {
      cambios.push(`mesSiguiente: ${match.mesSiguiente} → ${dto.mesSiguiente}`);
    }

    if (cambios.length === 0) {
      return { tipo: 'SIN_CAMBIOS', propuesta: dto, reglaActivaId: match.id };
    }

    return {
      tipo: 'MODIFICADA',
      propuesta: dto,
      reglaActivaId: match.id,
      cambios,
    };
  }
}
