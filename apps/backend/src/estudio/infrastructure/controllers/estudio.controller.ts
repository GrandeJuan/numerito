import { Controller, Get, Put, Post, Param, Body, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ESTUDIO_REPOSITORY } from '../../domain/repositories/estudio.repository';
import type { EstudioRepository } from '../../domain/repositories/estudio.repository';
import { ESTUDIO_EQUIPO_VIEW } from '../../../iam/application/public-views';
import type { EstudioEquipoViewInput, EquipoMiembroDto } from '../../../iam/application/public-views';
import { NombreEstudio } from '../../domain/value-objects/nombre-estudio.vo';
import {
  ActualizarEstudioDto,
  actualizarEstudioDtoSchema,
} from '../../application/dtos/actualizar-estudio.dto';
import { CambiarPlanDto, cambiarPlanDtoSchema } from '../../application/dtos/cambiar-plan.dto';
import {
  RenovarSubscripcionDto,
  renovarSubscripcionDtoSchema,
} from '../../application/dtos/renovar-subscripcion.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';
import { Principal } from '../../../shared/infrastructure/decorators/estudio-principal.decorator';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
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
    @Inject(ESTUDIO_EQUIPO_VIEW) private readonly equipoView: { execute(input: EstudioEquipoViewInput): Promise<EquipoMiembroDto[]> },
    private readonly renovarHandler: RenovarSubscripcionHandler,
    private readonly cancelarHandler: CancelarSubscripcionHandler,
    private readonly marcarVencidaHandler: MarcarSubscripcionVencidaHandler,
    private readonly cambiarPlanHandler: CambiarPlanSubscripcionHandler,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtener estudio actual del usuario' })
  async getMine(@Principal() principal: EstudioPrincipal) {
    const estudio = await this.estudioRepo.findById(principal.estudioId);
    if (!estudio) throw new RecursoNoEncontradoError('Estudio');
    return {
      nombre: estudio.nombre.value,
      cuit: estudio.cuit,
      condicionIva: 'RESPONSABLE_INSCRIPTO',
    };
  }

  @Get('equipo')
  @ApiOperation({ summary: 'Obtener equipo del estudio actual' })
  async getEquipo(@Principal() principal: EstudioPrincipal) {
    return this.equipoView.execute({ estudioId: principal.estudioId });
  }

  @Get('plan')
  @ApiOperation({ summary: 'Obtener plan del estudio actual' })
  async getPlan(@Principal() principal: EstudioPrincipal) {
    const estudio = await this.estudioRepo.findById(principal.estudioId);
    if (!estudio) throw new RecursoNoEncontradoError('Estudio');
    const subscripcion = await this.subscripcionRepo.findActiva(principal).catch(() => null);
    return {
      nombre: estudio.plan.value,
      estado: subscripcion ? 'ACTIVA' : 'SIN_SUBSCRIPCION',
      clientesActuales: 0,
      clientesMax: estudio.plan.maxClientes,
      usuariosActuales: 0,
      usuariosMax: estudio.plan.maxUsuarios,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener estudio por ID' })
  async getById(@Param('id') id: string) {
    const estudio = await this.estudioRepo.findById(id);
    if (!estudio) throw new RecursoNoEncontradoError('Estudio');
    return estudio;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar estudio' })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarEstudioDtoSchema)) dto: ActualizarEstudioDto,
  ) {
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
  async getSubscripcion(@Principal() principal: EstudioPrincipal, @Param('id') _id: string) {
    const subscripcion = await this.subscripcionRepo.findActiva(principal);
    if (!subscripcion) throw new RecursoNoEncontradoError('Subscripcion');
    return subscripcion;
  }

  @Post(':id/subscripcion/cambiar-plan')
  @ApiOperation({ summary: 'Cambiar plan de subscripcion' })
  async cambiarPlan(
    @Principal() principal: EstudioPrincipal,
    @Param('id') _id: string,
    @Body(new ZodValidationPipe(cambiarPlanDtoSchema)) dto: CambiarPlanDto,
  ) {
    return this.cambiarPlanHandler.execute(principal, { planId: dto.planId });
  }

  @Post(':id/subscripcion/renovar')
  @ApiOperation({ summary: 'Renovar subscripcion' })
  async renovar(
    @Principal() principal: EstudioPrincipal,
    @Param('id') _id: string,
    @Body(new ZodValidationPipe(renovarSubscripcionDtoSchema)) dto: RenovarSubscripcionDto,
  ) {
    return this.renovarHandler.execute(principal, { nuevaFechaFin: dto.nuevaFechaFin });
  }

  @Post(':id/subscripcion/cancelar')
  @ApiOperation({ summary: 'Cancelar subscripcion' })
  async cancelar(@Principal() principal: EstudioPrincipal, @Param('id') _id: string) {
    return this.cancelarHandler.execute(principal);
  }

  @Post(':id/subscripcion/marcar-vencida')
  @ApiOperation({ summary: 'Marcar subscripcion como vencida' })
  async marcarVencida(@Principal() principal: EstudioPrincipal, @Param('id') _id: string) {
    return this.marcarVencidaHandler.execute(principal, { subscripcionId: _id });
  }
}
