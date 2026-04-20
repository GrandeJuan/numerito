import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Guard for Fargate→Backend webhook calls.
 *
 * Validates the `x-ingesta-secret` header against the INGESTA_SECRET env var.
 * Used on the POST /:fuente/resultado endpoint as an alternative to AdminGuard
 * for machine-to-machine authentication from Fargate tasks.
 */
@Injectable()
export class IngestaWebhookGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const secret = request.headers['x-ingesta-secret'];
    const expected = this.configService.get<string>('INGESTA_SECRET');

    if (!expected) {
      throw new UnauthorizedException('INGESTA_SECRET not configured on server');
    }

    if (!secret || secret !== expected) {
      throw new UnauthorizedException('Invalid or missing x-ingesta-secret header');
    }

    return true;
  }
}
