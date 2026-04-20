import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Rol } from '@numerito/shared';
import { AdminGuard } from '../../../iam/infrastructure/guards/admin.guard';
import { ObtenerAdminUsuariosHandler } from '../../application/queries/obtener-admin-usuarios.query';
import { InvitarUsuarioAdminHandler } from '../../application/commands/invitar-usuario-admin.command';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';

@ApiTags('Admin — Usuarios')
@Controller({ path: 'admin/usuarios', version: '1' })
@UseGuards(AdminGuard)
export class AdminUsuariosController {
  constructor(
    private readonly handler: ObtenerAdminUsuariosHandler,
    private readonly invitarHandler: InvitarUsuarioAdminHandler,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar usuarios con filtros y paginación' })
  async list(@Query() query: Record<string, string>) {
    const filters = {
      ...(query.search && { search: query.search }),
      ...(query.rol && { rol: query.rol }),
      ...(query.isActive !== undefined && { isActive: query.isActive === 'true' }),
      ...(query.estudioId && { estudioId: query.estudioId }),
      ...(query.page && { page: Number(query.page) }),
      ...(query.limit && { limit: Number(query.limit) }),
    };

    const result = await this.handler.execute(filters);

    return successResponse(result.items, {
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas de usuarios' })
  async stats() {
    const data = await this.handler.getStats();
    return successResponse(data);
  }

  @Post('invitaciones')
  @ApiOperation({ summary: 'Invitar usuario de plataforma (superadmin/soporte)' })
  async invite(@Body() body: { email: string; nombre?: string; rol: Rol }) {
    const result = await this.invitarHandler.execute(body);
    return successResponse(result);
  }
}
