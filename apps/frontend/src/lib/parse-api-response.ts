import type { PaginationMeta } from '@numerito/shared';

export interface ParsedResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

export class ApiResponseError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiResponseError';
  }
}

/**
 * Parses a fetch Response from the backend API, extracting the data from the
 * standard envelope `{ data: T, meta: { ... } }`.
 *
 * Throws ApiResponseError on non-ok responses.
 */
export async function parseApiResponse<T>(res: Response): Promise<ParsedResponse<T>> {
  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error?.message) {
        message = body.error.message;
      } else if (body?.message) {
        message = body.message;
      }
    } catch {
      // body not parseable — use default message
    }
    throw new ApiResponseError(res.status, message);
  }

  const body = await res.json();

  // Backend wraps all responses in { data, meta } via ResponseWrapperInterceptor.
  // Handle the (legacy) case where a response is not wrapped.
  const data: T = body.data !== undefined ? body.data : body;

  const meta: PaginationMeta | undefined =
    body.meta?.total !== undefined
      ? {
          total: body.meta.total,
          page: body.meta.page,
          limit: body.meta.limit,
          totalPages: body.meta.totalPages,
        }
      : undefined;

  return { data, meta };
}
