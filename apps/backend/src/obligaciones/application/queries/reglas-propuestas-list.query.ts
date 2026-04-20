import { EntityManager } from '@mikro-orm/core';

export interface ReglaPropuestaItem {
  id: number;
  tipoObligacion: string;
  jurisdiccion: string;
  regimen: string;
  terminacionCuit: string;
  diaVencimiento: number;
  mesSiguiente: boolean;
  vigenciaDesde: string;
  vigenciaHasta: string | null;
  origen: string;
  estado: string;
  // Diff against active rule (if exists)
  reglaActivaId: number | null;
  reglaActivaDiaVencimiento: number | null;
  reglaActivaMesSiguiente: boolean | null;
  reglaActivaVigenciaDesde: string | null;
  reglaActivaVigenciaHasta: string | null;
  tipoDiff: 'NUEVA' | 'MODIFICADA';
}

export class ReglasPropuestasListHandler {
  constructor(private readonly em: EntityManager) {}

  async execute(filters?: { fuente?: string }): Promise<ReglaPropuestaItem[]> {
    // LEFT JOIN propuesta with the active rule that shares the same natural key
    let sql = `
      SELECT
        p.id,
        tp.codigo AS "tipoObligacion",
        p.jurisdiccion,
        p.regimen,
        p.terminacion_cuit AS "terminacionCuit",
        p.dia_vencimiento AS "diaVencimiento",
        p.mes_siguiente AS "mesSiguiente",
        p.vigencia_desde AS "vigenciaDesde",
        p.vigencia_hasta AS "vigenciaHasta",
        p.origen,
        p.estado,
        a.id AS "reglaActivaId",
        a.dia_vencimiento AS "reglaActivaDiaVencimiento",
        a.mes_siguiente AS "reglaActivaMesSiguiente",
        a.vigencia_desde AS "reglaActivaVigenciaDesde",
        a.vigencia_hasta AS "reglaActivaVigenciaHasta",
        CASE WHEN a.id IS NULL THEN 'NUEVA' ELSE 'MODIFICADA' END AS "tipoDiff"
      FROM regla_vencimiento p
      JOIN tipo_obligacion tp ON tp.id = p.tipo_obligacion_id
      LEFT JOIN regla_vencimiento a
        ON a.tipo_obligacion_id = p.tipo_obligacion_id
        AND a.jurisdiccion = p.jurisdiccion
        AND a.regimen = p.regimen
        AND a.terminacion_cuit = p.terminacion_cuit
        AND a.estado = 'ACTIVA'
      WHERE p.estado = 'PROPUESTA'
    `;

    const params: unknown[] = [];
    if (filters?.fuente) {
      // Filter by jurisdiccion as proxy for fuente (ARCA → ARCA jurisdiction)
      sql += ' AND p.jurisdiccion = $1';
      params.push(filters.fuente);
    }

    sql += ' ORDER BY tp.codigo, p.jurisdiccion, p.terminacion_cuit';

    return this.em.getConnection().execute(sql, params);
  }
}
