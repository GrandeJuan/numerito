import { BadRequestException } from '@nestjs/common';
import { refreshTokenSchema } from '@numerito/shared';
import { refreshTokenDtoSchema } from './refresh-token.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';

describe('RefreshTokenDto — Zod-derived validation', () => {
  const pipe = new ZodValidationPipe(refreshTokenDtoSchema);

  const valid = { refreshToken: 'some-jwt-token' };

  describe('agreement with shared schema', () => {
    it('uses the same schema instance as @numerito/shared', () => {
      expect(refreshTokenDtoSchema).toBe(refreshTokenSchema);
    });
  });

  describe('accepts valid input', () => {
    it('passes valid refresh token', () => {
      const result = pipe.transform(valid);
      expect(result).toEqual(valid);
    });
  });

  describe('rejects invalid input', () => {
    it('rejects empty refreshToken', () => {
      expect(() => pipe.transform({ refreshToken: '' })).toThrow(BadRequestException);
    });

    it('rejects missing refreshToken', () => {
      expect(() => pipe.transform({})).toThrow(BadRequestException);
    });
  });
});
