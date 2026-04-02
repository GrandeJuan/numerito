import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './infrastructure/controllers/auth.controller';
import { JwtTokenService } from './infrastructure/services/jwt-token.service';
import { JwtAuthGuard } from './infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from './infrastructure/guards/roles.guard';
import { RegistrarUsuarioHandler } from './application/commands/registrar-usuario.command';
import { IniciarSesionHandler } from './application/commands/iniciar-sesion.command';
import { SolicitarResetPasswordHandler } from './application/commands/solicitar-reset-password.command';
import { ResetearPasswordHandler } from './application/commands/resetear-password.command';
import { Activar2FAHandler } from './application/commands/activar-2fa.command';
import { Verificar2FAHandler } from './application/commands/verificar-2fa.command';
import { TOKEN_SERVICE } from './application/services/token.service';
import type { TokenService } from './application/services/token.service';
import { USUARIO_REPOSITORY } from './domain/repositories/usuario.repository';
import type { UsuarioRepository } from './domain/repositories/usuario.repository';
import { MikroOrmUsuarioRepository } from './infrastructure/persistence/mikro-orm-usuario.repository';
import { RESET_TOKEN_REPOSITORY } from './domain/repositories/reset-token.repository';
import type { ResetTokenRepository } from './domain/repositories/reset-token.repository';
import { MikroOrmResetTokenRepository } from './infrastructure/persistence/mikro-orm-reset-token.repository';
import { TOTP_SECRET_REPOSITORY } from './domain/repositories/totp-secret.repository';
import type { TotpSecretRepository } from './domain/repositories/totp-secret.repository';
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
    {
      provide: RegistrarUsuarioHandler,
      useFactory: (repo: UsuarioRepository) => new RegistrarUsuarioHandler(repo),
      inject: [USUARIO_REPOSITORY],
    },
    {
      provide: IniciarSesionHandler,
      useFactory: (repo: UsuarioRepository, tokenService: TokenService) =>
        new IniciarSesionHandler(repo, tokenService),
      inject: [USUARIO_REPOSITORY, TOKEN_SERVICE],
    },
    {
      provide: SolicitarResetPasswordHandler,
      useFactory: (repo: UsuarioRepository, resetRepo: ResetTokenRepository) =>
        new SolicitarResetPasswordHandler(repo, resetRepo),
      inject: [USUARIO_REPOSITORY, RESET_TOKEN_REPOSITORY],
    },
    {
      provide: ResetearPasswordHandler,
      useFactory: (repo: UsuarioRepository, resetRepo: ResetTokenRepository) =>
        new ResetearPasswordHandler(repo, resetRepo),
      inject: [USUARIO_REPOSITORY, RESET_TOKEN_REPOSITORY],
    },
    {
      provide: Activar2FAHandler,
      useFactory: (repo: UsuarioRepository) => new Activar2FAHandler(repo),
      inject: [USUARIO_REPOSITORY],
    },
    {
      provide: Verificar2FAHandler,
      useFactory: (repo: TotpSecretRepository) => new Verificar2FAHandler(repo),
      inject: [TOTP_SECRET_REPOSITORY],
    },
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [TOKEN_SERVICE, USUARIO_REPOSITORY, RESET_TOKEN_REPOSITORY, TOTP_SECRET_REPOSITORY, SESION_REPOSITORY, JwtAuthGuard, RolesGuard],
})
export class IamModule {}
