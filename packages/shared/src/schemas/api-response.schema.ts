import { z } from 'zod';

// ── API Envelope ────────────────────────────────────────────────────────

export const apiMetaSchema = z.object({
  timestamp: z.string(),
  total: z.number().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
  totalPages: z.number().optional(),
});

export type ApiMeta = z.infer<typeof apiMetaSchema>;

export const apiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    meta: apiMetaSchema,
  });

export type ApiSuccessResponse<T> = {
  data: T;
  meta: ApiMeta;
};

export const apiErrorDetailSchema = z.object({
  code: z.string(),
  message: z.string(),
  statusCode: z.number(),
});

export const apiErrorSchema = z.object({
  error: apiErrorDetailSchema,
  meta: apiMetaSchema,
});

export type ApiErrorResponse = z.infer<typeof apiErrorSchema>;

// ── Pagination ──────────────────────────────────────────────────────────

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
