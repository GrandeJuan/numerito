import { BadRequestException } from '@nestjs/common';
import { crearFacturaSchema } from '@numerito/shared';
import { crearFacturaDtoSchema } from './crear-factura.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';

describe('CrearFacturaDto — Zod-derived validation', () => {
  const pipe = new ZodValidationPipe(crearFacturaDtoSchema);

  const validLinea = {
    descripcion: 'Servicio contable',
    cantidad: 1,
    precioUnitario: 1000,
    alicuotaIva: 21,
  };

  const valid = {
    clienteId: 'client-123',
    numero: 'A-0001-00000001',
    fechaEmision: '2026-01-15',
    fechaVencimiento: '2026-02-15',
    concepto: 'Servicios profesionales',
    lineas: [validLinea],
  };

  describe('agreement with shared schema', () => {
    it('uses the same schema instance as @numerito/shared', () => {
      expect(crearFacturaDtoSchema).toBe(crearFacturaSchema);
    });
  });

  describe('accepts valid input', () => {
    it('passes valid factura data', () => {
      const result = pipe.transform(valid);
      expect(result).toEqual(valid);
    });

    it('accepts multiple lineas', () => {
      const result = pipe.transform({ ...valid, lineas: [validLinea, validLinea] });
      expect(result.lineas).toHaveLength(2);
    });
  });

  describe('rejects invalid input', () => {
    it('rejects empty clienteId', () => {
      expect(() => pipe.transform({ ...valid, clienteId: '' })).toThrow(BadRequestException);
    });

    it('rejects empty numero', () => {
      expect(() => pipe.transform({ ...valid, numero: '' })).toThrow(BadRequestException);
    });

    it('rejects empty concepto', () => {
      expect(() => pipe.transform({ ...valid, concepto: '' })).toThrow(BadRequestException);
    });

    it('rejects empty lineas array', () => {
      expect(() => pipe.transform({ ...valid, lineas: [] })).toThrow(BadRequestException);
    });

    it('rejects linea with empty descripcion', () => {
      expect(() =>
        pipe.transform({ ...valid, lineas: [{ ...validLinea, descripcion: '' }] }),
      ).toThrow(BadRequestException);
    });

    it('rejects linea with cantidad 0', () => {
      expect(() =>
        pipe.transform({ ...valid, lineas: [{ ...validLinea, cantidad: 0 }] }),
      ).toThrow(BadRequestException);
    });

    it('rejects linea with negative precioUnitario', () => {
      expect(() =>
        pipe.transform({ ...valid, lineas: [{ ...validLinea, precioUnitario: -1 }] }),
      ).toThrow(BadRequestException);
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
