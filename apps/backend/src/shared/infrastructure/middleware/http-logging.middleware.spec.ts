import { HttpLoggingMiddleware } from './http-logging.middleware';
import { StructuredLogger } from '../logger/structured-logger.service';
import { EventEmitter } from 'events';

describe('HttpLoggingMiddleware', () => {
  let middleware: HttpLoggingMiddleware;
  let mockLogger: jest.Mocked<StructuredLogger>;
  let mockReq: any;
  let mockRes: EventEmitter & { statusCode: number; setHeader: jest.Mock };
  let nextFn: jest.Mock;

  beforeEach(() => {
    mockLogger = {
      setContext: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any;

    middleware = new HttpLoggingMiddleware(mockLogger);

    mockReq = {
      method: 'GET',
      originalUrl: '/api/v1/clientes',
      headers: { 'x-correlation-id': 'corr-abc' },
    };

    mockRes = Object.assign(new EventEmitter(), {
      statusCode: 200,
      setHeader: jest.fn(),
    });

    nextFn = jest.fn();
  });

  it('should call next()', () => {
    middleware.use(mockReq, mockRes as any, nextFn);
    expect(nextFn).toHaveBeenCalled();
  });

  it('should echo correlation ID in response header', () => {
    middleware.use(mockReq, mockRes as any, nextFn);
    expect(mockRes.setHeader).toHaveBeenCalledWith('x-correlation-id', 'corr-abc');
  });

  it('should not set response header if no correlation ID', () => {
    mockReq.headers = {};
    middleware.use(mockReq, mockRes as any, nextFn);
    expect(mockRes.setHeader).not.toHaveBeenCalled();
  });

  it('should log on response finish with 200 using log()', () => {
    middleware.use(mockReq, mockRes as any, nextFn);
    mockRes.statusCode = 200;
    mockRes.emit('finish');

    expect(mockLogger.log).toHaveBeenCalled();
    const msg = mockLogger.log.mock.calls[0][0] as string;
    expect(msg).toContain('GET');
    expect(msg).toContain('/api/v1/clientes');
    expect(msg).toContain('200');
  });

  it('should log 4xx responses using warn()', () => {
    middleware.use(mockReq, mockRes as any, nextFn);
    mockRes.statusCode = 404;
    mockRes.emit('finish');

    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('should log 5xx responses using error()', () => {
    middleware.use(mockReq, mockRes as any, nextFn);
    mockRes.statusCode = 500;
    mockRes.emit('finish');

    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('should work without logger (no DI)', () => {
    const middlewareNoLogger = new HttpLoggingMiddleware();
    middlewareNoLogger.use(mockReq, mockRes as any, nextFn);
    mockRes.emit('finish');
    // Should not throw
    expect(nextFn).toHaveBeenCalled();
  });

  it('should set context to HTTP', () => {
    expect(mockLogger.setContext).toHaveBeenCalledWith('HTTP');
  });
});
