import { parseApiResponse, ApiResponseError } from './parse-api-response';

function mockResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    headers: new Headers(),
  } as Response;
}

describe('parseApiResponse', () => {
  it('extracts data from wrapped response { data, meta }', async () => {
    const res = mockResponse({
      data: { id: '1', nombre: 'Test' },
      meta: { timestamp: '2026-01-01T00:00:00Z' },
    });

    const result = await parseApiResponse<{ id: string; nombre: string }>(res);

    expect(result.data).toEqual({ id: '1', nombre: 'Test' });
  });

  it('extracts pagination meta when present', async () => {
    const res = mockResponse({
      data: [{ id: '1' }],
      meta: { timestamp: '2026-01-01T00:00:00Z', total: 50, page: 1, limit: 20, totalPages: 3 },
    });

    const result = await parseApiResponse<{ id: string }[]>(res);

    expect(result.meta).toEqual({ total: 50, page: 1, limit: 20, totalPages: 3 });
  });

  it('returns undefined meta when no pagination fields', async () => {
    const res = mockResponse({
      data: { id: '1' },
      meta: { timestamp: '2026-01-01T00:00:00Z' },
    });

    const result = await parseApiResponse<{ id: string }>(res);

    expect(result.meta).toBeUndefined();
  });

  it('handles unwrapped (legacy) response without data envelope', async () => {
    const res = mockResponse({ id: '1', nombre: 'Legacy' });

    const result = await parseApiResponse<{ id: string; nombre: string }>(res);

    expect(result.data).toEqual({ id: '1', nombre: 'Legacy' });
    expect(result.meta).toBeUndefined();
  });

  it('throws ApiResponseError on non-ok response with error body', async () => {
    const res = mockResponse(
      { error: { message: 'Not found', code: 'NOT_FOUND', statusCode: 404 } },
      404,
    );

    await expect(parseApiResponse(res)).rejects.toThrow(ApiResponseError);
    await expect(parseApiResponse(mockResponse(
      { error: { message: 'Not found', code: 'NOT_FOUND', statusCode: 404 } },
      404,
    ))).rejects.toThrow('Not found');
  });

  it('throws ApiResponseError with status code', async () => {
    const res = mockResponse({ message: 'Server error' }, 500);

    try {
      await parseApiResponse(res);
      fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiResponseError);
      expect((err as ApiResponseError).statusCode).toBe(500);
      expect((err as ApiResponseError).message).toBe('Server error');
    }
  });

  it('throws generic error message when response body is not parseable', async () => {
    const res = {
      ok: false,
      status: 502,
      json: () => Promise.reject(new Error('invalid json')),
      headers: new Headers(),
    } as Response;

    try {
      await parseApiResponse(res);
      fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiResponseError);
      expect((err as ApiResponseError).message).toBe('Error 502');
    }
  });

  it('handles data: null correctly', async () => {
    const res = mockResponse({ data: null, meta: { timestamp: '2026-01-01T00:00:00Z' } });

    const result = await parseApiResponse<null>(res);

    expect(result.data).toBeNull();
  });

  it('handles data: [] (empty array)', async () => {
    const res = mockResponse({ data: [], meta: { timestamp: '2026-01-01T00:00:00Z' } });

    const result = await parseApiResponse<unknown[]>(res);

    expect(result.data).toEqual([]);
  });
});
