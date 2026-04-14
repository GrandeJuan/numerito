import { Controller, Get, Patch, Param, Query, Req, Inject, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../iam/infrastructure/guards/jwt-auth.guard';
import { NOTIFICACION_REPOSITORY } from '../../domain/repositories/notificacion.repository';
import type { NotificacionRepository } from '../../domain/repositories/notificacion.repository';
import {
  RecursoNoEncontradoError,
  OperacionInvalidaError,
} from '../../../shared/domain/exceptions';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';

@ApiTags('Notificaciones')
@Controller({ path: 'notificaciones', version: '1' })
@UseGuards(JwtAuthGuard)
export class NotificacionesController {
  constructor(
    @Inject(NOTIFICACION_REPOSITORY) private readonly notificacionRepo: NotificacionRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar notificaciones del usuario (paginado)' })
  async findAll(
    @Req() req: any,
    @Query('leida') leida?: string,
    @Query('limit') limit = 20,
    @Query('offset') offset = 0,
  ) {
    const usuarioId = req.user.sub;
    const leidaFilter = leida === 'true' ? true : leida === 'false' ? false : undefined;

    const result = await this.notificacionRepo.findByUsuario(usuarioId, {
      leida: leidaFilter,
      limit: Number(limit),
      offset: Number(offset),
    });

    const items = result.data.map((n) => ({
      id: n.id,
      tipo: n.tipo,
      mensaje: n.mensaje,
      leida: n.leida,
      createdAt: n.createdAt,
    }));
    return successResponse(items, {
      total: result.total,
      page: Math.floor(Number(offset) / Number(limit)) + 1,
      limit: Number(limit),
    });
  }

  @Patch(':id/leer')
  @ApiOperation({ summary: 'Marcar notificacion como leida' })
  async marcarLeida(@Req() req: any, @Param('id') id: string) {
    const usuarioId = req.user.sub;
    const notificacion = await this.notificacionRepo.findById(id);

    if (!notificacion) {
      throw new RecursoNoEncontradoError('Notificacion');
    }

    if (notificacion.usuarioId !== usuarioId) {
      throw new OperacionInvalidaError('No autorizado para esta notificacion');
    }

    notificacion.marcarLeida();
    await this.notificacionRepo.save(notificacion);

    return { ok: true };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Cantidad de notificaciones no leidas' })
  async unreadCount(@Req() req: any) {
    const usuarioId = req.user.sub;
    const count = await this.notificacionRepo.countUnread(usuarioId);
    return { count };
  }
}
