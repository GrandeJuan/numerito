import { BadRequestException } from '@nestjs/common';
import { iniciarSesionSchema } from '@numerito/shared';
import { iniciarSesionDtoSchema } from './iniciar-sesion.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';

describe('IniciarSesionDto — Zod-derived validation', () => {
  const pipe = new ZodValidationPipe(iniciarSesionDtoSchema);

  const valid = { email: 'user@example.com', password: 'secret123' };

  describe('agreement with shared schema', () => {
    it('uses the same schema instance as @numerito/shared', () => {
      expect(iniciarSesionDtoSchema).toBe(iniciarSesionSchema);
    });
  });

  describe('accepts valid input', () => {
    it('passes valid login data', () => {
      const result = pipe.transform(valid);
      expect(result).toEqual(valid);
    });
  });

  describe('rejects invalid input', () => {
    it('rejects invalid email', () => {
      expect(() => pipe.transform({ ...valid, email: 'not-an-email' })).toThrow(
        BadRequestException,
      );
    });

    it('rejects empty password', () => {
      expect(() => pipe.transform({ ...valid, password: '' })).toThrow(BadRequestException);
    });

    it('rejects missing fields', () => {
      expect(() => pipe.transform({})).toThrow(BadRequestException);
    });
  });

  describe('strips unknown fields', () => {
    it('removes fields not in the schema', () => {
      const result = pipe.transform({ ...valid, unknown: 'field' });
      expect(result).not.toHaveProperty('unknown');
    });
  });
});
