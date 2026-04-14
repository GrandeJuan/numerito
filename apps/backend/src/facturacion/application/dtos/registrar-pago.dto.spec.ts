import { BadRequestException } from '@nestjs/common';
import { registrarPagoSchema } from '@numerito/shared';
import { registrarPagoDtoSchema } from './registrar-pago.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';

describe('RegistrarPagoDto — Zod-derived validation', () => {
  const pipe = new ZodValidationPipe(registrarPagoDtoSchema);

  const valid = {
    monto: 1500.50,
    medioPagoId: 1,
  };

  describe('agreement with shared schema', () => {
    it('uses the same schema instance as @numerito/shared', () => {
      expect(registrarPagoDtoSchema).toBe(registrarPagoSchema);
    });
  });

  describe('accepts valid input', () => {
    it('passes with required fields only', () => {
      const result = pipe.transform(valid);
      expect(result).toEqual(valid);
    });

    it('passes with optional referencia', () => {
      const result = pipe.transform({ ...valid, referencia: 'TRX-001' });
      expect(result).toEqual({ ...valid, referencia: 'TRX-001' });
    });
  });

  describe('rejects invalid input', () => {
    it('rejects monto less than 0.01', () => {
      expect(() => pipe.transform({ ...valid, monto: 0 })).toThrow(BadRequestException);
    });

    it('rejects negative monto', () => {
      expect(() => pipe.transform({ ...valid, monto: -100 })).toThrow(BadRequestException);
    });

    it('rejects non-integer medioPagoId', () => {
      expect(() => pipe.transform({ ...valid, medioPagoId: 1.5 })).toThrow(BadRequestException);
    });

    it('rejects medioPagoId less than 1', () => {
      expect(() => pipe.transform({ ...valid, medioPagoId: 0 })).toThrow(BadRequestException);
    });

    it('rejects missing monto', () => {
      expect(() => pipe.transform({ medioPagoId: 1 })).toThrow(BadRequestException);
    });

    it('rejects missing medioPagoId', () => {
      expect(() => pipe.transform({ monto: 100 })).toThrow(BadRequestException);
    });
  });

  describe('strips unknown fields', () => {
    it('removes fields not in the schema', () => {
      const result = pipe.transform({ ...valid, unknown: 'field' });
      expect(result).not.toHaveProperty('unknown');
    });
  });
});
