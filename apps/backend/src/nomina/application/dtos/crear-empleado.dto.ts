import { crearEmpleadoSchema, type CrearEmpleadoInput } from '@numerito/shared';

export const crearEmpleadoDtoSchema = crearEmpleadoSchema;

export class CrearEmpleadoDto implements CrearEmpleadoInput {
  clienteId!: string;
  nombre!: string;
  apellido!: string;
  cuil!: string;
  fechaIngreso!: string;
  sueldoBasico!: number;
  categoriaConvenio!: string;
}
