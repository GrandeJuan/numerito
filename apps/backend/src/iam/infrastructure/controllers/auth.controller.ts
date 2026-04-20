import { Controller, Post, Get, Body, HttpCode, HttpStatus, Inject, Param, Req, UseGuards, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RegistrarUsuarioHandler } from '../../application/commands/registrar-usuario.command';
import { IniciarSesionHandler } from '../../application/commands/iniciar-sesion.command';
import { CerrarSesionHandler } from '../../application/commands/cerrar-sesion.command';
import { AutenticarSsoHandler } from '../../application/commands/autenticar-sso.command';
import { SolicitarResetPasswordHandler } from '../../application/commands/solicitar-reset-password.command';
import { ResetearPasswordHandler } from '../../application/commands/resetear-password.command';
import { Activar2FAHandler } from '../../application/commands/activar-2fa.command';
import { Verificar2FAHandler } from '../../application/commands/verificar-2fa.command';
import { Reenviar2FAHandler } from '../../application/commands/reenviar-2fa.command';
import { TOKEN_SERVICE } from '../../application/services/token.service';
import type { TokenService } from '../../application/services/token.service';
import { TOTP_SECRET_REPOSITORY } from '../../domain/repositories/totp-secret.repository';
import type { TotpSecretRepository } from '../../domain/repositories/totp-secret.repository';
import { RegistrarUsuarioDto, registrarUsuarioDtoSchema } from '../../application/dtos/registrar-usuario.dto';
import { IniciarSesionDto, iniciarSesionDtoSchema } from '../../application/dtos/iniciar-sesion.dto';
import { SolicitarResetPasswordDto, solicitarResetPasswordDtoSchema } from '../../application/dtos/solicitar-reset-password.dto';
import { ResetearPasswordDto, resetearPasswordDtoSchema } from '../../application/dtos/resetear-password.dto';
import { RefreshTokenDto, refreshTokenDtoSchema } from '../../application/dtos/refresh-token.dto';
import { Verificar2FADto, verificar2FADtoSchema } from '../../application/dtos/verificar-2fa.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';
import { Public } from '../decorators/public.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import type { Rol } from '@numerito/shared';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly registrarHandler: RegistrarUsuarioHandler,
    private readonly iniciarSesionHandler: IniciarSesionHandler,
    private readonly cerrarSesionHandler: CerrarSesionHandler,
    private readonly autenticarSsoHandler: AutenticarSsoHandler,
    private readonly solicitarResetHandler: SolicitarResetPasswordHandler,
    private readonly resetearPasswordHandler: ResetearPasswordHandler,
    private readonly activar2FAHandler: Activar2FAHandler,
    private readonly verificar2FAHandler: Verificar2FAHandler,
    private readonly reenviar2FAHandler: Reenviar2FAHandler,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
    @Inject(TOTP_SECRET_REPOSITORY) private readonly totpSecretRepo: TotpSecretRepository,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  async register(@Body(new ZodValidationPipe(registrarUsuarioDtoSchema)) dto: RegistrarUsuarioDto) {
    return this.registrarHandler.execute({
      ...dto,
      rol: dto.rol as Rol,
    });
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  async login(@Body(new ZodValidationPipe(iniciarSesionDtoSchema)) dto: IniciarSesionDto) {
    return this.iniciarSesionHandler.execute(dto);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar reset de contraseña' })
  async forgotPassword(@Body(new ZodValidationPipe(solicitarResetPasswordDtoSchema)) dto: SolicitarResetPasswordDto) {
    return this.solicitarResetHandler.execute(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resetear contraseña con token' })
  async resetPassword(@Body(new ZodValidationPipe(resetearPasswordDtoSchema)) dto: ResetearPasswordDto) {
    return this.resetearPasswordHandler.execute(dto);
  }

  @Public()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refrescar access token' })
  async refreshToken(@Body(new ZodValidationPipe(refreshTokenDtoSchema)) dto: RefreshTokenDto) {
    const payload = this.tokenService.verifyRefreshToken(dto.refreshToken);

    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshToken = this.tokenService.generateRefreshToken(payload);

    return { accessToken, refreshToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar sesión' })
  async logout(@CurrentUser('sub') usuarioId: string) {
    return this.cerrarSesionHandler.execute({ usuarioId });
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Iniciar login con Google' })
  googleLogin() {
    // Passport redirects to Google
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Callback de Google OAuth' })
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const result = await this.autenticarSsoHandler.execute(req.user as any);
    const frontendUrl = this.getFrontendUrl();
    const params = new URLSearchParams({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
    res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
  }

  @Public()
  @Get('microsoft')
  @UseGuards(AuthGuard('microsoft'))
  @ApiOperation({ summary: 'Iniciar login con Microsoft' })
  microsoftLogin() {
    // Passport redirects to Microsoft
  }

  @Public()
  @Get('microsoft/callback')
  @UseGuards(AuthGuard('microsoft'))
  @ApiOperation({ summary: 'Callback de Microsoft OAuth' })
  async microsoftCallback(@Req() req: Request, @Res() res: Response) {
    const result = await this.autenticarSsoHandler.execute(req.user as any);
    const frontendUrl = this.getFrontendUrl();
    const params = new URLSearchParams({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
    res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
  }

  private getFrontendUrl(): string {
    return process.env.FRONTEND_URL || 'http://localhost:3000';
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
  async verify2FA(@Param('usuarioId') usuarioId: string, @Body(new ZodValidationPipe(verificar2FADtoSchema)) dto: Verificar2FADto) {
    return this.verificar2FAHandler.execute({ usuarioId, code: dto.code });
  }

  @Post('2fa/resend')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reenviar código 2FA' })
  async resend2FA(@CurrentUser('sub') usuarioId: string) {
    await this.reenviar2FAHandler.execute({ usuarioId });
  }
}
