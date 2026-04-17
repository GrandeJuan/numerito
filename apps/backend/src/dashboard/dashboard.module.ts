import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EntityManager } from '@mikro-orm/core';
import { DashboardController } from './infrastructure/controllers/dashboard.controller';
import { ObtenerDashboardStatsHandler } from './application/queries/obtener-dashboard-stats.query';
import { ClientesModule } from '../clientes/clientes.module';
import { CLIENTE_SUMMARY_VIEW } from '../clientes/application/public-views';
import type { ClienteSummaryView } from '../clientes/application/views/cliente-summary.view';

@Module({
  imports: [JwtModule.register({}), ClientesModule],
  controllers: [DashboardController],
  providers: [
    {
      provide: ObtenerDashboardStatsHandler,
      useFactory: (em: EntityManager, clienteSummary: ClienteSummaryView) =>
        new ObtenerDashboardStatsHandler(em, clienteSummary),
      inject: [EntityManager, CLIENTE_SUMMARY_VIEW],
    },
  ],
})
export class DashboardModule {}
