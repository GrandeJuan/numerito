import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
  const schema = z.object({
    name: z.string().min(3),
    age: z.number().positive(),
  });
  const pipe = new ZodValidationPipe(schema);

  it('returns parsed data for valid input', () => {
    const result = pipe.transform({ name: 'Alice', age: 30 });
    expect(result).toEqual({ name: 'Alice', age: 30 });
  });

  it('strips unknown fields (same as whitelist: true)', () => {
    const result = pipe.transform({ name: 'Alice', age: 30, extra: true });
    expect(result).toEqual({ name: 'Alice', age: 30 });
  });

  it('throws BadRequestException on invalid input', () => {
    expect(() => pipe.transform({ name: 'AB', age: -1 })).toThrow(BadRequestException);
  });

  it('includes field-level error details', () => {
    try {
      pipe.transform({ name: '', age: -1 });
      fail('should have thrown');
    } catch (e) {
      const response = (e as BadRequestException).getResponse() as any;
      expect(response.message).toBe('Error de validación');
      expect(response.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'name' }),
          expect.objectContaining({ field: 'age' }),
        ]),
      );
    }
  });

  it('throws on missing required fields', () => {
    expect(() => pipe.transform({})).toThrow(BadRequestException);
  });
});
