import {
  crearCatalogoObligacionSchema,
  actualizarCatalogoObligacionSchema,
} from '@numerito/shared';

export const crearCatalogoDtoSchema = crearCatalogoObligacionSchema;
export type CrearCatalogoDto = {
  nombre: string;
  jurisdiccion: string;
  tipoObligacion: string;
  frecuencia: string;
  activo?: boolean;
};

export const actualizarCatalogoDtoSchema = actualizarCatalogoObligacionSchema;
export type ActualizarCatalogoDto = {
  nombre?: string;
  activo?: boolean;
};
