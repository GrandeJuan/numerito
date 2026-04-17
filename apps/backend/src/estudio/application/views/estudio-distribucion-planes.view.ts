import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';

export interface DistribucionPlanDto {
  plan: string;
  cantidad: number;
}

@Injectable()
export class EstudioDistribucionPlanesView {
  constructor(private readonly em: EntityManager) {}

  async execute(): Promise<DistribucionPlanDto[]> {
    const conn = this.em.getConnection();

    const rows = await conn.execute(
      `SELECT p.nombre as plan, COUNT(*)::int as cantidad
       FROM estudio e
       JOIN plan p ON e.plan_id = p.id
       WHERE e.is_active = true
       GROUP BY p.nombre
       ORDER BY cantidad DESC`,
    );

    return rows.map((r: any) => ({
      plan: r.plan,
      cantidad: Number(r.cantidad),
    }));
  }
}
