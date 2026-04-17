import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';

export interface EstudioRegistrosMensualesViewInput {
  meses?: number;
}

export interface RegistroMensualDto {
  mes: string;
  cantidad: number;
}

@Injectable()
export class EstudioRegistrosMensualesView {
  constructor(private readonly em: EntityManager) {}

  async execute(input: EstudioRegistrosMensualesViewInput = {}): Promise<RegistroMensualDto[]> {
    const meses = input.meses ?? 12;
    const conn = this.em.getConnection();

    const rows = await conn.execute(
      `SELECT TO_CHAR(created_at, 'YYYY-MM') as mes, COUNT(*)::int as cantidad
       FROM estudio
       WHERE created_at >= NOW() - INTERVAL '${meses} months'
       GROUP BY mes
       ORDER BY mes`,
    );

    return this.fillMonths(rows, meses);
  }

  private fillMonths(raw: any[], meses: number): RegistroMensualDto[] {
    const map = new Map<string, number>();
    raw.forEach((r: any) => map.set(r.mes, Number(r.cantidad)));

    const months: RegistroMensualDto[] = [];
    const now = new Date();
    for (let i = meses - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({ mes: key, cantidad: map.get(key) ?? 0 });
    }
    return months;
  }
}
