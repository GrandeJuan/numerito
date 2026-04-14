import { Injectable, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ROL } from '@numerito/shared';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class AdminGuard extends JwtAuthGuard {
  constructor(jwtService: JwtService, configService: ConfigService, reflector: Reflector) {
    super(jwtService, configService, reflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.rol !== ROL.SUPERADMIN) {
      throw new ForbiddenException('Acceso restringido a superadministradores');
    }

    return true;
  }
}
