import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminGuard } from '../../../iam/infrastructure/guards/admin.guard';
import { ObtenerAdminDashboardStatsHandler } from '../../application/queries/obtener-admin-dashboard-stats.query';
import { DashboardStatsProjection } from '../../application/services/dashboard-stats-projection';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';

@ApiTags('Admin — Dashboard')
@Controller({ path: 'admin/dashboard', version: '1' })
@UseGuards(AdminGuard)
export class AdminDashboardController {
  constructor(
    private readonly statsHandler: ObtenerAdminDashboardStatsHandler,
    private readonly projection: DashboardStatsProjection,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas del dashboard admin' })
  async getStats() {
    const stats = await this.statsHandler.execute();
    return successResponse({
      ...stats,
      realTimeDeltas: this.projection.getDeltas(),
    });
  }
}
