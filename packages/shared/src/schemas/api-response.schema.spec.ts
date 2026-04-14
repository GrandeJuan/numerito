import { z } from 'zod';
import { apiMetaSchema, apiSuccessSchema, apiErrorSchema } from './api-response.schema';

describe('apiMetaSchema', () => {
  it('accepts minimal meta with only timestamp', () => {
    const result = apiMetaSchema.parse({ timestamp: '2026-01-01T00:00:00Z' });
    expect(result.timestamp).toBe('2026-01-01T00:00:00Z');
    expect(result.total).toBeUndefined();
  });

  it('accepts meta with pagination fields', () => {
    const result = apiMetaSchema.parse({
      timestamp: '2026-01-01T00:00:00Z',
      total: 100,
      page: 2,
      limit: 20,
      totalPages: 5,
    });
    expect(result.total).toBe(100);
    expect(result.totalPages).toBe(5);
  });

  it('rejects missing timestamp', () => {
    expect(() => apiMetaSchema.parse({})).toThrow();
  });
});

describe('apiSuccessSchema', () => {
  it('validates wrapped response with typed data', () => {
    const schema = apiSuccessSchema(z.object({ id: z.string() }));
    const result = schema.parse({
      data: { id: '123' },
      meta: { timestamp: '2026-01-01T00:00:00Z' },
    });
    expect(result.data.id).toBe('123');
  });

  it('rejects when data does not match inner schema', () => {
    const schema = apiSuccessSchema(z.object({ id: z.string() }));
    expect(() =>
      schema.parse({
        data: { id: 123 },
        meta: { timestamp: '2026-01-01T00:00:00Z' },
      }),
    ).toThrow();
  });

  it('rejects missing meta', () => {
    const schema = apiSuccessSchema(z.string());
    expect(() => schema.parse({ data: 'hello' })).toThrow();
  });
});

describe('apiErrorSchema', () => {
  it('validates error response', () => {
    const result = apiErrorSchema.parse({
      error: { code: 'NOT_FOUND', message: 'Entity not found', statusCode: 404 },
      meta: { timestamp: '2026-01-01T00:00:00Z' },
    });
    expect(result.error.code).toBe('NOT_FOUND');
    expect(result.error.statusCode).toBe(404);
  });

  it('rejects incomplete error object', () => {
    expect(() =>
      apiErrorSchema.parse({
        error: { code: 'NOT_FOUND' },
        meta: { timestamp: '2026-01-01T00:00:00Z' },
      }),
    ).toThrow();
  });
});
