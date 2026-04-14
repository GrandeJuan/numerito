import { BadRequestException } from '@nestjs/common';
import { crearAsientoSchema, lineaAsientoSchema } from '@numerito/shared';
import { crearAsientoDtoSchema, lineaAsientoDtoSchema } from './crear-asiento.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';

describe('CrearAsientoDto — Zod-derived validation', () => {
  const pipe = new ZodValidationPipe(crearAsientoDtoSchema);

  const validLinea = {
    cuentaId: 'cuenta-1',
    debe: 1000,
    haber: 0,
    descripcion: 'Linea de prueba',
  };

  const validInput = {
    libroId: 'libro-1',
    clienteId: 'cl-1',
    fecha: '2024-01-15T00:00:00.000Z',
    descripcion: 'Asiento de prueba',
    lineas: [validLinea],
  };

  describe('agreement with shared schema', () => {
    it('uses the same schema instance as @numerito/shared', () => {
      expect(crearAsientoDtoSchema).toBe(crearAsientoSchema);
      expect(lineaAsientoDtoSchema).toBe(lineaAsientoSchema);
    });
  });

  describe('accepts valid input', () => {
    it('passes with all required fields', () => {
      const result = pipe.transform(validInput);
      expect(result).toEqual(validInput);
    });
  });

  describe('rejects invalid input', () => {
    it('rejects empty libroId', () => {
      expect(() => pipe.transform({ ...validInput, libroId: '' })).toThrow(BadRequestException);
    });

    it('rejects empty clienteId', () => {
      expect(() => pipe.transform({ ...validInput, clienteId: '' })).toThrow(BadRequestException);
    });

    it('rejects invalid fecha', () => {
      expect(() => pipe.transform({ ...validInput, fecha: 'not-a-date' })).toThrow(BadRequestException);
    });

    it('rejects empty descripcion', () => {
      expect(() => pipe.transform({ ...validInput, descripcion: '' })).toThrow(BadRequestException);
    });

    it('rejects empty lineas array', () => {
      expect(() => pipe.transform({ ...validInput, lineas: [] })).toThrow(BadRequestException);
    });

    it('rejects linea with empty cuentaId', () => {
      expect(() =>
        pipe.transform({ ...validInput, lineas: [{ ...validLinea, cuentaId: '' }] }),
      ).toThrow(BadRequestException);
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
