import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../iam/infrastructure/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../guards/superadmin.guard';
import { HealthCheckHandler } from '../../application/queries/health-check.query';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';

@ApiTags('Admin — Health')
@Controller({ path: 'admin/health', version: '1' })
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class AdminHealthController {
  constructor(private readonly healthHandler: HealthCheckHandler) {}

  @Get()
  @ApiOperation({ summary: 'Health check de servicios de la plataforma' })
  async getHealth() {
    const result = await this.healthHandler.execute();
    return successResponse(result);
  }
}
