import { Module } from '@nestjs/common';
import { ESTUDIO_REPOSITORY } from './domain/repositories/estudio.repository';
import { MikroOrmEstudioRepository } from './infrastructure/persistence/mikro-orm-estudio.repository';

@Module({
  imports: [],
  controllers: [],
  providers: [
    { provide: ESTUDIO_REPOSITORY, useClass: MikroOrmEstudioRepository },
  ],
  exports: [ESTUDIO_REPOSITORY],
})
export class TenantModule {}
