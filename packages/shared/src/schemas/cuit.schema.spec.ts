import { cuitSchema } from './cuit.schema';
import { z } from 'zod/v4';

describe('cuitSchema', () => {
  it('should validate a correct CUIT', () => {
    const result = z.safeParse(cuitSchema, '20-12345678-6');
    expect(result.success).toBe(true);
  });

  it('should reject an invalid CUIT format', () => {
    const result = z.safeParse(cuitSchema, '123');
    expect(result.success).toBe(false);
  });

  it('should reject CUIT with wrong check digit', () => {
    const result = z.safeParse(cuitSchema, '20-12345678-0');
    expect(result.success).toBe(false);
  });
});
