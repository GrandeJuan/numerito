import { Controller, Get, Post, Patch, Param, Body, Query, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CrearTareaDto, crearTareaDtoSchema } from '../../application/dtos/crear-tarea.dto';
import { AsignarTareaDto, asignarTareaDtoSchema } from '../../application/dtos/asignar-tarea.dto';
import { RegistrarHorasDto, registrarHorasDtoSchema } from '../../application/dtos/registrar-horas.dto';
import { AgregarComentarioDto, agregarComentarioDtoSchema } from '../../application/dtos/agregar-comentario.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';
import { TAREA_REPOSITORY } from '../../domain/repositories/tarea.repository';
import type { TareaRepository } from '../../domain/repositories/tarea.repository';
import { Tarea } from '../../domain/entities/tarea.entity';
import { IniciarTareaHandler } from '../../application/commands/iniciar-tarea.command';
import { CompletarTareaHandler } from '../../application/commands/completar-tarea.command';
import { AsignarTareaHandler } from '../../application/commands/asignar-tarea.command';
import { RegistrarHorasHandler } from '../../application/commands/registrar-horas.command';
import { EstudioId } from '../../../shared/infrastructure/decorators/estudio-id.decorator';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

@ApiTags('Tareas')
@Controller({ path: 'tareas', version: '1' })
export class TareasController {
  constructor(
    @Inject(TAREA_REPOSITORY) private readonly tareaRepo: TareaRepository,
    private readonly iniciarTareaHandler: IniciarTareaHandler,
    private readonly completarTareaHandler: CompletarTareaHandler,
    private readonly asignarTareaHandler: AsignarTareaHandler,
    private readonly registrarHorasHandler: RegistrarHorasHandler,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar tareas del estudio' })
  async list(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('estado') estado?: string,
    @Query('responsableId') responsableId?: string,
    @Query('clienteId') clienteId?: string,
  ) {
    let tareas: Tarea[];

    if (responsableId) {
      tareas = await this.tareaRepo.findByResponsableId(responsableId);
    } else {
      tareas = await this.tareaRepo.findAll();
    }

    if (estado) {
      tareas = tareas.filter((t) => t.estado === estado);
    }
    if (clienteId) {
      tareas = tareas.filter((t) => t.clienteId === clienteId);
    }

    return successResponse(tareas, { total: tareas.length, page: +page, limit: +limit });
  }

  @Post()
  @ApiOperation({ summary: 'Crear tarea' })
  async create(@Body(new ZodValidationPipe(crearTareaDtoSchema)) dto: CrearTareaDto, @EstudioId() estudioId: string) {
    const tarea = Tarea.create({ ...dto, estudioId });
    await this.tareaRepo.save(tarea);
    return successResponse(tarea);
  }

  @Patch(':id/iniciar')
  @ApiOperation({ summary: 'Iniciar tarea' })
  async iniciar(@Param('id') id: string) {
    const tarea = await this.iniciarTareaHandler.execute({ tareaId: id });
    return successResponse(tarea);
  }

  @Patch(':id/completar')
  @ApiOperation({ summary: 'Completar tarea' })
  async completar(@Param('id') id: string) {
    const tarea = await this.completarTareaHandler.execute({ tareaId: id });
    return successResponse(tarea);
  }

  @Patch(':id/asignar')
  @ApiOperation({ summary: 'Asignar responsable a tarea' })
  async asignar(@Param('id') id: string, @Body(new ZodValidationPipe(asignarTareaDtoSchema)) dto: AsignarTareaDto) {
    const tarea = await this.asignarTareaHandler.execute({
      tareaId: id,
      responsableId: dto.responsableId,
    });
    return successResponse(tarea);
  }

  @Post(':id/horas')
  @ApiOperation({ summary: 'Registrar horas en tarea' })
  async registrarHoras(@Param('id') id: string, @Body(new ZodValidationPipe(registrarHorasDtoSchema)) dto: RegistrarHorasDto) {
    const tarea = await this.registrarHorasHandler.execute({
      tareaId: id,
      horas: dto.horas,
    });
    return successResponse(tarea);
  }

  @Post(':id/comentarios')
  @ApiOperation({ summary: 'Agregar comentario a tarea' })
  async agregarComentario(@Param('id') id: string, @Body(new ZodValidationPipe(agregarComentarioDtoSchema)) dto: AgregarComentarioDto) {
    const tarea = await this.findOrFail(id);
    tarea.agregarComentario(dto.autorId, dto.texto);
    await this.tareaRepo.save(tarea);
    return successResponse(tarea);
  }

  private async findOrFail(id: string): Promise<Tarea> {
    const tarea = await this.tareaRepo.findById(id);
    if (!tarea) throw new RecursoNoEncontradoError('Tarea');
    return tarea;
  }
}
