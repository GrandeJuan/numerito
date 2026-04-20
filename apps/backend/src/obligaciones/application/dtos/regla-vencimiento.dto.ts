import {
  crearReglaVencimientoSchema,
  actualizarReglaVencimientoSchema,
} from '@numerito/shared';

export const crearReglaDtoSchema = crearReglaVencimientoSchema;
export type CrearReglaDto = {
  tipoObligacion: string;
  jurisdiccion: string;
  regimen: string;
  terminacionCuit: string;
  diaVencimiento: number;
  mesSiguiente: boolean;
  vigenciaDesde: string;
  vigenciaHasta?: string | null;
  origen?: string;
  estado?: string;
};

export const actualizarReglaDtoSchema = actualizarReglaVencimientoSchema;
export type ActualizarReglaDto = {
  diaVencimiento?: number;
  mesSiguiente?: boolean;
  vigenciaHasta?: string | null;
  estado?: string;
};
