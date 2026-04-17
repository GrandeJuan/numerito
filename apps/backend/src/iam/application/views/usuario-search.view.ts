import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { UsuarioEntity } from '../../infrastructure/persistence/usuario.schema';

export interface UsuarioSearchViewInput {
  query: string;
  limit?: number;
}

export interface UsuarioSearchResultDto {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;
  isActive: boolean;
}

const DEFAULT_LIMIT = 5;

@Injectable()
export class UsuarioSearchView {
  constructor(private readonly em: EntityManager) {}

  async execute(input: UsuarioSearchViewInput): Promise<UsuarioSearchResultDto[]> {
    const like = `%${input.query.toLowerCase()}%`;

    const items = await this.em.find(
      UsuarioEntity,
      {
        $or: [
          { email: { $ilike: like } },
          { nombre: { $ilike: like } },
          { apellido: { $ilike: like } },
        ],
      } as any,
      {
        populate: ['rol'],
        orderBy: { nombre: 'ASC' },
        limit: input.limit ?? DEFAULT_LIMIT,
      },
    );

    return items.map((u) => ({
      id: u.id,
      email: u.email,
      nombre: u.nombre,
      apellido: u.apellido,
      rol: u.rol?.codigo ?? 'UNKNOWN',
      isActive: u.isActive,
    }));
  }
}
