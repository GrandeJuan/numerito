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
import { ObtenerAdminDashboardStatsHandler } from './application/queries/obtener-admin-dashboard-stats.query';
import { ObtenerAdminUsuariosHandler } from './application/queries/obtener-admin-usuarios.query';
import { DashboardStatsListener } from './application/listeners/dashboard-stats.listener';
import { DashboardStatsProjection } from './application/services/dashboard-stats-projection';
import { AdminEstudiosService } from './application/services/admin-estudios.service';
import { AdminPlanesService } from './application/services/admin-planes.service';
import { EstudioModule } from '../estudio/estudio.module';
import { IamModule } from '../iam/iam.module';

@Module({
  imports: [EstudioModule, IamModule, JwtModule.register({})],
  controllers: [AdminPlanesController, AdminEstudiosController, AdminDashboardController, AdminUsuariosController, AdminHealthController, AdminSearchController],
  providers: [
    { provide: ADMIN_PLAN_REPOSITORY, useClass: MikroOrmAdminPlanRepository },
    DashboardStatsProjection,
    DashboardStatsListener,
    {
      provide: AdminEstudiosService,
      useFactory: (em: EntityManager) => new AdminEstudiosService(em),
      inject: [EntityManager],
    },
    {
      provide: AdminPlanesService,
      useFactory: (planRepo: AdminPlanRepository) => new AdminPlanesService(planRepo),
      inject: [ADMIN_PLAN_REPOSITORY],
    },
    {
      provide: ObtenerAdminDashboardStatsHandler,
      useFactory: (em: EntityManager) => new ObtenerAdminDashboardStatsHandler(em),
      inject: [EntityManager],
    },
    {
      provide: ObtenerAdminUsuariosHandler,
      useFactory: (em: EntityManager) => new ObtenerAdminUsuariosHandler(em),
      inject: [EntityManager],
    },
    {
      provide: HealthCheckHandler,
      useFactory: (em: EntityManager) => new HealthCheckHandler(em),
      inject: [EntityManager],
    },
    {
      provide: AdminSearchHandler,
      useFactory: (em: EntityManager) => new AdminSearchHandler(em),
      inject: [EntityManager],
    },
  ],
})
export class AdministracionModule {}
