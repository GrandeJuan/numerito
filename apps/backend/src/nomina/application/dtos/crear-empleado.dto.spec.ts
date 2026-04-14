import { BadRequestException } from '@nestjs/common';
import { crearEmpleadoSchema } from '@numerito/shared';
import { crearEmpleadoDtoSchema } from './crear-empleado.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';

describe('CrearEmpleadoDto — Zod-derived validation', () => {
  const pipe = new ZodValidationPipe(crearEmpleadoDtoSchema);

  const validInput = {
    clienteId: 'cl-1',
    nombre: 'Juan',
    apellido: 'Perez',
    cuil: '20-12345678-9',
    fechaIngreso: '2024-01-15T00:00:00.000Z',
    sueldoBasico: 50000,
    categoriaConvenio: 'CAT-A',
  };

  describe('agreement with shared schema', () => {
    it('uses the same schema instance as @numerito/shared', () => {
      expect(crearEmpleadoDtoSchema).toBe(crearEmpleadoSchema);
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

    it('rejects empty nombre', () => {
      expect(() => pipe.transform({ ...validInput, nombre: '' })).toThrow(BadRequestException);
    });

    it('rejects empty apellido', () => {
      expect(() => pipe.transform({ ...validInput, apellido: '' })).toThrow(BadRequestException);
    });

    it('rejects empty cuil', () => {
      expect(() => pipe.transform({ ...validInput, cuil: '' })).toThrow(BadRequestException);
    });

    it('rejects invalid fechaIngreso', () => {
      expect(() => pipe.transform({ ...validInput, fechaIngreso: 'not-a-date' })).toThrow(BadRequestException);
    });

    it('rejects sueldoBasico less than 1', () => {
      expect(() => pipe.transform({ ...validInput, sueldoBasico: 0 })).toThrow(BadRequestException);
    });

    it('rejects empty categoriaConvenio', () => {
      expect(() => pipe.transform({ ...validInput, categoriaConvenio: '' })).toThrow(BadRequestException);
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
