import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './infrastructure/controllers/auth.controller';
import { JwtTokenService } from './infrastructure/services/jwt-token.service';
import { JwtAuthGuard } from './infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from './infrastructure/guards/roles.guard';
import { TOKEN_SERVICE } from './application/services/token.service';
import { USUARIO_REPOSITORY } from './domain/repositories/usuario.repository';
import { MikroOrmUsuarioRepository } from './infrastructure/persistence/mikro-orm-usuario.repository';
import { RESET_TOKEN_REPOSITORY } from './domain/repositories/reset-token.repository';
import { MikroOrmResetTokenRepository } from './infrastructure/persistence/mikro-orm-reset-token.repository';
import { TOTP_SECRET_REPOSITORY } from './domain/repositories/totp-secret.repository';
import { MikroOrmTotpSecretRepository } from './infrastructure/persistence/mikro-orm-totp-secret.repository';
import { SESION_REPOSITORY } from './domain/repositories/sesion.repository';
import { MikroOrmSesionRepository } from './infrastructure/persistence/mikro-orm-sesion.repository';

@Module({
  imports: [JwtModule.register({}), ConfigModule],
  controllers: [AuthController],
  providers: [
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    { provide: USUARIO_REPOSITORY, useClass: MikroOrmUsuarioRepository },
    { provide: RESET_TOKEN_REPOSITORY, useClass: MikroOrmResetTokenRepository },
    { provide: TOTP_SECRET_REPOSITORY, useClass: MikroOrmTotpSecretRepository },
    { provide: SESION_REPOSITORY, useClass: MikroOrmSesionRepository },
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [TOKEN_SERVICE, USUARIO_REPOSITORY, RESET_TOKEN_REPOSITORY, TOTP_SECRET_REPOSITORY, SESION_REPOSITORY, JwtAuthGuard, RolesGuard],
})
export class IamModule {}
