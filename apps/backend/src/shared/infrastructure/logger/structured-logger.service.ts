import { Injectable, LoggerService, Scope, Inject, Optional } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { RequestContextService, REQUEST_CONTEXT } from '../services/request-context.service';

export interface LogEntry {
  level: string;
  msg: string;
  timestamp: string;
  context?: string;
  correlationId?: string;
  estudioId?: string;
  userId?: string;
  [key: string]: unknown;
}

/**
 * Structured logger backed by Pino (via nestjs-pino).
 *
 * Automatically includes request context (correlationId, estudioId, userId)
 * in every log entry. Use as NestJS LoggerService replacement or inject
 * directly into services.
 *
 * Falls back to process.stdout/stderr if PinoLogger is not available
 * (e.g. during bootstrap or in tests).
 */
@Injectable({ scope: Scope.TRANSIENT })
export class StructuredLogger implements LoggerService {
  private context?: string;

  constructor(
    @Optional()
    @Inject(REQUEST_CONTEXT)
    private readonly requestContext?: RequestContextService,
    @Optional()
    private readonly pino?: PinoLogger,
  ) {}

  setContext(context: string): void {
    this.context = context;
    if (this.pino) {
      this.pino.setContext(context);
    }
  }

  log(message: string, ...optionalParams: unknown[]): void {
    if (this.pino) {
      this.pino.info(this.mergeContext(optionalParams), message);
    } else {
      this.writeLog('info', message, optionalParams);
    }
  }

  error(message: string, ...optionalParams: unknown[]): void {
    if (this.pino) {
      const ctx = this.mergeContext(optionalParams);
      this.pino.error(ctx, message);
    } else {
      this.writeLog('error', message, optionalParams);
    }
  }

  warn(message: string, ...optionalParams: unknown[]): void {
    if (this.pino) {
      this.pino.warn(this.mergeContext(optionalParams), message);
    } else {
      this.writeLog('warn', message, optionalParams);
    }
  }

  debug(message: string, ...optionalParams: unknown[]): void {
    if (this.pino) {
      this.pino.debug(this.mergeContext(optionalParams), message);
    } else {
      this.writeLog('debug', message, optionalParams);
    }
  }

  verbose(message: string, ...optionalParams: unknown[]): void {
    if (this.pino) {
      this.pino.trace(this.mergeContext(optionalParams), message);
    } else {
      this.writeLog('trace', message, optionalParams);
    }
  }

  /** Build a structured context object from NestJS-style optional params */
  private mergeContext(optionalParams: unknown[]): Record<string, unknown> {
    const ctx: Record<string, unknown> = {};

    // Request context
    if (this.requestContext) {
      if (this.requestContext.correlationId) ctx.correlationId = this.requestContext.correlationId;
      if (this.requestContext.estudioId) ctx.estudioId = this.requestContext.estudioId;
      if (this.requestContext.userId) ctx.userId = this.requestContext.userId;
    }

    // Context name
    const lastParam = optionalParams[optionalParams.length - 1];
    if (typeof lastParam === 'string' && optionalParams.length > 0) {
      ctx.context = lastParam;
    } else if (this.context) {
      ctx.context = this.context;
    }

    // Error/stack/extra from first param
    const first = optionalParams[0];
    if (first instanceof Error) {
      ctx.err = first;
    } else if (typeof first === 'string' && first !== lastParam) {
      ctx.stack = first;
    } else if (typeof first === 'object' && first !== null && first !== lastParam) {
      Object.assign(ctx, first);
    }

    return ctx;
  }

  // --- Fallback (no pino): write JSON to stdout/stderr ---

  private writeLog(level: string, message: string, optionalParams: unknown[]): void {
    const entry = this.buildEntry(level, message, optionalParams);
    const json = JSON.stringify(entry);

    switch (level) {
      case 'error':
        process.stderr.write(json + '\n');
        break;
      default:
        process.stdout.write(json + '\n');
        break;
    }
  }

  buildEntry(level: string, message: string, optionalParams: unknown[] = []): LogEntry {
    const entry: LogEntry = {
      level,
      msg: message,
      timestamp: new Date().toISOString(),
    };

    const lastParam = optionalParams[optionalParams.length - 1];
    if (typeof lastParam === 'string' && optionalParams.length > 0) {
      entry.context = lastParam;
    } else if (this.context) {
      entry.context = this.context;
    }

    if (this.requestContext) {
      if (this.requestContext.correlationId) entry.correlationId = this.requestContext.correlationId;
      if (this.requestContext.estudioId) entry.estudioId = this.requestContext.estudioId;
      if (this.requestContext.userId) entry.userId = this.requestContext.userId;
    }

    const stackOrExtra = optionalParams[0];
    if (stackOrExtra instanceof Error) {
      entry.err = {
        message: stackOrExtra.message,
        name: stackOrExtra.name,
        stack: stackOrExtra.stack,
      };
    } else if (typeof stackOrExtra === 'string' && level === 'error' && stackOrExtra !== lastParam) {
      entry.stack = stackOrExtra;
    } else if (typeof stackOrExtra === 'object' && stackOrExtra !== null && !(typeof lastParam === 'string' && stackOrExtra === lastParam)) {
      Object.assign(entry, stackOrExtra);
    }

    return entry;
  }
}
