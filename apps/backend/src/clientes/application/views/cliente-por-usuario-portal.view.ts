import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';

export interface ClientePorUsuarioPortalViewInput {
  usuarioId: string;
}

export interface ClientePorUsuarioPortalDto {
  clienteId: string;
  razonSocial: string;
}

@Injectable()
export class ClientePorUsuarioPortalView {
  constructor(private readonly em: EntityManager) {}

  async execute(input: ClientePorUsuarioPortalViewInput): Promise<ClientePorUsuarioPortalDto | null> {
    const conn = this.em.getConnection();

    const rows = await conn.execute(
      `SELECT c.id, c.razon_social
       FROM cliente c
       JOIN usuario_estudio ue ON ue.estudio_id = c.estudio_id
       JOIN rol r ON ue.rol_id = r.id
       WHERE ue.usuario_id = ? AND r.codigo = 'CLIENTE'
       LIMIT 1`,
      [input.usuarioId],
    );

    if (rows.length === 0) {
      return null;
    }

    return {
      clienteId: rows[0].id as string,
      razonSocial: rows[0].razon_social as string,
    };
  }
}
