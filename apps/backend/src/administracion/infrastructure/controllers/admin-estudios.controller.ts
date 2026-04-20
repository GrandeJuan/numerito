import { Controller, Get, Post, Patch, Param, Inject, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ESTUDIO_REPOSITORY } from '../../../estudio/domain/repositories/estudio.repository';
import type { EstudioRepository } from '../../../estudio/domain/repositories/estudio.repository';
import { AdminGuard } from '../../../iam/infrastructure/guards/admin.guard';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';
import { AdminEstudiosService } from '../../application/services/admin-estudios.service';
import { CrearEstudioAdminHandler } from '../../application/commands/crear-estudio-admin.command';

@ApiTags('Admin — Estudios')
@Controller({ path: 'admin/estudios', version: '1' })
@UseGuards(AdminGuard)
export class AdminEstudiosController {
  constructor(
    @Inject(ESTUDIO_REPOSITORY) private readonly estudioRepo: EstudioRepository,
    private readonly estudiosService: AdminEstudiosService,
    private readonly crearEstudioHandler: CrearEstudioAdminHandler,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar estudios con filtros y paginación' })
  async list(@Query() query: Record<string, string>) {
    const filters = {
      ...(query.search && { search: query.search }),
      ...(query.plan && { plan: query.plan }),
      ...(query.isActive !== undefined && { isActive: query.isActive === 'true' }),
      ...(query.from && { from: query.from }),
      ...(query.to && { to: query.to }),
      ...(query.page && { page: Number(query.page) }),
      ...(query.limit && { limit: Number(query.limit) }),
    };

    const result = await this.estudiosService.list(filters);

    return successResponse(result.items, {
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Crear estudio manualmente (onboarding asistido)' })
  async create(@Body() body: { nombre: string; cuit: string; planCodigo: string; trialDias?: number }) {
    const result = await this.crearEstudioHandler.execute(body);
    return successResponse(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener estudio por ID' })
  async getById(@Param('id') id: string) {
    const estudio = await this.estudioRepo.findById(id);
    if (!estudio) throw new RecursoNoEncontradoError('Estudio');
    return successResponse({
      id: estudio.id,
      nombre: estudio.nombre.value,
      cuit: estudio.cuit,
      plan: estudio.plan.value,
      maxClientes: estudio.plan.maxClientes,
      maxUsuarios: estudio.plan.maxUsuarios,
      isActive: estudio.isActive,
      createdAt: estudio.createdAt.toISOString(),
    });
  }

  @Patch(':id/suspend')
  @ApiOperation({ summary: 'Suspender estudio' })
  async suspend(@Param('id') id: string) {
    const estudio = await this.estudioRepo.findById(id);
    if (!estudio) throw new RecursoNoEncontradoError('Estudio');

    estudio.deactivate();
    await this.estudioRepo.save(estudio);
    return estudio;
  }

  @Patch(':id/reactivate')
  @ApiOperation({ summary: 'Reactivar estudio' })
  async reactivate(@Param('id') id: string) {
    const estudio = await this.estudioRepo.findById(id);
    if (!estudio) throw new RecursoNoEncontradoError('Estudio');

    estudio.activate();
    await this.estudioRepo.save(estudio);
    return estudio;
  }
}
