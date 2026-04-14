import {
  crearFacturaSchema,
  lineaFacturaSchema,
  type CrearFacturaInput,
  type LineaFacturaInput,
} from '@numerito/shared';

export const crearFacturaDtoSchema = crearFacturaSchema;
export const lineaFacturaDtoSchema = lineaFacturaSchema;

export class LineaFacturaDto implements LineaFacturaInput {
  descripcion!: string;
  cantidad!: number;
  precioUnitario!: number;
  alicuotaIva!: number;
}

export class CrearFacturaDto implements CrearFacturaInput {
  clienteId!: string;
  numero!: string;
  fechaEmision!: string;
  fechaVencimiento!: string;
  concepto!: string;
  lineas!: LineaFacturaDto[];
}
