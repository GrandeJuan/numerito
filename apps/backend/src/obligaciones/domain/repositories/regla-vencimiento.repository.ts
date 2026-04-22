import type { TipoObligacion, Jurisdiccion, EstadoRegla } from '@numerito/shared';
import type { ReglaVencimiento } from '../entities/regla-vencimiento.entity';

/**
 * @deprecated Use ReglaVencimientoData only for backward compatibility.
 * New code should use the ReglaVencimiento domain entity via ReglaVencimientoEntityRepository.
 */
export interface ReglaVencimientoData {
  tipoObligacion: TipoObligacion;
  terminacionCuit: string;
  diaVencimiento: number;
  mesSiguiente: boolean; // true = vence el mes siguiente al periodo
}

/**
 * @deprecated Legacy repository interface. Use ReglaVencimientoEntityRepository instead.
 */
export interface ReglaVencimientoRepository {
  findByTipoYTerminacion(
    tipo: TipoObligacion,
    terminacion: string,
  ): Promise<ReglaVencimientoData | null>;
  findByTipo(tipo: TipoObligacion): Promise<ReglaVencimientoData[]>;
  findAll(): Promise<ReglaVencimientoData[]>;
  save(regla: ReglaVencimientoData): Promise<void>;
  saveMany(reglas: ReglaVencimientoData[]): Promise<void>;
}

export const REGLA_VENCIMIENTO_REPOSITORY = Symbol('ReglaVencimientoRepository');

/** New domain-entity-based repository for extended regla vencimiento */
export interface ReglaVencimientoEntityRepository {
  findById(id: string): Promise<ReglaVencimiento | null>;
  findAll(): Promise<ReglaVencimiento[]>;
  findActivas(): Promise<ReglaVencimiento[]>;
  findActivasAsSummary(): Promise<ReglaActivaSummary[]>;
  findByEstado(estado: EstadoRegla): Promise<ReglaVencimiento[]>;
  findVigentes(
    tipoObligacion: TipoObligacion,
    jurisdiccion: Jurisdiccion,
    regimen: string,
    terminacion: string,
    fecha: Date,
  ): Promise<ReglaVencimiento[]>;
  save(regla: ReglaVencimiento): Promise<void>;
  /**
   * Create + persist a PROPUESTA rule from primitive data produced by an
   * external source (scraping, imports). Avoids the caller needing the
   * ReglaVencimiento class and keeps factory logic inside obligaciones.
   */
  createPropuestaFromScrape(data: ReglaPropuestaScrapeData): Promise<void>;
  delete(regla: ReglaVencimiento): Promise<void>;
}

/** Primitive projection of an active rule, safe to consume cross-context. */
export interface ReglaActivaSummary {
  id: string;
  tipoObligacion: TipoObligacion;
  jurisdiccion: Jurisdiccion;
  regimen: string;
  terminacionCuit: string;
  diaVencimiento: number;
  mesSiguiente: boolean;
}

export interface ReglaPropuestaScrapeData {
  tipoObligacion: TipoObligacion;
  jurisdiccion: Jurisdiccion;
  regimen: string;
  terminacionCuit: string;
  diaVencimiento: number;
  mesSiguiente: boolean;
  vigenciaDesde: Date;
  vigenciaHasta: Date | null;
}

export const REGLA_VENCIMIENTO_ENTITY_REPOSITORY = Symbol('ReglaVencimientoEntityRepository');
