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
  let mockResponse: { status: jest.Mock; json: jest.Mock };
  let mockHost: any;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
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
    // Create an HttpException that returns null from getResponse
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
});
