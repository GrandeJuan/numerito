import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { EstadoVencimiento } from '@numerito/shared';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import {
  CrearVencimientoDto,
  crearVencimientoDtoSchema,
} from '../../application/dtos/crear-vencimiento.dto';
import {
  type ProyectarCalendarioDto,
  proyectarCalendarioDtoSchema,
} from '../../application/dtos/proyectar-calendario.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';
import {
  CrearVencimientoHandler,
  type CrearVencimientoCommand,
} from '../../application/commands/crear-vencimiento.command';
import { ProyectarCalendarioMensualHandler } from '../../application/commands/proyectar-calendario-mensual.command';
import { ProyectarCalendarioMasivoHandler } from '../../application/commands/proyectar-calendario-masivo.command';
import { PresentarVencimientoHandler } from '../../application/commands/presentar-vencimiento.command';
import { MarcarVencidoHandler } from '../../application/commands/marcar-vencido.command';
import { ProrrogarVencimientoHandler } from '../../application/commands/prorrogar-vencimiento.command';
import { MarcarNoAplicaHandler } from '../../application/commands/marcar-no-aplica.command';
import { ReasignarResponsableHandler } from '../../application/commands/reasignar-responsable.command';
import {
  type ProrrogarVencimientoDto,
  prorrogarVencimientoDtoSchema,
} from '../../application/dtos/prorrogar-vencimiento.dto';
import {
  type ReasignarResponsableDto,
  reasignarResponsableDtoSchema,
} from '../../application/dtos/reasignar-responsable.dto';
import {
  type MarcarNoAplicaDto,
  marcarNoAplicaDtoSchema,
} from '../../application/dtos/marcar-no-aplica.dto';
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
    private readonly proyectarCalendarioHandler: ProyectarCalendarioMensualHandler,
    private readonly presentarVencimientoHandler: PresentarVencimientoHandler,
    private readonly marcarVencidoHandler: MarcarVencidoHandler,
    private readonly prorrogarVencimientoHandler: ProrrogarVencimientoHandler,
    private readonly marcarNoAplicaHandler: MarcarNoAplicaHandler,
    private readonly reasignarResponsableHandler: ReasignarResponsableHandler,
    private readonly vencimientoKpisHandler: VencimientoKpisHandler,
    private readonly vencimientoListHandler: VencimientoListHandler,
    private readonly vencimientoCalendarioHandler: VencimientoCalendarioHandler,
    private readonly vencimientoByIdHandler: VencimientoByIdHandler,
    private readonly proyectarMasivoHandler: ProyectarCalendarioMasivoHandler,
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

  @Post('calendario/proyectar')
  @ApiOperation({ summary: 'Proyectar calendario mensual de un cliente' })
  async proyectarCalendario(
    @Body(new ZodValidationPipe(proyectarCalendarioDtoSchema)) dto: ProyectarCalendarioDto,
    @Principal() principal: EstudioPrincipal,
  ) {
    const result = await this.proyectarCalendarioHandler.execute(principal, dto);
    return successResponse(result);
  }

  @Post('calendario/proyectar-masivo')
  @ApiOperation({ summary: 'Proyectar calendario mensual de todos los clientes del estudio' })
  async proyectarCalendarioMasivo(
    @Body(new ZodValidationPipe(proyectarCalendarioDtoSchema)) dto: { periodo: string },
    @Principal() principal: EstudioPrincipal,
  ) {
    const result = await this.proyectarMasivoHandler.execute(principal, {
      periodo: dto.periodo,
    });
    return successResponse(result);
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

  @Patch(':id/prorrogar')
  @ApiOperation({ summary: 'Prorrogar vencimiento con motivo y nueva fecha' })
  async prorrogar(
    @Principal() principal: EstudioPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(prorrogarVencimientoDtoSchema)) dto: ProrrogarVencimientoDto,
  ) {
    return this.prorrogarVencimientoHandler.execute(principal, {
      vencimientoId: id,
      motivo: dto.motivo,
      nuevaFecha: dto.nuevaFecha,
    });
  }

  @Patch(':id/no-aplica')
  @ApiOperation({ summary: 'Marcar vencimiento como no aplica' })
  async marcarNoAplica(
    @Principal() principal: EstudioPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(marcarNoAplicaDtoSchema)) dto: MarcarNoAplicaDto,
  ) {
    return this.marcarNoAplicaHandler.execute(principal, {
      vencimientoId: id,
      motivo: dto.motivo,
    });
  }
  @Post('reasignar-responsable')
  @ApiOperation({ summary: 'Reasignar responsable de vencimientos futuros por tipo de obligación' })
  async reasignarResponsable(
    @Body(new ZodValidationPipe(reasignarResponsableDtoSchema)) dto: ReasignarResponsableDto,
    @Principal() principal: EstudioPrincipal,
  ) {
    const result = await this.reasignarResponsableHandler.execute(principal, dto);
    return successResponse(result);
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
