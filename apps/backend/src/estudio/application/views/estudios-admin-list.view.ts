import { Injectable } from '@nestjs/common';
import { EntityManager, FilterQuery } from '@mikro-orm/core';
import { EstudioEntity } from '../../infrastructure/persistence/estudio.schema';

export interface EstudiosAdminListViewInput {
  search?: string;
  plan?: string;
  isActive?: boolean;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface AdminEstudioItemDto {
  id: string;
  nombre: string;
  cuit: string;
  plan: string;
  planCodigo: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface EstudiosAdminListDto {
  items: AdminEstudioItemDto[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class EstudiosAdminListView {
  constructor(private readonly em: EntityManager) {}

  async execute(input: EstudiosAdminListViewInput): Promise<EstudiosAdminListDto> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 20;
    const offset = (page - 1) * limit;

    const where: FilterQuery<EstudioEntity> = {};

    if (input.search) {
      const like = `%${input.search.toLowerCase()}%`;
      (where as any).$or = [
        { nombre: { $ilike: like } },
        { cuit: { $ilike: like } },
      ];
    }

    if (input.plan) {
      (where as any).plan = { codigo: input.plan };
    }

    if (input.isActive !== undefined) {
      (where as any).isActive = input.isActive;
    }

    if (input.from) {
      (where as any).createdAt = { ...((where as any).createdAt || {}), $gte: new Date(input.from) };
    }

    if (input.to) {
      (where as any).createdAt = { ...((where as any).createdAt || {}), $lte: new Date(input.to) };
    }

    const [items, total] = await this.em.findAndCount(EstudioEntity, where, {
      populate: ['plan'],
      orderBy: { createdAt: 'DESC' },
      limit,
      offset,
    });

    return {
      items: items.map((e) => ({
        id: e.id,
        nombre: e.nombre,
        cuit: e.cuit,
        plan: e.plan?.nombre ?? 'Sin plan',
        planCodigo: e.plan?.codigo ?? null,
        isActive: e.isActive,
        createdAt: e.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
    };
  }
}
