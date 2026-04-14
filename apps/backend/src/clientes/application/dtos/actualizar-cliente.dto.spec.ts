import { BadRequestException } from '@nestjs/common';
import { actualizarClienteSchema } from '@numerito/shared';
import { actualizarClienteDtoSchema } from './actualizar-cliente.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';

describe('ActualizarClienteDto — Zod-derived validation', () => {
  const pipe = new ZodValidationPipe(actualizarClienteDtoSchema);

  describe('agreement with shared schema', () => {
    it('uses the same schema instance as @numerito/shared', () => {
      expect(actualizarClienteDtoSchema).toBe(actualizarClienteSchema);
    });
  });

  describe('accepts valid input', () => {
    it('passes with all fields', () => {
      const result = pipe.transform({
        razonSocial: 'Acme SA',
        condicionIva: 'RESPONSABLE_INSCRIPTO',
        regimen: 'GENERAL',
      });
      expect(result).toEqual({
        razonSocial: 'Acme SA',
        condicionIva: 'RESPONSABLE_INSCRIPTO',
        regimen: 'GENERAL',
      });
    });

    it('passes with only razonSocial', () => {
      const result = pipe.transform({ razonSocial: 'Acme SA' });
      expect(result).toEqual({ razonSocial: 'Acme SA' });
    });

    it('passes with empty object (all fields optional)', () => {
      const result = pipe.transform({});
      expect(result).toEqual({});
    });
  });

  describe('rejects invalid input', () => {
    it('rejects razonSocial shorter than 3 characters', () => {
      expect(() => pipe.transform({ razonSocial: 'AB' })).toThrow(BadRequestException);
    });

    it('rejects empty condicionIva', () => {
      expect(() => pipe.transform({ condicionIva: '' })).toThrow(BadRequestException);
    });

    it('rejects empty regimen', () => {
      expect(() => pipe.transform({ regimen: '' })).toThrow(BadRequestException);
    });
  });

  describe('strips unknown fields', () => {
    it('removes fields not in the schema', () => {
      const result = pipe.transform({ razonSocial: 'Acme SA', unknown: 'field' });
      expect(result).not.toHaveProperty('unknown');
    });
  });
});
