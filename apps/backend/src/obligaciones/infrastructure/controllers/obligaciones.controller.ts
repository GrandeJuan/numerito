import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { EstadoVencimiento } from '@numerito/shared';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import {
  CrearVencimientoDto,
  crearVencimientoDtoSchema,
} from '../../application/dtos/crear-vencimiento.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';
import {
  CrearVencimientoHandler,
  type CrearVencimientoCommand,
} from '../../application/commands/crear-vencimiento.command';
import { PresentarVencimientoHandler } from '../../application/commands/presentar-vencimiento.command';
import { MarcarVencidoHandler } from '../../application/commands/marcar-vencido.command';
import { VencimientoKpisHandler } from '../../application/queries/vencimiento-kpis.query';
import { VencimientoListHandler } from '../../application/queries/vencimiento-list.query';
import { VencimientoCalendarioHandler } from '../../application/queries/vencimiento-calendario.query';
import { VencimientoByIdHandler } from '../../application/queries/vencimiento-by-id.query';
import { Principal } from '../../../shared/infrastructure/decorators/estudio-principal.decorator';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';

@ApiTags('Vencimientos')
@Controller({ path: 'vencimientos', version: '1' })
export class ObligacionesController {
  constructor(
    private readonly crearVencimientoHandler: CrearVencimientoHandler,
    private readonly presentarVencimientoHandler: PresentarVencimientoHandler,
    private readonly marcarVencidoHandler: MarcarVencidoHandler,
    private readonly vencimientoKpisHandler: VencimientoKpisHandler,
    private readonly vencimientoListHandler: VencimientoListHandler,
    private readonly vencimientoCalendarioHandler: VencimientoCalendarioHandler,
    private readonly vencimientoByIdHandler: VencimientoByIdHandler,
  ) {}

  @Get('kpis')
  @ApiOperation({ summary: 'KPIs de vencimientos del estudio' })
  async kpis(@Principal() principal: EstudioPrincipal) {
    const result = await this.vencimientoKpisHandler.execute(principal);
    return successResponse(result);
  }

  @Get('calendario/:periodo')
  @ApiOperation({ summary: 'Calendario de vencimientos por periodo' })
  async calendario(@Principal() principal: EstudioPrincipal, @Param('periodo') periodo: string) {
    const { fechaDesde, fechaHasta } = periodoToRange(periodo);
    const items = await this.vencimientoCalendarioHandler.execute(principal, {
      fechaDesde,
      fechaHasta,
    });
    return successResponse(items);
  }

  @Get()
  @ApiOperation({ summary: 'Listar vencimientos' })
  async list(
    @Principal() principal: EstudioPrincipal,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('estado') estado?: string,
    @Query('periodo') periodo?: string,
    @Query('clienteId') clienteId?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ) {
    const pageNum = +page;
    const limitNum = +limit;
    const { items, total } = await this.vencimientoListHandler.execute(principal, {
      estado: estado as EstadoVencimiento | undefined,
      periodo,
      clienteId,
      fechaDesde,
      fechaHasta,
      page: pageNum,
      limit: limitNum,
    });
    return successResponse(items, {
      total,
      page: pageNum,
      limit: limitNum,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Crear vencimiento' })
  async create(
    @Body(new ZodValidationPipe(crearVencimientoDtoSchema)) dto: CrearVencimientoDto,
    @Principal() principal: EstudioPrincipal,
  ) {
    const result = await this.crearVencimientoHandler.execute(
      principal,
      dto as CrearVencimientoCommand,
    );
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener vencimiento por ID' })
  async getById(@Principal() principal: EstudioPrincipal, @Param('id') id: string) {
    const vencimiento = await this.vencimientoByIdHandler.execute(principal, { id });
    return successResponse(vencimiento);
  }

  @Patch(':id/presentar')
  @ApiOperation({ summary: 'Marcar vencimiento como presentado' })
  async presentar(@Principal() principal: EstudioPrincipal, @Param('id') id: string) {
    return this.presentarVencimientoHandler.execute(principal, { vencimientoId: id });
  }

  @Patch(':id/vencido')
  @ApiOperation({ summary: 'Marcar vencimiento como vencido' })
  async marcarVencido(@Principal() principal: EstudioPrincipal, @Param('id') id: string) {
    return this.marcarVencidoHandler.execute(principal, { vencimientoId: id });
  }
}

function periodoToRange(periodo: string): { fechaDesde: string; fechaHasta: string } {
  const [yearStr, monthStr] = periodo.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const lastDay = new Date(year, month, 0).getDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    fechaDesde: `${yearStr}-${pad(month)}-01`,
    fechaHasta: `${yearStr}-${pad(month)}-${pad(lastDay)}`,
  };
}
