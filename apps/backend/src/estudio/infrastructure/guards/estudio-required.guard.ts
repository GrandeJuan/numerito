import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';

@Injectable()
export class EstudioRequiredGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    if (!request.estudioId) {
      throw new BadRequestException('Header x-estudio-id es requerido');
    }
    return true;
  }
}
