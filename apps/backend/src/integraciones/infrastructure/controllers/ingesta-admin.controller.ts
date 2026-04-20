import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminGuard } from '../../../iam/infrastructure/guards/admin.guard';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';
import {
  CONFIGURACION_INGESTA_REPOSITORY,
} from '../../domain/repositories/configuracion-ingesta.repository';
import type { ConfiguracionIngestaRepository } from '../../domain/repositories/configuracion-ingesta.repository';
import { ActualizarConfiguracionIngestaHandler } from '../../application/commands/actualizar-configuracion-ingesta.command';
import { ConfiguracionIngestaListHandler } from '../../application/queries/configuracion-ingesta-list.query';
import {
  actualizarConfiguracionIngestaDtoSchema,
  type ActualizarConfiguracionIngestaDto,
} from '../../application/dtos/configuracion-ingesta.dto';

@ApiTags('Admin — Configuración Ingesta')
@Controller({ path: 'admin/ingesta/configuraciones', version: '1' })
@UseGuards(AdminGuard)
export class IngestaAdminController {
  constructor(
    @Inject(CONFIGURACION_INGESTA_REPOSITORY)
    private readonly repo: ConfiguracionIngestaRepository,
    private readonly actualizarHandler: ActualizarConfiguracionIngestaHandler,
    private readonly listHandler: ConfiguracionIngestaListHandler,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar configuraciones de ingesta' })
  async list() {
    const items = await this.listHandler.execute();
    return successResponse(items);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener configuración de ingesta por ID' })
  async getById(@Param('id') id: string) {
    const config = await this.repo.findById(id);
    if (!config) throw new RecursoNoEncontradoError('ConfiguracionIngesta');
    return successResponse({
      id: config.id,
      fuente: config.fuente,
      habilitado: config.habilitado,
      cadenciaDias: config.cadenciaDias,
      proximaEjecucion: config.proximaEjecucion?.toISOString() ?? null,
      ultimaEjecucion: config.ultimaEjecucion?.toISOString() ?? null,
      ultimoResultado: config.ultimoResultado,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar configuración de ingesta (habilitar, cadencia)' })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarConfiguracionIngestaDtoSchema))
    dto: ActualizarConfiguracionIngestaDto,
  ) {
    const result = await this.actualizarHandler.execute({ id, ...dto });
    return successResponse(result);
  }
}
