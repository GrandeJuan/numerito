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
import { EstudioModule } from '../estudio/estudio.module';
import { IamModule } from '../iam/iam.module';
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
} from '../estudio/application/public-views';
import type { EstudioSearchView } from '../estudio/application/views/estudio-search.view';
import type { EstudiosAdminListView } from '../estudio/application/views/estudios-admin-list.view';
import type { EstudioAdminKpisView } from '../estudio/application/views/estudio-admin-kpis.view';
import type { EstudioAdminSparklineView } from '../estudio/application/views/estudio-admin-sparkline.view';
import type { EstudioRegistrosMensualesView } from '../estudio/application/views/estudio-registros-mensuales.view';
import type { EstudioDistribucionPlanesView } from '../estudio/application/views/estudio-distribucion-planes.view';
import type { EstudioRecientesAdminView } from '../estudio/application/views/estudio-recientes-admin.view';
import type { EstudioTopTenantsView } from '../estudio/application/views/estudio-top-tenants.view';
import type { EstudioRegistrosRecientesView } from '../estudio/application/views/estudio-registros-recientes.view';
import {
  USUARIO_SEARCH_VIEW,
  USUARIOS_ADMIN_LIST_VIEW,
  USUARIO_ADMIN_KPIS_VIEW,
} from '../iam/application/public-views';
import type { UsuarioSearchView } from '../iam/application/views/usuario-search.view';
import type { UsuariosAdminListView } from '../iam/application/views/usuarios-admin-list.view';
import type { UsuarioAdminKpisView } from '../iam/application/views/usuario-admin-kpis.view';

@Module({
  imports: [EstudioModule, IamModule, JwtModule.register({})],
  controllers: [AdminPlanesController, AdminEstudiosController, AdminDashboardController, AdminUsuariosController, AdminHealthController, AdminSearchController],
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
        registrosMensuales: EstudioRegistrosMensualesView,
        distribucionPlanes: EstudioDistribucionPlanesView,
        estudiosRecientes: EstudioRecientesAdminView,
        usuarioKpis: UsuarioAdminKpisView,
        topTenants: EstudioTopTenantsView,
        registrosRecientes: EstudioRegistrosRecientesView,
      ) =>
        new DashboardStatsComputer(
          estudioKpis,
          estudioSparkline,
          registrosMensuales,
          distribucionPlanes,
          estudiosRecientes,
          usuarioKpis,
          topTenants,
          registrosRecientes,
        ),
      inject: [
        ESTUDIO_ADMIN_KPIS_VIEW,
        ESTUDIO_ADMIN_SPARKLINE_VIEW,
        ESTUDIO_REGISTROS_MENSUALES_VIEW,
        ESTUDIO_DISTRIBUCION_PLANES_VIEW,
        ESTUDIO_RECIENTES_ADMIN_VIEW,
        USUARIO_ADMIN_KPIS_VIEW,
        ESTUDIO_TOP_TENANTS_VIEW,
        ESTUDIO_REGISTROS_RECIENTES_VIEW,
      ],
    },
    {
      provide: AdminEstudiosService,
      useFactory: (estudiosAdminList: EstudiosAdminListView) => new AdminEstudiosService(estudiosAdminList),
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
      useFactory: (usuariosAdminList: UsuariosAdminListView) => new ObtenerAdminUsuariosHandler(usuariosAdminList),
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
  ],
})
export class AdministracionModule {}
