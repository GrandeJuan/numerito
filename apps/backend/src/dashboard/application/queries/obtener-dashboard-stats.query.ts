import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';
import type { DashboardStats } from '@numerito/shared';
import type { ClienteSummaryView } from '../../../clientes/application/views/cliente-summary.view';
import type { VencimientosProximosView } from '../../../obligaciones/application/views/vencimientos-proximos.view';
import type { VencimientosPorEstadoView } from '../../../obligaciones/application/views/vencimientos-por-estado.view';
import type { ProximosVencimientosDetalleView } from '../../../obligaciones/application/views/proximos-vencimientos-detalle.view';
import type { TareasPendientesView } from '../../../tareas/application/views/tareas-pendientes.view';
import type { CargaTrabajoView } from '../../../tareas/application/views/carga-trabajo.view';
import type { FacturacionMesView } from '../../../facturacion/application/views/facturacion-mes.view';
import type { FacturacionMensualView } from '../../../facturacion/application/views/facturacion-mensual.view';
import type { UsuarioMembershipView } from '../../../iam/application/views/usuario-membership.view';
import type { ActividadRecienteTareasView } from '../../../tareas/application/views/actividad-reciente-tareas.view';
import type { ActividadRecienteVencimientosView } from '../../../obligaciones/application/views/actividad-reciente-vencimientos.view';

export type { DashboardStats };

export interface DashboardStatsQuery {
  estudioId: string;
  usuarioId: string;
}

export class ObtenerDashboardStatsHandler {
  constructor(
    private readonly clienteSummary: ClienteSummaryView,
    private readonly vencimientosProximos: VencimientosProximosView,
    private readonly tareasPendientes: TareasPendientesView,
    private readonly vencimientosPorEstado: VencimientosPorEstadoView,
    private readonly proximosVencimientosDetalle: ProximosVencimientosDetalleView,
    private readonly cargaTrabajo: CargaTrabajoView,
    private readonly facturacionMes: FacturacionMesView,
    private readonly facturacionMensual: FacturacionMensualView,
    private readonly membershipView: UsuarioMembershipView,
    private readonly actividadTareas: ActividadRecienteTareasView,
    private readonly actividadVencimientos: ActividadRecienteVencimientosView,
  ) {}

  async execute(query: DashboardStatsQuery): Promise<DashboardStats> {
    const membership = await this.membershipView.execute({
      usuarioId: query.usuarioId,
      estudioId: query.estudioId,
    });

    if (!membership || !membership.isActive) {
      throw new RecursoNoEncontradoError('Membresía en estudio');
    }

    const rol = membership.rol;
    const permisos = membership.permisos;
    const tieneFacturacion = permisos.includes('VER_FACTURACION');
    const esEmpleado = rol === 'EMPLEADO';
    const esSocioOResponsable = rol === 'SOCIO' || rol === 'RESPONSABLE';

    // KPIs — compose views from source contexts
    const [clienteSummary, vencimientosProximosSummary, tareasPendientesSummary] = await Promise.all([
      this.clienteSummary.execute({
        estudioId: query.estudioId,
        ...(esEmpleado ? { responsableId: query.usuarioId } : {}),
      }),
      this.vencimientosProximos.execute({
        estudioId: query.estudioId,
      }),
      this.tareasPendientes.execute({
        estudioId: query.estudioId,
        ...(esEmpleado ? { responsableId: query.usuarioId } : {}),
      }),
    ]);

    let facturacionMes: number | undefined;
    if (tieneFacturacion) {
      const result = await this.facturacionMes.execute({ estudioId: query.estudioId });
      facturacionMes = result.total;
    }

    // Chart/detail data — compose views from source contexts
    const vencimientosPorEstado = await this.vencimientosPorEstado.execute({
      estudioId: query.estudioId,
    });

    let facturacionMensual: { mes: string; monto: number }[] | undefined;
    if (tieneFacturacion) {
      facturacionMensual = await this.facturacionMensual.execute({
        estudioId: query.estudioId,
      });
    }

    const proximosVencimientos = await this.proximosVencimientosDetalle.execute({
      estudioId: query.estudioId,
    });

    // Actividad reciente — compose views from tareas + obligaciones contexts
    const [tareasRecientes, vencimientosRecientes] = await Promise.all([
      this.actividadTareas.execute({
        estudioId: query.estudioId,
        ...(esEmpleado ? { responsableId: query.usuarioId } : {}),
      }),
      this.actividadVencimientos.execute({
        estudioId: query.estudioId,
      }),
    ]);

    const actividadReciente = [...tareasRecientes, ...vencimientosRecientes]
      .sort((a, b) => (b.fecha > a.fecha ? 1 : b.fecha < a.fecha ? -1 : 0))
      .slice(0, 10);

    // Carga de trabajo — compose view from tareas context
    let cargaTrabajo: { usuario: string; tareas: number }[] | undefined;
    if (esSocioOResponsable) {
      cargaTrabajo = await this.cargaTrabajo.execute({
        estudioId: query.estudioId,
      });
    }

    return {
      kpis: {
        clientes: clienteSummary.totalClientes,
        vencimientosProximos: vencimientosProximosSummary.totalVencimientosProximos,
        ...(tieneFacturacion ? { facturacionMes } : {}),
        tareasActivas: tareasPendientesSummary.totalTareasPendientes,
      },
      vencimientosPorEstado,
      ...(tieneFacturacion ? { facturacionMensual } : {}),
      proximosVencimientos,
      actividadReciente,
      ...(esSocioOResponsable ? { cargaTrabajo } : {}),
    };
  }

}
