import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { EstudioPrincipal } from '../../domain/estudio-principal';
import { ESTUDIO_ID_HEADER } from '../middleware/request-context.middleware';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
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
    const userId: string | undefined = user?.sub ?? user?.id;
    const roles: string[] = user?.roles ?? (user?.rol ? [user.rol] : []);

    if (estudioId && userId) {
      req.estudioPrincipal = {
        estudioId,
        userId,
        roles,
      };
    }

    return next.handle();
  }
}
