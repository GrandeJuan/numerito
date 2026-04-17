import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';

export interface UsuarioAdminKpisViewInput {
  meses?: number;
}

export interface UsuarioAdminKpisDto {
  totalUsuarios: number;
  sparkline: number[];
}

@Injectable()
export class UsuarioAdminKpisView {
  constructor(private readonly em: EntityManager) {}

  async execute(input: UsuarioAdminKpisViewInput = {}): Promise<UsuarioAdminKpisDto> {
    const meses = input.meses ?? 12;
    const conn = this.em.getConnection();
    const intervalMonths = meses - 1;

    const [[{ count }], sparklineRows] = await Promise.all([
      conn.execute(`SELECT COUNT(*)::int as count FROM usuario`),
      conn.execute(
        `SELECT TO_CHAR(d.mes, 'YYYY-MM') as mes,
                (SELECT COUNT(*) FROM usuario WHERE created_at <= d.mes + INTERVAL '1 month' - INTERVAL '1 day')::int as cantidad
         FROM generate_series(
           DATE_TRUNC('month', NOW()) - INTERVAL '${intervalMonths} months',
           DATE_TRUNC('month', NOW()),
           '1 month'
         ) d(mes)
         ORDER BY d.mes`,
      ),
    ]);

    return {
      totalUsuarios: Number(count),
      sparkline: sparklineRows.map((r: any) => Number(r.cantidad) || 0),
    };
  }
}
