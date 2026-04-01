import { Controller, Post, Body, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RegistrarUsuarioHandler } from '../../application/commands/registrar-usuario.command';
import { IniciarSesionHandler } from '../../application/commands/iniciar-sesion.command';
import { USUARIO_REPOSITORY } from '../../domain/repositories/usuario.repository';
import type { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { TOKEN_SERVICE } from '../../application/services/token.service';
import type { TokenService } from '../../application/services/token.service';

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
  async register(
    @Body() body: { email: string; password: string; nombre: string; apellido: string; rol: string },
  ) {
    return this.registrarHandler.execute(body as any);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  async login(@Body() body: { email: string; password: string }) {
    return this.iniciarSesionHandler.execute(body);
  }
}
