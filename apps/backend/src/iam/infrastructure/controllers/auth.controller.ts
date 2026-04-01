import { Controller, Post, Body, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RegistrarUsuarioHandler } from '../../application/commands/registrar-usuario.command';
import { IniciarSesionHandler } from '../../application/commands/iniciar-sesion.command';
import { USUARIO_REPOSITORY } from '../../domain/repositories/usuario.repository';
import type { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { TOKEN_SERVICE } from '../../application/services/token.service';
import type { TokenService } from '../../application/services/token.service';
import { RegistrarUsuarioDto } from '../../application/dtos/registrar-usuario.dto';
import { IniciarSesionDto } from '../../application/dtos/iniciar-sesion.dto';
import type { Rol } from '@numerito/shared';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  private readonly registrarHandler: RegistrarUsuarioHandler;
  private readonly iniciarSesionHandler: IniciarSesionHandler;

  constructor(
    @Inject(USUARIO_REPOSITORY) usuarioRepo: UsuarioRepository,
    @Inject(TOKEN_SERVICE) tokenService: TokenService,
  ) {
    this.registrarHandler = new RegistrarUsuarioHandler(usuarioRepo);
    this.iniciarSesionHandler = new IniciarSesionHandler(usuarioRepo, tokenService);
  }

  @Post('register')
  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  async register(@Body() dto: RegistrarUsuarioDto) {
    return this.registrarHandler.execute({
      ...dto,
      rol: dto.rol as Rol,
    });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  async login(@Body() dto: IniciarSesionDto) {
    return this.iniciarSesionHandler.execute(dto);
  }
}
