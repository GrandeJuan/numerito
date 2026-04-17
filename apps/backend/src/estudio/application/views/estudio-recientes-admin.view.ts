import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';

export interface EstudioRecientesAdminViewInput {
  limit?: number;
}

export interface EstudioRecienteAdminDto {
  id: string;
  nombre: string;
  plan: string;
  isActive: boolean;
  createdAt: string;
}

@Injectable()
export class EstudioRecientesAdminView {
  constructor(private readonly em: EntityManager) {}

  async execute(input: EstudioRecientesAdminViewInput = {}): Promise<EstudioRecienteAdminDto[]> {
    const limit = input.limit ?? 10;
    const conn = this.em.getConnection();

    const rows: any[] = await conn.execute(
      `SELECT e.id, e.nombre, p.nombre as plan, e.is_active, e.created_at
       FROM estudio e
       JOIN plan p ON e.plan_id = p.id
       ORDER BY e.created_at DESC
       LIMIT ${limit}`,
    );

    return rows.map((e: any) => ({
      id: e.id,
      nombre: e.nombre,
      plan: e.plan ?? 'Sin plan',
      isActive: Boolean(e.is_active),
      createdAt: new Date(e.created_at).toISOString().split('T')[0],
    }));
  }
}
