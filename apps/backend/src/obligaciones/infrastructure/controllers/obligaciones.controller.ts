import { Controller, Get, Post, Patch, Param, Body, Query, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VENCIMIENTO_REPOSITORY } from '../../domain/repositories/vencimiento.repository';
import type { VencimientoRepository } from '../../domain/repositories/vencimiento.repository';
import { TenantId } from '../../../shared/infrastructure/decorators/tenant-id.decorator';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';

@ApiTags('Obligaciones')
@Controller({ path: 'obligaciones', version: '1' })
export class ObligacionesController {
  constructor(
    @Inject(VENCIMIENTO_REPOSITORY) private readonly vencimientoRepo: VencimientoRepository,
  ) {}

  @Get('vencimientos')
  @ApiOperation({ summary: 'Listar vencimientos' })
  async list(
    @TenantId() tenantId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('estado') estado?: string,
    @Query('periodo') periodo?: string,
  ) {
    let vencimientos;
    if (periodo) {
      vencimientos = await this.vencimientoRepo.findByPeriodo(periodo, tenantId);
    } else if (estado) {
      vencimientos = await this.vencimientoRepo.findByEstado(estado as any, tenantId);
    } else {
      vencimientos = await this.vencimientoRepo.findByTenantId(tenantId);
    }
    return successResponse(vencimientos, { total: vencimientos.length, page: +page, limit: +limit });
  }

  @Get('vencimientos/:id')
  @ApiOperation({ summary: 'Obtener vencimiento por ID' })
  async getById(@Param('id') id: string) {
    return this.vencimientoRepo.findById(id);
  }
}
