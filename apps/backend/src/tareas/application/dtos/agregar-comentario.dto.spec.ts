import { BadRequestException } from '@nestjs/common';
import { agregarComentarioSchema } from '@numerito/shared';
import { agregarComentarioDtoSchema } from './agregar-comentario.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';

describe('AgregarComentarioDto — Zod-derived validation', () => {
  const pipe = new ZodValidationPipe(agregarComentarioDtoSchema);

  const validInput = {
    autorId: 'usr-1',
    texto: 'Comentario de prueba',
  };

  describe('agreement with shared schema', () => {
    it('uses the same schema instance as @numerito/shared', () => {
      expect(agregarComentarioDtoSchema).toBe(agregarComentarioSchema);
    });
  });

  describe('accepts valid input', () => {
    it('passes with all required fields', () => {
      const result = pipe.transform(validInput);
      expect(result).toEqual(validInput);
    });
  });

  describe('rejects invalid input', () => {
    it('rejects empty autorId', () => {
      expect(() => pipe.transform({ ...validInput, autorId: '' })).toThrow(BadRequestException);
    });

    it('rejects empty texto', () => {
      expect(() => pipe.transform({ ...validInput, texto: '' })).toThrow(BadRequestException);
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
