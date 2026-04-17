import { EntityManager } from '@mikro-orm/core';
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

export type { DashboardStats };

export interface DashboardStatsQuery {
  estudioId: string;
  usuarioId: string;
}

export class ObtenerDashboardStatsHandler {
  constructor(
    private readonly em: EntityManager,
    private readonly clienteSummary: ClienteSummaryView,
    private readonly vencimientosProximos: VencimientosProximosView,
    private readonly tareasPendientes: TareasPendientesView,
    private readonly vencimientosPorEstado: VencimientosPorEstadoView,
    private readonly proximosVencimientosDetalle: ProximosVencimientosDetalleView,
    private readonly cargaTrabajo: CargaTrabajoView,
    private readonly facturacionMes: FacturacionMesView,
    private readonly facturacionMensual: FacturacionMensualView,
  ) {}

  async execute(query: DashboardStatsQuery): Promise<DashboardStats> {
    const conn = this.em.getConnection();

    const [membership] = await conn.execute(
      `SELECT ue.is_active, r.codigo as rol
       FROM usuario_estudio ue
       JOIN rol r ON ue.rol_id = r.id
       WHERE ue.usuario_id = ? AND ue.estudio_id = ?
       LIMIT 1`,
      [query.usuarioId, query.estudioId],
    );

    if (!membership || !membership.is_active) {
      throw new RecursoNoEncontradoError('Membresía en estudio');
    }

    const rol: string = membership.rol;
    const permisosRaw = await conn.execute(
      `SELECT p.codigo
       FROM rol_permiso rp
       JOIN rol r ON rp.rol_id = r.id
       JOIN permiso p ON rp.permiso_id = p.id
       WHERE r.codigo = ?`,
      [rol],
    );
    const permisos: string[] = permisosRaw.map((r: any) => r.codigo);
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

    // Actividad reciente — cross-context query, remains as raw SQL
    // until a dedicated cross-context view pattern is established.
    const actividadFilter = esEmpleado
      ? `AND (t.responsable_id = '${query.usuarioId}' OR c.responsable_id = '${query.usuarioId}')`
      : '';
    const actividadRaw = await conn.execute(
      `(SELECT 'tarea' as tipo,
              CONCAT('Tarea "', t.titulo, '" actualizada') as descripcion,
              t.updated_at::text as fecha,
              u.email as usuario
       FROM tarea t
       LEFT JOIN usuario u ON t.responsable_id = u.id
       LEFT JOIN cliente c ON t.cliente_id = c.id
       WHERE t.estudio_id = ? ${actividadFilter}
       ORDER BY t.updated_at DESC LIMIT 5)
      UNION ALL
      (SELECT 'vencimiento' as tipo,
              CONCAT('Vencimiento de ', c2.razon_social) as descripcion,
              v.updated_at::text as fecha,
              NULL as usuario
       FROM vencimiento v
       JOIN cliente c2 ON v.cliente_id = c2.id
       WHERE v.estudio_id = ?
       ORDER BY v.updated_at DESC LIMIT 5)
      ORDER BY fecha DESC LIMIT 10`,
      [query.estudioId, query.estudioId],
    );
    const actividadReciente = actividadRaw.map((r: any) => ({
      tipo: r.tipo,
      descripcion: r.descripcion,
      fecha: r.fecha,
      ...(r.usuario ? { usuario: r.usuario } : {}),
    }));

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
