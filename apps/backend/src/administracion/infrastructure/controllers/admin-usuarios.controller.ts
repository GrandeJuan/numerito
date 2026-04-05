import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../iam/infrastructure/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../guards/superadmin.guard';
import { ObtenerAdminUsuariosHandler } from '../../application/queries/obtener-admin-usuarios.query';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';

@ApiTags('Admin — Usuarios')
@Controller({ path: 'admin/usuarios', version: '1' })
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class AdminUsuariosController {
  constructor(private readonly handler: ObtenerAdminUsuariosHandler) {}

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
}
