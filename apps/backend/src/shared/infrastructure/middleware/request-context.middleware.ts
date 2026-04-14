import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { RequestContextService, REQUEST_CONTEXT } from '../services/request-context.service';

export const CORRELATION_ID_HEADER = 'x-correlation-id';
export const ESTUDIO_ID_HEADER = 'x-estudio-id';

declare global {
  namespace Express {
    interface Request {
      estudioId?: string;
    }
  }
}

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(
    @Inject(REQUEST_CONTEXT)
    private readonly context: RequestContextService,
  ) {}

  use(req: Request, _res: Response, next: NextFunction) {
    const estudioId = req.headers[ESTUDIO_ID_HEADER] as string | undefined;
    if (estudioId) {
      this.context.estudioId = estudioId;
      req.estudioId = estudioId;
    }

    const user = (req as any).user;
    if (user?.id) {
      this.context.userId = user.id;
    }

    this.context.correlationId = (req.headers[CORRELATION_ID_HEADER] as string) || randomUUID();

    next();
  }
}
