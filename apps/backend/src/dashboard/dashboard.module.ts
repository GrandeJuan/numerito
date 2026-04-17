import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EntityManager } from '@mikro-orm/core';
import { DashboardController } from './infrastructure/controllers/dashboard.controller';
import { ObtenerDashboardStatsHandler } from './application/queries/obtener-dashboard-stats.query';
import { ClientesModule } from '../clientes/clientes.module';
import { CLIENTE_SUMMARY_VIEW } from '../clientes/application/public-views';
import type { ClienteSummaryView } from '../clientes/application/views/cliente-summary.view';
import { ObligacionesModule } from '../obligaciones/obligaciones.module';
import { VENCIMIENTOS_PROXIMOS_VIEW, VENCIMIENTOS_POR_ESTADO_VIEW, PROXIMOS_VENCIMIENTOS_DETALLE_VIEW } from '../obligaciones/application/public-views';
import type { VencimientosProximosView } from '../obligaciones/application/views/vencimientos-proximos.view';
import type { VencimientosPorEstadoView } from '../obligaciones/application/views/vencimientos-por-estado.view';
import type { ProximosVencimientosDetalleView } from '../obligaciones/application/views/proximos-vencimientos-detalle.view';
import { TareasModule } from '../tareas/tareas.module';
import { TAREAS_PENDIENTES_VIEW, CARGA_TRABAJO_VIEW } from '../tareas/application/public-views';
import type { TareasPendientesView } from '../tareas/application/views/tareas-pendientes.view';
import type { CargaTrabajoView } from '../tareas/application/views/carga-trabajo.view';
import { FacturacionModule } from '../facturacion/facturacion.module';
import { FACTURACION_MES_VIEW, FACTURACION_MENSUAL_VIEW } from '../facturacion/application/public-views';
import type { FacturacionMesView } from '../facturacion/application/views/facturacion-mes.view';
import type { FacturacionMensualView } from '../facturacion/application/views/facturacion-mensual.view';

@Module({
  imports: [JwtModule.register({}), ClientesModule, ObligacionesModule, TareasModule, FacturacionModule],
  controllers: [DashboardController],
  providers: [
    {
      provide: ObtenerDashboardStatsHandler,
      useFactory: (
        em: EntityManager,
        clienteSummary: ClienteSummaryView,
        vencimientosProximos: VencimientosProximosView,
        tareasPendientes: TareasPendientesView,
        vencimientosPorEstado: VencimientosPorEstadoView,
        proximosVencimientosDetalle: ProximosVencimientosDetalleView,
        cargaTrabajo: CargaTrabajoView,
        facturacionMes: FacturacionMesView,
        facturacionMensual: FacturacionMensualView,
      ) => new ObtenerDashboardStatsHandler(
        em,
        clienteSummary,
        vencimientosProximos,
        tareasPendientes,
        vencimientosPorEstado,
        proximosVencimientosDetalle,
        cargaTrabajo,
        facturacionMes,
        facturacionMensual,
      ),
      inject: [
        EntityManager,
        CLIENTE_SUMMARY_VIEW,
        VENCIMIENTOS_PROXIMOS_VIEW,
        TAREAS_PENDIENTES_VIEW,
        VENCIMIENTOS_POR_ESTADO_VIEW,
        PROXIMOS_VENCIMIENTOS_DETALLE_VIEW,
        CARGA_TRABAJO_VIEW,
        FACTURACION_MES_VIEW,
        FACTURACION_MENSUAL_VIEW,
      ],
    },
  ],
})
export class DashboardModule {}
