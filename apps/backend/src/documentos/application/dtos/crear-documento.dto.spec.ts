import { BadRequestException } from '@nestjs/common';
import { crearDocumentoSchema } from '@numerito/shared';
import { crearDocumentoDtoSchema } from './crear-documento.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';

describe('CrearDocumentoDto — Zod-derived validation', () => {
  const pipe = new ZodValidationPipe(crearDocumentoDtoSchema);

  const validInput = {
    clienteId: 'cl-1',
    tipo: 'BALANCE',
    nombre: 'Balance 2024',
    s3Key: 'documentos/balance-2024.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1024,
  };

  describe('agreement with shared schema', () => {
    it('uses the same schema instance as @numerito/shared', () => {
      expect(crearDocumentoDtoSchema).toBe(crearDocumentoSchema);
    });
  });

  describe('accepts valid input', () => {
    it('passes with all required fields', () => {
      const result = pipe.transform(validInput);
      expect(result).toEqual(validInput);
    });

    it('accepts all valid tipo values', () => {
      const tipos = ['BALANCE', 'DDJJ', 'FACTURA', 'RECIBO_SUELDO', 'CONTRATO', 'PODER', 'ESTATUTO', 'CERTIFICACION', 'OTRO'];
      for (const tipo of tipos) {
        const result = pipe.transform({ ...validInput, tipo });
        expect(result.tipo).toBe(tipo);
      }
    });
  });

  describe('rejects invalid input', () => {
    it('rejects empty clienteId', () => {
      expect(() => pipe.transform({ ...validInput, clienteId: '' })).toThrow(BadRequestException);
    });

    it('rejects invalid tipo', () => {
      expect(() => pipe.transform({ ...validInput, tipo: 'INVALID' })).toThrow(BadRequestException);
    });

    it('rejects empty nombre', () => {
      expect(() => pipe.transform({ ...validInput, nombre: '' })).toThrow(BadRequestException);
    });

    it('rejects empty s3Key', () => {
      expect(() => pipe.transform({ ...validInput, s3Key: '' })).toThrow(BadRequestException);
    });

    it('rejects empty mimeType', () => {
      expect(() => pipe.transform({ ...validInput, mimeType: '' })).toThrow(BadRequestException);
    });

    it('rejects non-positive sizeBytes', () => {
      expect(() => pipe.transform({ ...validInput, sizeBytes: 0 })).toThrow(BadRequestException);
      expect(() => pipe.transform({ ...validInput, sizeBytes: -1 })).toThrow(BadRequestException);
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
