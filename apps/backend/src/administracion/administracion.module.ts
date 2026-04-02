import { Module } from '@nestjs/common';
import { AdminPlanesController } from './infrastructure/controllers/admin-planes.controller';
import { AdminEstudiosController } from './infrastructure/controllers/admin-estudios.controller';
import { SuperAdminGuard } from './infrastructure/guards/superadmin.guard';
import { ADMIN_PLAN_REPOSITORY } from './domain/repositories/admin-plan.repository';
import { MikroOrmAdminPlanRepository } from './infrastructure/persistence/mikro-orm-admin-plan.repository';
import { EstudioModule } from '../estudio/estudio.module';

@Module({
  imports: [EstudioModule],
  controllers: [AdminPlanesController, AdminEstudiosController],
  providers: [
    { provide: ADMIN_PLAN_REPOSITORY, useClass: MikroOrmAdminPlanRepository },
    SuperAdminGuard,
  ],
})
export class AdministracionModule {}
