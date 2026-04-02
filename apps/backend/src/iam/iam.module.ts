import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { JwtTokenService } from './infrastructure/services/jwt-token.service';
import { JwtAuthGuard } from './infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from './infrastructure/guards/roles.guard';
import { TOKEN_SERVICE } from './application/services/token.service';
import { USUARIO_REPOSITORY } from './domain/repositories/usuario.repository';
import { MikroOrmUsuarioRepository } from './infrastructure/persistence/mikro-orm-usuario.repository';

@Module({
  imports: [JwtModule.register({}), ConfigModule],
  providers: [
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    { provide: USUARIO_REPOSITORY, useClass: MikroOrmUsuarioRepository },
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [TOKEN_SERVICE, USUARIO_REPOSITORY, JwtAuthGuard, RolesGuard],
})
export class IamModule {}
