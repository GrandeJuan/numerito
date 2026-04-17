import { Module } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { EstudioController } from './infrastructure/controllers/estudio.controller';
import { ESTUDIO_REPOSITORY } from './domain/repositories/estudio.repository';
import { MikroOrmEstudioRepository } from './infrastructure/persistence/mikro-orm-estudio.repository';
import { SUBSCRIPCION_REPOSITORY } from './domain/repositories/subscripcion.repository';
import type { SubscripcionRepository } from './domain/repositories/subscripcion.repository';
import { MikroOrmSubscripcionRepository } from './infrastructure/persistence/mikro-orm-subscripcion.repository';
import { PLAN_REPOSITORY } from './domain/repositories/plan.repository';
import { MikroOrmPlanRepository } from './infrastructure/persistence/mikro-orm-plan.repository';
import { RenovarSubscripcionHandler } from './application/commands/renovar-subscripcion.command';
import { CancelarSubscripcionHandler } from './application/commands/cancelar-subscripcion.command';
import { MarcarSubscripcionVencidaHandler } from './application/commands/marcar-subscripcion-vencida.command';
import { CambiarPlanSubscripcionHandler } from './application/commands/cambiar-plan-subscripcion.command';
import type { EventBus } from '../shared/domain/event-bus';
import { EVENT_BUS } from '../shared/domain/event-bus';
import { EstudioSearchView } from './application/views/estudio-search.view';
import { ESTUDIO_SEARCH_VIEW, ESTUDIOS_ADMIN_LIST_VIEW } from './application/public-views';
import { EstudiosAdminListView } from './application/views/estudios-admin-list.view';

@Module({
  imports: [],
  controllers: [EstudioController],
  providers: [
    { provide: ESTUDIO_REPOSITORY, useClass: MikroOrmEstudioRepository },
    { provide: SUBSCRIPCION_REPOSITORY, useClass: MikroOrmSubscripcionRepository },
    { provide: PLAN_REPOSITORY, useClass: MikroOrmPlanRepository },
    {
      provide: RenovarSubscripcionHandler,
      useFactory: (repo: SubscripcionRepository, eventBus: EventBus) =>
        new RenovarSubscripcionHandler(repo, eventBus),
      inject: [SUBSCRIPCION_REPOSITORY, EVENT_BUS],
    },
    {
      provide: CancelarSubscripcionHandler,
      useFactory: (repo: SubscripcionRepository, eventBus: EventBus) =>
        new CancelarSubscripcionHandler(repo, eventBus),
      inject: [SUBSCRIPCION_REPOSITORY, EVENT_BUS],
    },
    {
      provide: MarcarSubscripcionVencidaHandler,
      useFactory: (repo: SubscripcionRepository, eventBus: EventBus) =>
        new MarcarSubscripcionVencidaHandler(repo, eventBus),
      inject: [SUBSCRIPCION_REPOSITORY, EVENT_BUS],
    },
    {
      provide: CambiarPlanSubscripcionHandler,
      useFactory: (repo: SubscripcionRepository, eventBus: EventBus) =>
        new CambiarPlanSubscripcionHandler(repo, eventBus),
      inject: [SUBSCRIPCION_REPOSITORY, EVENT_BUS],
    },
    {
      provide: ESTUDIO_SEARCH_VIEW,
      useFactory: (em: EntityManager) => new EstudioSearchView(em),
      inject: [EntityManager],
    },
    {
      provide: ESTUDIOS_ADMIN_LIST_VIEW,
      useFactory: (em: EntityManager) => new EstudiosAdminListView(em),
      inject: [EntityManager],
    },
  ],
  exports: [ESTUDIO_REPOSITORY, SUBSCRIPCION_REPOSITORY, PLAN_REPOSITORY, ESTUDIO_SEARCH_VIEW, ESTUDIOS_ADMIN_LIST_VIEW],
})
export class EstudioModule {}
