import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ObtenerEstudiosUsuarioHandler } from '../../application/queries/obtener-estudios-usuario.query';
import { CurrentUser } from '../decorators/current-user.decorator';

@ApiTags('Usuarios')
@Controller({ path: 'usuarios', version: '1' })
export class UsuarioController {
  constructor(
    private readonly obtenerEstudiosHandler: ObtenerEstudiosUsuarioHandler,
  ) {}

  @Get('me/estudios')
  @ApiOperation({ summary: 'Obtener estudios del usuario autenticado' })
  async getMisEstudios(@CurrentUser('sub') usuarioId: string) {
    return this.obtenerEstudiosHandler.execute({ usuarioId });
  }
}
