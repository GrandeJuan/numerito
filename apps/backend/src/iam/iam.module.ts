import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './infrastructure/controllers/auth.controller';
import { UsuarioController } from './infrastructure/controllers/usuario.controller';
import { JwtTokenService } from './infrastructure/services/jwt-token.service';
import { JwtAuthGuard } from './infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from './infrastructure/guards/roles.guard';
import { RegistrarUsuarioHandler } from './application/commands/registrar-usuario.command';
import { IniciarSesionHandler } from './application/commands/iniciar-sesion.command';
import { SolicitarResetPasswordHandler } from './application/commands/solicitar-reset-password.command';
import { ResetearPasswordHandler } from './application/commands/resetear-password.command';
import { Activar2FAHandler } from './application/commands/activar-2fa.command';
import { Verificar2FAHandler } from './application/commands/verificar-2fa.command';
import { CerrarSesionHandler } from './application/commands/cerrar-sesion.command';
import { AutenticarSsoHandler } from './application/commands/autenticar-sso.command';
import { GoogleStrategy } from './infrastructure/strategies/google.strategy';
import { MicrosoftStrategy } from './infrastructure/strategies/microsoft.strategy';
import { PassportModule } from '@nestjs/passport';
import { ObtenerEstudiosUsuarioHandler } from './application/queries/obtener-estudios-usuario.query';
import { ObtenerPermisosUsuarioHandler } from './application/queries/obtener-permisos-usuario.query';
import { PermisoService } from './application/services/permiso.service';
import type { SesionRepository } from './domain/repositories/sesion.repository';
import { USUARIO_ESTUDIO_REPOSITORY } from './domain/repositories/usuario-estudio.repository';
import type { UsuarioEstudioRepository } from './domain/repositories/usuario-estudio.repository';
import { ROL_PERMISO_REPOSITORY } from './domain/repositories/rol-permiso.repository';
import type { RolPermisoRepository } from './domain/repositories/rol-permiso.repository';
import { MikroOrmUsuarioEstudioRepository } from './infrastructure/persistence/mikro-orm-usuario-estudio.repository';
import { MikroOrmRolPermisoRepository } from './infrastructure/persistence/mikro-orm-rol-permiso.repository';
import { ESTUDIO_LOOKUP_SERVICE } from './application/services/estudio-lookup.service';
import type { EstudioLookupService } from './application/services/estudio-lookup.service';
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
  imports: [JwtModule.register({}), ConfigModule, PassportModule],
  controllers: [AuthController, UsuarioController],
  providers: [
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    { provide: USUARIO_REPOSITORY, useClass: MikroOrmUsuarioRepository },
    { provide: RESET_TOKEN_REPOSITORY, useClass: MikroOrmResetTokenRepository },
    { provide: TOTP_SECRET_REPOSITORY, useClass: MikroOrmTotpSecretRepository },
    { provide: SESION_REPOSITORY, useClass: MikroOrmSesionRepository },
    { provide: USUARIO_ESTUDIO_REPOSITORY, useClass: MikroOrmUsuarioEstudioRepository },
    { provide: ROL_PERMISO_REPOSITORY, useClass: MikroOrmRolPermisoRepository },
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
      provide: CerrarSesionHandler,
      useFactory: (sesionRepo: SesionRepository) => new CerrarSesionHandler(sesionRepo),
      inject: [SESION_REPOSITORY],
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
    {
      provide: ObtenerEstudiosUsuarioHandler,
      useFactory: (ueRepo: UsuarioEstudioRepository, estudioLookup: EstudioLookupService) =>
        new ObtenerEstudiosUsuarioHandler(ueRepo, estudioLookup),
      inject: [USUARIO_ESTUDIO_REPOSITORY, ESTUDIO_LOOKUP_SERVICE],
    },
    {
      provide: ObtenerPermisosUsuarioHandler,
      useFactory: (ueRepo: UsuarioEstudioRepository, rpRepo: RolPermisoRepository) =>
        new ObtenerPermisosUsuarioHandler(ueRepo, rpRepo),
      inject: [USUARIO_ESTUDIO_REPOSITORY, ROL_PERMISO_REPOSITORY],
    },
    {
      provide: AutenticarSsoHandler,
      useFactory: (repo: UsuarioRepository, tokenService: TokenService) =>
        new AutenticarSsoHandler(repo, tokenService),
      inject: [USUARIO_REPOSITORY, TOKEN_SERVICE],
    },
    ...(process.env.GOOGLE_CLIENT_ID ? [GoogleStrategy] : []),
    ...(process.env.MICROSOFT_CLIENT_ID ? [MicrosoftStrategy] : []),
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [TOKEN_SERVICE, USUARIO_REPOSITORY, RESET_TOKEN_REPOSITORY, TOTP_SECRET_REPOSITORY, SESION_REPOSITORY, USUARIO_ESTUDIO_REPOSITORY, JwtAuthGuard, RolesGuard],
})
export class IamModule {}
