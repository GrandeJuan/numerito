import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EntityManager } from '@mikro-orm/core';
import { DashboardController } from './infrastructure/controllers/dashboard.controller';
import { ObtenerDashboardStatsHandler } from './application/queries/obtener-dashboard-stats.query';
import { ClientesModule } from '../clientes/clientes.module';
import { CLIENTE_SUMMARY_VIEW } from '../clientes/application/public-views';
import type { ClienteSummaryView } from '../clientes/application/views/cliente-summary.view';
import { ObligacionesModule } from '../obligaciones/obligaciones.module';
import { VENCIMIENTOS_PROXIMOS_VIEW } from '../obligaciones/application/public-views';
import type { VencimientosProximosView } from '../obligaciones/application/views/vencimientos-proximos.view';

@Module({
  imports: [JwtModule.register({}), ClientesModule, ObligacionesModule],
  controllers: [DashboardController],
  providers: [
    {
      provide: ObtenerDashboardStatsHandler,
      useFactory: (
        em: EntityManager,
        clienteSummary: ClienteSummaryView,
        vencimientosProximos: VencimientosProximosView,
      ) => new ObtenerDashboardStatsHandler(em, clienteSummary, vencimientosProximos),
      inject: [EntityManager, CLIENTE_SUMMARY_VIEW, VENCIMIENTOS_PROXIMOS_VIEW],
    },
  ],
})
export class DashboardModule {}
