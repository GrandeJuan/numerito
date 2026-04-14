import { EntityManager } from '@mikro-orm/core';
import { ClienteEntity } from '../../../clientes/infrastructure/persistence/cliente.schema';
import { VencimientoEntity } from '../../../obligaciones/infrastructure/persistence/vencimiento.schema';
import { TareaEntity } from '../../../tareas/infrastructure/persistence/tarea.schema';
import type { UsuarioEstudioRepository } from '../../../iam/domain/repositories/usuario-estudio.repository';
import type { RolPermisoRepository } from '../../../iam/domain/repositories/rol-permiso.repository';
import { Permiso } from '../../../iam/domain/value-objects/permiso.vo';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

export interface DashboardStatsQuery {
  estudioId: string;
  usuarioId: string;
}

export interface DashboardStats {
  kpis: {
    clientes: number;
    vencimientosProximos: number;
    facturacionMes?: number;
    tareasActivas: number;
  };
  vencimientosPorEstado: { estado: string; cantidad: number }[];
  facturacionMensual?: { mes: string; monto: number }[];
  proximosVencimientos: {
    id: string;
    cliente: string;
    obligacion: string;
    fecha: string;
    estado: string;
  }[];
  actividadReciente: { tipo: string; descripcion: string; fecha: string; usuario?: string }[];
  cargaTrabajo?: { usuario: string; tareas: number }[];
}

export class ObtenerDashboardStatsHandler {
  constructor(
    private readonly em: EntityManager,
    private readonly usuarioEstudioRepo: UsuarioEstudioRepository,
    private readonly rolPermisoRepo: RolPermisoRepository,
  ) {}

  async execute(query: DashboardStatsQuery): Promise<DashboardStats> {
    const membership = await this.usuarioEstudioRepo.findByUsuarioAndEstudio(query.usuarioId);

    if (!membership || !membership.isActive) {
      throw new RecursoNoEncontradoError('Membresía en estudio');
    }

    const rol = membership.rol;
    const permisos = await this.rolPermisoRepo.findPermisosByRol(rol);
    const tieneFacturacion = permisos.includes(Permiso.VER_FACTURACION);
    const esEmpleado = rol === 'EMPLEADO';
    const esSocioOResponsable = rol === 'SOCIO' || rol === 'RESPONSABLE';

    // Build base filter — EMPLEADO sees only their assigned resources
    const clienteFilter: Record<string, any> = { estudio: query.estudioId };
    const tareaFilter: Record<string, any> = { estudio: query.estudioId };
    if (esEmpleado) {
      clienteFilter.responsable = query.usuarioId;
      tareaFilter.responsable = query.usuarioId;
    }

    // KPIs
    const [clientes, vencimientosProximos, tareasActivas] = await Promise.all([
      this.em.count(ClienteEntity, clienteFilter),
      this.em.count(VencimientoEntity, {
        estudio: query.estudioId,
        fechaVencimiento: { $gte: new Date(), $lte: this.addDays(new Date(), 30) },
        ...(esEmpleado ? {} : {}),
      }),
      this.em.count(TareaEntity, {
        ...tareaFilter,
        estado: { codigo: { $nin: ['COMPLETADA', 'CANCELADA'] } },
      }),
    ]);

    let facturacionMes: number | undefined;
    if (tieneFacturacion) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const conn = this.em.getConnection();
      const [row] = await conn.execute(
        `SELECT COALESCE(SUM(total), 0) as total
         FROM factura
         WHERE estudio_id = ?
           AND fecha_emision >= ?
           AND fecha_emision <= ?`,
        [query.estudioId, startOfMonth.toISOString(), endOfMonth.toISOString()],
      );
      facturacionMes = Number(row?.total) || 0;
    }

    // Vencimientos por estado (last 6 months)
    const conn = this.em.getConnection();
    const vencimientosPorEstadoRaw = await conn.execute(
      `SELECT ev.nombre as estado, COUNT(*)::int as cantidad
       FROM vencimiento v
       JOIN estado_vencimiento ev ON v.estado_id = ev.id
       WHERE v.estudio_id = ?
         AND v.fecha_vencimiento >= NOW() - INTERVAL '6 months'
       GROUP BY ev.nombre
       ORDER BY cantidad DESC`,
      [query.estudioId],
    );
    const vencimientosPorEstado = vencimientosPorEstadoRaw.map((r: any) => ({
      estado: r.estado,
      cantidad: Number(r.cantidad),
    }));

    // Facturacion mensual (6 months)
    let facturacionMensual: { mes: string; monto: number }[] | undefined;
    if (tieneFacturacion) {
      const facturacionRaw = await conn.execute(
        `SELECT TO_CHAR(fecha_emision, 'YYYY-MM') as mes, COALESCE(SUM(total), 0) as monto
         FROM factura
         WHERE estudio_id = ?
           AND fecha_emision >= NOW() - INTERVAL '6 months'
         GROUP BY mes
         ORDER BY mes`,
        [query.estudioId],
      );
      facturacionMensual = facturacionRaw.map((r: any) => ({
        mes: r.mes,
        monto: Number(r.monto),
      }));
    }

    // Proximos vencimientos (top 5)
    const proximosRaw = await conn.execute(
      `SELECT v.id, c.razon_social as cliente, to2.nombre as obligacion,
              v.fecha_vencimiento::text as fecha, ev.nombre as estado
       FROM vencimiento v
       JOIN cliente c ON v.cliente_id = c.id
       JOIN tipo_obligacion to2 ON v.tipo_obligacion_id = to2.id
       JOIN estado_vencimiento ev ON v.estado_id = ev.id
       WHERE v.estudio_id = ?
         AND v.fecha_vencimiento >= NOW()
       ORDER BY v.fecha_vencimiento ASC
       LIMIT 5`,
      [query.estudioId],
    );
    const proximosVencimientos = proximosRaw.map((r: any) => ({
      id: r.id,
      cliente: r.cliente,
      obligacion: r.obligacion,
      fecha: r.fecha,
      estado: r.estado,
    }));

    // Actividad reciente
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

    // Carga de trabajo (only SOCIO/RESPONSABLE)
    let cargaTrabajo: { usuario: string; tareas: number }[] | undefined;
    if (esSocioOResponsable) {
      const cargaRaw = await conn.execute(
        `SELECT u.email as usuario, COUNT(*)::int as tareas
         FROM tarea t
         JOIN usuario u ON t.responsable_id = u.id
         JOIN estado_tarea et ON t.estado_id = et.id
         WHERE t.estudio_id = ?
           AND et.codigo NOT IN ('COMPLETADA', 'CANCELADA')
         GROUP BY u.email
         ORDER BY tareas DESC`,
        [query.estudioId],
      );
      cargaTrabajo = cargaRaw.map((r: any) => ({
        usuario: r.usuario,
        tareas: Number(r.tareas),
      }));
    }

    return {
      kpis: {
        clientes,
        vencimientosProximos,
        ...(tieneFacturacion ? { facturacionMes } : {}),
        tareasActivas,
      },
      vencimientosPorEstado,
      ...(tieneFacturacion ? { facturacionMensual } : {}),
      proximosVencimientos,
      actividadReciente,
      ...(esSocioOResponsable ? { cargaTrabajo } : {}),
    };
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}
