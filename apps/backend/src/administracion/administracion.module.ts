import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EntityManager } from '@mikro-orm/core';
import { AdminPlanesController } from './infrastructure/controllers/admin-planes.controller';
import { AdminEstudiosController } from './infrastructure/controllers/admin-estudios.controller';
import { AdminDashboardController } from './infrastructure/controllers/admin-dashboard.controller';
import { AdminUsuariosController } from './infrastructure/controllers/admin-usuarios.controller';
import { AdminHealthController } from './infrastructure/controllers/admin-health.controller';
import { AdminSearchController } from './infrastructure/controllers/admin-search.controller';
import { HealthCheckHandler } from './application/queries/health-check.query';
import { AdminSearchHandler } from './application/queries/admin-search.query';
import { ADMIN_PLAN_REPOSITORY } from './domain/repositories/admin-plan.repository';
import type { AdminPlanRepository } from './domain/repositories/admin-plan.repository';
import { MikroOrmAdminPlanRepository } from './infrastructure/persistence/mikro-orm-admin-plan.repository';
import { DASHBOARD_SNAPSHOT_REPOSITORY } from './domain/repositories/dashboard-snapshot.repository';
import { PgDashboardSnapshotRepository } from './infrastructure/persistence/pg-dashboard-snapshot.repository';
import { ObtenerAdminDashboardStatsHandler } from './application/queries/obtener-admin-dashboard-stats.query';
import { ObtenerAdminUsuariosHandler } from './application/queries/obtener-admin-usuarios.query';
import { DashboardStatsListener } from './application/listeners/dashboard-stats.listener';
import { DashboardStatsProjection } from './application/services/dashboard-stats-projection';
import { DashboardStatsComputer } from './application/services/dashboard-stats-computer';
import { MaterializeDashboardSnapshotService } from './application/services/materialize-dashboard-snapshot.service';
import { AdminEstudiosService } from './application/services/admin-estudios.service';
import { AdminPlanesService } from './application/services/admin-planes.service';
import { CrearEstudioAdminHandler } from '../estudio/application/public-commands';
import { InvitarUsuarioAdminHandler } from '../iam/application/public-commands';
import { EstudioModule } from '../estudio/estudio.module';
import { IamModule } from '../iam/iam.module';
import {
  ESTUDIO_SEARCH_VIEW,
  ESTUDIOS_ADMIN_LIST_VIEW,
  ESTUDIO_ADMIN_KPIS_VIEW,
  ESTUDIO_ADMIN_SPARKLINE_VIEW,
  ESTUDIO_DISTRIBUCION_PLANES_VIEW,
  ESTUDIO_TOP_TENANTS_VIEW,
} from '../estudio/application/public-views';
import type { EstudioSearchView } from '../estudio/application/views/estudio-search.view';
import type { EstudiosAdminListView } from '../estudio/application/views/estudios-admin-list.view';
import type { EstudioAdminKpisView } from '../estudio/application/views/estudio-admin-kpis.view';
import type { EstudioAdminSparklineView } from '../estudio/application/views/estudio-admin-sparkline.view';
import type { EstudioDistribucionPlanesView } from '../estudio/application/views/estudio-distribucion-planes.view';
import type { EstudioTopTenantsView } from '../estudio/application/views/estudio-top-tenants.view';
import { USUARIO_SEARCH_VIEW, USUARIOS_ADMIN_LIST_VIEW } from '../iam/application/public-views';
import type { UsuarioSearchView } from '../iam/application/views/usuario-search.view';
import type { UsuariosAdminListView } from '../iam/application/views/usuarios-admin-list.view';
import { ESTUDIO_REPOSITORY } from '../estudio/domain/repositories/estudio.repository';
import type { EstudioRepository } from '../estudio/domain/repositories/estudio.repository';
import { SUBSCRIPCION_REPOSITORY } from '../estudio/domain/repositories/subscripcion.repository';
import type { SubscripcionRepository } from '../estudio/domain/repositories/subscripcion.repository';
import { USUARIO_REPOSITORY } from '../iam/domain/repositories/usuario.repository';
import type { UsuarioRepository } from '../iam/domain/repositories/usuario.repository';
import type { EventBus } from '../shared/domain/event-bus';
import { EVENT_BUS } from '../shared/domain/event-bus';

