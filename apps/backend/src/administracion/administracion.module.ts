import { Module } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { AdminPlanesController } from './infrastructure/controllers/admin-planes.controller';
import { AdminEstudiosController } from './infrastructure/controllers/admin-estudios.controller';
import { AdminDashboardController } from './infrastructure/controllers/admin-dashboard.controller';
import { SuperAdminGuard } from './infrastructure/guards/superadmin.guard';
import { ADMIN_PLAN_REPOSITORY } from './domain/repositories/admin-plan.repository';
import { MikroOrmAdminPlanRepository } from './infrastructure/persistence/mikro-orm-admin-plan.repository';
import { ObtenerAdminDashboardStatsHandler } from './application/queries/obtener-admin-dashboard-stats.query';
import { EstudioModule } from '../estudio/estudio.module';

@Module({
  imports: [EstudioModule],
  controllers: [AdminPlanesController, AdminEstudiosController, AdminDashboardController],
  providers: [
    { provide: ADMIN_PLAN_REPOSITORY, useClass: MikroOrmAdminPlanRepository },
    {
      provide: ObtenerAdminDashboardStatsHandler,
      useFactory: (em: EntityManager) => new ObtenerAdminDashboardStatsHandler(em),
      inject: [EntityManager],
    },
    SuperAdminGuard,
  ],
})
export class AdministracionModule {}
