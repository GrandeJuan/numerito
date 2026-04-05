import { Controller, Get, Patch, Body, Query, BadRequestException, Inject, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ObtenerEstudiosUsuarioHandler } from '../../application/queries/obtener-estudios-usuario.query';
import { ObtenerPermisosUsuarioHandler } from '../../application/queries/obtener-permisos-usuario.query';
import { USUARIO_REPOSITORY } from '../../domain/repositories/usuario.repository';
import type { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';

@ApiTags('Usuarios')
@Controller({ path: 'usuarios', version: '1' })
@UseGuards(JwtAuthGuard)
export class UsuarioController {
  constructor(
    private readonly obtenerEstudiosHandler: ObtenerEstudiosUsuarioHandler,
    private readonly obtenerPermisosHandler: ObtenerPermisosUsuarioHandler,
    @Inject(USUARIO_REPOSITORY) private readonly usuarioRepo: UsuarioRepository,
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

  @Patch('me/preferencias')
  @ApiOperation({ summary: 'Actualizar preferencias del usuario' })
  async updatePreferencias(
    @CurrentUser('sub') usuarioId: string,
    @Body() body: { themePreference?: 'light' | 'dark' },
  ) {
    const usuario = await this.usuarioRepo.findById(usuarioId);
    if (!usuario) throw new BadRequestException('Usuario no encontrado');

    if (body.themePreference) {
      usuario.changeThemePreference(body.themePreference);
    }

    await this.usuarioRepo.save(usuario);
    return successResponse({ themePreference: usuario.themePreference });
  }
}
