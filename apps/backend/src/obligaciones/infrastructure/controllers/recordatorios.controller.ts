import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminGuard } from '../../../shared/infrastructure/guards/admin.guard';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';
import { ProcesarRecordatoriosDiariosHandler } from '../../application/commands/procesar-recordatorios-diarios.command';
import { ProcesarAlertasEnRiesgoHandler } from '../../application/commands/procesar-alertas-en-riesgo.command';

@ApiTags('Admin — Recordatorios')
@Controller({ path: 'admin/recordatorios', version: '1' })
@UseGuards(AdminGuard)
export class RecordatoriosController {
  constructor(
    private readonly procesarRecordatoriosHandler: ProcesarRecordatoriosDiariosHandler,
    private readonly procesarAlertasHandler: ProcesarAlertasEnRiesgoHandler,
  ) {}

  @Post('ejecutar-recordatorios')
  @ApiOperation({ summary: 'Ejecutar recordatorios diarios (disparo manual)' })
  async ejecutarRecordatorios() {
    const result = await this.procesarRecordatoriosHandler.execute();
    return successResponse(result);
  }

  @Post('ejecutar-alertas-en-riesgo')
  @ApiOperation({ summary: 'Ejecutar alertas en riesgo 48h (disparo manual)' })
  async ejecutarAlertasEnRiesgo() {
    const result = await this.procesarAlertasHandler.execute();
    return successResponse(result);
  }
}
