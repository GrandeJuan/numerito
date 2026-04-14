import { BadRequestException } from '@nestjs/common';
import { actualizarEmpleadoSchema } from '@numerito/shared';
import { actualizarEmpleadoDtoSchema } from './actualizar-empleado.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';

describe('ActualizarEmpleadoDto — Zod-derived validation', () => {
  const pipe = new ZodValidationPipe(actualizarEmpleadoDtoSchema);

  describe('agreement with shared schema', () => {
    it('uses the same schema instance as @numerito/shared', () => {
      expect(actualizarEmpleadoDtoSchema).toBe(actualizarEmpleadoSchema);
    });
  });

  describe('accepts valid input', () => {
    it('passes with all fields', () => {
      const result = pipe.transform({ nombre: 'Juan', apellido: 'Perez', categoriaConvenio: 'CAT-B' });
      expect(result).toEqual({ nombre: 'Juan', apellido: 'Perez', categoriaConvenio: 'CAT-B' });
    });

    it('passes with only nombre', () => {
      const result = pipe.transform({ nombre: 'Juan' });
      expect(result).toEqual({ nombre: 'Juan' });
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

    it('rejects empty apellido', () => {
      expect(() => pipe.transform({ apellido: '' })).toThrow(BadRequestException);
    });

    it('rejects empty categoriaConvenio', () => {
      expect(() => pipe.transform({ categoriaConvenio: '' })).toThrow(BadRequestException);
    });
  });

  describe('strips unknown fields', () => {
    it('removes fields not in the schema', () => {
      const result = pipe.transform({ nombre: 'Juan', unknown: 'field' });
      expect(result).not.toHaveProperty('unknown');
    });
  });
});
