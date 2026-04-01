export interface ApiMeta {
  timestamp: string;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface ApiSuccessResponse<T> {
  data: T;
  meta: ApiMeta;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  statusCode: number;
}

export interface ApiErrorResponse {
  error: ApiErrorDetail;
  meta: ApiMeta;
}

export function successResponse<T>(data: T, pagination?: { total: number; page: number; limit: number }): ApiSuccessResponse<T> {
  const meta: ApiMeta = {
    timestamp: new Date().toISOString(),
  };

  if (pagination) {
    meta.total = pagination.total;
    meta.page = pagination.page;
    meta.limit = pagination.limit;
    meta.totalPages = Math.ceil(pagination.total / pagination.limit);
  }

  return { data, meta };
}

export function errorResponse(code: string, message: string, statusCode: number): ApiErrorResponse {
  return {
    error: { code, message, statusCode },
    meta: { timestamp: new Date().toISOString() },
  };
}
