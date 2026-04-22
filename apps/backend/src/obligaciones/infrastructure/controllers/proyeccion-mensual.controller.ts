import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminGuard } from '../../../shared/infrastructure/guards/admin.guard';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';
import { ProyeccionMensualScheduler } from '../../application/commands/proyeccion-mensual-scheduler.command';

@ApiTags('Admin — Proyección Mensual')
@Controller({ path: 'admin/proyeccion-mensual', version: '1' })
@UseGuards(AdminGuard)
export class ProyeccionMensualController {
  constructor(private readonly scheduler: ProyeccionMensualScheduler) {}

  @Post('ejecutar')
  @ApiOperation({
    summary: 'Ejecutar proyección mensual para todos los estudios activos',
    description:
      'Runs batch calendar projection across all active estudios. ' +
      'Designed to be triggered monthly (day 1) by EventBridge Scheduler or manually by superadmin.',
  })
  async ejecutar(@Body() body?: { periodo?: string }) {
    const result = await this.scheduler.execute(body?.periodo);
    return successResponse(result);
  }
}
