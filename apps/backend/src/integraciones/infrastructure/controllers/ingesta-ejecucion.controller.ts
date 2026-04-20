import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminGuard } from '../../../iam/infrastructure/guards/admin.guard';
import { AdminOrIngestaGuard } from '../guards/admin-or-ingesta.guard';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';
import { ProcesarResultadoScrapingHandler } from '../../application/commands/procesar-resultado-scraping.command';
import { EjecutarIngestaManualHandler } from '../../application/commands/ejecutar-ingesta-manual.command';
import { EjecucionIngestaListHandler } from '../../application/queries/ejecucion-ingesta-list.query';
import {
  resultadoScrapingDtoSchema,
  type ResultadoScrapingDto,
} from '../../application/dtos/resultado-scraping.dto';
import { DISPARADOR_INGESTA } from '../../domain/entities/ejecucion-ingesta.entity';

@ApiTags('Admin — Ingesta Ejecuciones')
@Controller({ path: 'admin/ingesta', version: '1' })
export class IngestaEjecucionController {
  constructor(
    private readonly procesarHandler: ProcesarResultadoScrapingHandler,
    private readonly ejecutarManualHandler: EjecutarIngestaManualHandler,
    private readonly ejecucionListHandler: EjecucionIngestaListHandler,
  ) {}

  @Post(':fuente/resultado')
  @UseGuards(AdminOrIngestaGuard)
  @ApiOperation({
    summary: 'Recibir resultado de scraping (llamado por Fargate task o admin)',
  })
  async recibirResultado(
    @Param('fuente') fuente: string,
    @Body(new ZodValidationPipe(resultadoScrapingDtoSchema))
    dto: ResultadoScrapingDto,
    @Req() req: { headers: Record<string, string>; user?: { sub?: string } },
  ) {
    const isWebhook = !!req.headers['x-ingesta-secret'];
    const result = await this.procesarHandler.execute({
      resultado: { ...dto, fuente: fuente as ResultadoScrapingDto['fuente'] },
      disparador: isWebhook ? DISPARADOR_INGESTA.SCHEDULE : DISPARADOR_INGESTA.MANUAL,
      disparadoPor: isWebhook ? null : (req.user?.sub ?? null),
    });
    return successResponse(result);
  }

  @Post(':fuente/ejecutar-ahora')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Disparar ingesta manual on-demand (lanza Fargate task)' })
  async ejecutarAhora(@Param('fuente') fuente: string) {
    const result = await this.ejecutarManualHandler.execute({
      fuente,
      disparadoPor: 'admin',
    });
    return successResponse(result);
  }

  @Get('ejecuciones')
  @UseGuards(AdminGuard)
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
