import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CrearFacturaDto, crearFacturaDtoSchema } from '../../application/dtos/crear-factura.dto';
import { ZodValidationPipe } from '../../../shared/infrastructure/pipes/zod-validation.pipe';
import { RegistrarPagoDto, registrarPagoDtoSchema } from '../../application/dtos/registrar-pago.dto';
import { FacturacionStatsQuery } from '../../application/queries/facturacion-stats.query';
import {
  CrearFacturaHandler,
  type CrearFacturaCommand,
} from '../../application/commands/crear-factura.command';
import {
  RegistrarPagoHandler,
  type RegistrarPagoCommand,
} from '../../application/commands/registrar-pago.command';
import { AnularFacturaHandler } from '../../application/commands/anular-factura.command';
import { FACTURA_REPOSITORY } from '../../domain/repositories/factura.repository';
import type { FacturaRepository } from '../../domain/repositories/factura.repository';
import { Inject } from '@nestjs/common';
import { Principal } from '../../../shared/infrastructure/decorators/estudio-principal.decorator';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

@ApiTags('Facturacion')
@Controller({ path: 'facturacion', version: '1' })
export class FacturacionController {
  constructor(
    @Inject(FACTURA_REPOSITORY) private readonly facturaRepo: FacturaRepository,
    private readonly crearFacturaHandler: CrearFacturaHandler,
    private readonly registrarPagoHandler: RegistrarPagoHandler,
    private readonly anularFacturaHandler: AnularFacturaHandler,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Estadisticas de facturacion del estudio' })
  async stats(@Principal() principal: EstudioPrincipal) {
    const query = new FacturacionStatsQuery(this.facturaRepo);
    const stats = await query.execute(principal);
    return successResponse(stats);
  }

  @Get('facturas')
  @ApiOperation({ summary: 'Listar facturas del estudio' })
  async list(@Principal() principal: EstudioPrincipal, @Query('page') page = 1, @Query('limit') limit = 20) {
    const facturas = await this.facturaRepo.findAll(principal);
    return successResponse(facturas, { total: facturas.length, page: +page, limit: +limit });
  }

  @Post('facturas')
  @ApiOperation({ summary: 'Crear factura' })
  async create(@Body(new ZodValidationPipe(crearFacturaDtoSchema)) dto: CrearFacturaDto, @Principal() principal: EstudioPrincipal) {
    const result = await this.crearFacturaHandler.execute(principal, dto as CrearFacturaCommand);
    return successResponse(result);
  }

  @Get('facturas/:id')
  @ApiOperation({ summary: 'Obtener factura por ID' })
  async getById(@Principal() principal: EstudioPrincipal, @Param('id') id: string) {
    const factura = await this.facturaRepo.findById(principal, id);
    if (!factura) throw new RecursoNoEncontradoError('Factura');
    return successResponse(factura);
  }

  @Post('facturas/:id/pago')
  @ApiOperation({ summary: 'Registrar pago en factura' })
  async registrarPago(
    @Principal() principal: EstudioPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(registrarPagoDtoSchema)) dto: RegistrarPagoDto,
  ) {
    const result = await this.registrarPagoHandler.execute(principal, {
      facturaId: id,
      monto: dto.monto,
      medioPagoId: dto.medioPagoId,
      referencia: dto.referencia,
    } as RegistrarPagoCommand);
    return successResponse(result);
  }

  @Patch('facturas/:id/anular')
  @ApiOperation({ summary: 'Anular factura' })
  async anular(@Principal() principal: EstudioPrincipal, @Param('id') id: string) {
    const result = await this.anularFacturaHandler.execute(principal, { id });
    return successResponse(result);
  }

  @Get('cuenta-corriente/:clienteId')
  @ApiOperation({ summary: 'Cuenta corriente de un cliente' })
  async cuentaCorriente(
    @Principal() principal: EstudioPrincipal,
    @Param('clienteId') clienteId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const facturas = await this.facturaRepo.findByClienteId(principal, clienteId);
    return successResponse(facturas, { total: facturas.length, page: +page, limit: +limit });
  }
}
