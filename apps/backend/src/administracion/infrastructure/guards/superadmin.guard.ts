import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ROL } from '@numerito/shared';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.rol !== ROL.SUPERADMIN) {
      throw new ForbiddenException('Acceso restringido a superadministradores');
    }

    return true;
  }
}
