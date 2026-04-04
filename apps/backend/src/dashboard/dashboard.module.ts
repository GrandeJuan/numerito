import { Module } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { DashboardController } from './infrastructure/controllers/dashboard.controller';
import { ObtenerDashboardStatsHandler } from './application/queries/obtener-dashboard-stats.query';
import { IamModule } from '../iam/iam.module';
import { USUARIO_ESTUDIO_REPOSITORY } from '../iam/domain/repositories/usuario-estudio.repository';
import type { UsuarioEstudioRepository } from '../iam/domain/repositories/usuario-estudio.repository';
import { ROL_PERMISO_REPOSITORY } from '../iam/domain/repositories/rol-permiso.repository';
import type { RolPermisoRepository } from '../iam/domain/repositories/rol-permiso.repository';

@Module({
  imports: [IamModule],
  controllers: [DashboardController],
  providers: [
    {
      provide: ObtenerDashboardStatsHandler,
      useFactory: (
        em: EntityManager,
        ueRepo: UsuarioEstudioRepository,
        rpRepo: RolPermisoRepository,
      ) => new ObtenerDashboardStatsHandler(em, ueRepo, rpRepo),
      inject: [EntityManager, USUARIO_ESTUDIO_REPOSITORY, ROL_PERMISO_REPOSITORY],
    },
  ],
})
export class DashboardModule {}
