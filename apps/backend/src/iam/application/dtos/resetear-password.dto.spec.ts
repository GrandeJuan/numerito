import { BadRequestException } from '@nestjs/common';
import { resetearPasswordSchema } from '@numerito/shared';
import { resetearPasswordDtoSchema } from './resetear-password.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';

describe('ResetearPasswordDto — Zod-derived validation', () => {
  const pipe = new ZodValidationPipe(resetearPasswordDtoSchema);

  const valid = { token: 'abc123', newPassword: '12345678' };

  describe('agreement with shared schema', () => {
    it('uses the same schema instance as @numerito/shared', () => {
      expect(resetearPasswordDtoSchema).toBe(resetearPasswordSchema);
    });
  });

  describe('accepts valid input', () => {
    it('passes valid reset data', () => {
      const result = pipe.transform(valid);
      expect(result).toEqual(valid);
    });
  });

  describe('rejects invalid input', () => {
    it('rejects empty token', () => {
      expect(() => pipe.transform({ ...valid, token: '' })).toThrow(BadRequestException);
    });

    it('rejects password shorter than 8 characters', () => {
      expect(() => pipe.transform({ ...valid, newPassword: '1234567' })).toThrow(
        BadRequestException,
      );
    });

    it('rejects missing fields', () => {
      expect(() => pipe.transform({})).toThrow(BadRequestException);
    });
  });
});
