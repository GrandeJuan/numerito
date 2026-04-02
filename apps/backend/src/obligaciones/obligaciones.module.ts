import { Module } from '@nestjs/common';
import { ObligacionesController } from './infrastructure/controllers/obligaciones.controller';
import { VENCIMIENTO_REPOSITORY } from './domain/repositories/vencimiento.repository';
import { MikroOrmVencimientoRepository } from './infrastructure/persistence/mikro-orm-vencimiento.repository';

@Module({
  imports: [],
  controllers: [ObligacionesController],
  providers: [
    { provide: VENCIMIENTO_REPOSITORY, useClass: MikroOrmVencimientoRepository },
  ],
  exports: [VENCIMIENTO_REPOSITORY],
})
export class ObligacionesModule {}
