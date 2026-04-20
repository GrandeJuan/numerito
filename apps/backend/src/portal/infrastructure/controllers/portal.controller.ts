import { Controller, Get, Inject, Param, Res, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../../iam/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../iam/infrastructure/guards/roles.guard';
import { Roles } from '../../../iam/infrastructure/decorators/roles.decorator';
import { CurrentUser } from '../../../iam/infrastructure/decorators/current-user.decorator';
import { ObtenerPortalStatsHandler } from '../../application/queries/obtener-portal-stats.query';
import { ObtenerResumenesClienteHandler } from '../../application/queries/obtener-resumenes-cliente.query';
import { DescargarCalendarioPdfHandler } from '../../application/queries/descargar-calendario-pdf.query';
import type { ClientePorUsuarioPortalView } from '../../../clientes/application/views/cliente-por-usuario-portal.view';
import { CLIENTE_POR_USUARIO_PORTAL_VIEW } from '../../../clientes/application/public-views';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';
import { ROL } from '@numerito/shared';

@ApiTags('Portal')
@Controller({ path: 'portal', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROL.CLIENTE)
export class PortalController {
  constructor(
    private readonly statsHandler: ObtenerPortalStatsHandler,
    private readonly resumenesHandler: ObtenerResumenesClienteHandler,
    private readonly descargarPdfHandler: DescargarCalendarioPdfHandler,
    @Inject(CLIENTE_POR_USUARIO_PORTAL_VIEW) private readonly clientePorUsuario: ClientePorUsuarioPortalView,
  ) {}

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Obtener estadisticas del portal del cliente' })
  async getStats(@CurrentUser() user: { sub: string; rol: string }) {
    const stats = await this.statsHandler.execute({
      usuarioId: user.sub,
      rol: user.rol,
    });
    return successResponse(stats);
  }

  @Get('mis-resumenes')
  @ApiOperation({ summary: 'Listar resumenes mensuales del cliente' })
  async getResumenes(@CurrentUser() user: { sub: string; rol: string }) {
    const cliente = await this.resolveCliente(user.sub);
    const resumenes = await this.resumenesHandler.execute({
      clienteId: cliente.clienteId,
    });
    return successResponse(resumenes);
  }

  @Get('mi-calendario/:periodo.pdf')
  @ApiOperation({ summary: 'Descargar PDF del calendario mensual' })
  async descargarPdf(
    @Param('periodo') periodo: string,
    @CurrentUser() user: { sub: string; rol: string },
    @Res() res: Response,
  ) {
    const cliente = await this.resolveCliente(user.sub);
    const result = await this.descargarPdfHandler.execute({
      clienteId: cliente.clienteId,
      periodo,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  }

  private async resolveCliente(usuarioId: string): Promise<{ clienteId: string }> {
    const cliente = await this.clientePorUsuario.execute({ usuarioId });
    if (!cliente) {
      throw new ForbiddenException('Cliente no encontrado');
    }
    return { clienteId: cliente.clienteId };
  }
}
