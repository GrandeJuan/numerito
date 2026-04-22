import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminGuard } from '../../../shared/infrastructure/guards/admin.guard';
import { AdminOrIngestaGuard } from '../guards/admin-or-ingesta.guard';
import { Public } from '../../../shared/infrastructure/decorators/public.decorator';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';
import { ProcesarResultadoScrapingHandler } from '../../application/commands/procesar-resultado-scraping.command';
import {
  SUGERENCIAS_PRORROGA_DETECTOR,
  type SugerenciasProrrogaDetectorPort,
} from '../../domain/ports/sugerencias-prorroga-detector.port';
import { EjecutarIngestaManualHandler } from '../../application/commands/ejecutar-ingesta-manual.command';
import { EjecucionIngestaListHandler } from '../../application/queries/ejecucion-ingesta-list.query';
import {
  FARGATE_TASK_LAUNCHER,
  type FargateTaskLauncherPort,
} from '../../domain/ports/fargate-task-launcher.port';
import {
  EJECUCION_INGESTA_REPOSITORY,
  type EjecucionIngestaRepository,
} from '../../domain/repositories/ejecucion-ingesta.repository';
import { Inject, Optional } from '@nestjs/common';
import {
  resultadoScrapingDtoSchema,
  type ResultadoScrapingDto,
} from '../../application/dtos/resultado-scraping.dto';
import { DISPARADOR_INGESTA } from '../../domain/entities/ejecucion-ingesta.entity';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

@ApiTags('Admin — Ingesta Ejecuciones')
@Controller({ path: 'admin/ingesta', version: '1' })
export class IngestaEjecucionController {
  constructor(
    private readonly procesarHandler: ProcesarResultadoScrapingHandler,
    @Inject(SUGERENCIAS_PRORROGA_DETECTOR)
    private readonly sugerenciasDetector: SugerenciasProrrogaDetectorPort,
    private readonly ejecutarManualHandler: EjecutarIngestaManualHandler,
    private readonly ejecucionListHandler: EjecucionIngestaListHandler,
    @Inject(EJECUCION_INGESTA_REPOSITORY)
    private readonly ejecucionRepo: EjecucionIngestaRepository,
    @Optional()
    @Inject(FARGATE_TASK_LAUNCHER)
    private readonly taskLauncher: FargateTaskLauncherPort | null,
  ) {}

  @Post(':fuente/resultado')
  @HttpCode(HttpStatus.OK)
  // @Public() bypasses the global JwtAuthGuard so the `x-ingesta-secret` path
  // in AdminOrIngestaGuard gets a chance to run. The route still requires auth:
  // AdminOrIngestaGuard enforces either the shared secret (scraper container)
  // or a JWT with admin role (manual UI trigger).
  @Public()
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

    // Detect prorroga suggestions for modified rules
    if (result.reglasModificadas > 0 && result.diff.length > 0) {
      try {
        const sugerenciasResult = await this.sugerenciasDetector.detectar({
          reglasModificadas: result.diff,
          ejecucionIngestaId: result.ejecucionId,
        });
        (result as unknown as Record<string, unknown>).sugerenciasCreadas =
          sugerenciasResult.sugerenciasCreadas;
        (result as unknown as Record<string, unknown>).sugerenciasOmitidas =
          sugerenciasResult.sugerenciasOmitidas;
      } catch {
        // Detection is best-effort — don't fail the scraping pipeline
      }
    }

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
  async listEjecuciones(@Query('fuente') fuente?: string, @Query('estado') estado?: string) {
    const items = await this.ejecucionListHandler.execute({
      fuente: fuente || undefined,
      estado: estado || undefined,
    });
    return successResponse(items);
  }

  @Get('ejecuciones/:id')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Detalle de una ejecución (usado por el frontend para pollear progreso)',
  })
  async getEjecucion(@Param('id') id: string) {
    const item = await this.ejecucionListHandler.byId(id);
    if (!item) {
      throw new RecursoNoEncontradoError('EjecucionIngesta');
    }
    return successResponse(item);
  }

  @Get('ejecuciones/:id/logs')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary:
      'Logs del container scraper (stdout+stderr). Útil para ver progreso en vivo y diagnosticar fallas.',
  })
  async getEjecucionLogs(@Param('id') id: string) {
    const ejecucion = await this.ejecucionRepo.findById(id);
    if (!ejecucion) throw new RecursoNoEncontradoError('EjecucionIngesta');
    if (!this.taskLauncher) {
      return successResponse({ logs: '(ningún task launcher configurado en este entorno)' });
    }
    if (!ejecucion.launcherTaskId) {
      return successResponse({
        logs: '(esta ejecución no registró un task id — corrió antes de #logs)',
      });
    }
    const logs = await this.taskLauncher.getLogs(ejecucion.launcherTaskId, ejecucion.fuente);
    return successResponse({ logs });
  }
}
