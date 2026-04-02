import { Module } from '@nestjs/common';
import { FACTURA_REPOSITORY } from './domain/repositories/factura.repository';
import { MikroOrmFacturaRepository } from './infrastructure/persistence/mikro-orm-factura.repository';

@Module({
  providers: [
    { provide: FACTURA_REPOSITORY, useClass: MikroOrmFacturaRepository },
  ],
  exports: [FACTURA_REPOSITORY],
})
export class FacturacionModule {}
