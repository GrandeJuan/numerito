import { Controller, Get, Post, Put, Patch, Param, Body, Query, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CrearClienteDto } from '../../application/dtos/crear-cliente.dto';
import { CrearClienteHandler } from '../../application/commands/crear-cliente.command';
import { CLIENTE_REPOSITORY } from '../../domain/repositories/cliente.repository';
import type { ClienteRepository } from '../../domain/repositories/cliente.repository';
import { TenantId } from '../../../shared/infrastructure/decorators/tenant-id.decorator';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';

@ApiTags('Clientes')
@Controller({ path: 'clientes', version: '1' })
export class ClientesController {
  constructor(
    @Inject(CLIENTE_REPOSITORY) private readonly clienteRepo: ClienteRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar clientes del estudio' })
  async list(
    @TenantId() tenantId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const clientes = await this.clienteRepo.findByTenantId(tenantId);
    return successResponse(clientes, { total: clientes.length, page: +page, limit: +limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener cliente por ID' })
  async getById(@Param('id') id: string) {
    return this.clienteRepo.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear cliente' })
  async create(@Body() dto: CrearClienteDto, @TenantId() tenantId: string) {
    const handler = new CrearClienteHandler(this.clienteRepo);
    return handler.execute({ ...dto, tenantId } as any);
  }
}
