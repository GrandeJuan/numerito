import { Controller, Get, Patch, Param, Inject, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ESTUDIO_REPOSITORY } from '../../../estudio/domain/repositories/estudio.repository';
import type { EstudioRepository } from '../../../estudio/domain/repositories/estudio.repository';
import { SuperAdminGuard } from '../guards/superadmin.guard';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';

@ApiTags('Admin — Estudios')
@Controller({ path: 'admin/estudios', version: '1' })
@UseGuards(SuperAdminGuard)
export class AdminEstudiosController {
  constructor(
    @Inject(ESTUDIO_REPOSITORY) private readonly estudioRepo: EstudioRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los estudios' })
  async list() {
    const estudios = await this.estudioRepo.findAll();
    return successResponse(estudios);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener estudio por ID' })
  async getById(@Param('id') id: string) {
    const estudio = await this.estudioRepo.findById(id);
    if (!estudio) throw new RecursoNoEncontradoError('Estudio');
    return estudio;
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
