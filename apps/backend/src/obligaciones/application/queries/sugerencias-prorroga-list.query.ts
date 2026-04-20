import { EntityManager } from '@mikro-orm/postgresql';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';

export interface SugerenciaProrrogaListItem {
  id: string;
  vencimientoId: string;
  clienteId: string;
  cliente: string;
  tipoObligacion: string;
  periodo: string;
  fechaOriginal: string;
  fechaSugerida: string;
  motivo: string;
  estado: string;
  reglaActivaId: string | null;
  ejecucionIngestaId: string | null;
  createdAt: string;
}

export class SugerenciasProrrogaListHandler {
  constructor(private readonly em: EntityManager) {}

  async execute(
    principal: EstudioPrincipal,
    filters?: { estado?: string },
  ): Promise<SugerenciaProrrogaListItem[]> {
    const conditions: string[] = ['sp.estudio_id = ?'];
    const params: unknown[] = [principal.estudioId];

    if (filters?.estado) {
      conditions.push('sp.estado = ?');
      params.push(filters.estado);
    }

    const rows = await this.em.getConnection().execute<SugerenciaProrrogaListItem[]>(
      `SELECT
        sp.id,
        sp.vencimiento_id AS "vencimientoId",
        sp.cliente_id AS "clienteId",
        COALESCE(c.razon_social, c.nombre || ' ' || c.apellido) AS cliente,
        sp.tipo_obligacion AS "tipoObligacion",
        sp.periodo,
        sp.fecha_original AS "fechaOriginal",
        sp.fecha_sugerida AS "fechaSugerida",
        sp.motivo,
        sp.estado,
        sp.regla_activa_id AS "reglaActivaId",
        sp.ejecucion_ingesta_id AS "ejecucionIngestaId",
        sp.created_at AS "createdAt"
      FROM sugerencia_prorroga sp
      LEFT JOIN cliente c ON c.id = sp.cliente_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY sp.created_at DESC`,
      params,
    );
    return rows;
  }
}
