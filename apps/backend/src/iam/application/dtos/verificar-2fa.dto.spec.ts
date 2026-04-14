import { BadRequestException } from '@nestjs/common';
import { verificar2FASchema } from '@numerito/shared';
import { verificar2FADtoSchema } from './verificar-2fa.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';

describe('Verificar2FADto — Zod-derived validation', () => {
  const pipe = new ZodValidationPipe(verificar2FADtoSchema);

  const valid = { code: '123456' };

  describe('agreement with shared schema', () => {
    it('uses the same schema instance as @numerito/shared', () => {
      expect(verificar2FADtoSchema).toBe(verificar2FASchema);
    });
  });

  describe('accepts valid input', () => {
    it('passes valid 6-digit code', () => {
      const result = pipe.transform(valid);
      expect(result).toEqual(valid);
    });
  });

  describe('rejects invalid input', () => {
    it('rejects code shorter than 6 characters', () => {
      expect(() => pipe.transform({ code: '12345' })).toThrow(BadRequestException);
    });

    it('rejects code longer than 6 characters', () => {
      expect(() => pipe.transform({ code: '1234567' })).toThrow(BadRequestException);
    });

    it('rejects missing code', () => {
      expect(() => pipe.transform({})).toThrow(BadRequestException);
    });
  });
});
