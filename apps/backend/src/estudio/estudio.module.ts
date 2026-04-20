import { Module, forwardRef } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { EstudioController } from './infrastructure/controllers/estudio.controller';
import { IamModule } from '../iam/iam.module';
import { ClientesModule } from '../clientes/clientes.module';
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
import {
  ESTUDIO_SEARCH_VIEW,
  ESTUDIOS_ADMIN_LIST_VIEW,
  ESTUDIO_ADMIN_KPIS_VIEW,
  ESTUDIO_ADMIN_SPARKLINE_VIEW,
  ESTUDIO_REGISTROS_MENSUALES_VIEW,
  ESTUDIO_DISTRIBUCION_PLANES_VIEW,
  ESTUDIO_RECIENTES_ADMIN_VIEW,
  ESTUDIO_TOP_TENANTS_VIEW,
  ESTUDIO_REGISTROS_RECIENTES_VIEW,
} from './application/public-views';
import { EstudiosAdminListView } from './application/views/estudios-admin-list.view';
import { EstudioAdminKpisView } from './application/views/estudio-admin-kpis.view';
import { EstudioAdminSparklineView } from './application/views/estudio-admin-sparkline.view';
import { EstudioRegistrosMensualesView } from './application/views/estudio-registros-mensuales.view';
import { EstudioDistribucionPlanesView } from './application/views/estudio-distribucion-planes.view';
import { EstudioRecientesAdminView } from './application/views/estudio-recientes-admin.view';
import { EstudioTopTenantsView } from './application/views/estudio-top-tenants.view';
import { EstudioRegistrosRecientesView } from './application/views/estudio-registros-recientes.view';

@Module({
  imports: [forwardRef(() => IamModule), ClientesModule],
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
    {
      provide: ESTUDIO_ADMIN_KPIS_VIEW,
      useFactory: (em: EntityManager) => new EstudioAdminKpisView(em),
      inject: [EntityManager],
    },
    {
      provide: ESTUDIO_ADMIN_SPARKLINE_VIEW,
      useFactory: (em: EntityManager) => new EstudioAdminSparklineView(em),
      inject: [EntityManager],
    },
    {
      provide: ESTUDIO_REGISTROS_MENSUALES_VIEW,
      useFactory: (em: EntityManager) => new EstudioRegistrosMensualesView(em),
      inject: [EntityManager],
    },
    {
      provide: ESTUDIO_DISTRIBUCION_PLANES_VIEW,
      useFactory: (em: EntityManager) => new EstudioDistribucionPlanesView(em),
      inject: [EntityManager],
    },
    {
      provide: ESTUDIO_RECIENTES_ADMIN_VIEW,
      useFactory: (em: EntityManager) => new EstudioRecientesAdminView(em),
      inject: [EntityManager],
    },
    {
      provide: ESTUDIO_TOP_TENANTS_VIEW,
      useFactory: (em: EntityManager) => new EstudioTopTenantsView(em),
      inject: [EntityManager],
    },
    {
      provide: ESTUDIO_REGISTROS_RECIENTES_VIEW,
      useFactory: (em: EntityManager) => new EstudioRegistrosRecientesView(em),
      inject: [EntityManager],
    },
  ],
  exports: [ESTUDIO_REPOSITORY, SUBSCRIPCION_REPOSITORY, PLAN_REPOSITORY, ESTUDIO_SEARCH_VIEW, ESTUDIOS_ADMIN_LIST_VIEW, ESTUDIO_ADMIN_KPIS_VIEW, ESTUDIO_ADMIN_SPARKLINE_VIEW, ESTUDIO_REGISTROS_MENSUALES_VIEW, ESTUDIO_DISTRIBUCION_PLANES_VIEW, ESTUDIO_RECIENTES_ADMIN_VIEW, ESTUDIO_TOP_TENANTS_VIEW, ESTUDIO_REGISTROS_RECIENTES_VIEW],
})
export class EstudioModule {}
