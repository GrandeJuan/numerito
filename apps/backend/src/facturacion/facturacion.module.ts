import { Module } from '@nestjs/common';
import { FACTURA_REPOSITORY } from './domain/repositories/factura.repository';
import type { FacturaRepository } from './domain/repositories/factura.repository';
import { MikroOrmFacturaRepository } from './infrastructure/persistence/mikro-orm-factura.repository';
import { PAGO_REPOSITORY } from './domain/repositories/pago.repository';
import type { PagoRepository } from './domain/repositories/pago.repository';
import { MikroOrmPagoRepository } from './infrastructure/persistence/mikro-orm-pago.repository';
import { FacturacionController } from './infrastructure/controllers/facturacion.controller';
import { CrearFacturaHandler } from './application/commands/crear-factura.command';
import { RegistrarPagoHandler } from './application/commands/registrar-pago.command';
import { AnularFacturaHandler } from './application/commands/anular-factura.command';

@Module({
  controllers: [FacturacionController],
  providers: [
    { provide: FACTURA_REPOSITORY, useClass: MikroOrmFacturaRepository },
    { provide: PAGO_REPOSITORY, useClass: MikroOrmPagoRepository },
    {
      provide: CrearFacturaHandler,
      useFactory: (repo: FacturaRepository) =>
        new CrearFacturaHandler(repo),
      inject: [FACTURA_REPOSITORY],
    },
    {
      provide: RegistrarPagoHandler,
      useFactory: (facturaRepo: FacturaRepository, pagoRepo: PagoRepository) =>
        new RegistrarPagoHandler(facturaRepo, pagoRepo),
      inject: [FACTURA_REPOSITORY, PAGO_REPOSITORY],
    },
    {
      provide: AnularFacturaHandler,
      useFactory: (repo: FacturaRepository) =>
        new AnularFacturaHandler(repo),
      inject: [FACTURA_REPOSITORY],
    },
  ],
  exports: [FACTURA_REPOSITORY, PAGO_REPOSITORY],
})
export class FacturacionModule {}
