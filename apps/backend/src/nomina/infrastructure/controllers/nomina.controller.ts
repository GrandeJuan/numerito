import { Controller, Get, Post, Put, Patch, Param, Body, Query, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CrearEmpleadoDto, crearEmpleadoDtoSchema } from '../../application/dtos/crear-empleado.dto';
import { ActualizarEmpleadoDto, actualizarEmpleadoDtoSchema } from '../../application/dtos/actualizar-empleado.dto';
import { ActualizarSueldoDto, actualizarSueldoDtoSchema } from '../../application/dtos/actualizar-sueldo.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';
import { EMPLEADO_REPOSITORY } from '../../domain/repositories/empleado.repository';
import type { EmpleadoRepository } from '../../domain/repositories/empleado.repository';
import { Empleado } from '../../domain/entities/empleado.entity';
import { Principal } from '../../../shared/infrastructure/decorators/estudio-principal.decorator';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

@ApiTags('Nomina')
@Controller({ path: 'nomina', version: '1' })
export class NominaController {
  constructor(@Inject(EMPLEADO_REPOSITORY) private readonly empleadoRepo: EmpleadoRepository) {}

  @Get('empleados')
  @ApiOperation({ summary: 'Listar empleados del estudio' })
  async list(@Principal() principal: EstudioPrincipal, @Query('page') page = 1, @Query('limit') limit = 20) {
    const empleados = await this.empleadoRepo.findAll(principal);
    return successResponse(empleados, { total: empleados.length, page: +page, limit: +limit });
  }

  @Post('empleados')
  @ApiOperation({ summary: 'Crear empleado' })
  async create(@Body(new ZodValidationPipe(crearEmpleadoDtoSchema)) dto: CrearEmpleadoDto, @Principal() principal: EstudioPrincipal) {
    const empleado = Empleado.create({
      clienteId: dto.clienteId,
      estudioId: principal.estudioId,
      nombre: dto.nombre,
      apellido: dto.apellido,
      cuil: dto.cuil,
      fechaIngreso: new Date(dto.fechaIngreso),
      sueldoBasico: dto.sueldoBasico,
      categoriaConvenio: dto.categoriaConvenio,
    });
    await this.empleadoRepo.save(principal, empleado);
    return empleado;
  }

  @Put('empleados/:id')
  @ApiOperation({ summary: 'Actualizar empleado' })
  async update(@Principal() principal: EstudioPrincipal, @Param('id') id: string, @Body(new ZodValidationPipe(actualizarEmpleadoDtoSchema)) dto: ActualizarEmpleadoDto) {
    const empleado = await this.empleadoRepo.findById(principal, id);
    if (!empleado) throw new RecursoNoEncontradoError('Empleado');

    empleado.actualizar(dto);
    await this.empleadoRepo.save(principal, empleado);
    return empleado;
  }

  @Patch('empleados/:id/baja')
  @ApiOperation({ summary: 'Dar de baja empleado' })
  async darDeBaja(@Principal() principal: EstudioPrincipal, @Param('id') id: string, @Body() body: { fecha: string }) {
    const empleado = await this.empleadoRepo.findById(principal, id);
    if (!empleado) throw new RecursoNoEncontradoError('Empleado');

    empleado.darDeBaja(new Date(body.fecha));
    await this.empleadoRepo.save(principal, empleado);
    return empleado;
  }

  @Patch('empleados/:id/sueldo')
  @ApiOperation({ summary: 'Actualizar sueldo de empleado' })
  async actualizarSueldo(@Principal() principal: EstudioPrincipal, @Param('id') id: string, @Body(new ZodValidationPipe(actualizarSueldoDtoSchema)) dto: ActualizarSueldoDto) {
    const empleado = await this.empleadoRepo.findById(principal, id);
    if (!empleado) throw new RecursoNoEncontradoError('Empleado');

    empleado.actualizarSueldo(dto.sueldo);
    await this.empleadoRepo.save(principal, empleado);
    return empleado;
  }
}
