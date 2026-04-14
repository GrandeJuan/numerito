import { BadRequestException } from '@nestjs/common';
import { registrarUsuarioSchema } from '@numerito/shared';
import { registrarUsuarioDtoSchema } from './registrar-usuario.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';

describe('RegistrarUsuarioDto — Zod-derived validation', () => {
  const pipe = new ZodValidationPipe(registrarUsuarioDtoSchema);

  const valid = {
    email: 'user@example.com',
    password: '12345678',
    nombre: 'Juan',
    apellido: 'Perez',
    rol: 'SOCIO',
  };

  describe('agreement with shared schema', () => {
    it('uses the same schema instance as @numerito/shared', () => {
      expect(registrarUsuarioDtoSchema).toBe(registrarUsuarioSchema);
    });
  });

  describe('accepts valid input', () => {
    it('passes valid registration data', () => {
      const result = pipe.transform(valid);
      expect(result).toEqual(valid);
    });
  });

  describe('rejects invalid input', () => {
    it('rejects invalid email', () => {
      expect(() => pipe.transform({ ...valid, email: 'not-an-email' })).toThrow(
        BadRequestException,
      );
    });

    it('rejects password shorter than 8 characters', () => {
      expect(() => pipe.transform({ ...valid, password: '1234567' })).toThrow(BadRequestException);
    });

    it('rejects empty nombre', () => {
      expect(() => pipe.transform({ ...valid, nombre: '' })).toThrow(BadRequestException);
    });

    it('rejects empty apellido', () => {
      expect(() => pipe.transform({ ...valid, apellido: '' })).toThrow(BadRequestException);
    });

    it('rejects empty rol', () => {
      expect(() => pipe.transform({ ...valid, rol: '' })).toThrow(BadRequestException);
    });

    it('rejects missing fields', () => {
      expect(() => pipe.transform({})).toThrow(BadRequestException);
    });
  });

  describe('strips unknown fields', () => {
    it('removes fields not in the schema', () => {
      const result = pipe.transform({ ...valid, unknown: 'field' });
      expect(result).not.toHaveProperty('unknown');
    });
  });
});
