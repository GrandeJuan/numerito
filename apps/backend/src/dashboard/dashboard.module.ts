import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DashboardController } from './infrastructure/controllers/dashboard.controller';
import { ObtenerDashboardStatsHandler } from './application/queries/obtener-dashboard-stats.query';
import { ObtenerActividadHandler } from './application/queries/obtener-actividad.query';
import { ObtenerCumplimientoSocioHandler } from './application/queries/obtener-cumplimiento-socio.query';
import { ClientesModule } from '../clientes/clientes.module';
import { CLIENTE_SUMMARY_VIEW } from '../clientes/application/public-views';
import type { ClienteSummaryView } from '../clientes/application/views/cliente-summary.view';
import { ObligacionesModule } from '../obligaciones/obligaciones.module';
import {
  VENCIMIENTOS_PROXIMOS_VIEW,
  VENCIMIENTOS_POR_ESTADO_VIEW,
  PROXIMOS_VENCIMIENTOS_DETALLE_VIEW,
  ACTIVIDAD_RECIENTE_VENCIMIENTOS_VIEW,
  CUMPLIMIENTO_SOCIO_VIEW,
} from '../obligaciones/application/public-views';
import type { VencimientosProximosView } from '../obligaciones/application/views/vencimientos-proximos.view';
import type { VencimientosPorEstadoView } from '../obligaciones/application/views/vencimientos-por-estado.view';
import type { ProximosVencimientosDetalleView } from '../obligaciones/application/views/proximos-vencimientos-detalle.view';
import type { ActividadRecienteVencimientosView } from '../obligaciones/application/views/actividad-reciente-vencimientos.view';
import type { CumplimientoSocioView } from '../obligaciones/application/views/cumplimiento-socio.view';
import { TareasModule } from '../tareas/tareas.module';
import {
  TAREAS_PENDIENTES_VIEW,
  CARGA_TRABAJO_VIEW,
  ACTIVIDAD_RECIENTE_TAREAS_VIEW,
} from '../tareas/application/public-views';
import type { TareasPendientesView } from '../tareas/application/views/tareas-pendientes.view';
import type { CargaTrabajoView } from '../tareas/application/views/carga-trabajo.view';
import type { ActividadRecienteTareasView } from '../tareas/application/views/actividad-reciente-tareas.view';
import { FacturacionModule } from '../facturacion/facturacion.module';
import {
  FACTURACION_MES_VIEW,
  FACTURACION_MENSUAL_VIEW,
} from '../facturacion/application/public-views';
import type { FacturacionMesView } from '../facturacion/application/views/facturacion-mes.view';
import type { FacturacionMensualView } from '../facturacion/application/views/facturacion-mensual.view';
import { IamModule } from '../iam/iam.module';
import { USUARIO_MEMBERSHIP_VIEW } from '../iam/application/public-views';
import type { UsuarioMembershipView } from '../iam/application/views/usuario-membership.view';

@Module({
  imports: [
    JwtModule.register({}),
    ClientesModule,
    ObligacionesModule,
    TareasModule,
    FacturacionModule,
    IamModule,
  ],
  controllers: [DashboardController],
  providers: [
    {
      provide: ObtenerDashboardStatsHandler,
      useFactory: (
        clienteSummary: ClienteSummaryView,
        vencimientosProximos: VencimientosProximosView,
        tareasPendientes: TareasPendientesView,
        vencimientosPorEstado: VencimientosPorEstadoView,
        proximosVencimientosDetalle: ProximosVencimientosDetalleView,
        cargaTrabajo: CargaTrabajoView,
        facturacionMes: FacturacionMesView,
        facturacionMensual: FacturacionMensualView,
        membershipView: UsuarioMembershipView,
        actividadTareas: ActividadRecienteTareasView,
        actividadVencimientos: ActividadRecienteVencimientosView,
      ) =>
        new ObtenerDashboardStatsHandler(
          clienteSummary,
          vencimientosProximos,
          tareasPendientes,
          vencimientosPorEstado,
          proximosVencimientosDetalle,
          cargaTrabajo,
          facturacionMes,
          facturacionMensual,
          membershipView,
          actividadTareas,
          actividadVencimientos,
        ),
      inject: [
        CLIENTE_SUMMARY_VIEW,
        VENCIMIENTOS_PROXIMOS_VIEW,
        TAREAS_PENDIENTES_VIEW,
        VENCIMIENTOS_POR_ESTADO_VIEW,
        PROXIMOS_VENCIMIENTOS_DETALLE_VIEW,
        CARGA_TRABAJO_VIEW,
        FACTURACION_MES_VIEW,
        FACTURACION_MENSUAL_VIEW,
        USUARIO_MEMBERSHIP_VIEW,
        ACTIVIDAD_RECIENTE_TAREAS_VIEW,
        ACTIVIDAD_RECIENTE_VENCIMIENTOS_VIEW,
      ],
    },
    {
      provide: ObtenerActividadHandler,
      useFactory: (
        actividadTareas: ActividadRecienteTareasView,
        actividadVencimientos: ActividadRecienteVencimientosView,
        membershipView: UsuarioMembershipView,
      ) => new ObtenerActividadHandler(actividadTareas, actividadVencimientos, membershipView),
      inject: [
        ACTIVIDAD_RECIENTE_TAREAS_VIEW,
        ACTIVIDAD_RECIENTE_VENCIMIENTOS_VIEW,
        USUARIO_MEMBERSHIP_VIEW,
      ],
    },
    {
      provide: ObtenerCumplimientoSocioHandler,
      useFactory: (
        cumplimientoView: CumplimientoSocioView,
        membershipView: UsuarioMembershipView,
      ) => new ObtenerCumplimientoSocioHandler(cumplimientoView, membershipView),
      inject: [CUMPLIMIENTO_SOCIO_VIEW, USUARIO_MEMBERSHIP_VIEW],
    },
  ],
})
export class DashboardModule {}
