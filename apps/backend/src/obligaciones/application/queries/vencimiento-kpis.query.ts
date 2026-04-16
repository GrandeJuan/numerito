import { EntityManager } from '@mikro-orm/core';

export interface VencimientoKpisQuery {
  estudioId: string;
}

export interface VencimientoKpisResult {
  pendientes: number;
  vencidos: number;
  presentadosEsteMes: number;
  proximoVencimiento: string | null;
}

export class VencimientoKpisHandler {
  constructor(private readonly em: EntityManager) {}

  async execute(query: VencimientoKpisQuery): Promise<VencimientoKpisResult> {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const conn = this.em.getConnection();
    const [row] = await conn.execute(
      `SELECT
         COUNT(*) FILTER (WHERE ev.codigo = 'PENDIENTE') AS pendientes,
         COUNT(*) FILTER (WHERE ev.codigo = 'VENCIDO') AS vencidos,
         COUNT(*) FILTER (WHERE ev.codigo = 'PRESENTADO' AND v.periodo = ?) AS presentados_este_mes,
         (MIN(v.fecha_vencimiento) FILTER (WHERE ev.codigo = 'PENDIENTE'))::date::text AS proximo_vencimiento
       FROM vencimiento v
       JOIN estado_vencimiento ev ON v.estado_id = ev.id
       WHERE v.estudio_id = ?`,
      [currentMonth, query.estudioId],
    );

    return {
      pendientes: Number(row?.pendientes ?? 0),
      vencidos: Number(row?.vencidos ?? 0),
      presentadosEsteMes: Number(row?.presentados_este_mes ?? 0),
      proximoVencimiento: row?.proximo_vencimiento ?? null,
    };
  }
}
