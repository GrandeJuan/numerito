import { BadRequestException } from '@nestjs/common';
import { crearPlanSchema } from '@numerito/shared';
import { crearPlanDtoSchema } from './crear-plan.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';

describe('CrearPlanDto — Zod-derived validation', () => {
  const pipe = new ZodValidationPipe(crearPlanDtoSchema);

  const validInput = {
    codigo: 'BASIC',
    nombre: 'Plan Basico',
    maxClientes: 10,
    maxUsuarios: 3,
    precio: 5000,
  };

  describe('agreement with shared schema', () => {
    it('uses the same schema instance as @numerito/shared', () => {
      expect(crearPlanDtoSchema).toBe(crearPlanSchema);
    });
  });

  describe('accepts valid input', () => {
    it('passes with required fields only', () => {
      const result = pipe.transform(validInput);
      expect(result).toEqual(validInput);
    });

    it('passes with all optional fields', () => {
      const full = {
        ...validInput,
        descripcion: 'Plan basico para estudios pequenos',
        isPublico: true,
        condiciones: { maxStorage: '1GB' },
      };
      const result = pipe.transform(full);
      expect(result).toEqual(full);
    });

    it('passes with precio zero', () => {
      const result = pipe.transform({ ...validInput, precio: 0 });
      expect(result).toEqual({ ...validInput, precio: 0 });
    });
  });

  describe('rejects invalid input', () => {
    it('rejects empty codigo', () => {
      expect(() => pipe.transform({ ...validInput, codigo: '' })).toThrow(BadRequestException);
    });

    it('rejects empty nombre', () => {
      expect(() => pipe.transform({ ...validInput, nombre: '' })).toThrow(BadRequestException);
    });

    it('rejects non-positive maxClientes', () => {
      expect(() => pipe.transform({ ...validInput, maxClientes: 0 })).toThrow(BadRequestException);
    });

    it('rejects non-positive maxUsuarios', () => {
      expect(() => pipe.transform({ ...validInput, maxUsuarios: -1 })).toThrow(BadRequestException);
    });

    it('rejects non-integer maxClientes', () => {
      expect(() => pipe.transform({ ...validInput, maxClientes: 1.5 })).toThrow(BadRequestException);
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
