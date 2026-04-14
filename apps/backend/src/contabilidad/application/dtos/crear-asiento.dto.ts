import {
  crearAsientoSchema,
  lineaAsientoSchema,
  type CrearAsientoInput,
  type LineaAsientoInput,
} from '@numerito/shared';

export const lineaAsientoDtoSchema = lineaAsientoSchema;
export const crearAsientoDtoSchema = crearAsientoSchema;

export class LineaAsientoDto implements LineaAsientoInput {
  cuentaId!: string;
  debe!: number;
  haber!: number;
  descripcion!: string;
}

export class CrearAsientoDto implements CrearAsientoInput {
  libroId!: string;
  clienteId!: string;
  fecha!: string;
  descripcion!: string;
  lineas!: LineaAsientoDto[];
}
