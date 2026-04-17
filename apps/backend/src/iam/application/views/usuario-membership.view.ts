import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';

export interface UsuarioMembershipViewInput {
  usuarioId: string;
  estudioId: string;
}

export interface UsuarioMembershipDto {
  isActive: boolean;
  rol: string;
  permisos: string[];
}

@Injectable()
export class UsuarioMembershipView {
  constructor(private readonly em: EntityManager) {}

  async execute(input: UsuarioMembershipViewInput): Promise<UsuarioMembershipDto | null> {
    const conn = this.em.getConnection();

    const [membership] = await conn.execute(
      `SELECT ue.is_active, r.codigo as rol
       FROM usuario_estudio ue
       JOIN rol r ON ue.rol_id = r.id
       WHERE ue.usuario_id = ? AND ue.estudio_id = ?
       LIMIT 1`,
      [input.usuarioId, input.estudioId],
    );

    if (!membership) {
      return null;
    }

    const permisosRaw = await conn.execute(
      `SELECT p.codigo
       FROM rol_permiso rp
       JOIN rol r ON rp.rol_id = r.id
       JOIN permiso p ON rp.permiso_id = p.id
       WHERE r.codigo = ?`,
      [membership.rol],
    );

    return {
      isActive: membership.is_active,
      rol: membership.rol as string,
      permisos: permisosRaw.map((r: any) => r.codigo as string),
    };
  }
}
