import { BadRequestException } from '@nestjs/common';
import { crearVencimientoSchema } from '@numerito/shared';
import { crearVencimientoDtoSchema } from './crear-vencimiento.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';

describe('CrearVencimientoDto — Zod-derived validation', () => {
  const pipe = new ZodValidationPipe(crearVencimientoDtoSchema);

  const valid = {
    clienteId: 'client-123',
    tipoObligacion: 'IVA',
    periodo: '2026-04',
    fechaVencimiento: '2026-04-20',
    descripcion: 'Presentacion IVA mensual',
  };

  describe('agreement with shared schema', () => {
    it('uses the same schema instance as @numerito/shared', () => {
      expect(crearVencimientoDtoSchema).toBe(crearVencimientoSchema);
    });
  });

  describe('accepts valid input', () => {
    it('passes valid vencimiento data', () => {
      const result = pipe.transform(valid);
      expect(result).toEqual(valid);
    });
  });

  describe('rejects invalid input', () => {
    it('rejects empty clienteId', () => {
      expect(() => pipe.transform({ ...valid, clienteId: '' })).toThrow(BadRequestException);
    });

    it('rejects empty tipoObligacion', () => {
      expect(() => pipe.transform({ ...valid, tipoObligacion: '' })).toThrow(BadRequestException);
    });

    it('rejects empty periodo', () => {
      expect(() => pipe.transform({ ...valid, periodo: '' })).toThrow(BadRequestException);
    });

    it('rejects empty descripcion', () => {
      expect(() => pipe.transform({ ...valid, descripcion: '' })).toThrow(BadRequestException);
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
