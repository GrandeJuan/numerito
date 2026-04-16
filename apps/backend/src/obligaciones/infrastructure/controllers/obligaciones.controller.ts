import { Controller, Get, Post, Patch, Param, Body, Query, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VENCIMIENTO_REPOSITORY } from '../../domain/repositories/vencimiento.repository';
import type { VencimientoRepository } from '../../domain/repositories/vencimiento.repository';
import { CrearVencimientoDto, crearVencimientoDtoSchema } from '../../application/dtos/crear-vencimiento.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';
import {
  CrearVencimientoHandler,
  type CrearVencimientoCommand,
} from '../../application/commands/crear-vencimiento.command';
import { PresentarVencimientoHandler } from '../../application/commands/presentar-vencimiento.command';
import { MarcarVencidoHandler } from '../../application/commands/marcar-vencido.command';
import { VencimientoKpisHandler } from '../../application/queries/vencimiento-kpis.query';
import { EstudioId } from '../../../shared/infrastructure/decorators/estudio-id.decorator';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';
import type { EstadoVencimiento } from '../../domain/entities/vencimiento.entity';

@ApiTags('Obligaciones')
@Controller({ path: 'obligaciones', version: '1' })
export class ObligacionesController {
  constructor(
    @Inject(VENCIMIENTO_REPOSITORY) private readonly vencimientoRepo: VencimientoRepository,
    private readonly crearVencimientoHandler: CrearVencimientoHandler,
    private readonly presentarVencimientoHandler: PresentarVencimientoHandler,
    private readonly marcarVencidoHandler: MarcarVencidoHandler,
    private readonly vencimientoKpisHandler: VencimientoKpisHandler,
  ) {}

  @Get('kpis')
  @ApiOperation({ summary: 'KPIs de obligaciones del estudio' })
  async kpis(@EstudioId() estudioId: string) {
    const result = await this.vencimientoKpisHandler.execute({ estudioId });
    return successResponse(result);
  }

  @Get('vencimientos')
  @ApiOperation({ summary: 'Listar vencimientos' })
  async list(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('estado') estado?: string,
    @Query('periodo') periodo?: string,
  ) {
    let vencimientos;
    if (periodo) {
      vencimientos = await this.vencimientoRepo.findByPeriodo(periodo);
    } else if (estado) {
      vencimientos = await this.vencimientoRepo.findByEstado(estado as EstadoVencimiento);
    } else {
      vencimientos = await this.vencimientoRepo.findAll();
    }
    return successResponse(vencimientos, {
      total: vencimientos.length,
      page: +page,
      limit: +limit,
    });
  }

  @Get('vencimientos/:id')
  @ApiOperation({ summary: 'Obtener vencimiento por ID' })
  async getById(@Param('id') id: string) {
    const vencimiento = await this.vencimientoRepo.findById(id);
    if (!vencimiento) throw new RecursoNoEncontradoError('Vencimiento');
    return vencimiento;
  }

  @Post('vencimientos')
  @ApiOperation({ summary: 'Crear vencimiento' })
  async create(@Body(new ZodValidationPipe(crearVencimientoDtoSchema)) dto: CrearVencimientoDto, @EstudioId() estudioId: string) {
    const result = await this.crearVencimientoHandler.execute({ ...dto, estudioId } as CrearVencimientoCommand);
    return result;
  }

  @Patch('vencimientos/:id/presentar')
  @ApiOperation({ summary: 'Marcar vencimiento como presentado' })
  async presentar(@Param('id') id: string) {
    return this.presentarVencimientoHandler.execute({ vencimientoId: id });
  }

  @Patch('vencimientos/:id/vencido')
  @ApiOperation({ summary: 'Marcar vencimiento como vencido' })
  async marcarVencido(@Param('id') id: string) {
    return this.marcarVencidoHandler.execute({ vencimientoId: id });
  }

  @Get('calendario/:periodo')
  @ApiOperation({ summary: 'Calendario de vencimientos por periodo' })
  async calendario(@Param('periodo') periodo: string) {
    const vencimientos = await this.vencimientoRepo.findByPeriodo(periodo);
    return successResponse(vencimientos);
  }
}
