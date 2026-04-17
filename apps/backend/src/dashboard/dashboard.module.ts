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
import { TareasModule } from '../tareas/tareas.module';
import { TAREAS_PENDIENTES_VIEW } from '../tareas/application/public-views';
import type { TareasPendientesView } from '../tareas/application/views/tareas-pendientes.view';

@Module({
  imports: [JwtModule.register({}), ClientesModule, ObligacionesModule, TareasModule],
  controllers: [DashboardController],
  providers: [
    {
      provide: ObtenerDashboardStatsHandler,
      useFactory: (
        em: EntityManager,
        clienteSummary: ClienteSummaryView,
        vencimientosProximos: VencimientosProximosView,
        tareasPendientes: TareasPendientesView,
      ) => new ObtenerDashboardStatsHandler(em, clienteSummary, vencimientosProximos, tareasPendientes),
      inject: [EntityManager, CLIENTE_SUMMARY_VIEW, VENCIMIENTOS_PROXIMOS_VIEW, TAREAS_PENDIENTES_VIEW],
    },
  ],
})
export class DashboardModule {}
