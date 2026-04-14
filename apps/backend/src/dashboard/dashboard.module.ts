import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EntityManager } from '@mikro-orm/core';
import { DashboardController } from './infrastructure/controllers/dashboard.controller';
import { ObtenerDashboardStatsHandler } from './application/queries/obtener-dashboard-stats.query';

@Module({
  imports: [JwtModule.register({})],
  controllers: [DashboardController],
  providers: [
    {
      provide: ObtenerDashboardStatsHandler,
      useFactory: (em: EntityManager) => new ObtenerDashboardStatsHandler(em),
      inject: [EntityManager],
    },
  ],
})
export class DashboardModule {}
