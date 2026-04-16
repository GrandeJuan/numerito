import { EntityManager } from '@mikro-orm/core';
import type { EstadoTarea, Prioridad } from '@numerito/shared';

export interface TareaListQuery {
  estudioId: string;
  estado?: EstadoTarea;
  clienteId?: string;
  responsableId?: string;
  prioridad?: Prioridad;
  page?: number;
  limit?: number;
}

export interface TareaListItem {
  id: string;
  titulo: string;
  descripcion: string | null;
  clienteId: string | null;
  clienteNombre: string | null;
  responsableId: string | null;
  responsableNombre: string | null;
  estado: EstadoTarea;
  prioridad: Prioridad;
  horasRegistradas: number;
}

export interface TareaListResult {
  items: TareaListItem[];
  total: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

export class TareaListHandler {
  constructor(private readonly em: EntityManager) {}

  async execute(query: TareaListQuery): Promise<TareaListResult> {
    const page = Math.max(1, Number(query.page) || DEFAULT_PAGE);
    const limit = Math.max(1, Number(query.limit) || DEFAULT_LIMIT);
    const offset = (page - 1) * limit;

    const whereParts: string[] = ['t.estudio_id = ?'];
    const whereParams: unknown[] = [query.estudioId];

    if (query.estado) {
      whereParts.push('et.codigo = ?');
      whereParams.push(query.estado);
    }
    if (query.clienteId) {
      whereParts.push('t.cliente_id = ?');
      whereParams.push(query.clienteId);
    }
    if (query.responsableId) {
      whereParts.push('t.responsable_id = ?');
      whereParams.push(query.responsableId);
    }
    if (query.prioridad) {
      whereParts.push('p.codigo = ?');
      whereParams.push(query.prioridad);
    }

    const whereClause = whereParts.join(' AND ');
    const conn = this.em.getConnection();

    const rows = await conn.execute(
      `SELECT
         t.id,
         t.titulo,
         t.descripcion,
         t.cliente_id,
         c.razon_social AS cliente_nombre,
         t.responsable_id,
         (u.nombre || ' ' || u.apellido) AS responsable_nombre,
         et.codigo AS estado,
         p.codigo AS prioridad,
         t.horas_registradas
       FROM tarea t
       LEFT JOIN cliente c ON t.cliente_id = c.id
       LEFT JOIN usuario u ON t.responsable_id = u.id
       JOIN estado_tarea et ON t.estado_id = et.id
       JOIN prioridad p ON t.prioridad_id = p.id
       WHERE ${whereClause}
       ORDER BY t.created_at DESC, t.id ASC
       LIMIT ? OFFSET ?`,
      [...whereParams, limit, offset],
    );

    const [countRow] = await conn.execute(
      `SELECT COUNT(*) AS total
       FROM tarea t
       LEFT JOIN cliente c ON t.cliente_id = c.id
       LEFT JOIN usuario u ON t.responsable_id = u.id
       JOIN estado_tarea et ON t.estado_id = et.id
       JOIN prioridad p ON t.prioridad_id = p.id
       WHERE ${whereClause}`,
      whereParams,
    );

    const items: TareaListItem[] = rows.map((r: any) => ({
      id: r.id,
      titulo: r.titulo,
      descripcion: r.descripcion ?? null,
      clienteId: r.cliente_id ?? null,
      clienteNombre: r.cliente_nombre ?? null,
      responsableId: r.responsable_id ?? null,
      responsableNombre: r.responsable_nombre ?? null,
      estado: r.estado as EstadoTarea,
      prioridad: r.prioridad as Prioridad,
      horasRegistradas: Number(r.horas_registradas ?? 0),
    }));

    return {
      items,
      total: Number(countRow?.total ?? 0),
    };
  }
}
