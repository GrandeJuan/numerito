import { Module } from '@nestjs/common';
import { FACTURA_REPOSITORY } from './domain/repositories/factura.repository';
import { MikroOrmFacturaRepository } from './infrastructure/persistence/mikro-orm-factura.repository';
import { PAGO_REPOSITORY } from './domain/repositories/pago.repository';
import { MikroOrmPagoRepository } from './infrastructure/persistence/mikro-orm-pago.repository';
import { FacturacionController } from './infrastructure/controllers/facturacion.controller';

@Module({
  controllers: [FacturacionController],
  providers: [
    { provide: FACTURA_REPOSITORY, useClass: MikroOrmFacturaRepository },
    { provide: PAGO_REPOSITORY, useClass: MikroOrmPagoRepository },
  ],
  exports: [FACTURA_REPOSITORY, PAGO_REPOSITORY],
})
export class FacturacionModule {}
