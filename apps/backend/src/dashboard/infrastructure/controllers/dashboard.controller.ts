import { Controller, Get, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../../../iam/infrastructure/decorators/current-user.decorator';
import { ObtenerDashboardStatsHandler } from '../../application/queries/obtener-dashboard-stats.query';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';

@ApiTags('Dashboard')
@Controller({ path: 'dashboard', version: '1' })
export class DashboardController {
  constructor(private readonly statsHandler: ObtenerDashboardStatsHandler) {}

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas del dashboard del estudio' })
  async getStats(
    @Headers('x-estudio-id') estudioId: string,
    @CurrentUser('sub') usuarioId: string,
  ) {
    const stats = await this.statsHandler.execute({ estudioId, usuarioId });
    return successResponse(stats);
  }
}
