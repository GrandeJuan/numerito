import { crearTareaSchema, type CrearTareaInput, type Prioridad } from '@numerito/shared';

export const crearTareaDtoSchema = crearTareaSchema;

export class CrearTareaDto implements CrearTareaInput {
  titulo!: string;
  descripcion?: string;
  clienteId?: string;
  prioridad!: Prioridad;
}
