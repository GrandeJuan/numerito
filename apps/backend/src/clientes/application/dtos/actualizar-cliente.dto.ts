import { actualizarClienteSchema, type ActualizarClienteInput } from '@numerito/shared';

export const actualizarClienteDtoSchema = actualizarClienteSchema;

export class ActualizarClienteDto implements ActualizarClienteInput {
  razonSocial?: string;
  condicionIva?: string;
  regimen?: string;
}
