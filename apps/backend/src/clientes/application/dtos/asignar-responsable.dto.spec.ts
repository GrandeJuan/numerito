import { BadRequestException } from '@nestjs/common';
import { asignarResponsableSchema } from '@numerito/shared';
import { asignarResponsableDtoSchema } from './asignar-responsable.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';

describe('AsignarResponsableDto — Zod-derived validation', () => {
  const pipe = new ZodValidationPipe(asignarResponsableDtoSchema);

  describe('agreement with shared schema', () => {
    it('uses the same schema instance as @numerito/shared', () => {
      expect(asignarResponsableDtoSchema).toBe(asignarResponsableSchema);
    });
  });

  describe('accepts valid input', () => {
    it('passes with valid responsableId', () => {
      const result = pipe.transform({ responsableId: 'user-123' });
      expect(result).toEqual({ responsableId: 'user-123' });
    });
  });

  describe('rejects invalid input', () => {
    it('rejects empty responsableId', () => {
      expect(() => pipe.transform({ responsableId: '' })).toThrow(BadRequestException);
    });

    it('rejects missing responsableId', () => {
      expect(() => pipe.transform({})).toThrow(BadRequestException);
    });
  });

  describe('strips unknown fields', () => {
    it('removes fields not in the schema', () => {
      const result = pipe.transform({ responsableId: 'user-123', unknown: 'field' });
      expect(result).not.toHaveProperty('unknown');
    });
  });
});
