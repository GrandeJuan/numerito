import { Controller, Get, Headers, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '../../../iam/infrastructure/decorators/current-user.decorator';
import { ObtenerDashboardStatsHandler } from '../../application/queries/obtener-dashboard-stats.query';
import { ObtenerActividadHandler } from '../../application/queries/obtener-actividad.query';
import { ObtenerCumplimientoSocioHandler } from '../../application/queries/obtener-cumplimiento-socio.query';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';

@ApiTags('Dashboard')
@Controller({ path: 'dashboard', version: '1' })
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(
    private readonly statsHandler: ObtenerDashboardStatsHandler,
    private readonly actividadHandler: ObtenerActividadHandler,
    private readonly cumplimientoHandler: ObtenerCumplimientoSocioHandler,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas del dashboard del estudio' })
  async getStats(
    @Headers('x-estudio-id') estudioId: string,
    @CurrentUser('sub') usuarioId: string,
  ) {
    const stats = await this.statsHandler.execute({ estudioId, usuarioId });
    return successResponse(stats);
  }

  @Get('actividad')
  @ApiOperation({ summary: 'Listado extendido de actividad reciente' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'tipo', required: false, enum: ['todos', 'tarea', 'vencimiento'] })
  async getActividad(
    @Headers('x-estudio-id') estudioId: string,
    @CurrentUser('sub') usuarioId: string,
    @Query('limit') limit?: string,
    @Query('tipo') tipo?: 'todos' | 'tarea' | 'vencimiento',
  ) {
    const items = await this.actividadHandler.execute({
      estudioId,
      usuarioId,
      limit: limit ? Number(limit) : undefined,
      tipo,
    });
    return successResponse(items);
  }

  @Get('cumplimiento-socio')
  @ApiOperation({
    summary: 'Dashboard del socio: cumplimiento por responsable, en riesgo, filtros',
  })
  @ApiQuery({ name: 'periodo', required: false, description: 'Periodo fiscal YYYY-MM' })
  @ApiQuery({ name: 'tipoObligacionId', required: false, type: Number })
  @ApiQuery({ name: 'clienteId', required: false })
  @ApiQuery({ name: 'responsableId', required: false })
  @ApiQuery({
    name: 'diasRiesgo',
    required: false,
    type: Number,
    description: 'Días para considerar en riesgo (default 3)',
  })
  async getCumplimientoSocio(
    @Headers('x-estudio-id') estudioId: string,
    @CurrentUser('sub') usuarioId: string,
    @Query('periodo') periodo?: string,
    @Query('tipoObligacionId') tipoObligacionId?: string,
    @Query('clienteId') clienteId?: string,
    @Query('responsableId') responsableId?: string,
    @Query('diasRiesgo') diasRiesgo?: string,
  ) {
    const result = await this.cumplimientoHandler.execute({
      estudioId,
      usuarioId,
      periodo,
      tipoObligacionId: tipoObligacionId ? Number(tipoObligacionId) : undefined,
      clienteId,
      responsableId,
      diasRiesgo: diasRiesgo ? Number(diasRiesgo) : undefined,
    });
    return successResponse(result);
  }
}
