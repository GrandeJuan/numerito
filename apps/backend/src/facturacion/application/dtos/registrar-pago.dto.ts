import { registrarPagoSchema, type RegistrarPagoInput } from '@numerito/shared';

export const registrarPagoDtoSchema = registrarPagoSchema;

export class RegistrarPagoDto implements RegistrarPagoInput {
  monto!: number;
  medioPagoId!: number;
  referencia?: string;
}
