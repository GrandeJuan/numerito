import { Controller, Get, Post, Put, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import { CrearClienteDto, crearClienteDtoSchema } from '../../application/dtos/crear-cliente.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';
import {
  ActualizarClienteDto,
  actualizarClienteDtoSchema,
} from '../../application/dtos/actualizar-cliente.dto';
import {
  AsignarResponsableDto,
  asignarResponsableDtoSchema,
} from '../../application/dtos/asignar-responsable.dto';
import {
  CrearClienteHandler,
  type CrearClienteCommand,
} from '../../application/commands/crear-cliente.command';
import {
  ActualizarClienteHandler,
  type ActualizarClienteCommand,
} from '../../application/commands/actualizar-cliente.command';
import { DesactivarClienteHandler } from '../../application/commands/desactivar-cliente.command';
import { ActivarClienteHandler } from '../../application/commands/activar-cliente.command';
import {
  AsignarResponsableHandler,
  type AsignarResponsableCommand,
} from '../../application/commands/asignar-responsable.command';
import {
  ActualizarPerfilFiscalHandler,
  type ActualizarPerfilFiscalCommand,
} from '../../application/commands/actualizar-perfil-fiscal.command';
import {
  ActualizarPerfilFiscalDto,
  actualizarPerfilFiscalDtoSchema,
} from '../../application/dtos/actualizar-perfil-fiscal.dto';
import {
  AsignarResponsablePorObligacionHandler,
  type AsignarResponsablePorObligacionCommand,
} from '../../application/commands/asignar-responsable-por-obligacion.command';
import {
  type AsignarResponsablePorObligacionDto,
  asignarResponsablePorObligacionDtoSchema,
} from '../../application/dtos/asignar-responsable-por-obligacion.dto';
import { CLIENTE_REPOSITORY } from '../../domain/repositories/cliente.repository';
import type { ClienteRepository } from '../../domain/repositories/cliente.repository';
import { Inject } from '@nestjs/common';
import { Principal } from '../../../shared/infrastructure/decorators/estudio-principal.decorator';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';
import { toClienteResponseDto } from '../../application/dtos/cliente-response.dto';

@ApiTags('Clientes')
@Controller({ path: 'clientes', version: '1' })
export class ClientesController {
  constructor(
    @Inject(CLIENTE_REPOSITORY) private readonly clienteRepo: ClienteRepository,
    private readonly crearClienteHandler: CrearClienteHandler,
    private readonly actualizarClienteHandler: ActualizarClienteHandler,
    private readonly desactivarClienteHandler: DesactivarClienteHandler,
    private readonly activarClienteHandler: ActivarClienteHandler,
    private readonly asignarResponsableHandler: AsignarResponsableHandler,
    private readonly actualizarPerfilFiscalHandler: ActualizarPerfilFiscalHandler,
    private readonly asignarResponsablePorObligacionHandler: AsignarResponsablePorObligacionHandler,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar clientes del estudio' })
  async list(
    @Principal() principal: EstudioPrincipal,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const clientes = await this.clienteRepo.findAll(principal);
    return successResponse(clientes.map(toClienteResponseDto), {
      total: clientes.length,
      page: +page,
      limit: +limit,
    });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Resumen de clientes del estudio' })
  async summary(@Principal() principal: EstudioPrincipal) {
    const clientes = await this.clienteRepo.findAll(principal);
    const porCondicionIva: Record<string, number> = {};
    for (const c of clientes) {
      const key = String(c.condicionIva);
      porCondicionIva[key] = (porCondicionIva[key] ?? 0) + 1;
    }
    return successResponse({ total: clientes.length, porCondicionIva });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener cliente por ID' })
  async getById(@Principal() principal: EstudioPrincipal, @Param('id') id: string) {
    const cliente = await this.clienteRepo.findById(principal, id);
    if (!cliente) throw new RecursoNoEncontradoError('Cliente');
    return successResponse(toClienteResponseDto(cliente));
  }

  @Post()
  @ApiOperation({ summary: 'Crear cliente' })
  async create(
    @Body(new ZodValidationPipe(crearClienteDtoSchema)) dto: CrearClienteDto,
    @Principal() principal: EstudioPrincipal,
  ) {
    return this.crearClienteHandler.execute(principal, dto as CrearClienteCommand);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar cliente' })
  async update(
    @Principal() principal: EstudioPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarClienteDtoSchema)) dto: ActualizarClienteDto,
  ) {
    return this.actualizarClienteHandler.execute(principal, {
      id,
      ...dto,
    } as ActualizarClienteCommand);
  }

  @Patch(':id/desactivar')
  @ApiOperation({ summary: 'Desactivar cliente' })
  async deactivate(@Principal() principal: EstudioPrincipal, @Param('id') id: string) {
    return this.desactivarClienteHandler.execute(principal, { id });
  }

  @Patch(':id/activar')
  @ApiOperation({ summary: 'Activar cliente' })
  async activate(@Principal() principal: EstudioPrincipal, @Param('id') id: string) {
    return this.activarClienteHandler.execute(principal, { id });
  }

  @Patch(':id/responsable')
  @ApiOperation({ summary: 'Asignar responsable al cliente' })
  async assignResponsable(
    @Principal() principal: EstudioPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(asignarResponsableDtoSchema)) dto: AsignarResponsableDto,
  ) {
    return this.asignarResponsableHandler.execute(principal, {
      id,
      responsableId: dto.responsableId,
    } as AsignarResponsableCommand);
  }

  @Patch(':id/perfil-fiscal')
  @ApiOperation({ summary: 'Actualizar perfil fiscal del cliente' })
  async updatePerfilFiscal(
    @Principal() principal: EstudioPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarPerfilFiscalDtoSchema)) dto: ActualizarPerfilFiscalDto,
  ) {
    await this.actualizarPerfilFiscalHandler.execute(principal, {
      id,
      inscripciones: dto.inscripciones,
    } as ActualizarPerfilFiscalCommand);
    return successResponse({ ok: true });
  }

  @Patch(':id/responsable-por-obligacion')
  @ApiOperation({ summary: 'Asignar responsable override por tipo de obligación' })
  async assignResponsablePorObligacion(
    @Principal() principal: EstudioPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(asignarResponsablePorObligacionDtoSchema))
    dto: AsignarResponsablePorObligacionDto,
  ) {
    await this.asignarResponsablePorObligacionHandler.execute(principal, {
      clienteId: id,
      tipoObligacion: dto.tipoObligacion,
      responsableId: dto.responsableId,
    } as AsignarResponsablePorObligacionCommand);
    return successResponse({ ok: true });
  }
}
