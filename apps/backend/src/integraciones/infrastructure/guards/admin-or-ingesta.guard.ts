import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AdminGuard } from '../../../shared/infrastructure/guards/admin.guard';
import { IngestaWebhookGuard } from './ingesta-webhook.guard';

/**
 * Composite guard: accepts either JWT admin token OR x-ingesta-secret header.
 *
 * Used on the POST /:fuente/resultado endpoint which is called by:
 * - Fargate tasks (x-ingesta-secret)
 * - Admin UI / manual tools (JWT Bearer token)
 */
@Injectable()
export class AdminOrIngestaGuard implements CanActivate {
  constructor(
    private readonly adminGuard: AdminGuard,
    private readonly webhookGuard: IngestaWebhookGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const hasSecretHeader = !!req.headers['x-ingesta-secret'];

    // If the caller sent a shared secret, that's the path they want (scraper
    // container). A bad secret is a hard 401 — don't fall through to JWT.
    if (hasSecretHeader) {
      return this.webhookGuard.canActivate(context);
    }

    // Otherwise, require a valid admin JWT (manual UI trigger).
    return this.adminGuard.canActivate(context);
  }
}
