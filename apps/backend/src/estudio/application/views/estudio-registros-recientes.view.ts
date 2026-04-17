import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';

export interface EstudioRegistrosRecientesViewInput {
  limite?: number;
}

export interface EstudioRegistroRecienteDto {
  id: string;
  nombre: string;
  plan: string;
  email: string;
  creadoEn: string;
}

@Injectable()
export class EstudioRegistrosRecientesView {
  constructor(private readonly em: EntityManager) {}

  async execute(input: EstudioRegistrosRecientesViewInput = {}): Promise<EstudioRegistroRecienteDto[]> {
    const limite = input.limite ?? 5;
    const conn = this.em.getConnection();

    const rows: any[] = await conn.execute(
      `SELECT
         e.id,
         e.nombre,
         p.nombre as plan,
         e.created_at,
         (
           SELECT u.email FROM usuario_estudio ue2
           JOIN usuario u ON u.id = ue2.usuario_id
           WHERE ue2.estudio_id = e.id
           ORDER BY ue2.created_at ASC
           LIMIT 1
         ) as email
       FROM estudio e
       JOIN plan p ON e.plan_id = p.id
       ORDER BY e.created_at DESC
       LIMIT ?`,
      [limite],
    );

    return rows.map((r) => ({
      id: r.id as string,
      nombre: r.nombre as string,
      plan: r.plan as string,
      email: (r.email as string) ?? '',
      creadoEn: new Date(r.created_at).toISOString().split('T')[0],
    }));
  }
}
