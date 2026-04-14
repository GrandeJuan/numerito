import { renovarSubscripcionSchema, type RenovarSubscripcionInput } from '@numerito/shared';

export const renovarSubscripcionDtoSchema = renovarSubscripcionSchema;

export class RenovarSubscripcionDto implements RenovarSubscripcionInput {
  nuevaFechaFin!: string;
}
