import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, LoggerService, Optional, Inject } from '@nestjs/common';
import { Request, Response } from 'express';
import { errorResponse } from '../responses/api-response';
import { DomainException } from '../../domain/exceptions/domain.exception';
import { CORRELATION_ID_HEADER } from '../middleware/request-context.middleware';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    @Optional() @Inject('LoggerService') private readonly logger?: LoggerService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof DomainException) {
      statusCode = exception.httpStatus;
      message = exception.message;
      code = exception.code;
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exResponse = exception.getResponse();

      if (typeof exResponse === 'string') {
        message = exResponse;
      } else if (typeof exResponse === 'object' && exResponse !== null) {
        const obj = exResponse as Record<string, unknown>;
        message = (obj.message as string) || message;
        code = (obj.code as string) || this.statusToCode(statusCode);
      }

      code = this.statusToCode(statusCode);
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Extract correlation ID from the request header (set by RequestContextMiddleware)
    const correlationId = request?.headers?.[CORRELATION_ID_HEADER] as string | undefined;

    // Log the exception with structured context
    if (this.logger) {
      const logContext = {
        statusCode,
        code,
        method: request?.method,
        url: request?.url,
        correlationId,
      };

      if (statusCode >= 500) {
        this.logger.error(
          `[${code}] ${message}`,
          exception instanceof Error ? exception.stack : undefined,
          JSON.stringify(logContext),
        );
      } else if (statusCode >= 400) {
        this.logger.warn(
          `[${code}] ${message}`,
          JSON.stringify(logContext),
        );
      }
    }

    const body = errorResponse(code, message, statusCode, correlationId);
    response.status(statusCode).json(body);
  }

  private statusToCode(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_ERROR',
    };
    return map[status] || 'UNKNOWN_ERROR';
  }
}
