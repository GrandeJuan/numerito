import { crearVencimientoSchema, type CrearVencimientoInput } from '@numerito/shared';

export const crearVencimientoDtoSchema = crearVencimientoSchema;

export class CrearVencimientoDto implements CrearVencimientoInput {
  clienteId!: string;
  tipoObligacion!: string;
  periodo!: string;
  fechaVencimiento!: string;
  descripcion!: string;
}
