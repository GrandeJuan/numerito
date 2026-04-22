import { Injectable, ExecutionContext, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../../shared/infrastructure/decorators/public.decorator';
import { JwtAuthGuard } from '../../../shared/infrastructure/guards/jwt-auth.guard';

@Injectable()
export class EstudioMemberGuard extends JwtAuthGuard {
  constructor(
    jwtService: JwtService,
    configService: ConfigService,
    private readonly memberReflector: Reflector,
  ) {
    super(jwtService, configService, memberReflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.memberReflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    await super.canActivate(context);

    const request = context.switchToHttp().getRequest();

    if (!request.estudioId) {
      throw new BadRequestException('Header x-estudio-id es requerido');
    }

    return true;
  }
}
