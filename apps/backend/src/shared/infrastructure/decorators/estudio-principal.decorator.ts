import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { EstudioPrincipal } from '../../domain/estudio-principal';

/**
 * Extracts the {@link EstudioPrincipal} from the request.
 *
 * Returns `undefined` when the interceptor did not build a principal
 * (e.g., unauthenticated request or missing `x-estudio-id` header).
 *
 * Usage:
 * ```ts
 * @Get()
 * list(@Principal() principal: EstudioPrincipal) { ... }
 * ```
 */
export const Principal = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): EstudioPrincipal | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.estudioPrincipal;
  },
);
