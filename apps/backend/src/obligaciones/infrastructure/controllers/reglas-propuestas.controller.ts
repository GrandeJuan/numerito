import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminGuard } from '../../../iam/infrastructure/guards/admin.guard';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';
import { AprobarReglaPropuestaHandler } from '../../application/commands/aprobar-regla-propuesta.command';
import { RechazarReglaPropuestaHandler } from '../../application/commands/rechazar-regla-propuesta.command';
import { AprobarReglasBloqueHandler } from '../../application/commands/aprobar-reglas-bloque.command';
import { ReglasPropuestasListHandler } from '../../application/queries/reglas-propuestas-list.query';
import { z } from 'zod';

const aprobarBloqueDtoSchema = z.object({
  reglaIds: z.array(z.string().min(1)).min(1),
});
type AprobarBloqueDto = z.infer<typeof aprobarBloqueDtoSchema>;

@ApiTags('Admin — Reglas Propuestas')
@Controller({ path: 'admin/reglas/propuestas', version: '1' })
@UseGuards(AdminGuard)
export class ReglasPropuestasController {
  constructor(
    private readonly aprobarHandler: AprobarReglaPropuestaHandler,
    private readonly rechazarHandler: RechazarReglaPropuestaHandler,
    private readonly aprobarBloqueHandler: AprobarReglasBloqueHandler,
    private readonly listHandler: ReglasPropuestasListHandler,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar reglas propuestas con diff contra activas' })
  async list(@Query('fuente') fuente?: string) {
    const items = await this.listHandler.execute(fuente ? { fuente } : undefined);
    return successResponse(items);
  }

  @Patch(':id/aprobar')
  @ApiOperation({ summary: 'Aprobar una regla propuesta (cierra vigencia de la activa)' })
  async aprobar(@Param('id') id: string) {
    const result = await this.aprobarHandler.execute({ reglaId: id });
    return successResponse(result);
  }

  @Patch(':id/rechazar')
  @ApiOperation({ summary: 'Rechazar una regla propuesta' })
  async rechazar(@Param('id') id: string) {
    const result = await this.rechazarHandler.execute({ reglaId: id });
    return successResponse(result);
  }

  @Post('aprobar-bloque')
  @ApiOperation({ summary: 'Aprobar múltiples reglas propuestas en bloque' })
  async aprobarBloque(
    @Body(new ZodValidationPipe(aprobarBloqueDtoSchema)) dto: AprobarBloqueDto,
  ) {
    const result = await this.aprobarBloqueHandler.execute({ reglaIds: dto.reglaIds });
    return successResponse(result);
  }
}
