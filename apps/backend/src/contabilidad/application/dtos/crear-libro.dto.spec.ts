import { BadRequestException } from '@nestjs/common';
import { crearLibroSchema } from '@numerito/shared';
import { crearLibroDtoSchema } from './crear-libro.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';

describe('CrearLibroDto — Zod-derived validation', () => {
  const pipe = new ZodValidationPipe(crearLibroDtoSchema);

  const validInput = {
    clienteId: 'cl-1',
    tipo: 'DIARIO',
    periodo: '2024-01',
  };

  describe('agreement with shared schema', () => {
    it('uses the same schema instance as @numerito/shared', () => {
      expect(crearLibroDtoSchema).toBe(crearLibroSchema);
    });
  });

  describe('accepts valid input', () => {
    it('passes with all required fields', () => {
      const result = pipe.transform(validInput);
      expect(result).toEqual(validInput);
    });
  });

  describe('rejects invalid input', () => {
    it('rejects empty clienteId', () => {
      expect(() => pipe.transform({ ...validInput, clienteId: '' })).toThrow(BadRequestException);
    });

    it('rejects empty tipo', () => {
      expect(() => pipe.transform({ ...validInput, tipo: '' })).toThrow(BadRequestException);
    });

    it('rejects empty periodo', () => {
      expect(() => pipe.transform({ ...validInput, periodo: '' })).toThrow(BadRequestException);
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
