import { StructuredLogger, LogEntry } from './structured-logger.service';
import { RequestContextService } from '../services/request-context.service';

describe('StructuredLogger', () => {
  let logger: StructuredLogger;
  let requestContext: RequestContextService;
  let stdoutSpy: jest.SpyInstance;
  let stderrSpy: jest.SpyInstance;

  beforeEach(() => {
    requestContext = new RequestContextService();
    requestContext.correlationId = 'corr-123';
    requestContext.estudioId = 'est-456';
    requestContext.userId = 'user-789';

    // No PinoLogger injected — exercises the fallback JSON path
    logger = new StructuredLogger(requestContext);

    stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  });

  function parseOutput(spy: jest.SpyInstance): LogEntry {
    const raw = spy.mock.calls[0][0] as string;
    return JSON.parse(raw.trim());
  }

  describe('log levels', () => {
    it('should write info level to stdout', () => {
      logger.log('test message');
      const entry = parseOutput(stdoutSpy);
      expect(entry.level).toBe('info');
      expect(entry.msg).toBe('test message');
    });

    it('should write error level to stderr', () => {
      logger.error('error message');
      const entry = parseOutput(stderrSpy);
      expect(entry.level).toBe('error');
      expect(entry.msg).toBe('error message');
    });

    it('should write warn level to stdout', () => {
      logger.warn('warning');
      const entry = parseOutput(stdoutSpy);
      expect(entry.level).toBe('warn');
    });

    it('should write debug level to stdout', () => {
      logger.debug('debug info');
      const entry = parseOutput(stdoutSpy);
      expect(entry.level).toBe('debug');
    });

    it('should write verbose as trace level to stdout', () => {
      logger.verbose('verbose info');
      const entry = parseOutput(stdoutSpy);
      expect(entry.level).toBe('trace');
    });
  });

  describe('request context binding', () => {
    it('should include correlationId from request context', () => {
      logger.log('hello');
      const entry = parseOutput(stdoutSpy);
      expect(entry.correlationId).toBe('corr-123');
    });

    it('should include estudioId from request context', () => {
      logger.log('hello');
      const entry = parseOutput(stdoutSpy);
      expect(entry.estudioId).toBe('est-456');
    });

    it('should include userId from request context', () => {
      logger.log('hello');
      const entry = parseOutput(stdoutSpy);
      expect(entry.userId).toBe('user-789');
    });

    it('should omit undefined context fields', () => {
      const emptyCtx = new RequestContextService();
      emptyCtx.correlationId = 'only-corr';
      const loggerNoTenant = new StructuredLogger(emptyCtx);

      loggerNoTenant.log('hello');
      const entry = parseOutput(stdoutSpy);
      expect(entry.correlationId).toBe('only-corr');
      expect(entry.estudioId).toBeUndefined();
      expect(entry.userId).toBeUndefined();
    });

    it('should work without request context (no DI)', () => {
      const loggerNoDI = new StructuredLogger();
      loggerNoDI.log('standalone');
      const entry = parseOutput(stdoutSpy);
      expect(entry.correlationId).toBeUndefined();
      expect(entry.msg).toBe('standalone');
    });
  });

  describe('context name', () => {
    it('should use setContext value', () => {
      logger.setContext('MyService');
      logger.log('hello');
      const entry = parseOutput(stdoutSpy);
      expect(entry.context).toBe('MyService');
    });

    it('should use last string param as context (NestJS convention)', () => {
      logger.log('hello', 'ControllerName');
      const entry = parseOutput(stdoutSpy);
      expect(entry.context).toBe('ControllerName');
    });
  });

  describe('error handling', () => {
    it('should include Error object details', () => {
      const err = new Error('something broke');
      logger.error('failure', err);
      const entry = parseOutput(stderrSpy);
      expect(entry.err).toBeDefined();
      expect((entry.err as any).message).toBe('something broke');
      expect((entry.err as any).name).toBe('Error');
      expect((entry.err as any).stack).toBeDefined();
    });

    it('should include stack trace string', () => {
      logger.error('failure', 'stack trace here', 'SomeContext');
      const entry = parseOutput(stderrSpy);
      expect(entry.stack).toBe('stack trace here');
      expect(entry.context).toBe('SomeContext');
    });
  });

  describe('timestamp', () => {
    it('should include ISO timestamp', () => {
      logger.log('hello');
      const entry = parseOutput(stdoutSpy);
      expect(entry.timestamp).toBeDefined();
      expect(() => new Date(entry.timestamp)).not.toThrow();
      expect(new Date(entry.timestamp).toISOString()).toBe(entry.timestamp);
    });
  });

  describe('buildEntry', () => {
    it('should return a structured LogEntry without writing to stdout', () => {
      const entry = logger.buildEntry('info', 'test');
      expect(entry.level).toBe('info');
      expect(entry.msg).toBe('test');
      expect(entry.correlationId).toBe('corr-123');
      expect(stdoutSpy).not.toHaveBeenCalled();
    });
  });

  describe('pino delegation', () => {
    it('should delegate to PinoLogger.info when pino is available', () => {
      const mockPino = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        trace: jest.fn(),
        setContext: jest.fn(),
      };
      const pinoLogger = new StructuredLogger(requestContext, mockPino as any);

      pinoLogger.log('hello pino');
      expect(mockPino.info).toHaveBeenCalledWith(
        expect.objectContaining({ correlationId: 'corr-123' }),
        'hello pino',
      );
      expect(stdoutSpy).not.toHaveBeenCalled();
    });

    it('should delegate to PinoLogger.error when pino is available', () => {
      const mockPino = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        trace: jest.fn(),
        setContext: jest.fn(),
      };
      const pinoLogger = new StructuredLogger(requestContext, mockPino as any);
      const err = new Error('pino error');

      pinoLogger.error('failure', err);
      expect(mockPino.error).toHaveBeenCalledWith(
        expect.objectContaining({ err, correlationId: 'corr-123' }),
        'failure',
      );
    });

    it('should set context on PinoLogger when setContext is called', () => {
      const mockPino = {
        info: jest.fn(),
        setContext: jest.fn(),
      };
      const pinoLogger = new StructuredLogger(requestContext, mockPino as any);

      pinoLogger.setContext('TestModule');
      expect(mockPino.setContext).toHaveBeenCalledWith('TestModule');
    });
  });
});