@Module({
  imports: [EstudioModule, IamModule, JwtModule.register({})],
  controllers: [
    AdminPlanesController,
    AdminEstudiosController,
    AdminDashboardController,
    AdminUsuariosController,
    AdminHealthController,
    AdminSearchController,
  ],
  providers: [
    { provide: ADMIN_PLAN_REPOSITORY, useClass: MikroOrmAdminPlanRepository },
    { provide: DASHBOARD_SNAPSHOT_REPOSITORY, useClass: PgDashboardSnapshotRepository },
    DashboardStatsProjection,
    DashboardStatsListener,
    MaterializeDashboardSnapshotService,
    {
      provide: DashboardStatsComputer,
      useFactory: (
        estudioKpis: EstudioAdminKpisView,
        estudioSparkline: EstudioAdminSparklineView,
        distribucionPlanes: EstudioDistribucionPlanesView,
        topTenants: EstudioTopTenantsView,
      ) =>
        new DashboardStatsComputer(estudioKpis, estudioSparkline, distribucionPlanes, topTenants),
      inject: [
        ESTUDIO_ADMIN_KPIS_VIEW,
        ESTUDIO_ADMIN_SPARKLINE_VIEW,
        ESTUDIO_DISTRIBUCION_PLANES_VIEW,
        ESTUDIO_TOP_TENANTS_VIEW,
      ],
    },
    {
      provide: AdminEstudiosService,
      useFactory: (estudiosAdminList: EstudiosAdminListView) =>
        new AdminEstudiosService(estudiosAdminList),
      inject: [ESTUDIOS_ADMIN_LIST_VIEW],
    },
    {
      provide: AdminPlanesService,
      useFactory: (planRepo: AdminPlanRepository) => new AdminPlanesService(planRepo),
      inject: [ADMIN_PLAN_REPOSITORY],
    },
    ObtenerAdminDashboardStatsHandler,
    {
      provide: ObtenerAdminUsuariosHandler,
      useFactory: (usuariosAdminList: UsuariosAdminListView) =>
        new ObtenerAdminUsuariosHandler(usuariosAdminList),
      inject: [USUARIOS_ADMIN_LIST_VIEW],
    },
    {
      provide: HealthCheckHandler,
      useFactory: (em: EntityManager) => new HealthCheckHandler(em),
      inject: [EntityManager],
    },
    {
      provide: AdminSearchHandler,
      useFactory: (estudioSearch: EstudioSearchView, usuarioSearch: UsuarioSearchView) =>
        new AdminSearchHandler(estudioSearch, usuarioSearch),
      inject: [ESTUDIO_SEARCH_VIEW, USUARIO_SEARCH_VIEW],
    },
    {
      provide: CrearEstudioAdminHandler,
      useFactory: (
        estudioRepo: EstudioRepository,
        planRepo: AdminPlanRepository,
        eventBus: EventBus,
        subRepo: SubscripcionRepository,
      ) =>
        new CrearEstudioAdminHandler(estudioRepo, planRepo, eventBus, (sub) => {
          const systemPrincipal = {
            estudioId: sub.estudioId,
            userId: 'system',
            roles: ['SUPERADMIN'],
          };
          return subRepo.save(systemPrincipal, sub);
        }),
      inject: [ESTUDIO_REPOSITORY, ADMIN_PLAN_REPOSITORY, EVENT_BUS, SUBSCRIPCION_REPOSITORY],
    },
    {
      provide: InvitarUsuarioAdminHandler,
      useFactory: (usuarioRepo: UsuarioRepository, eventBus: EventBus) =>
        new InvitarUsuarioAdminHandler(usuarioRepo, eventBus),
      inject: [USUARIO_REPOSITORY, EVENT_BUS],
    },
  ],
})
export class AdministracionModule {}
