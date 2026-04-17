import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * @deprecated Use `@Principal()` from `estudio-principal.decorator.ts` instead.
 *
 * Legacy decorator that extracts `estudioId` as a plain string from the
 * request object. Superseded by the typed `EstudioPrincipal` pattern
 * introduced in Phase 1 (#211). All bounded-context controllers have
 * been migrated to `@Principal()` in Phase 2 (#225–#228).
 *
 * This decorator will be removed in a future release.
 */
export const EstudioId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.estudioId;
  },
);
