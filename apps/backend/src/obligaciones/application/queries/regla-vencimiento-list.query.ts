import { EntityManager } from '@mikro-orm/core';

export interface ReglaVencimientoItem {
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
}

export class ReglaVencimientoListHandler {
  constructor(private readonly em: EntityManager) {}

  async execute(filters?: { estado?: string }): Promise<ReglaVencimientoItem[]> {
    let sql = `
      SELECT rv.id, t.codigo AS "tipoObligacion", rv.jurisdiccion, rv.regimen,
             rv.terminacion_cuit AS "terminacionCuit",
             rv.dia_vencimiento AS "diaVencimiento",
             rv.mes_siguiente AS "mesSiguiente",
             rv.vigencia_desde AS "vigenciaDesde",
             rv.vigencia_hasta AS "vigenciaHasta",
             rv.origen, rv.estado
      FROM regla_vencimiento rv
      JOIN tipo_obligacion t ON t.id = rv.tipo_obligacion_id
    `;
    const params: unknown[] = [];
    if (filters?.estado) {
      sql += ' WHERE rv.estado = $1';
      params.push(filters.estado);
    }
    sql += ' ORDER BY t.codigo, rv.jurisdiccion, rv.terminacion_cuit';

    return this.em.getConnection().execute(sql, params);
  }
}
