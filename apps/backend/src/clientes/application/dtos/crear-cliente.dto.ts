import { crearClienteSchema, type CrearClienteInput } from '@numerito/shared';

export const crearClienteDtoSchema = crearClienteSchema;

export class CrearClienteDto implements CrearClienteInput {
  cuit!: string;
  razonSocial!: string;
  condicionIva!: string;
  tipo!: string;
  regimen!: string;
}
