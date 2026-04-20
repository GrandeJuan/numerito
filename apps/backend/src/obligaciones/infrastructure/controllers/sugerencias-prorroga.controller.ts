import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import { Principal } from '../../../shared/infrastructure/decorators/estudio-principal.decorator';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';
import { AprobarSugerenciaProrrogaHandler } from '../../application/commands/aprobar-sugerencia-prorroga.command';
import { DescartarSugerenciaProrrogaHandler } from '../../application/commands/descartar-sugerencia-prorroga.command';
import { SugerenciasProrrogaListHandler } from '../../application/queries/sugerencias-prorroga-list.query';

@ApiTags('Sugerencias de Prórroga')
@Controller({ path: 'vencimientos/sugerencias-prorroga', version: '1' })
export class SugerenciasProrrogaController {
  constructor(
    private readonly aprobarHandler: AprobarSugerenciaProrrogaHandler,
    private readonly descartarHandler: DescartarSugerenciaProrrogaHandler,
    private readonly listHandler: SugerenciasProrrogaListHandler,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar sugerencias de prórroga del estudio' })
  async list(
    @Principal() principal: EstudioPrincipal,
    @Query('estado') estado?: string,
  ) {
    const items = await this.listHandler.execute(principal, { estado });
    return successResponse(items);
  }

  @Patch(':id/aprobar')
  @ApiOperation({ summary: 'Aprobar sugerencia de prórroga (ejecuta la prórroga)' })
  async aprobar(@Principal() principal: EstudioPrincipal, @Param('id') id: string) {
    await this.aprobarHandler.execute(principal, { sugerenciaId: id });
    return successResponse({ message: 'Sugerencia aprobada y prórroga aplicada' });
  }

  @Patch(':id/descartar')
  @ApiOperation({ summary: 'Descartar sugerencia de prórroga' })
  async descartar(@Principal() principal: EstudioPrincipal, @Param('id') id: string) {
    await this.descartarHandler.execute(principal, { sugerenciaId: id });
    return successResponse({ message: 'Sugerencia descartada' });
  }
}
