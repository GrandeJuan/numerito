import { Controller, Get, Post, Put, Patch, Param, Body, Query, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CrearClienteDto } from '../../application/dtos/crear-cliente.dto';
import { ActualizarClienteDto } from '../../application/dtos/actualizar-cliente.dto';
import { AsignarResponsableDto } from '../../application/dtos/asignar-responsable.dto';
import {
  CrearClienteHandler,
  type CrearClienteCommand,
} from '../../application/commands/crear-cliente.command';
import {
  ActualizarClienteHandler,
  type ActualizarClienteCommand,
} from '../../application/commands/actualizar-cliente.command';
import { CLIENTE_REPOSITORY } from '../../domain/repositories/cliente.repository';
import type { ClienteRepository } from '../../domain/repositories/cliente.repository';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

@ApiTags('Clientes')
@Controller({ path: 'clientes', version: '1' })
export class ClientesController {
  constructor(
    @Inject(CLIENTE_REPOSITORY) private readonly clienteRepo: ClienteRepository,
    private readonly crearClienteHandler: CrearClienteHandler,
    private readonly actualizarClienteHandler: ActualizarClienteHandler,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar clientes del estudio' })
  async list(@Query('page') page = 1, @Query('limit') limit = 20) {
    const clientes = await this.clienteRepo.findAll();
    return successResponse(clientes, { total: clientes.length, page: +page, limit: +limit });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Resumen de clientes del estudio' })
  async summary() {
    const clientes = await this.clienteRepo.findAll();
    const porCondicionIva: Record<string, number> = {};
    for (const c of clientes) {
      const key = String(c.condicionIva);
      porCondicionIva[key] = (porCondicionIva[key] ?? 0) + 1;
    }
    return successResponse({ total: clientes.length, porCondicionIva });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener cliente por ID' })
  async getById(@Param('id') id: string) {
    const cliente = await this.clienteRepo.findById(id);
    if (!cliente) throw new RecursoNoEncontradoError('Cliente');
    return cliente;
  }

  @Post()
  @ApiOperation({ summary: 'Crear cliente' })
  async create(@Body() dto: CrearClienteDto) {
    return this.crearClienteHandler.execute(dto as CrearClienteCommand);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar cliente' })
  async update(@Param('id') id: string, @Body() dto: ActualizarClienteDto) {
    return this.actualizarClienteHandler.execute({ id, ...dto } as ActualizarClienteCommand);
  }

  @Patch(':id/desactivar')
  @ApiOperation({ summary: 'Desactivar cliente' })
  async deactivate(@Param('id') id: string) {
    const cliente = await this.clienteRepo.findById(id);
    if (!cliente) throw new RecursoNoEncontradoError('Cliente');

    cliente.deactivate();
    await this.clienteRepo.save(cliente);
    return cliente;
  }

  @Patch(':id/activar')
  @ApiOperation({ summary: 'Activar cliente' })
  async activate(@Param('id') id: string) {
    const cliente = await this.clienteRepo.findById(id);
    if (!cliente) throw new RecursoNoEncontradoError('Cliente');

    cliente.activate();
    await this.clienteRepo.save(cliente);
    return cliente;
  }

  @Patch(':id/responsable')
  @ApiOperation({ summary: 'Asignar responsable al cliente' })
  async assignResponsable(@Param('id') id: string, @Body() dto: AsignarResponsableDto) {
    const cliente = await this.clienteRepo.findById(id);
    if (!cliente) throw new RecursoNoEncontradoError('Cliente');

    cliente.assignResponsable(dto.responsableId);
    await this.clienteRepo.save(cliente);
    return cliente;
  }
}
