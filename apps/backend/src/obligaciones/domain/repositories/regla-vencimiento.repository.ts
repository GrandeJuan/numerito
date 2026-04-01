import type { TipoObligacion } from '@numerito/shared';

export interface ReglaVencimientoData {
  tipoObligacion: TipoObligacion;
  terminacionCuit: string;
  diaVencimiento: number;
  mesSiguiente: boolean; // true = vence el mes siguiente al periodo
}

export interface ReglaVencimientoRepository {
  findByTipoYTerminacion(tipo: TipoObligacion, terminacion: string): Promise<ReglaVencimientoData | null>;
  findByTipo(tipo: TipoObligacion): Promise<ReglaVencimientoData[]>;
  findAll(): Promise<ReglaVencimientoData[]>;
  save(regla: ReglaVencimientoData): Promise<void>;
  saveMany(reglas: ReglaVencimientoData[]): Promise<void>;
}

export const REGLA_VENCIMIENTO_REPOSITORY = Symbol('ReglaVencimientoRepository');
