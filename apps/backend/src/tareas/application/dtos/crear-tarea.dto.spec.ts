import { BadRequestException } from '@nestjs/common';
import { crearTareaSchema } from '@numerito/shared';
import { crearTareaDtoSchema } from './crear-tarea.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';

describe('CrearTareaDto — Zod-derived validation', () => {
  const pipe = new ZodValidationPipe(crearTareaDtoSchema);

  const validInput = {
    titulo: 'Preparar DDJJ',
    prioridad: 'ALTA',
  };

  describe('agreement with shared schema', () => {
    it('uses the same schema instance as @numerito/shared', () => {
      expect(crearTareaDtoSchema).toBe(crearTareaSchema);
    });
  });

  describe('accepts valid input', () => {
    it('passes with required fields only', () => {
      const result = pipe.transform(validInput);
      expect(result).toEqual(validInput);
    });

    it('passes with optional fields', () => {
      const input = { ...validInput, descripcion: 'Detalles', clienteId: 'cl-1' };
      const result = pipe.transform(input);
      expect(result).toEqual(input);
    });

    it('accepts all valid prioridad values', () => {
      const prioridades = ['BAJA', 'MEDIA', 'ALTA', 'URGENTE'];
      for (const prioridad of prioridades) {
        const result = pipe.transform({ ...validInput, prioridad });
        expect(result.prioridad).toBe(prioridad);
      }
    });
  });

  describe('rejects invalid input', () => {
    it('rejects empty titulo', () => {
      expect(() => pipe.transform({ ...validInput, titulo: '' })).toThrow(BadRequestException);
    });

    it('rejects invalid prioridad', () => {
      expect(() => pipe.transform({ ...validInput, prioridad: 'INVALID' })).toThrow(BadRequestException);
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
