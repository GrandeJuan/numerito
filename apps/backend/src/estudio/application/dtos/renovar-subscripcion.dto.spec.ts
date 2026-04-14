import { BadRequestException } from '@nestjs/common';
import { renovarSubscripcionSchema } from '@numerito/shared';
import { renovarSubscripcionDtoSchema } from './renovar-subscripcion.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';

describe('RenovarSubscripcionDto — Zod-derived validation', () => {
  const pipe = new ZodValidationPipe(renovarSubscripcionDtoSchema);

  describe('agreement with shared schema', () => {
    it('uses the same schema instance as @numerito/shared', () => {
      expect(renovarSubscripcionDtoSchema).toBe(renovarSubscripcionSchema);
    });
  });

  describe('accepts valid input', () => {
    it('passes with valid ISO datetime string', () => {
      const result = pipe.transform({ nuevaFechaFin: '2026-12-31T23:59:59.000Z' });
      expect(result).toEqual({ nuevaFechaFin: '2026-12-31T23:59:59.000Z' });
    });
  });

  describe('rejects invalid input', () => {
    it('rejects missing nuevaFechaFin', () => {
      expect(() => pipe.transform({})).toThrow(BadRequestException);
    });

    it('rejects non-datetime string', () => {
      expect(() => pipe.transform({ nuevaFechaFin: 'not-a-date' })).toThrow(BadRequestException);
    });

    it('rejects empty string', () => {
      expect(() => pipe.transform({ nuevaFechaFin: '' })).toThrow(BadRequestException);
    });
  });

  describe('strips unknown fields', () => {
    it('removes fields not in the schema', () => {
      const result = pipe.transform({ nuevaFechaFin: '2026-12-31T23:59:59.000Z', unknown: 'field' });
      expect(result).not.toHaveProperty('unknown');
    });
  });
});
