import { successResponse, errorResponse } from './api-response';

describe('api-response', () => {
  describe('successResponse', () => {
    it('should wrap data with meta timestamp', () => {
      const result = successResponse({ id: 1 });
      expect(result.data).toEqual({ id: 1 });
      expect(result.meta.timestamp).toBeDefined();
      expect(result.meta.total).toBeUndefined();
    });

    it('should include pagination when provided', () => {
      const result = successResponse([1, 2, 3], { total: 10, page: 1, limit: 3 });
      expect(result.meta.total).toBe(10);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(3);
      expect(result.meta.totalPages).toBe(4);
    });

    it('should calculate totalPages correctly', () => {
      const result = successResponse([], { total: 7, page: 1, limit: 3 });
      expect(result.meta.totalPages).toBe(3);
    });
  });

  describe('errorResponse', () => {
    it('should return error with code, message, and statusCode', () => {
      const result = errorResponse('NOT_FOUND', 'not found', 404);
      expect(result.error.code).toBe('NOT_FOUND');
      expect(result.error.message).toBe('not found');
      expect(result.error.statusCode).toBe(404);
      expect(result.meta.timestamp).toBeDefined();
    });
  });
});
