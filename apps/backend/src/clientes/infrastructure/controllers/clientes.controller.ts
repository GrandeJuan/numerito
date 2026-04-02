import { Controller, Get, Post, Put, Patch, Param, Body, Query, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CrearClienteDto } from '../../application/dtos/crear-cliente.dto';
import { ActualizarClienteDto } from '../../application/dtos/actualizar-cliente.dto';
import { AsignarResponsableDto } from '../../application/dtos/asignar-responsable.dto';
import { CrearClienteHandler, type CrearClienteCommand } from '../../application/commands/crear-cliente.command';
import { CLIENTE_REPOSITORY } from '../../domain/repositories/cliente.repository';
import type { ClienteRepository } from '../../domain/repositories/cliente.repository';
import { RazonSocial } from '../../domain/value-objects/razon-social.vo';
import { EstudioId } from '../../../shared/infrastructure/decorators/estudio-id.decorator';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';
import type { CondicionIVA } from '@numerito/shared';
import type { Regimen } from '../../domain/entities/cliente.entity';

@ApiTags('Clientes')
@Controller({ path: 'clientes', version: '1' })
export class ClientesController {
  constructor(
    @Inject(CLIENTE_REPOSITORY) private readonly clienteRepo: ClienteRepository,
    private readonly crearClienteHandler: CrearClienteHandler,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar clientes del estudio' })
  async list(
    @EstudioId() estudioId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const clientes = await this.clienteRepo.findByEstudioId(estudioId);
    return successResponse(clientes, { total: clientes.length, page: +page, limit: +limit });
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
  async create(@Body() dto: CrearClienteDto, @EstudioId() estudioId: string) {
    return this.crearClienteHandler.execute({ ...dto, estudioId } as CrearClienteCommand);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar cliente' })
  async update(@Param('id') id: string, @Body() dto: ActualizarClienteDto) {
    const cliente = await this.clienteRepo.findById(id);
    if (!cliente) throw new RecursoNoEncontradoError('Cliente');

    if (dto.razonSocial) {
      cliente.updateRazonSocial(RazonSocial.create(dto.razonSocial));
    }
    if (dto.condicionIva) {
      cliente.changeCondicionIva(dto.condicionIva as CondicionIVA);
    }
    if (dto.regimen) {
      cliente.changeRegimen(dto.regimen as Regimen);
    }

    await this.clienteRepo.save(cliente);
    return cliente;
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
