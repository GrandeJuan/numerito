import { BadRequestException } from '@nestjs/common';
import { asignarTareaSchema } from '@numerito/shared';
import { asignarTareaDtoSchema } from './asignar-tarea.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';

describe('AsignarTareaDto — Zod-derived validation', () => {
  const pipe = new ZodValidationPipe(asignarTareaDtoSchema);

  const validInput = {
    responsableId: 'usr-1',
  };

  describe('agreement with shared schema', () => {
    it('uses the same schema instance as @numerito/shared', () => {
      expect(asignarTareaDtoSchema).toBe(asignarTareaSchema);
    });
  });

  describe('accepts valid input', () => {
    it('passes with all required fields', () => {
      const result = pipe.transform(validInput);
      expect(result).toEqual(validInput);
    });
  });

  describe('rejects invalid input', () => {
    it('rejects empty responsableId', () => {
      expect(() => pipe.transform({ responsableId: '' })).toThrow(BadRequestException);
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
