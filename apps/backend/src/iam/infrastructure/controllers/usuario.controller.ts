import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ObtenerEstudiosUsuarioHandler } from '../../application/queries/obtener-estudios-usuario.query';
import { ObtenerPermisosUsuarioHandler } from '../../application/queries/obtener-permisos-usuario.query';
import { CurrentUser } from '../decorators/current-user.decorator';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';

@ApiTags('Usuarios')
@Controller({ path: 'usuarios', version: '1' })
export class UsuarioController {
  constructor(
    private readonly obtenerEstudiosHandler: ObtenerEstudiosUsuarioHandler,
    private readonly obtenerPermisosHandler: ObtenerPermisosUsuarioHandler,
  ) {}

  @Get('me/estudios')
  @ApiOperation({ summary: 'Obtener estudios del usuario autenticado' })
  async getMisEstudios(@CurrentUser('sub') usuarioId: string) {
    return this.obtenerEstudiosHandler.execute({ usuarioId });
  }

  @Get('me/permisos')
  @ApiOperation({ summary: 'Obtener permisos del usuario en un estudio' })
  @ApiQuery({ name: 'estudioId', required: true, type: String })
  async getMisPermisos(
    @CurrentUser('sub') usuarioId: string,
    @Query('estudioId') estudioId: string,
  ) {
    if (!estudioId) throw new BadRequestException('estudioId is required');
    const permisos = await this.obtenerPermisosHandler.execute({ usuarioId, estudioId });
    return successResponse(permisos);
  }
}
