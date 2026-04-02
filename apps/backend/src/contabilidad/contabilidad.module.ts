import { Module } from '@nestjs/common';
import { LIBRO_CONTABLE_REPOSITORY } from './domain/repositories/libro-contable.repository';
import { ASIENTO_CONTABLE_REPOSITORY } from './domain/repositories/asiento-contable.repository';
import { MikroOrmLibroContableRepository } from './infrastructure/persistence/mikro-orm-libro-contable.repository';
import { MikroOrmAsientoContableRepository } from './infrastructure/persistence/mikro-orm-asiento-contable.repository';
import { ContabilidadController } from './infrastructure/controllers/contabilidad.controller';

@Module({
  imports: [],
  controllers: [ContabilidadController],
  providers: [
    { provide: LIBRO_CONTABLE_REPOSITORY, useClass: MikroOrmLibroContableRepository },
    { provide: ASIENTO_CONTABLE_REPOSITORY, useClass: MikroOrmAsientoContableRepository },
  ],
  exports: [LIBRO_CONTABLE_REPOSITORY, ASIENTO_CONTABLE_REPOSITORY],
})
export class ContabilidadModule {}
