import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../iam/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../iam/infrastructure/guards/roles.guard';
import { Roles } from '../../../iam/infrastructure/decorators/roles.decorator';
import { CurrentUser } from '../../../iam/infrastructure/decorators/current-user.decorator';
import { ObtenerPortalStatsHandler } from '../../application/queries/obtener-portal-stats.query';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';
import { ROL } from '@numerito/shared';

@ApiTags('Portal')
@Controller({ path: 'portal/dashboard', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROL.CLIENTE)
export class PortalController {
  constructor(private readonly statsHandler: ObtenerPortalStatsHandler) {}

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadisticas del portal del cliente' })
  async getStats(@CurrentUser() user: { sub: string; rol: string }) {
    const stats = await this.statsHandler.execute({
      usuarioId: user.sub,
      rol: user.rol,
    });
    return successResponse(stats);
  }
}
