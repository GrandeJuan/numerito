import { refreshTokenSchema, type RefreshTokenInput } from '@numerito/shared';

export const refreshTokenDtoSchema = refreshTokenSchema;

export class RefreshTokenDto implements RefreshTokenInput {
  refreshToken!: string;
}
