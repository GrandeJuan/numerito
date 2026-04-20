import type { ReglaVencimientoEntityRepository } from '../../../obligaciones/domain/repositories/regla-vencimiento.repository';
import type { EjecucionIngestaRepository } from '../../domain/repositories/ejecucion-ingesta.repository';
import type { ConfiguracionIngestaRepository } from '../../domain/repositories/configuracion-ingesta.repository';
import type { FeriadoRepository } from '../../../obligaciones/domain/repositories/feriado.repository';
import { EjecucionIngesta, DISPARADOR_INGESTA } from '../../domain/entities/ejecucion-ingesta.entity';
import { ReglaVencimiento, ESTADO_REGLA, ORIGEN_REGLA } from '../../../obligaciones/domain/entities/regla-vencimiento.entity';
import { DiaFeriado } from '../../../obligaciones/domain/entities/dia-feriado.entity';
import type { ResultadoScrapingDto, ReglaPropuestaScrapeadaDto, FeriadoPropuestoDto } from '../dtos/resultado-scraping.dto';
import type { TipoObligacion, Jurisdiccion, TipoFeriado } from '@numerito/shared';
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

export interface DiffFeriado {
  tipo: 'NUEVO' | 'EXISTENTE';
  feriado: FeriadoPropuestoDto;
}

export interface ProcesarResultadoScrapingResult {
  ejecucionId: string;
  reglasNuevas: number;
  reglasModificadas: number;
  sinCambios: number;
  feriadosNuevos: number;
  feriadosExistentes: number;
  errores: string[];
  diff: DiffRegla[];
  diffFeriados: DiffFeriado[];
  duplicado?: boolean;
}

export class ProcesarResultadoScrapingHandler {
  constructor(
    private readonly reglaRepo: ReglaVencimientoEntityRepository,
    private readonly ejecucionRepo: EjecucionIngestaRepository,
    private readonly configRepo: ConfiguracionIngestaRepository,
    private readonly feriadoRepo: FeriadoRepository | null = null,
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
          feriadosNuevos: 0,
          feriadosExistentes: 0,
          errores: existing.errores,
          diff: [],
          diffFeriados: [],
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

    const errores: string[] = [...resultado.errores];

    // Process reglas (ARCA, ARBA, AGIP)
    const { diff, nuevas, modificadas, sinCambios } = await this.procesarReglas(
      resultado.reglas,
      ejecucion,
      errores,
    );

    // Process feriados (BCRA_FERIADOS)
    const { diffFeriados, feriadosNuevos, feriadosExistentes } = await this.procesarFeriados(
      resultado.feriados ?? [],
      ejecucion,
      errores,
    );

    const totalNuevas = nuevas + feriadosNuevos;
    const totalModificadas = modificadas;

    if (errores.length > 0 && totalNuevas === 0 && totalModificadas === 0 && sinCambios === 0 && feriadosExistentes === 0) {
      ejecucion.completarFallida(errores);
    } else {
      ejecucion.completarExitosa(totalNuevas, totalModificadas);
    }

    await this.ejecucionRepo.save(ejecucion);

    // Update ConfiguracionIngesta with execution record
    const config = await this.configRepo.findByFuente(resultado.fuente);
    if (config) {
      const parts: string[] = [];
      if (nuevas > 0 || modificadas > 0 || sinCambios > 0) {
        parts.push(`reglas: ${nuevas} nuevas, ${modificadas} modificadas, ${sinCambios} sin cambios`);
      }
      if (feriadosNuevos > 0 || feriadosExistentes > 0) {
        parts.push(`feriados: ${feriadosNuevos} nuevos, ${feriadosExistentes} existentes`);
      }
      const resumenMsg = parts.length > 0 ? `OK: ${parts.join('; ')}` : 'OK: sin datos';
      config.registrarEjecucion(errores.length > 0 ? `${resumenMsg} (${errores.length} errores)` : resumenMsg);
      await this.configRepo.save(config);
    }

    return {
      ejecucionId: ejecucion.id,
      reglasNuevas: nuevas,
      reglasModificadas: modificadas,
      sinCambios,
      feriadosNuevos,
      feriadosExistentes,
      errores,
      diff,
      diffFeriados,
    };
  }

  private async procesarReglas(
    reglas: ReglaPropuestaScrapeadaDto[],
    ejecucion: EjecucionIngesta,
    errores: string[],
  ): Promise<{ diff: DiffRegla[]; nuevas: number; modificadas: number; sinCambios: number }> {
    if (reglas.length === 0) {
      return { diff: [], nuevas: 0, modificadas: 0, sinCambios: 0 };
    }

    const reglasActivas = await this.reglaRepo.findActivas();
    const diff: DiffRegla[] = [];
    let nuevas = 0;
    let modificadas = 0;
    let sinCambios = 0;

    for (const reglaDto of reglas) {
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

    return { diff, nuevas, modificadas, sinCambios };
  }

  private async procesarFeriados(
    feriados: FeriadoPropuestoDto[],
    ejecucion: EjecucionIngesta,
    errores: string[],
  ): Promise<{ diffFeriados: DiffFeriado[]; feriadosNuevos: number; feriadosExistentes: number }> {
    if (feriados.length === 0 || !this.feriadoRepo) {
      return { diffFeriados: [], feriadosNuevos: 0, feriadosExistentes: 0 };
    }

    const diffFeriados: DiffFeriado[] = [];
    let feriadosNuevos = 0;
    let feriadosExistentes = 0;

    for (const feriadoDto of feriados) {
      try {
        // Check if feriado already exists for this date
        const fecha = new Date(feriadoDto.fecha);
        const existentes = await this.feriadoRepo.findByFecha(fecha);
        const yaExiste = existentes.some(
          (f) => f.tipo === feriadoDto.tipo && f.jurisdiccionAfectada === (feriadoDto.jurisdiccionAfectada ?? null),
        );

        if (yaExiste) {
          diffFeriados.push({ tipo: 'EXISTENTE', feriado: feriadoDto });
          feriadosExistentes++;
        } else {
          const nuevaEntidad = DiaFeriado.create({
            fecha,
            tipo: feriadoDto.tipo as TipoFeriado,
            descripcion: feriadoDto.descripcion,
            jurisdiccionAfectada: feriadoDto.jurisdiccionAfectada ?? null,
          });
          await this.feriadoRepo.save(nuevaEntidad);
          diffFeriados.push({ tipo: 'NUEVO', feriado: feriadoDto });
          feriadosNuevos++;
        }
      } catch (err) {
        const errorMsg = `Error procesando feriado ${feriadoDto.fecha} (${feriadoDto.descripcion}): ${(err as Error).message}`;
        errores.push(errorMsg);
        ejecucion.agregarError(errorMsg);
      }
    }

    return { diffFeriados, feriadosNuevos, feriadosExistentes };
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
