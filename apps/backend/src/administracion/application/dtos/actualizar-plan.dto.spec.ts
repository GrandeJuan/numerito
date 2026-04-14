import { BadRequestException } from '@nestjs/common';
import { actualizarPlanSchema } from '@numerito/shared';
import { actualizarPlanDtoSchema } from './actualizar-plan.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';

describe('ActualizarPlanDto — Zod-derived validation', () => {
  const pipe = new ZodValidationPipe(actualizarPlanDtoSchema);

  describe('agreement with shared schema', () => {
    it('uses the same schema instance as @numerito/shared', () => {
      expect(actualizarPlanDtoSchema).toBe(actualizarPlanSchema);
    });
  });

  describe('accepts valid input', () => {
    it('passes with all fields', () => {
      const input = {
        nombre: 'Plan Pro',
        descripcion: 'Plan profesional',
        maxClientes: 50,
        maxUsuarios: 10,
        precio: 15000,
        isPublico: false,
        condiciones: { maxStorage: '10GB' },
      };
      const result = pipe.transform(input);
      expect(result).toEqual(input);
    });

    it('passes with only nombre', () => {
      const result = pipe.transform({ nombre: 'Plan Pro' });
      expect(result).toEqual({ nombre: 'Plan Pro' });
    });

    it('passes with empty object (all fields optional)', () => {
      const result = pipe.transform({});
      expect(result).toEqual({});
    });
  });

  describe('rejects invalid input', () => {
    it('rejects empty nombre', () => {
      expect(() => pipe.transform({ nombre: '' })).toThrow(BadRequestException);
    });

    it('rejects non-positive maxClientes', () => {
      expect(() => pipe.transform({ maxClientes: 0 })).toThrow(BadRequestException);
    });

    it('rejects non-integer maxUsuarios', () => {
      expect(() => pipe.transform({ maxUsuarios: 2.5 })).toThrow(BadRequestException);
    });
  });

  describe('strips unknown fields', () => {
    it('removes fields not in the schema', () => {
      const result = pipe.transform({ nombre: 'Plan Pro', unknown: 'field' });
      expect(result).not.toHaveProperty('unknown');
    });
  });
});
