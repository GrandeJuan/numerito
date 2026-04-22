import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminGuard } from '../../../shared/infrastructure/guards/admin.guard';
import { CrearPlanDto, crearPlanDtoSchema } from '../../application/dtos/crear-plan.dto';
import {
  ActualizarPlanDto,
  actualizarPlanDtoSchema,
} from '../../application/dtos/actualizar-plan.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';
import { AdminPlanesService } from '../../application/services/admin-planes.service';

@ApiTags('Admin — Planes')
@Controller({ path: 'admin/planes', version: '1' })
@UseGuards(AdminGuard)
export class AdminPlanesController {
  constructor(private readonly planesService: AdminPlanesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los planes' })
  async list() {
    const plans = await this.planesService.findAll();
    return successResponse(plans);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener plan por ID' })
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.planesService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear plan' })
  async create(@Body(new ZodValidationPipe(crearPlanDtoSchema)) dto: CrearPlanDto) {
    return this.planesService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar plan' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(actualizarPlanDtoSchema)) dto: ActualizarPlanDto,
  ) {
    return this.planesService.update(id, dto);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Desactivar plan' })
  async deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.planesService.deactivate(id);
  }
}
