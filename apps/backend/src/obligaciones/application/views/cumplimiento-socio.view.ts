import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';

export interface CumplimientoSocioViewInput {
  estudioId: string;
  /** Periodo fiscal YYYY-MM. Defaults to current month. */
  periodo?: string;
  /** Filter by tipo_obligacion.id */
  tipoObligacionId?: number;
  /** Filter by cliente.id */
  clienteId?: string;
  /** Filter by responsable (usuario.id) */
  responsableId?: string;
  /** Days threshold for "en riesgo" — pendientes within N days. Default 3. */
  diasRiesgo?: number;
}

export interface CumplimientoResponsableDto {
  responsableId: string | null;
  responsableNombre: string;
  total: number;
  presentados: number;
  vencidos: number;
  prorrogados: number;
  pendientes: number;
  enRiesgo: number;
  porcentajeCumplimiento: number;
}

export interface CumplimientoSocioDto {
  periodo: string;
  resumenGeneral: {
    total: number;
    presentados: number;
    vencidos: number;
    prorrogados: number;
    pendientes: number;
    enRiesgo: number;
    porcentajeCumplimiento: number;
  };
  porResponsable: CumplimientoResponsableDto[];
}

@Injectable()
export class CumplimientoSocioView {
  constructor(private readonly em: EntityManager) {}

  async execute(input: CumplimientoSocioViewInput): Promise<CumplimientoSocioDto> {
    const periodo = input.periodo ?? this.currentPeriodo();
    const diasRiesgo = input.diasRiesgo ?? 3;
    const conn = this.em.getConnection();

    const filters: string[] = [];
    const filterParams: unknown[] = [];

    if (input.tipoObligacionId != null) {
      filters.push(`AND v.tipo_obligacion_id = ?`);
      filterParams.push(input.tipoObligacionId);
    }
    if (input.clienteId) {
      filters.push(`AND v.cliente_id = ?`);
      filterParams.push(input.clienteId);
    }
    if (input.responsableId) {
      filters.push(`AND v.responsable_id = ?`);
      filterParams.push(input.responsableId);
    }

    const filterClause = filters.join(' ');

    const rows = await conn.execute(
      `SELECT
         v.responsable_id,
         COALESCE(u.nombre || ' ' || u.apellido, 'Sin asignar') AS responsable_nombre,
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE ev.codigo = 'PRESENTADO')::int AS presentados,
         COUNT(*) FILTER (WHERE ev.codigo = 'VENCIDO')::int AS vencidos,
         COUNT(*) FILTER (WHERE ev.codigo = 'PRORROGADO')::int AS prorrogados,
         COUNT(*) FILTER (WHERE ev.codigo = 'PENDIENTE')::int AS pendientes,
         COUNT(*) FILTER (
           WHERE ev.codigo = 'PENDIENTE'
             AND v.fecha_vencimiento <= NOW() + MAKE_INTERVAL(days => ?)
         )::int AS en_riesgo
       FROM vencimiento v
       JOIN estado_vencimiento ev ON v.estado_id = ev.id
       LEFT JOIN usuario u ON v.responsable_id = u.id
       WHERE v.estudio_id = ?
         AND v.periodo = ?
         ${filterClause}
       GROUP BY v.responsable_id, u.nombre, u.apellido
       ORDER BY total DESC`,
      [diasRiesgo, input.estudioId, periodo, ...filterParams],
    );

    const porResponsable: CumplimientoResponsableDto[] = rows.map((r: any) => ({
      responsableId: r.responsable_id as string | null,
      responsableNombre: r.responsable_nombre as string,
      total: Number(r.total),
      presentados: Number(r.presentados),
      vencidos: Number(r.vencidos),
      prorrogados: Number(r.prorrogados),
      pendientes: Number(r.pendientes),
      enRiesgo: Number(r.en_riesgo),
      porcentajeCumplimiento: Number(r.total) > 0
        ? Math.round((Number(r.presentados) / Number(r.total)) * 100)
        : 0,
    }));

    const resumenGeneral = porResponsable.reduce(
      (acc, r) => ({
        total: acc.total + r.total,
        presentados: acc.presentados + r.presentados,
        vencidos: acc.vencidos + r.vencidos,
        prorrogados: acc.prorrogados + r.prorrogados,
        pendientes: acc.pendientes + r.pendientes,
        enRiesgo: acc.enRiesgo + r.enRiesgo,
        porcentajeCumplimiento: 0,
      }),
      { total: 0, presentados: 0, vencidos: 0, prorrogados: 0, pendientes: 0, enRiesgo: 0, porcentajeCumplimiento: 0 },
    );
    resumenGeneral.porcentajeCumplimiento = resumenGeneral.total > 0
      ? Math.round((resumenGeneral.presentados / resumenGeneral.total) * 100)
      : 0;

    return { periodo, resumenGeneral, porResponsable };
  }

  private currentPeriodo(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }
}
