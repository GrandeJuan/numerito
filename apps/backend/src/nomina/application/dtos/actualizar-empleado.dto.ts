import { actualizarEmpleadoSchema, type ActualizarEmpleadoInput } from '@numerito/shared';

export const actualizarEmpleadoDtoSchema = actualizarEmpleadoSchema;

export class ActualizarEmpleadoDto implements ActualizarEmpleadoInput {
  nombre?: string;
  apellido?: string;
  categoriaConvenio?: string;
}
