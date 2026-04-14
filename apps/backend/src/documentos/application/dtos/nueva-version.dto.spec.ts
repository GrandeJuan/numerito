import { BadRequestException } from '@nestjs/common';
import { nuevaVersionSchema } from '@numerito/shared';
import { nuevaVersionDtoSchema } from './nueva-version.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';

describe('NuevaVersionDto — Zod-derived validation', () => {
  const pipe = new ZodValidationPipe(nuevaVersionDtoSchema);

  const validInput = {
    s3Key: 'documentos/balance-2024-v2.pdf',
    sizeBytes: 2048,
  };

  describe('agreement with shared schema', () => {
    it('uses the same schema instance as @numerito/shared', () => {
      expect(nuevaVersionDtoSchema).toBe(nuevaVersionSchema);
    });
  });

  describe('accepts valid input', () => {
    it('passes with all required fields', () => {
      const result = pipe.transform(validInput);
      expect(result).toEqual(validInput);
    });
  });

  describe('rejects invalid input', () => {
    it('rejects empty s3Key', () => {
      expect(() => pipe.transform({ ...validInput, s3Key: '' })).toThrow(BadRequestException);
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
