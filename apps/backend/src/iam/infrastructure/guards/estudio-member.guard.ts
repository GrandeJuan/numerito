import { Injectable, ExecutionContext, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class EstudioMemberGuard extends JwtAuthGuard {
  constructor(jwtService: JwtService, configService: ConfigService, reflector: Reflector) {
    super(jwtService, configService, reflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);

    const request = context.switchToHttp().getRequest();

    if (!request.estudioId) {
      throw new BadRequestException('Header x-estudio-id es requerido');
    }

    return true;
  }
}
