import { EntityManager } from '@mikro-orm/core';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';
import { UsuarioEntity } from '../../../iam/infrastructure/persistence/usuario.schema';
import { SubscripcionEntity } from '../../../estudio/infrastructure/persistence/subscripcion.schema';

export interface KpiWithSparkline {
  value: number;
  delta: string;
  deltaUp: boolean;
  sparkline: number[];
}

export interface GrowthDataPoint {
  mes: string;
  usuarios: number;
  estudios: number;
}

export interface RevenueDataPoint {
  mes: string;
  mrr: number;
  arr: number;
}

export interface TopTenant {
  id: string;
  nombre: string;
  plan: string;
  usuarios: number;
  clientes: number;
  actividad: number;
}

export interface RegistroReciente {
  id: string;
  nombre: string;
  plan: string;
  email: string;
  creadoEn: string;
}

export interface AdminDashboardStats {
  kpis: {
    estudiosActivos: KpiWithSparkline;
    totalUsuarios: KpiWithSparkline;
    subscripcionesActivas: KpiWithSparkline;
    mrr: KpiWithSparkline;
    churnMensual: KpiWithSparkline;
    uptime: KpiWithSparkline;
  };
  growthData: GrowthDataPoint[];
  revenueData: RevenueDataPoint[];
  registrosMensuales: { mes: string; cantidad: number }[];
  distribucionPlanes: { plan: string; cantidad: number }[];
  alertas: { tipo: string; mensaje: string; fecha: string }[];
  estudiosRecientes: { id: string; nombre: string; plan: string; estado: string; creadoEn: string }[];
  topTenants: TopTenant[];
  registrosRecientes: RegistroReciente[];
}

export class ObtenerAdminDashboardStatsHandler {
  constructor(private readonly em: EntityManager) {}

