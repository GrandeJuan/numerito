import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { EstudioEntity } from '../../infrastructure/persistence/estudio.schema';

export interface EstudioSearchViewInput {
  query: string;
  limit?: number;
}

export interface EstudioSearchResultDto {
  id: string;
  nombre: string;
  cuit: string;
  plan: string;
  isActive: boolean;
}

const DEFAULT_LIMIT = 5;

@Injectable()
export class EstudioSearchView {
  constructor(private readonly em: EntityManager) {}

  async execute(input: EstudioSearchViewInput): Promise<EstudioSearchResultDto[]> {
    const like = `%${input.query.toLowerCase()}%`;

    const items = await this.em.find(
      EstudioEntity,
      {
        $or: [
          { nombre: { $ilike: like } },
          { cuit: { $ilike: like } },
        ],
      } as any,
      {
        populate: ['plan'],
        orderBy: { nombre: 'ASC' },
        limit: input.limit ?? DEFAULT_LIMIT,
      },
    );

    return items.map((e) => ({
      id: e.id,
      nombre: e.nombre,
      cuit: e.cuit,
      plan: (e.plan as any)?.nombre ?? 'Sin plan',
      isActive: e.isActive,
    }));
  }
}
