import { Controller, Get, Post, Put, Patch, Param, Body, Query, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CrearEmpleadoDto } from '../../application/dtos/crear-empleado.dto';
import { ActualizarEmpleadoDto } from '../../application/dtos/actualizar-empleado.dto';
import { ActualizarSueldoDto } from '../../application/dtos/actualizar-sueldo.dto';
import { EMPLEADO_REPOSITORY } from '../../domain/repositories/empleado.repository';
import type { EmpleadoRepository } from '../../domain/repositories/empleado.repository';
import { Empleado } from '../../domain/entities/empleado.entity';
import { EstudioId } from '../../../shared/infrastructure/decorators/estudio-id.decorator';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

@ApiTags('Nomina')
@Controller({ path: 'nomina', version: '1' })
export class NominaController {
  constructor(
    @Inject(EMPLEADO_REPOSITORY) private readonly empleadoRepo: EmpleadoRepository,
  ) {}

  @Get('empleados')
  @ApiOperation({ summary: 'Listar empleados del estudio' })
  async list(
    @EstudioId() estudioId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const empleados = await this.empleadoRepo.findByEstudioId(estudioId);
    return successResponse(empleados, { total: empleados.length, page: +page, limit: +limit });
  }

  @Post('empleados')
  @ApiOperation({ summary: 'Crear empleado' })
  async create(@Body() dto: CrearEmpleadoDto, @EstudioId() estudioId: string) {
    const empleado = Empleado.create({
      clienteId: dto.clienteId,
      estudioId,
      nombre: dto.nombre,
      apellido: dto.apellido,
      cuil: dto.cuil,
      fechaIngreso: new Date(dto.fechaIngreso),
      sueldoBasico: dto.sueldoBasico,
      categoriaConvenio: dto.categoriaConvenio,
    });
    await this.empleadoRepo.save(empleado);
    return empleado;
  }

  @Put('empleados/:id')
  @ApiOperation({ summary: 'Actualizar empleado' })
  async update(@Param('id') id: string, @Body() dto: ActualizarEmpleadoDto) {
    const empleado = await this.empleadoRepo.findById(id);
    if (!empleado) throw new RecursoNoEncontradoError('Empleado');

    empleado.actualizar(dto);
    await this.empleadoRepo.save(empleado);
    return empleado;
  }

  @Patch('empleados/:id/baja')
  @ApiOperation({ summary: 'Dar de baja empleado' })
  async darDeBaja(@Param('id') id: string, @Body() body: { fecha: string }) {
    const empleado = await this.empleadoRepo.findById(id);
    if (!empleado) throw new RecursoNoEncontradoError('Empleado');

    empleado.darDeBaja(new Date(body.fecha));
    await this.empleadoRepo.save(empleado);
    return empleado;
  }

  @Patch('empleados/:id/sueldo')
  @ApiOperation({ summary: 'Actualizar sueldo de empleado' })
  async actualizarSueldo(@Param('id') id: string, @Body() dto: ActualizarSueldoDto) {
    const empleado = await this.empleadoRepo.findById(id);
    if (!empleado) throw new RecursoNoEncontradoError('Empleado');

    empleado.actualizarSueldo(dto.sueldo);
    await this.empleadoRepo.save(empleado);
    return empleado;
  }
}