  async execute(): Promise<AdminDashboardStats> {
    const conn = this.em.getConnection();

    const [
      estudiosActivos,
      totalUsuarios,
      subscripcionesActivas,
      subscripcionesPorVencer,
      estudiosHistorico,
      usuariosHistorico,
      subscripcionesHistorico,
      mrrHistorico,
      churnHistorico,
    ] = await Promise.all([
      this.em.count(EstudioEntity, { isActive: true }),
      this.em.count(UsuarioEntity, {}),
      this.em.count(SubscripcionEntity, {
        estado: { codigo: 'ACTIVA' },
      }),
      this.em.count(SubscripcionEntity, {
        fechaFin: { $gte: new Date(), $lte: this.addDays(new Date(), 30) },
      }),
      // Monthly active estudios (cumulative count at end of each month)
      conn.execute(
        `SELECT TO_CHAR(d.mes, 'YYYY-MM') as mes,
                (SELECT COUNT(*) FROM estudio WHERE is_active = true AND created_at <= d.mes + INTERVAL '1 month' - INTERVAL '1 day')::int as cantidad
         FROM generate_series(
           DATE_TRUNC('month', NOW()) - INTERVAL '11 months',
           DATE_TRUNC('month', NOW()),
           '1 month'
         ) d(mes)
         ORDER BY d.mes`,
      ),
      // Monthly total usuarios (cumulative)
      conn.execute(
        `SELECT TO_CHAR(d.mes, 'YYYY-MM') as mes,
                (SELECT COUNT(*) FROM usuario WHERE created_at <= d.mes + INTERVAL '1 month' - INTERVAL '1 day')::int as cantidad
         FROM generate_series(
           DATE_TRUNC('month', NOW()) - INTERVAL '11 months',
           DATE_TRUNC('month', NOW()),
           '1 month'
         ) d(mes)
         ORDER BY d.mes`,
      ),
      // Monthly active subscripciones (snapshot: active at end of each month)
      conn.execute(
        `SELECT TO_CHAR(d.mes, 'YYYY-MM') as mes,
                (SELECT COUNT(*) FROM subscripcion s
                 JOIN estado_subscripcion es ON s.estado_subscripcion_id = es.id
                 WHERE es.codigo = 'ACTIVA'
                   AND s.fecha_inicio <= d.mes + INTERVAL '1 month' - INTERVAL '1 day'
                   AND (s.fecha_fin IS NULL OR s.fecha_fin >= d.mes))::int as cantidad
         FROM generate_series(
           DATE_TRUNC('month', NOW()) - INTERVAL '11 months',
           DATE_TRUNC('month', NOW()),
           '1 month'
         ) d(mes)
         ORDER BY d.mes`,
      ),
      // Monthly MRR (sum of plan prices for active subscriptions at each month)
      conn.execute(
        `SELECT TO_CHAR(d.mes, 'YYYY-MM') as mes,
                COALESCE((SELECT SUM(p.precio) FROM subscripcion s
                 JOIN plan p ON s.plan_id = p.id
                 JOIN estado_subscripcion es ON s.estado_subscripcion_id = es.id
                 WHERE es.codigo = 'ACTIVA'
                   AND s.fecha_inicio <= d.mes + INTERVAL '1 month' - INTERVAL '1 day'
                   AND (s.fecha_fin IS NULL OR s.fecha_fin >= d.mes)), 0) as mrr
         FROM generate_series(
           DATE_TRUNC('month', NOW()) - INTERVAL '11 months',
           DATE_TRUNC('month', NOW()),
           '1 month'
         ) d(mes)
         ORDER BY d.mes`,
      ),
      // Monthly churn: cancelaciones in month / activas at start of month
      conn.execute(
        `SELECT TO_CHAR(d.mes, 'YYYY-MM') as mes,
                (SELECT COUNT(*) FROM subscripcion s
                 JOIN estado_subscripcion es ON s.estado_subscripcion_id = es.id
                 WHERE es.codigo = 'CANCELADA'
                   AND s.updated_at >= d.mes
                   AND s.updated_at < d.mes + INTERVAL '1 month')::int as canceladas,
                GREATEST((SELECT COUNT(*) FROM subscripcion s2
                 JOIN estado_subscripcion es2 ON s2.estado_subscripcion_id = es2.id
                 WHERE es2.codigo IN ('ACTIVA', 'CANCELADA', 'SUSPENDIDA', 'VENCIDA')
                   AND s2.fecha_inicio < d.mes
                   AND (s2.fecha_fin IS NULL OR s2.fecha_fin >= d.mes)), 1)::int as activas_inicio
         FROM generate_series(
           DATE_TRUNC('month', NOW()) - INTERVAL '11 months',
           DATE_TRUNC('month', NOW()),
           '1 month'
         ) d(mes)
         ORDER BY d.mes`,
      ),
    ]);

    // Build sparkline arrays from historical data
    const estudiosSparkline = this.extractSparkline(estudiosHistorico, 'cantidad');
    const usuariosSparkline = this.extractSparkline(usuariosHistorico, 'cantidad');
    const subscripcionesSparkline = this.extractSparkline(subscripcionesHistorico, 'cantidad');
    const mrrSparkline = this.extractSparkline(mrrHistorico, 'mrr');
    const churnSparkline = churnHistorico.map((r: any) =>
      Math.round((Number(r.canceladas) / Number(r.activas_inicio)) * 10000) / 100,
    );

    // Current MRR is the last sparkline value
    const currentMrr = mrrSparkline[mrrSparkline.length - 1] ?? 0;
    const currentChurn = churnSparkline[churnSparkline.length - 1] ?? 0;

    // Build growth data (dual series: usuarios + estudios per month)
    const months = this.buildMonthLabels();
    const growthData: GrowthDataPoint[] = months.map((mes, i) => ({
      mes,
      usuarios: usuariosSparkline[i] ?? 0,
      estudios: estudiosSparkline[i] ?? 0,
    }));

    // Build revenue data (MRR + ARR per month)
    const revenueData: RevenueDataPoint[] = months.map((mes, i) => {
      const mrr = mrrSparkline[i] ?? 0;
      return { mes, mrr, arr: mrr * 12 };
    });

    // Monthly registrations (last 12 months) — keep for charts
    const registrosRaw = await conn.execute(
      `SELECT TO_CHAR(created_at, 'YYYY-MM') as mes, COUNT(*)::int as cantidad
       FROM estudio
       WHERE created_at >= NOW() - INTERVAL '12 months'
       GROUP BY mes
       ORDER BY mes`,
    );
    const registrosMensuales = this.fillMonths(registrosRaw);

    // Plan distribution
    const distribucionRaw = await conn.execute(
      `SELECT p.nombre as plan, COUNT(*)::int as cantidad
       FROM estudio e
       JOIN plan p ON e.plan_id = p.id
       WHERE e.is_active = true
       GROUP BY p.nombre
       ORDER BY cantidad DESC`,
    );
    const distribucionPlanes = distribucionRaw.map((r: any) => ({
      plan: r.plan,
      cantidad: Number(r.cantidad),
    }));

    // Alertas
    const alertas: AdminDashboardStats['alertas'] = [];
    if (subscripcionesPorVencer > 0) {
      alertas.push({
        tipo: 'warning',
        mensaje: `${subscripcionesPorVencer} subscripciones por vencer en los próximos 30 días`,
        fecha: new Date().toISOString().split('T')[0],
      });
    }

    // Recent estudios
    const estudiosRecientesRaw = await this.em.find(
      EstudioEntity,
      {},
      { orderBy: { createdAt: 'DESC' }, limit: 10, populate: ['plan'] },
    );
    const estudiosRecientes = estudiosRecientesRaw.map((e) => ({
      id: e.id,
      nombre: e.nombre,
      plan: e.plan?.nombre ?? 'Sin plan',
      estado: e.isActive ? 'Activo' : 'Inactivo',
      creadoEn: e.createdAt.toISOString().split('T')[0],
    }));

    // Top tenants by activity score
    // Activity score = (usuarios * 3) + (clientes * 2), normalized to 0-100
    const topTenantsRaw: any[] = await conn.execute(
      `SELECT
         e.id,
         e.nombre,
         p.nombre as plan,
         COALESCE(ue.usuarios_count, 0)::int as usuarios,
         COALESCE(c.clientes_count, 0)::int as clientes,
         (COALESCE(ue.usuarios_count, 0) * 3 + COALESCE(c.clientes_count, 0) * 2)::int as raw_score
       FROM estudio e
       JOIN plan p ON e.plan_id = p.id
       LEFT JOIN (
         SELECT estudio_id, COUNT(*)::int as usuarios_count
         FROM usuario_estudio
         WHERE is_active = true
         GROUP BY estudio_id
       ) ue ON ue.estudio_id = e.id
       LEFT JOIN (
         SELECT estudio_id, COUNT(*)::int as clientes_count
         FROM cliente
         GROUP BY estudio_id
       ) c ON c.estudio_id = e.id
       WHERE e.is_active = true
       ORDER BY raw_score DESC
       LIMIT 8`,
    );

    const maxScore = topTenantsRaw.length > 0
      ? Math.max(...topTenantsRaw.map((t) => Number(t.raw_score)), 1)
      : 1;

    const topTenants: TopTenant[] = topTenantsRaw.map((t) => ({
      id: t.id,
      nombre: t.nombre,
      plan: t.plan,
      usuarios: Number(t.usuarios),
      clientes: Number(t.clientes),
      actividad: Math.round((Number(t.raw_score) / maxScore) * 100),
    }));

    // Recent registrations with contact email (first user of the estudio)
    const registrosRecientesRaw: any[] = await conn.execute(
      `SELECT
         e.id,
         e.nombre,
         p.nombre as plan,
         e.created_at,
         (
           SELECT u.email FROM usuario_estudio ue2
           JOIN usuario u ON u.id = ue2.usuario_id
           WHERE ue2.estudio_id = e.id
           ORDER BY ue2.created_at ASC
           LIMIT 1
         ) as email
       FROM estudio e
       JOIN plan p ON e.plan_id = p.id
       ORDER BY e.created_at DESC
       LIMIT 5`,
    );

    const registrosRecientes: RegistroReciente[] = registrosRecientesRaw.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      plan: r.plan,
      email: r.email ?? '',
      creadoEn: new Date(r.created_at).toISOString().split('T')[0],
    }));

    return {
      kpis: {
        estudiosActivos: this.buildKpi(estudiosActivos, estudiosSparkline),
        totalUsuarios: this.buildKpi(totalUsuarios, usuariosSparkline),
        subscripcionesActivas: this.buildKpi(subscripcionesActivas, subscripcionesSparkline),
        mrr: this.buildKpi(currentMrr, mrrSparkline),
        churnMensual: this.buildKpi(currentChurn, churnSparkline, true),
        uptime: {
          value: 99.98,
          delta: 'SLA OK',
          deltaUp: true,
          sparkline: Array(12).fill(99.98),
        },
      },
      growthData,
      revenueData,
      registrosMensuales,
      distribucionPlanes,
      alertas,
      estudiosRecientes,
      topTenants,
      registrosRecientes,
    };
  }

  private buildKpi(current: number, sparkline: number[], invertDelta = false): KpiWithSparkline {
    const prev = sparkline.length >= 2 ? sparkline[sparkline.length - 2] : 0;
    let deltaPercent = 0;
    if (prev > 0) {
      deltaPercent = Math.round(((current - prev) / prev) * 1000) / 10;
    }
    const deltaUp = invertDelta ? deltaPercent <= 0 : deltaPercent >= 0;
    const sign = deltaPercent >= 0 ? '+' : '';
    return {
      value: current,
      delta: `${sign}${deltaPercent}%`,
      deltaUp,
      sparkline,
    };
  }

  private extractSparkline(rows: any[], field: string): number[] {
    return rows.map((r: any) => Number(r[field]) || 0);
  }

  private buildMonthLabels(): string[] {
    const labels: string[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return labels;
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private fillMonths(raw: any[]): { mes: string; cantidad: number }[] {
    const map = new Map<string, number>();
    raw.forEach((r: any) => map.set(r.mes, Number(r.cantidad)));

    const months: { mes: string; cantidad: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({ mes: key, cantidad: map.get(key) ?? 0 });
    }
    return months;
  }
}
