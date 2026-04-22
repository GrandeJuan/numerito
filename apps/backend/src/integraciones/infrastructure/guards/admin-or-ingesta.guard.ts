import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ROL } from '@numerito/shared';
import { IngestaWebhookGuard } from './ingesta-webhook.guard';

/**
 * Composite guard: accepts either JWT admin token OR x-ingesta-secret header.
 *
 * Used on the POST /:fuente/resultado endpoint which is called by:
 * - Fargate tasks (x-ingesta-secret)
 * - Admin UI / manual tools (JWT Bearer token)
 *
 * This guard does JWT+admin validation inline instead of delegating to
 * AdminGuard, because AdminGuard checks @Public() metadata — and the
 * resultado endpoint IS marked @Public() (to bypass the global JwtAuthGuard).
 * Delegating to AdminGuard would short-circuit and allow unauthenticated access.
 */
@Injectable()
export class AdminOrIngestaGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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

    // JWT admin path: validate token and check admin role directly.
    // We intentionally skip the @Public() check that AdminGuard performs,
    // because THIS guard is the auth layer for the @Public() route.
    const token = this.extractTokenFromHeader(req);
    if (!token) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET'),
      });
      req.user = payload;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    if (!req.user || req.user.rol !== ROL.SUPERADMIN) {
      throw new ForbiddenException('Acceso restringido a superadministradores');
    }

    return true;
  }

  private extractTokenFromHeader(request: {
    headers: { authorization?: string };
  }): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
