import { BadRequestException } from '@nestjs/common';
import { actualizarEstudioSchema } from '@numerito/shared';
import { actualizarEstudioDtoSchema } from './actualizar-estudio.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';

describe('ActualizarEstudioDto — Zod-derived validation', () => {
  const pipe = new ZodValidationPipe(actualizarEstudioDtoSchema);

  describe('agreement with shared schema', () => {
    it('uses the same schema instance as @numerito/shared', () => {
      expect(actualizarEstudioDtoSchema).toBe(actualizarEstudioSchema);
    });
  });

  describe('accepts valid input', () => {
    it('passes with nombre', () => {
      const result = pipe.transform({ nombre: 'Estudio Contable ABC' });
      expect(result).toEqual({ nombre: 'Estudio Contable ABC' });
    });

    it('passes with empty object (all fields optional)', () => {
      const result = pipe.transform({});
      expect(result).toEqual({});
    });
  });

  describe('rejects invalid input', () => {
    it('rejects nombre shorter than 3 characters', () => {
      expect(() => pipe.transform({ nombre: 'AB' })).toThrow(BadRequestException);
    });

    it('rejects empty nombre', () => {
      expect(() => pipe.transform({ nombre: '' })).toThrow(BadRequestException);
    });
  });

  describe('strips unknown fields', () => {
    it('removes fields not in the schema', () => {
      const result = pipe.transform({ nombre: 'Estudio ABC', unknown: 'field' });
      expect(result).not.toHaveProperty('unknown');
    });
  });
});
