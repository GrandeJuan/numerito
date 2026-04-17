import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';

export interface FacturacionMensualViewInput {
  estudioId: string;
  mesesAtras?: number;
}

export interface FacturacionMensualItemDto {
  mes: string;
  monto: number;
}

@Injectable()
export class FacturacionMensualView {
  constructor(private readonly em: EntityManager) {}

  async execute(input: FacturacionMensualViewInput): Promise<FacturacionMensualItemDto[]> {
    const meses = input.mesesAtras ?? 6;
    const conn = this.em.getConnection();

    const rows = await conn.execute(
      `SELECT TO_CHAR(fecha_emision, 'YYYY-MM') as mes, COALESCE(SUM(total), 0) as monto
       FROM factura
       WHERE estudio_id = ?
         AND fecha_emision >= NOW() - MAKE_INTERVAL(months => ?)
       GROUP BY mes
       ORDER BY mes`,
      [input.estudioId, meses],
    );

    return rows.map((r: any) => ({
      mes: r.mes as string,
      monto: Number(r.monto),
    }));
  }
}
