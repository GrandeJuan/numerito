import { Controller, Get, Post, Put, Patch, Param, Body, Inject, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ADMIN_PLAN_REPOSITORY } from '../../domain/repositories/admin-plan.repository';
import type { AdminPlanRepository } from '../../domain/repositories/admin-plan.repository';
import { SuperAdminGuard } from '../guards/superadmin.guard';
import { CrearPlanDto } from '../../application/dtos/crear-plan.dto';
import { ActualizarPlanDto } from '../../application/dtos/actualizar-plan.dto';
import { RecursoNoEncontradoError, OperacionInvalidaError } from '../../../shared/domain/exceptions';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';

@ApiTags('Admin — Planes')
@Controller({ path: 'admin/planes', version: '1' })
@UseGuards(SuperAdminGuard)
export class AdminPlanesController {
  constructor(
    @Inject(ADMIN_PLAN_REPOSITORY) private readonly planRepo: AdminPlanRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los planes' })
  async list() {
    const plans = await this.planRepo.findAll();
    return successResponse(plans);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener plan por ID' })
  async getById(@Param('id', ParseIntPipe) id: number) {
    const plan = await this.planRepo.findById(id);
    if (!plan) throw new RecursoNoEncontradoError('Plan');
    return plan;
  }

  @Post()
  @ApiOperation({ summary: 'Crear plan' })
  async create(@Body() dto: CrearPlanDto) {
    const existing = await this.planRepo.findByCodigo(dto.codigo);
    if (existing) {
      throw new OperacionInvalidaError('El código de plan ya existe');
    }

    return this.planRepo.save({
      codigo: dto.codigo,
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      maxClientes: dto.maxClientes,
      maxUsuarios: dto.maxUsuarios,
      precio: dto.precio,
      isPublico: dto.isPublico ?? true,
      isActivo: true,
      condiciones: dto.condiciones,
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar plan' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: ActualizarPlanDto) {
    const plan = await this.planRepo.findById(id);
    if (!plan) throw new RecursoNoEncontradoError('Plan');

    if (dto.nombre !== undefined) plan.nombre = dto.nombre;
    if (dto.descripcion !== undefined) plan.descripcion = dto.descripcion;
    if (dto.maxClientes !== undefined) plan.maxClientes = dto.maxClientes;
    if (dto.maxUsuarios !== undefined) plan.maxUsuarios = dto.maxUsuarios;
    if (dto.precio !== undefined) plan.precio = dto.precio;
    if (dto.isPublico !== undefined) plan.isPublico = dto.isPublico;
    if (dto.condiciones !== undefined) plan.condiciones = dto.condiciones;

    return this.planRepo.save(plan);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Desactivar plan' })
  async deactivate(@Param('id', ParseIntPipe) id: number) {
    const plan = await this.planRepo.findById(id);
    if (!plan) throw new RecursoNoEncontradoError('Plan');

    plan.isActivo = false;
    return this.planRepo.save(plan);
  }
}
