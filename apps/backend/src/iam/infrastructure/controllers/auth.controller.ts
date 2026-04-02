import { Controller, Post, Body, HttpCode, HttpStatus, Inject, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RegistrarUsuarioHandler } from '../../application/commands/registrar-usuario.command';
import { IniciarSesionHandler } from '../../application/commands/iniciar-sesion.command';
import { SolicitarResetPasswordHandler } from '../../application/commands/solicitar-reset-password.command';
import { ResetearPasswordHandler } from '../../application/commands/resetear-password.command';
import { Activar2FAHandler } from '../../application/commands/activar-2fa.command';
import { Verificar2FAHandler } from '../../application/commands/verificar-2fa.command';
import { USUARIO_REPOSITORY } from '../../domain/repositories/usuario.repository';
import type { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { TOKEN_SERVICE } from '../../application/services/token.service';
import type { TokenService } from '../../application/services/token.service';
import { RESET_TOKEN_REPOSITORY } from '../../domain/repositories/reset-token.repository';
import type { ResetTokenRepository } from '../../domain/repositories/reset-token.repository';
import { TOTP_SECRET_REPOSITORY } from '../../domain/repositories/totp-secret.repository';
import type { TotpSecretRepository } from '../../domain/repositories/totp-secret.repository';
import { SESION_REPOSITORY } from '../../domain/repositories/sesion.repository';
import type { SesionRepository } from '../../domain/repositories/sesion.repository';
import { RegistrarUsuarioDto } from '../../application/dtos/registrar-usuario.dto';
import { IniciarSesionDto } from '../../application/dtos/iniciar-sesion.dto';
import { SolicitarResetPasswordDto } from '../../application/dtos/solicitar-reset-password.dto';
import { ResetearPasswordDto } from '../../application/dtos/resetear-password.dto';
import { RefreshTokenDto } from '../../application/dtos/refresh-token.dto';
import { Verificar2FADto } from '../../application/dtos/verificar-2fa.dto';
import { Public } from '../decorators/public.decorator';
import { TokenInvalidoError } from '../../../shared/domain/exceptions';
import type { Rol } from '@numerito/shared';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  private readonly registrarHandler: RegistrarUsuarioHandler;
  private readonly iniciarSesionHandler: IniciarSesionHandler;
  private readonly solicitarResetHandler: SolicitarResetPasswordHandler;
  private readonly resetearPasswordHandler: ResetearPasswordHandler;
  private readonly activar2FAHandler: Activar2FAHandler;
  private readonly verificar2FAHandler: Verificar2FAHandler;

  constructor(
    @Inject(USUARIO_REPOSITORY) usuarioRepo: UsuarioRepository,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
    @Inject(RESET_TOKEN_REPOSITORY) resetTokenRepo: ResetTokenRepository,
    @Inject(TOTP_SECRET_REPOSITORY) private readonly totpSecretRepo: TotpSecretRepository,
    @Inject(SESION_REPOSITORY) sesionRepo: SesionRepository,
  ) {
    this.registrarHandler = new RegistrarUsuarioHandler(usuarioRepo);
    this.iniciarSesionHandler = new IniciarSesionHandler(usuarioRepo, tokenService);
    this.solicitarResetHandler = new SolicitarResetPasswordHandler(usuarioRepo, resetTokenRepo);
    this.resetearPasswordHandler = new ResetearPasswordHandler(usuarioRepo, resetTokenRepo);
    this.activar2FAHandler = new Activar2FAHandler(usuarioRepo);
    this.verificar2FAHandler = new Verificar2FAHandler(totpSecretRepo);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  async register(@Body() dto: RegistrarUsuarioDto) {
    return this.registrarHandler.execute({
      ...dto,
      rol: dto.rol as Rol,
    });
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  async login(@Body() dto: IniciarSesionDto) {
    return this.iniciarSesionHandler.execute(dto);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar reset de contraseña' })
  async forgotPassword(@Body() dto: SolicitarResetPasswordDto) {
    return this.solicitarResetHandler.execute(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resetear contraseña con token' })
  async resetPassword(@Body() dto: ResetearPasswordDto) {
    return this.resetearPasswordHandler.execute(dto);
  }

  @Public()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refrescar access token' })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    const payload = this.tokenService.verifyRefreshToken(dto.refreshToken);

    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshToken = this.tokenService.generateRefreshToken(payload);

    return { accessToken, refreshToken };
  }

  @Post('2fa/activate')
  @ApiOperation({ summary: 'Activar 2FA' })
  async activate2FA(@Param('usuarioId') usuarioId: string) {
    const result = await this.activar2FAHandler.execute({ usuarioId });
    await this.totpSecretRepo.save({
      usuarioId,
      secret: result.secret,
      verified: false,
    });
    return result;
  }

  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar código 2FA' })
  async verify2FA(@Param('usuarioId') usuarioId: string, @Body() dto: Verificar2FADto) {
    return this.verificar2FAHandler.execute({ usuarioId, code: dto.code });
  }
}
