import { Controller, Get, Post, Patch, Param, Body, Query, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import { CrearLibroDto, crearLibroDtoSchema } from '../../application/dtos/crear-libro.dto';
import { RubricarLibroDto, rubricarLibroDtoSchema } from '../../application/dtos/rubricar-libro.dto';
import { CrearAsientoDto, crearAsientoDtoSchema } from '../../application/dtos/crear-asiento.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';
import { ContabilidadStatsQuery } from '../../application/queries/contabilidad-stats.query';
import { LIBRO_CONTABLE_REPOSITORY } from '../../domain/repositories/libro-contable.repository';
import { ASIENTO_CONTABLE_REPOSITORY } from '../../domain/repositories/asiento-contable.repository';
import type { LibroContableRepository } from '../../domain/repositories/libro-contable.repository';
import type { AsientoContableRepository } from '../../domain/repositories/asiento-contable.repository';
import { LibroContable, TipoLibro } from '../../domain/entities/libro-contable.entity';
import { AsientoContable } from '../../domain/entities/asiento-contable.entity';
import { Principal } from '../../../shared/infrastructure/decorators/estudio-principal.decorator';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

@ApiTags('Contabilidad')
@Controller({ path: 'contabilidad', version: '1' })
export class ContabilidadController {
  constructor(
    @Inject(LIBRO_CONTABLE_REPOSITORY) private readonly libroRepo: LibroContableRepository,
    @Inject(ASIENTO_CONTABLE_REPOSITORY) private readonly asientoRepo: AsientoContableRepository,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Estadisticas de contabilidad del estudio' })
  async stats(@Principal() principal: EstudioPrincipal) {
    const query = new ContabilidadStatsQuery(this.libroRepo, this.asientoRepo);
    const stats = await query.execute(principal);
    return successResponse(stats);
  }

  @Get('libros')
  @ApiOperation({ summary: 'Listar libros contables del estudio' })
  async listLibros(@Principal() principal: EstudioPrincipal, @Query('page') page = 1, @Query('limit') limit = 20) {
    const libros = await this.libroRepo.findAll(principal);
    return successResponse(libros, { total: libros.length, page: +page, limit: +limit });
  }

  @Post('libros')
  @ApiOperation({ summary: 'Crear libro contable' })
  async createLibro(@Body(new ZodValidationPipe(crearLibroDtoSchema)) dto: CrearLibroDto, @Principal() principal: EstudioPrincipal) {
    const libro = LibroContable.create({
      clienteId: dto.clienteId,
      estudioId: principal.estudioId,
      tipo: dto.tipo as TipoLibro,
      periodo: dto.periodo,
    });
    await this.libroRepo.save(principal, libro);
    return libro;
  }

  @Patch('libros/:id/rubricar')
  @ApiOperation({ summary: 'Rubricar libro contable' })
  async rubricarLibro(@Principal() principal: EstudioPrincipal, @Param('id') id: string, @Body(new ZodValidationPipe(rubricarLibroDtoSchema)) dto: RubricarLibroDto) {
    const libro = await this.libroRepo.findById(principal, id);
    if (!libro) throw new RecursoNoEncontradoError('LibroContable');

    libro.rubricar(dto.numeroRubrica);
    await this.libroRepo.save(principal, libro);
    return libro;
  }

  @Get('libros/:id/asientos')
  @ApiOperation({ summary: 'Listar asientos de un libro' })
  async listAsientosByLibro(
    @Principal() principal: EstudioPrincipal,
    @Param('id') libroId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const libro = await this.libroRepo.findById(principal, libroId);
    if (!libro) throw new RecursoNoEncontradoError('LibroContable');

    const asientos = await this.asientoRepo.findByLibroId(principal, libroId);
    return successResponse(asientos, { total: asientos.length, page: +page, limit: +limit });
  }

  @Post('asientos')
  @ApiOperation({ summary: 'Crear asiento contable' })
  async createAsiento(@Body(new ZodValidationPipe(crearAsientoDtoSchema)) dto: CrearAsientoDto, @Principal() principal: EstudioPrincipal) {
    const asiento = AsientoContable.create({
      libroId: dto.libroId,
      clienteId: dto.clienteId,
      estudioId: principal.estudioId,
      fecha: new Date(dto.fecha),
      descripcion: dto.descripcion,
      lineas: dto.lineas,
    });

    await this.asientoRepo.save(principal, asiento);
    return asiento;
  }
}
