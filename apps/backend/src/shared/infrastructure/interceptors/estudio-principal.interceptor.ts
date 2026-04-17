import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { EstudioPrincipal } from '../../domain/estudio-principal';
import { ESTUDIO_ID_HEADER } from '../middleware/request-context.middleware';

declare global {
  namespace Express {
    interface Request {
      estudioPrincipal?: EstudioPrincipal;
    }
  }
}

/**
 * Builds an {@link EstudioPrincipal} from the authenticated request and
 * attaches it to `req.estudioPrincipal`.
 *
 * Runs as a NestJS interceptor (after auth guards) so that `req.user`
 * is reliably populated. When either the estudio header or the user is
 * missing, the principal is simply not set — the request proceeds as
 * before (legacy `@EstudioId()` path still works in parallel).
 *
 * Registered globally via `APP_INTERCEPTOR` in {@link RequestContextModule}.
 */
@Injectable()
export class EstudioPrincipalInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest();
    const estudioId = req.headers?.[ESTUDIO_ID_HEADER] as string | undefined;
    const user = req.user;

    if (estudioId && user?.id) {
      req.estudioPrincipal = {
        estudioId,
        userId: user.id,
        roles: user.roles ?? [],
      };
    }

    return next.handle();
  }
}
