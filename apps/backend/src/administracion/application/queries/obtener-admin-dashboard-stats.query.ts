import { EntityManager } from '@mikro-orm/core';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';
import { UsuarioEntity } from '../../../iam/infrastructure/persistence/usuario.schema';
import { SubscripcionEntity } from '../../../estudio/infrastructure/persistence/subscripcion.schema';

export interface AdminDashboardStats {
  kpis: {
    estudiosActivos: number;
    totalUsuarios: number;
    mrr: number;
    subscripcionesPorVencer: number;
  };
  registrosMensuales: { mes: string; cantidad: number }[];
  distribucionPlanes: { plan: string; cantidad: number }[];
  alertas: { tipo: string; mensaje: string; fecha: string }[];
  estudiosRecientes: { id: string; nombre: string; plan: string; estado: string; creadoEn: string }[];
}

export class ObtenerAdminDashboardStatsHandler {
  constructor(private readonly em: EntityManager) {}

  async execute(): Promise<AdminDashboardStats> {
    const [estudiosActivos, totalUsuarios, subscripcionesPorVencer] = await Promise.all([
      this.em.count(EstudioEntity, { isActive: true }),
      this.em.count(UsuarioEntity, {}),
      this.em.count(SubscripcionEntity, {
        fechaFin: { $gte: new Date(), $lte: this.addDays(new Date(), 30) },
      }),
    ]);

    const conn = this.em.getConnection();

    // MRR: sum of precio from active subscriptions' plans
    const [mrrResult] = await conn.execute(
      `SELECT COALESCE(SUM(p.precio), 0) as mrr
       FROM subscripcion s
       JOIN plan p ON s.plan_id = p.id
       JOIN estado_subscripcion es ON s.estado_subscripcion_id = es.id
       WHERE es.codigo = 'ACTIVA'`,
    );
    const mrr = Number(mrrResult?.mrr) || 0;

    // Monthly registrations (last 12 months)
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

    return {
      kpis: { estudiosActivos, totalUsuarios, mrr, subscripcionesPorVencer },
      registrosMensuales,
      distribucionPlanes,
      alertas,
      estudiosRecientes,
    };
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
