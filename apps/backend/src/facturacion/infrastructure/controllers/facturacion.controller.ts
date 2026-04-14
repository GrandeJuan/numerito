import { Controller, Get, Post, Patch, Param, Body, Query, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CrearFacturaDto } from '../../application/dtos/crear-factura.dto';
import { RegistrarPagoDto } from '../../application/dtos/registrar-pago.dto';
import { FacturacionStatsQuery } from '../../application/queries/facturacion-stats.query';
import { FACTURA_REPOSITORY } from '../../domain/repositories/factura.repository';
import type { FacturaRepository } from '../../domain/repositories/factura.repository';
import { PAGO_REPOSITORY } from '../../domain/repositories/pago.repository';
import type { PagoRepository } from '../../domain/repositories/pago.repository';
import { Factura } from '../../domain/entities/factura.entity';
import { Pago } from '../../domain/entities/pago.entity';
import { EstudioId } from '../../../shared/infrastructure/decorators/estudio-id.decorator';
import { successResponse } from '../../../shared/infrastructure/responses/api-response';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

@ApiTags('Facturacion')
@Controller({ path: 'facturacion', version: '1' })
export class FacturacionController {
  constructor(
    @Inject(FACTURA_REPOSITORY) private readonly facturaRepo: FacturaRepository,
    @Inject(PAGO_REPOSITORY) private readonly pagoRepo: PagoRepository,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Estadisticas de facturacion del estudio' })
  async stats() {
    const query = new FacturacionStatsQuery(this.facturaRepo);
    const stats = await query.execute();
    return successResponse(stats);
  }

  @Get('facturas')
  @ApiOperation({ summary: 'Listar facturas del estudio' })
  async list(@EstudioId() estudioId: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    const facturas = await this.facturaRepo.findAll();
    return successResponse(facturas, { total: facturas.length, page: +page, limit: +limit });
  }

  @Post('facturas')
  @ApiOperation({ summary: 'Crear factura' })
  async create(@Body() dto: CrearFacturaDto, @EstudioId() estudioId: string) {
    const factura = Factura.create({
      clienteId: dto.clienteId,
      estudioId,
      numero: dto.numero,
      fechaEmision: new Date(dto.fechaEmision),
      fechaVencimiento: new Date(dto.fechaVencimiento),
      concepto: dto.concepto,
      lineas: dto.lineas,
    });

    await this.facturaRepo.save(factura);
    return successResponse(factura);
  }

  @Get('facturas/:id')
  @ApiOperation({ summary: 'Obtener factura por ID' })
  async getById(@Param('id') id: string) {
    const factura = await this.facturaRepo.findById(id);
    if (!factura) throw new RecursoNoEncontradoError('Factura');
    return successResponse(factura);
  }

  @Post('facturas/:id/pago')
  @ApiOperation({ summary: 'Registrar pago en factura' })
  async registrarPago(
    @Param('id') id: string,
    @Body() dto: RegistrarPagoDto,
    @EstudioId() estudioId: string,
  ) {
    const factura = await this.facturaRepo.findById(id);
    if (!factura) throw new RecursoNoEncontradoError('Factura');

    factura.registrarPagoExterno(dto.monto);

    const pago = Pago.create({
      facturaId: factura.id,
      estudioId,
      fecha: new Date(),
      monto: dto.monto,
      medioPagoId: dto.medioPagoId,
      referencia: dto.referencia,
    });

    await this.facturaRepo.save(factura);
    await this.pagoRepo.save(pago);
    return successResponse(pago);
  }

  @Patch('facturas/:id/anular')
  @ApiOperation({ summary: 'Anular factura' })
  async anular(@Param('id') id: string) {
    const factura = await this.facturaRepo.findById(id);
    if (!factura) throw new RecursoNoEncontradoError('Factura');

    factura.anular();
    await this.facturaRepo.save(factura);
    return successResponse(factura);
  }

  @Get('cuenta-corriente/:clienteId')
  @ApiOperation({ summary: 'Cuenta corriente de un cliente' })
  async cuentaCorriente(
    @Param('clienteId') clienteId: string,
    @EstudioId() estudioId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const facturas = await this.facturaRepo.findByClienteId(clienteId);
    return successResponse(facturas, { total: facturas.length, page: +page, limit: +limit });
  }
}
