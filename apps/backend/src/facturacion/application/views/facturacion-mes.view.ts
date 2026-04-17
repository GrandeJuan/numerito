import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';

export interface FacturacionMesViewInput {
  estudioId: string;
}

export interface FacturacionMesDto {
  total: number;
}

@Injectable()
export class FacturacionMesView {
  constructor(private readonly em: EntityManager) {}

  async execute(input: FacturacionMesViewInput): Promise<FacturacionMesDto> {
    const conn = this.em.getConnection();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [row] = await conn.execute(
      `SELECT COALESCE(SUM(total), 0) as total
       FROM factura
       WHERE estudio_id = ?
         AND fecha_emision >= ?
         AND fecha_emision <= ?`,
      [input.estudioId, startOfMonth.toISOString(), endOfMonth.toISOString()],
    );

    return { total: Number(row?.total) || 0 };
  }
}
