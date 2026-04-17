import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';

export interface EstudioAdminKpisDto {
  estudiosActivos: number;
  subscripcionesActivas: number;
  subscripcionesPorVencer: number;
}

@Injectable()
export class EstudioAdminKpisView {
  constructor(private readonly em: EntityManager) {}

  async execute(): Promise<EstudioAdminKpisDto> {
    const conn = this.em.getConnection();

    const [[{ count: estudiosActivos }], [{ count: subscripcionesActivas }], [{ count: subscripcionesPorVencer }]] =
      await Promise.all([
        conn.execute(`SELECT COUNT(*)::int as count FROM estudio WHERE is_active = true`),
        conn.execute(
          `SELECT COUNT(*)::int as count FROM subscripcion s
           JOIN estado_subscripcion es ON s.estado_subscripcion_id = es.id
           WHERE es.codigo = 'ACTIVA'`,
        ),
        conn.execute(
          `SELECT COUNT(*)::int as count FROM subscripcion
           WHERE fecha_fin >= NOW() AND fecha_fin <= NOW() + INTERVAL '30 days'`,
        ),
      ]);

    return {
      estudiosActivos: Number(estudiosActivos),
      subscripcionesActivas: Number(subscripcionesActivas),
      subscripcionesPorVencer: Number(subscripcionesPorVencer),
    };
  }
}
