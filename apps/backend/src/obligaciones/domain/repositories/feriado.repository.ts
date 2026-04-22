import type { TipoFeriado, Jurisdiccion } from '@numerito/shared';
import type { DiaFeriado } from '../entities/dia-feriado.entity';

export interface FeriadoRepository {
  findById(id: string): Promise<DiaFeriado | null>;
  findAll(): Promise<DiaFeriado[]>;
  findByFecha(fecha: Date): Promise<DiaFeriado[]>;
  findByFechaAsSummary(fecha: Date): Promise<FeriadoSummary[]>;
  findByRango(desde: Date, hasta: Date): Promise<DiaFeriado[]>;
  save(entity: DiaFeriado): Promise<void>;
  /**
   * Create + persist a feriado from primitive data produced by an external
   * source (BCRA scraping). Caller does not need the DiaFeriado class.
   */
  createFromScrape(data: FeriadoScrapeData): Promise<void>;
  delete(entity: DiaFeriado): Promise<void>;
}

/** Primitive projection of a feriado, safe to consume cross-context. */
export interface FeriadoSummary {
  tipo: TipoFeriado;
  jurisdiccionAfectada: Jurisdiccion | null;
}

export interface FeriadoScrapeData {
  fecha: Date;
  tipo: TipoFeriado;
  descripcion: string;
  jurisdiccionAfectada: Jurisdiccion | null;
}

export const FERIADO_REPOSITORY = Symbol('FeriadoRepository');
