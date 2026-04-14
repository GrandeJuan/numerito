import { BadRequestException } from '@nestjs/common';
import { crearClienteSchema } from '@numerito/shared';
import { crearClienteDtoSchema } from './crear-cliente.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';

describe('CrearClienteDto — Zod-derived validation', () => {
  const pipe = new ZodValidationPipe(crearClienteDtoSchema);

  const valid = {
    cuit: '20-12345678-6',
    razonSocial: 'Acme SA',
    condicionIva: 'RESPONSABLE_INSCRIPTO',
    tipo: 'PERSONA_JURIDICA',
    regimen: 'GENERAL',
  };

  describe('agreement with shared schema', () => {
    it('uses the same schema instance as @numerito/shared', () => {
      expect(crearClienteDtoSchema).toBe(crearClienteSchema);
    });
  });

  describe('accepts valid input', () => {
    it('passes valid cliente data', () => {
      const result = pipe.transform(valid);
      expect(result).toEqual(valid);
    });

    it('accepts CUIT without dashes', () => {
      const result = pipe.transform({ ...valid, cuit: '20123456786' });
      expect(result.cuit).toBe('20123456786');
    });
  });

  describe('rejects invalid input', () => {
    it('rejects empty cuit', () => {
      expect(() => pipe.transform({ ...valid, cuit: '' })).toThrow(BadRequestException);
    });

    it('rejects cuit with wrong check digit', () => {
      expect(() => pipe.transform({ ...valid, cuit: '20-12345678-0' })).toThrow(
        BadRequestException,
      );
    });

    it('rejects cuit with invalid format', () => {
      expect(() => pipe.transform({ ...valid, cuit: '123' })).toThrow(BadRequestException);
    });

    it('rejects razonSocial shorter than 3 characters', () => {
      expect(() => pipe.transform({ ...valid, razonSocial: 'AB' })).toThrow(BadRequestException);
    });

    it('rejects empty condicionIva', () => {
      expect(() => pipe.transform({ ...valid, condicionIva: '' })).toThrow(BadRequestException);
    });

    it('rejects empty tipo', () => {
      expect(() => pipe.transform({ ...valid, tipo: '' })).toThrow(BadRequestException);
    });

    it('rejects empty regimen', () => {
      expect(() => pipe.transform({ ...valid, regimen: '' })).toThrow(BadRequestException);
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
