import { BadRequestException } from '@nestjs/common';
import { actualizarSueldoSchema } from '@numerito/shared';
import { actualizarSueldoDtoSchema } from './actualizar-sueldo.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';

describe('ActualizarSueldoDto — Zod-derived validation', () => {
  const pipe = new ZodValidationPipe(actualizarSueldoDtoSchema);

  describe('agreement with shared schema', () => {
    it('uses the same schema instance as @numerito/shared', () => {
      expect(actualizarSueldoDtoSchema).toBe(actualizarSueldoSchema);
    });
  });

  describe('accepts valid input', () => {
    it('passes with valid sueldo', () => {
      const result = pipe.transform({ sueldo: 75000 });
      expect(result).toEqual({ sueldo: 75000 });
    });

    it('passes with sueldo equal to 1', () => {
      const result = pipe.transform({ sueldo: 1 });
      expect(result).toEqual({ sueldo: 1 });
    });
  });

  describe('rejects invalid input', () => {
    it('rejects sueldo less than 1', () => {
      expect(() => pipe.transform({ sueldo: 0 })).toThrow(BadRequestException);
    });

    it('rejects negative sueldo', () => {
      expect(() => pipe.transform({ sueldo: -100 })).toThrow(BadRequestException);
    });

    it('rejects missing sueldo', () => {
      expect(() => pipe.transform({})).toThrow(BadRequestException);
    });

    it('rejects non-numeric sueldo', () => {
      expect(() => pipe.transform({ sueldo: 'abc' })).toThrow(BadRequestException);
    });
  });

  describe('strips unknown fields', () => {
    it('removes fields not in the schema', () => {
      const result = pipe.transform({ sueldo: 50000, unknown: 'field' });
      expect(result).not.toHaveProperty('unknown');
    });
  });
});
