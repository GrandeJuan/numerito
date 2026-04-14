import { BadRequestException } from '@nestjs/common';
import { rubricarLibroSchema } from '@numerito/shared';
import { rubricarLibroDtoSchema } from './rubricar-libro.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';

describe('RubricarLibroDto — Zod-derived validation', () => {
  const pipe = new ZodValidationPipe(rubricarLibroDtoSchema);

  const validInput = {
    numeroRubrica: 'RUB-2024-001',
  };

  describe('agreement with shared schema', () => {
    it('uses the same schema instance as @numerito/shared', () => {
      expect(rubricarLibroDtoSchema).toBe(rubricarLibroSchema);
    });
  });

  describe('accepts valid input', () => {
    it('passes with all required fields', () => {
      const result = pipe.transform(validInput);
      expect(result).toEqual(validInput);
    });
  });

  describe('rejects invalid input', () => {
    it('rejects empty numeroRubrica', () => {
      expect(() => pipe.transform({ numeroRubrica: '' })).toThrow(BadRequestException);
    });

    it('rejects missing required fields', () => {
      expect(() => pipe.transform({})).toThrow(BadRequestException);
    });
  });

  describe('strips unknown fields', () => {
    it('removes fields not in the schema', () => {
      const result = pipe.transform({ ...validInput, unknown: 'field' });
      expect(result).not.toHaveProperty('unknown');
    });
  });
});
