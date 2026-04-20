import type { DiaFeriado } from '../entities/dia-feriado.entity';

export interface FeriadoRepository {
  findById(id: string): Promise<DiaFeriado | null>;
  findAll(): Promise<DiaFeriado[]>;
  findByFecha(fecha: Date): Promise<DiaFeriado[]>;
  findByRango(desde: Date, hasta: Date): Promise<DiaFeriado[]>;
  save(entity: DiaFeriado): Promise<void>;
  delete(entity: DiaFeriado): Promise<void>;
}

export const FERIADO_REPOSITORY = Symbol('FeriadoRepository');
