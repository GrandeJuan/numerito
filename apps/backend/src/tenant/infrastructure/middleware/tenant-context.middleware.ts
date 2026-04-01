import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export const TENANT_ID_HEADER = 'x-tenant-id';

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const tenantId = req.headers[TENANT_ID_HEADER] as string | undefined;
    if (tenantId) {
      req.tenantId = tenantId;
    }
    next();
  }
}
