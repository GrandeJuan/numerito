import { Controller, Get, Put, Post, Param, Body, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ESTUDIO_REPOSITORY } from '../../domain/repositories/estudio.repository';
import type { EstudioRepository } from '../../domain/repositories/estudio.repository';
import { NombreEstudio } from '../../domain/value-objects/nombre-estudio.vo';
import { ActualizarEstudioDto, actualizarEstudioDtoSchema } from '../../application/dtos/actualizar-estudio.dto';
import { CambiarPlanDto, cambiarPlanDtoSchema } from '../../application/dtos/cambiar-plan.dto';
import { RenovarSubscripcionDto, renovarSubscripcionDtoSchema } from '../../application/dtos/renovar-subscripcion.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';
import { RenovarSubscripcionHandler } from '../../application/commands/renovar-subscripcion.command';
import { CancelarSubscripcionHandler } from '../../application/commands/cancelar-subscripcion.command';
import { MarcarSubscripcionVencidaHandler } from '../../application/commands/marcar-subscripcion-vencida.command';
import { CambiarPlanSubscripcionHandler } from '../../application/commands/cambiar-plan-subscripcion.command';
import { SUBSCRIPCION_REPOSITORY } from '../../domain/repositories/subscripcion.repository';
import type { SubscripcionRepository } from '../../domain/repositories/subscripcion.repository';

@ApiTags('Estudios')
@Controller({ path: 'estudios', version: '1' })
export class EstudioController {
  constructor(
    @Inject(ESTUDIO_REPOSITORY) private readonly estudioRepo: EstudioRepository,
    @Inject(SUBSCRIPCION_REPOSITORY) private readonly subscripcionRepo: SubscripcionRepository,
    private readonly renovarHandler: RenovarSubscripcionHandler,
    private readonly cancelarHandler: CancelarSubscripcionHandler,
    private readonly marcarVencidaHandler: MarcarSubscripcionVencidaHandler,
    private readonly cambiarPlanHandler: CambiarPlanSubscripcionHandler,
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
  async update(@Param('id') id: string, @Body(new ZodValidationPipe(actualizarEstudioDtoSchema)) dto: ActualizarEstudioDto) {
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
  async cambiarPlan(@Param('id') _id: string, @Body(new ZodValidationPipe(cambiarPlanDtoSchema)) dto: CambiarPlanDto) {
    return this.cambiarPlanHandler.execute({ planId: dto.planId });
  }

  @Post(':id/subscripcion/renovar')
  @ApiOperation({ summary: 'Renovar subscripcion' })
  async renovar(@Param('id') _id: string, @Body(new ZodValidationPipe(renovarSubscripcionDtoSchema)) dto: RenovarSubscripcionDto) {
    return this.renovarHandler.execute({ nuevaFechaFin: dto.nuevaFechaFin });
  }

  @Post(':id/subscripcion/cancelar')
  @ApiOperation({ summary: 'Cancelar subscripcion' })
  async cancelar(@Param('id') _id: string) {
    return this.cancelarHandler.execute();
  }

  @Post(':id/subscripcion/marcar-vencida')
  @ApiOperation({ summary: 'Marcar subscripcion como vencida' })
  async marcarVencida(@Param('id') _id: string) {
    return this.marcarVencidaHandler.execute({ subscripcionId: _id });
  }
}
