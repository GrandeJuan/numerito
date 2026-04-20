import { Injectable, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ROL } from '@numerito/shared';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class AdminGuard extends JwtAuthGuard {
  constructor(
    jwtService: JwtService,
    configService: ConfigService,
    private readonly adminReflector: Reflector,
  ) {
    super(jwtService, configService, adminReflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.adminReflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    await super.canActivate(context);

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.rol !== ROL.SUPERADMIN) {
      throw new ForbiddenException('Acceso restringido a superadministradores');
    }

    return true;
  }
}
