import { Controller, Get, Put, Post, Param, Body, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ESTUDIO_REPOSITORY } from '../../domain/repositories/estudio.repository';
import type { EstudioRepository } from '../../domain/repositories/estudio.repository';
import { SUBSCRIPCION_REPOSITORY } from '../../domain/repositories/subscripcion.repository';
import type { SubscripcionRepository } from '../../domain/repositories/subscripcion.repository';
import { NombreEstudio } from '../../domain/value-objects/nombre-estudio.vo';
import { ActualizarEstudioDto } from '../../application/dtos/actualizar-estudio.dto';
import { CambiarPlanDto } from '../../application/dtos/cambiar-plan.dto';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

@ApiTags('Estudios')
@Controller({ path: 'estudios', version: '1' })
export class EstudioController {
  constructor(
    @Inject(ESTUDIO_REPOSITORY) private readonly estudioRepo: EstudioRepository,
    @Inject(SUBSCRIPCION_REPOSITORY) private readonly subscripcionRepo: SubscripcionRepository,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Obtener estudio por ID' })
  async getById(@Param('id') id: string) {
    const estudio = await this.estudioRepo.findById(id);
    if (!estudio) throw new RecursoNoEncontradoError('Estudio');
    return estudio;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar estudio' })
  async update(@Param('id') id: string, @Body() dto: ActualizarEstudioDto) {
    const estudio = await this.estudioRepo.findById(id);
    if (!estudio) throw new RecursoNoEncontradoError('Estudio');

    if (dto.nombre) {
      estudio.updateNombre(NombreEstudio.create(dto.nombre));
    }

    await this.estudioRepo.save(estudio);
    return estudio;
  }

  @Get(':id/subscripcion')
  @ApiOperation({ summary: 'Obtener subscripcion activa del estudio' })
  async getSubscripcion(@Param('id') _id: string) {
    const subscripcion = await this.subscripcionRepo.findActiva();
    if (!subscripcion) throw new RecursoNoEncontradoError('Subscripcion');
    return subscripcion;
  }

  @Post(':id/subscripcion/cambiar-plan')
  @ApiOperation({ summary: 'Cambiar plan de subscripcion' })
  async cambiarPlan(@Param('id') id: string, @Body() dto: CambiarPlanDto) {
    const subscripcion = await this.subscripcionRepo.findActiva();
    if (!subscripcion) throw new RecursoNoEncontradoError('Subscripcion');

    subscripcion.cambiarPlan(dto.planId);
    await this.subscripcionRepo.save(subscripcion);
    return subscripcion;
  }
}
