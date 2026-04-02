import { Module } from '@nestjs/common';
import { EstudioController } from './infrastructure/controllers/estudio.controller';
import { ESTUDIO_REPOSITORY } from './domain/repositories/estudio.repository';
import { MikroOrmEstudioRepository } from './infrastructure/persistence/mikro-orm-estudio.repository';
import { SUBSCRIPCION_REPOSITORY } from './domain/repositories/subscripcion.repository';
import { MikroOrmSubscripcionRepository } from './infrastructure/persistence/mikro-orm-subscripcion.repository';
import { PLAN_REPOSITORY } from './domain/repositories/plan.repository';
import { MikroOrmPlanRepository } from './infrastructure/persistence/mikro-orm-plan.repository';

@Module({
  imports: [],
  controllers: [EstudioController],
  providers: [
    { provide: ESTUDIO_REPOSITORY, useClass: MikroOrmEstudioRepository },
    { provide: SUBSCRIPCION_REPOSITORY, useClass: MikroOrmSubscripcionRepository },
    { provide: PLAN_REPOSITORY, useClass: MikroOrmPlanRepository },
  ],
  exports: [ESTUDIO_REPOSITORY, SUBSCRIPCION_REPOSITORY, PLAN_REPOSITORY],
})
export class EstudioModule {}
