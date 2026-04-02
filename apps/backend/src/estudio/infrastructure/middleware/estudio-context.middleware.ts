import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export const ESTUDIO_ID_HEADER = 'x-estudio-id';

declare global {
  namespace Express {
    interface Request {
      estudioId?: string;
    }
  }
}

@Injectable()
export class EstudioContextMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const estudioId = req.headers[ESTUDIO_ID_HEADER] as string | undefined;
    if (estudioId) {
      req.estudioId = estudioId;
    }
    next();
  }
}
