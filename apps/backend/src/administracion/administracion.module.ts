import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EntityManager } from '@mikro-orm/core';
import { AdminPlanesController } from './infrastructure/controllers/admin-planes.controller';
import { AdminEstudiosController } from './infrastructure/controllers/admin-estudios.controller';
import { AdminDashboardController } from './infrastructure/controllers/admin-dashboard.controller';
import { AdminUsuariosController } from './infrastructure/controllers/admin-usuarios.controller';
import { SuperAdminGuard } from './infrastructure/guards/superadmin.guard';
import { ADMIN_PLAN_REPOSITORY } from './domain/repositories/admin-plan.repository';
import { MikroOrmAdminPlanRepository } from './infrastructure/persistence/mikro-orm-admin-plan.repository';
import { ObtenerAdminDashboardStatsHandler } from './application/queries/obtener-admin-dashboard-stats.query';
import { ObtenerAdminUsuariosHandler } from './application/queries/obtener-admin-usuarios.query';
import { EstudioModule } from '../estudio/estudio.module';
import { IamModule } from '../iam/iam.module';

@Module({
  imports: [EstudioModule, IamModule, JwtModule.register({})],
  controllers: [AdminPlanesController, AdminEstudiosController, AdminDashboardController, AdminUsuariosController],
  providers: [
    { provide: ADMIN_PLAN_REPOSITORY, useClass: MikroOrmAdminPlanRepository },
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
    SuperAdminGuard,
  ],
})
export class AdministracionModule {}
