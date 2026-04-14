import { Inject, Injectable, NestMiddleware, Optional } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { StructuredLogger } from '../logger/structured-logger.service';
import { CORRELATION_ID_HEADER } from './request-context.middleware';

@Injectable()
export class HttpLoggingMiddleware implements NestMiddleware {
  constructor(
    @Optional()
    @Inject(StructuredLogger)
    private readonly logger?: StructuredLogger,
  ) {
    this.logger?.setContext('HTTP');
  }

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const correlationId = req.headers[CORRELATION_ID_HEADER] as string | undefined;

    // Echo correlation ID back in response headers
    if (correlationId) {
      res.setHeader(CORRELATION_ID_HEADER, correlationId);
    }

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { method, originalUrl } = req;
      const { statusCode } = res;

      if (this.logger) {
        const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
        const entry = {
          method,
          url: originalUrl,
          statusCode,
          duration,
          correlationId,
        };

        if (level === 'error') {
          this.logger.error(`${method} ${originalUrl} ${statusCode} ${duration}ms`, entry as any);
        } else if (level === 'warn') {
          this.logger.warn(`${method} ${originalUrl} ${statusCode} ${duration}ms`, entry as any);
        } else {
          this.logger.log(`${method} ${originalUrl} ${statusCode} ${duration}ms`, entry as any);
        }
      }
    });

    next();
  }
}
