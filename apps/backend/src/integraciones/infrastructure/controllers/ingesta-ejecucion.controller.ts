import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminGuard } from '../../../iam/infrastructure/guards/admin.guard';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';
import { ProcesarResultadoScrapingHandler } from '../../application/commands/procesar-resultado-scraping.command';
import { EjecucionIngestaListHandler } from '../../application/queries/ejecucion-ingesta-list.query';
import {
  resultadoScrapingDtoSchema,
  type ResultadoScrapingDto,
} from '../../application/dtos/resultado-scraping.dto';
import { DISPARADOR_INGESTA } from '../../domain/entities/ejecucion-ingesta.entity';

@ApiTags('Admin — Ingesta Ejecuciones')
@Controller({ path: 'admin/ingesta', version: '1' })
@UseGuards(AdminGuard)
export class IngestaEjecucionController {
  constructor(
    private readonly procesarHandler: ProcesarResultadoScrapingHandler,
    private readonly ejecucionListHandler: EjecucionIngestaListHandler,
  ) {}

  @Post(':fuente/resultado')
  @ApiOperation({
    summary: 'Recibir resultado de scraping (llamado por Fargate task o manualmente)',
  })
  async recibirResultado(
    @Param('fuente') fuente: string,
    @Body(new ZodValidationPipe(resultadoScrapingDtoSchema))
    dto: ResultadoScrapingDto,
  ) {
    const result = await this.procesarHandler.execute({
      resultado: { ...dto, fuente: fuente as ResultadoScrapingDto['fuente'] },
      disparador: DISPARADOR_INGESTA.MANUAL,
      disparadoPor: null,
    });
    return successResponse(result);
  }

  @Post(':fuente/ejecutar-ahora')
  @ApiOperation({ summary: 'Disparar ingesta manual on-demand' })
  async ejecutarAhora(@Param('fuente') fuente: string) {
    // For now, return instructions — actual Fargate triggering requires AWS SDK
    // The Fargate task will call POST /:fuente/resultado when done
    return successResponse({
      message: `Ingesta manual solicitada para ${fuente}. El resultado será procesado al recibir el POST en /${fuente}/resultado.`,
      fuente,
    });
  }

  @Get('ejecuciones')
  @ApiOperation({ summary: 'Historial de ejecuciones de ingesta' })
  async listEjecuciones(
    @Query('fuente') fuente?: string,
    @Query('estado') estado?: string,
  ) {
    const items = await this.ejecucionListHandler.execute({
      fuente: fuente || undefined,
      estado: estado || undefined,
    });
    return successResponse(items);
  }
}
