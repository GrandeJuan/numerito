import { Module, Global } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import type { IncomingMessage } from 'http';
import { ESTUDIO_ID_HEADER, CORRELATION_ID_HEADER } from '../middleware/request-context.middleware';
import { StructuredLogger } from './structured-logger.service';

export const STRUCTURED_LOGGER = Symbol('StructuredLogger');

@Global()
@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        // Generate request ID from correlation header or random UUID
        genReqId: (req: IncomingMessage) =>
          (req.headers[CORRELATION_ID_HEADER] as string) || randomUUID(),

        // Attach tenant context to every log line for the request
        customProps: (req: IncomingMessage) => {
          const props: Record<string, string> = {};
          const estudioId = req.headers[ESTUDIO_ID_HEADER] as string | undefined;
          if (estudioId) {
            props.estudioId = estudioId;
          }
          const user = (req as any).user;
          if (user?.id) {
            props.userId = user.id;
          }
          return props;
        },

        // Use 'correlationId' instead of pino-http default 'reqId'
        customAttributeKeys: {
          reqId: 'correlationId',
        },

        // Structured JSON in production, pretty-print in development
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,

        // Log level from env, default to 'info'
        level: process.env.LOG_LEVEL || 'info',

        // Quieter request serialization (no headers/remoteAddress by default)
        serializers: {
          req: (req) => ({
            method: req.method,
            url: req.url,
          }),
          res: (res) => ({
            statusCode: res.statusCode,
          }),
        },
      },
    }),
  ],
  providers: [
    StructuredLogger,
    {
      provide: STRUCTURED_LOGGER,
      useClass: StructuredLogger,
    },
  ],
  exports: [PinoLoggerModule, StructuredLogger, STRUCTURED_LOGGER],
})
export class LoggerModule {}
