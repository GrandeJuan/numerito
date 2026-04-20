import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AdminGuard } from '../../../iam/infrastructure/guards/admin.guard';
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
    // Try webhook secret first (Fargate tasks)
    try {
      const webhookResult = this.webhookGuard.canActivate(context);
      if (webhookResult) return true;
    } catch {
      // Webhook auth failed — fall through to JWT
    }

    // Try JWT admin auth (human users)
    return this.adminGuard.canActivate(context);
  }
}
