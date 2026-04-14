import { GlobalExceptionFilter } from './global-exception.filter';
import { HttpException, HttpStatus } from '@nestjs/common';
import { DomainException } from '../../domain/exceptions/domain.exception';

class TestDomainException extends DomainException {
  readonly code = 'TEST_ERROR';
  readonly httpStatus = 422;
  constructor() {
    super('domain error');
  }
}

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockLogger: { error: jest.Mock; warn: jest.Mock; log: jest.Mock };
  let mockResponse: { status: jest.Mock; json: jest.Mock };
  let mockRequest: { method: string; url: string; headers: Record<string, string> };
  let mockHost: any;

  beforeEach(() => {
    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      log: jest.fn(),
    };
    filter = new GlobalExceptionFilter(mockLogger);
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockRequest = {
      method: 'GET',
      url: '/api/v1/test',
      headers: { 'x-correlation-id': 'test-corr-id' },
    };
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    };
  });

  it('should handle DomainException', () => {
    filter.catch(new TestDomainException(), mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(422);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'TEST_ERROR', message: 'domain error', statusCode: 422 }),
      }),
    );
  });

  it('should handle HttpException with string response', () => {
    filter.catch(new HttpException('not found', HttpStatus.NOT_FOUND), mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'NOT_FOUND', statusCode: 404 }),
      }),
    );
  });

  it('should handle HttpException with object response', () => {
    filter.catch(
      new HttpException({ message: 'bad input', code: 'CUSTOM' }, HttpStatus.BAD_REQUEST),
      mockHost,
    );
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'BAD_REQUEST', statusCode: 400 }),
      }),
    );
  });

  it('should handle generic Error', () => {
    filter.catch(new Error('unexpected'), mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ message: 'unexpected', code: 'INTERNAL_ERROR', statusCode: 500 }),
      }),
    );
  });

  it('should handle unknown exception type', () => {
    filter.catch('string error', mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'INTERNAL_ERROR', statusCode: 500 }),
      }),
    );
  });

  it('should map unknown status codes to UNKNOWN_ERROR', () => {
    filter.catch(new HttpException('teapot', 418 as any), mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(418);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'UNKNOWN_ERROR' }),
      }),
    );
  });

  it('should handle HttpException with object response missing message and code', () => {
    filter.catch(new HttpException({ other: 'info' }, HttpStatus.CONFLICT), mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(409);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'CONFLICT', statusCode: 409 }),
      }),
    );
  });

  it('should handle HttpException with null response object', () => {
    const exception = new HttpException('fallback', HttpStatus.UNAUTHORIZED);
    jest.spyOn(exception, 'getResponse').mockReturnValue(null as any);
    filter.catch(exception, mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'UNAUTHORIZED', statusCode: 401 }),
      }),
    );
  });

  describe('correlation ID in error response', () => {
    it('should include correlationId in meta when present', () => {
      filter.catch(new Error('fail'), mockHost);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          meta: expect.objectContaining({ correlationId: 'test-corr-id' }),
        }),
      );
    });

    it('should not include correlationId when header is missing', () => {
      mockRequest.headers = {};
      filter.catch(new Error('fail'), mockHost);
      const body = mockResponse.json.mock.calls[0][0];
      expect(body.meta.correlationId).toBeUndefined();
    });
  });

  describe('structured logging', () => {
    it('should log 5xx errors via logger.error with stack trace', () => {
      const err = new Error('server crash');
      filter.catch(err, mockHost);
      expect(mockLogger.error).toHaveBeenCalled();
      const [msg, stack] = mockLogger.error.mock.calls[0];
      expect(msg).toContain('INTERNAL_ERROR');
      expect(msg).toContain('server crash');
      expect(stack).toContain('Error: server crash');
    });

    it('should log 4xx errors via logger.warn', () => {
      filter.catch(new HttpException('bad', HttpStatus.BAD_REQUEST), mockHost);
      expect(mockLogger.warn).toHaveBeenCalled();
      const [msg] = mockLogger.warn.mock.calls[0];
      expect(msg).toContain('BAD_REQUEST');
    });

    it('should include correlationId in structured log payload', () => {
      filter.catch(new Error('oops'), mockHost);
      const [, , payloadStr] = mockLogger.error.mock.calls[0];
      const payload = JSON.parse(payloadStr);
      expect(payload.correlationId).toBe('test-corr-id');
      expect(payload.method).toBe('GET');
      expect(payload.url).toBe('/api/v1/test');
    });

    it('should not log when no logger is provided', () => {
      const filterNoLogger = new GlobalExceptionFilter();
      filterNoLogger.catch(new Error('oops'), mockHost);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });
});
