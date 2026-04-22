import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminGuard } from '../../../shared/infrastructure/guards/admin.guard';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';
import { CATALOGO_OBLIGACION_REPOSITORY } from '../../domain/repositories/catalogo-obligacion.repository';
import type { CatalogoObligacionRepository } from '../../domain/repositories/catalogo-obligacion.repository';
import { REGLA_VENCIMIENTO_ENTITY_REPOSITORY } from '../../domain/repositories/regla-vencimiento.repository';
import type { ReglaVencimientoEntityRepository } from '../../domain/repositories/regla-vencimiento.repository';
import { CrearCatalogoObligacionHandler } from '../../application/commands/crear-catalogo-obligacion.command';
import { ActualizarCatalogoObligacionHandler } from '../../application/commands/actualizar-catalogo-obligacion.command';
import { CrearReglaVencimientoHandler } from '../../application/commands/crear-regla-vencimiento.command';
import { ActualizarReglaVencimientoHandler } from '../../application/commands/actualizar-regla-vencimiento.command';
import { CatalogoObligacionListHandler } from '../../application/queries/catalogo-obligacion-list.query';
import { ReglaVencimientoListHandler } from '../../application/queries/regla-vencimiento-list.query';
import {
  crearCatalogoDtoSchema,
  type CrearCatalogoDto,
  actualizarCatalogoDtoSchema,
  type ActualizarCatalogoDto,
} from '../../application/dtos/catalogo-obligacion.dto';
import {
  crearReglaDtoSchema,
  type CrearReglaDto,
  actualizarReglaDtoSchema,
  type ActualizarReglaDto,
} from '../../application/dtos/regla-vencimiento.dto';

@ApiTags('Admin — Catálogo Obligaciones')
@Controller({ path: 'admin/catalogo-obligaciones', version: '1' })
@UseGuards(AdminGuard)
export class CatalogoAdminController {
  constructor(
    @Inject(CATALOGO_OBLIGACION_REPOSITORY)
    private readonly catalogoRepo: CatalogoObligacionRepository,
    @Inject(REGLA_VENCIMIENTO_ENTITY_REPOSITORY)
    private readonly reglaRepo: ReglaVencimientoEntityRepository,
    private readonly crearCatalogoHandler: CrearCatalogoObligacionHandler,
    private readonly actualizarCatalogoHandler: ActualizarCatalogoObligacionHandler,
    private readonly crearReglaHandler: CrearReglaVencimientoHandler,
    private readonly actualizarReglaHandler: ActualizarReglaVencimientoHandler,
    private readonly catalogoListHandler: CatalogoObligacionListHandler,
    private readonly reglaListHandler: ReglaVencimientoListHandler,
  ) {}

  // ── Catálogo ──────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Listar catálogo de obligaciones' })
  async listCatalogo() {
    const items = await this.catalogoListHandler.execute();
    return successResponse(items);
  }

  @Post()
  @ApiOperation({ summary: 'Crear entrada de catálogo' })
  async createCatalogo(@Body(new ZodValidationPipe(crearCatalogoDtoSchema)) dto: CrearCatalogoDto) {
    const result = await this.crearCatalogoHandler.execute(dto);
    return successResponse(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener entrada de catálogo por ID' })
  async getCatalogo(@Param('id') id: string) {
    const catalogo = await this.catalogoRepo.findById(id);
    if (!catalogo) throw new RecursoNoEncontradoError('CatalogoObligacion');
    return successResponse({
      id: catalogo.id,
      nombre: catalogo.nombre,
      tipoObligacion: catalogo.tipoObligacion,
      jurisdiccion: catalogo.jurisdiccion,
      frecuencia: catalogo.frecuencia,
      activo: catalogo.activo,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar entrada de catálogo' })
  async updateCatalogo(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarCatalogoDtoSchema)) dto: ActualizarCatalogoDto,
  ) {
    const result = await this.actualizarCatalogoHandler.execute({ id, ...dto });
    return successResponse(result);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar entrada de catálogo' })
  async deleteCatalogo(@Param('id') id: string) {
    const catalogo = await this.catalogoRepo.findById(id);
    if (!catalogo) throw new RecursoNoEncontradoError('CatalogoObligacion');
    await this.catalogoRepo.delete(catalogo);
    return successResponse({ deleted: true });
  }

  // ── Reglas Vencimiento ──────────────────────────

  @Get('reglas')
  @ApiOperation({ summary: 'Listar reglas de vencimiento' })
  async listReglas(@Query('estado') estado?: string) {
    const items = await this.reglaListHandler.execute(estado ? { estado } : undefined);
    return successResponse(items);
  }

  @Post('reglas')
  @ApiOperation({ summary: 'Crear regla de vencimiento' })
  async createRegla(@Body(new ZodValidationPipe(crearReglaDtoSchema)) dto: CrearReglaDto) {
    const result = await this.crearReglaHandler.execute(dto);
    return successResponse(result);
  }

  @Get('reglas/:id')
  @ApiOperation({ summary: 'Obtener regla por ID' })
  async getRegla(@Param('id') id: string) {
    const regla = await this.reglaRepo.findById(id);
    if (!regla) throw new RecursoNoEncontradoError('ReglaVencimiento');
    return successResponse({
      id: regla.id,
      tipoObligacion: regla.tipoObligacion,
      jurisdiccion: regla.jurisdiccion,
      regimen: regla.regimen,
      terminacionCuit: regla.terminacionCuit,
      diaVencimiento: regla.diaVencimiento,
      mesSiguiente: regla.mesSiguiente,
      vigenciaDesde: regla.vigenciaDesde.toISOString(),
      vigenciaHasta: regla.vigenciaHasta?.toISOString() ?? null,
      origen: regla.origen,
      estado: regla.estado,
    });
  }

  @Patch('reglas/:id')
  @ApiOperation({ summary: 'Actualizar regla de vencimiento' })
  async updateRegla(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarReglaDtoSchema)) dto: ActualizarReglaDto,
  ) {
    const result = await this.actualizarReglaHandler.execute({ id, ...dto });
    return successResponse(result);
  }

  @Delete('reglas/:id')
  @ApiOperation({ summary: 'Eliminar regla de vencimiento' })
  async deleteRegla(@Param('id') id: string) {
    const regla = await this.reglaRepo.findById(id);
    if (!regla) throw new RecursoNoEncontradoError('ReglaVencimiento');
    await this.reglaRepo.delete(regla);
    return successResponse({ deleted: true });
  }
}
