import { BadRequestException } from '@nestjs/common';
import { solicitarResetPasswordSchema } from '@numerito/shared';
import { solicitarResetPasswordDtoSchema } from './solicitar-reset-password.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';

describe('SolicitarResetPasswordDto — Zod-derived validation', () => {
  const pipe = new ZodValidationPipe(solicitarResetPasswordDtoSchema);

  const valid = { email: 'user@example.com' };

  describe('agreement with shared schema', () => {
    it('uses the same schema instance as @numerito/shared', () => {
      expect(solicitarResetPasswordDtoSchema).toBe(solicitarResetPasswordSchema);
    });
  });

  describe('accepts valid input', () => {
    it('passes valid email', () => {
      const result = pipe.transform(valid);
      expect(result).toEqual(valid);
    });
  });

  describe('rejects invalid input', () => {
    it('rejects invalid email', () => {
      expect(() => pipe.transform({ email: 'not-an-email' })).toThrow(BadRequestException);
    });

    it('rejects missing email', () => {
      expect(() => pipe.transform({})).toThrow(BadRequestException);
    });
  });
});
