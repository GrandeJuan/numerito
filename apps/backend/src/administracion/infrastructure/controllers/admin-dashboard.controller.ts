import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SuperAdminGuard } from '../guards/superadmin.guard';
import { ObtenerAdminDashboardStatsHandler } from '../../application/queries/obtener-admin-dashboard-stats.query';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';

@ApiTags('Admin — Dashboard')
@Controller({ path: 'admin/dashboard', version: '1' })
@UseGuards(SuperAdminGuard)
export class AdminDashboardController {
  constructor(private readonly statsHandler: ObtenerAdminDashboardStatsHandler) {}

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas del dashboard admin' })
  async getStats() {
    const stats = await this.statsHandler.execute();
    return successResponse(stats);
  }
}
