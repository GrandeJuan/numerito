import { nuevaVersionSchema, type NuevaVersionInput } from '@numerito/shared';

export const nuevaVersionDtoSchema = nuevaVersionSchema;

export class NuevaVersionDto implements NuevaVersionInput {
  s3Key!: string;
  sizeBytes!: number;
}
