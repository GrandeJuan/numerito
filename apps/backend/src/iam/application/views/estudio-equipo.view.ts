import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { UsuarioEstudioEntity } from '../../infrastructure/persistence/usuario-estudio.schema';

export interface EstudioEquipoViewInput {
  estudioId: string;
}

export interface EquipoMiembroDto {
  usuarioId: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;
  verificado: boolean;
  creadoEl: string;
}

@Injectable()
export class EstudioEquipoView {
  constructor(private readonly em: EntityManager) {}

  async execute(input: EstudioEquipoViewInput): Promise<EquipoMiembroDto[]> {
    const items = await this.em.find(
      UsuarioEstudioEntity,
      { estudio: input.estudioId, isActive: true } as any,
      {
        populate: ['usuario', 'rol'],
        orderBy: { createdAt: 'ASC' },
      },
    );

    return items.map((ue) => ({
      usuarioId: ue.usuario.id,
      email: ue.usuario.email,
      nombre: ue.usuario.nombre,
      apellido: ue.usuario.apellido,
      rol: ue.rol?.codigo ?? 'UNKNOWN',
      verificado: ue.usuario.emailVerified,
      creadoEl: ue.createdAt.toISOString(),
    }));
  }
}
