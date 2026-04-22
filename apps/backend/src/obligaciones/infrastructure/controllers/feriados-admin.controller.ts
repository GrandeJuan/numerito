import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminGuard } from '../../../shared/infrastructure/guards/admin.guard';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';
import { CrearFeriadoHandler } from '../../application/commands/crear-feriado.command';
import { ActualizarFeriadoHandler } from '../../application/commands/actualizar-feriado.command';
import { EliminarFeriadoHandler } from '../../application/commands/eliminar-feriado.command';
import { FeriadoListHandler } from '../../application/queries/feriado-list.query';
import {
  crearFeriadoDtoSchema,
  actualizarFeriadoDtoSchema,
  type CrearFeriadoDto,
  type ActualizarFeriadoDto,
} from '../../application/dtos/feriado.dto';

@ApiTags('Admin — Feriados')
@Controller({ path: 'admin/feriados', version: '1' })
@UseGuards(AdminGuard)
export class FeriadosAdminController {
  constructor(
    private readonly crearHandler: CrearFeriadoHandler,
    private readonly actualizarHandler: ActualizarFeriadoHandler,
    private readonly eliminarHandler: EliminarFeriadoHandler,
    private readonly listHandler: FeriadoListHandler,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar feriados (filtrar por año y/o tipo)' })
  async list(@Query('anio') anio?: string, @Query('tipo') tipo?: string) {
    const items = await this.listHandler.execute({
      anio: anio ? parseInt(anio, 10) : undefined,
      tipo: tipo || undefined,
    });
    return successResponse(items);
  }

  @Post()
  @ApiOperation({ summary: 'Crear feriado manualmente' })
  async create(
    @Body(new ZodValidationPipe(crearFeriadoDtoSchema))
    dto: CrearFeriadoDto,
  ) {
    const result = await this.crearHandler.execute(dto);
    return successResponse(result);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar feriado' })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarFeriadoDtoSchema))
    dto: ActualizarFeriadoDto,
  ) {
    const result = await this.actualizarHandler.execute({ id, ...dto });
    return successResponse(result);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Eliminar feriado' })
  async delete(@Param('id') id: string) {
    await this.eliminarHandler.execute({ id });
  }
}
