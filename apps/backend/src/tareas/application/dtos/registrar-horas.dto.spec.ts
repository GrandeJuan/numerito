import { BadRequestException } from '@nestjs/common';
import { registrarHorasSchema } from '@numerito/shared';
import { registrarHorasDtoSchema } from './registrar-horas.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';

describe('RegistrarHorasDto — Zod-derived validation', () => {
  const pipe = new ZodValidationPipe(registrarHorasDtoSchema);

  const validInput = {
    horas: 2.5,
    descripcion: 'Revision de documentacion',
  };

  describe('agreement with shared schema', () => {
    it('uses the same schema instance as @numerito/shared', () => {
      expect(registrarHorasDtoSchema).toBe(registrarHorasSchema);
    });
  });

  describe('accepts valid input', () => {
    it('passes with all required fields', () => {
      const result = pipe.transform(validInput);
      expect(result).toEqual(validInput);
    });
  });

  describe('rejects invalid input', () => {
    it('rejects non-positive horas', () => {
      expect(() => pipe.transform({ ...validInput, horas: 0 })).toThrow(BadRequestException);
      expect(() => pipe.transform({ ...validInput, horas: -1 })).toThrow(BadRequestException);
    });

    it('rejects empty descripcion', () => {
      expect(() => pipe.transform({ ...validInput, descripcion: '' })).toThrow(BadRequestException);
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
