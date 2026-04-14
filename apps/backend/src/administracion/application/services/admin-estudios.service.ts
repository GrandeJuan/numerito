import { EntityManager, FilterQuery } from '@mikro-orm/core';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';

export interface AdminEstudioFilters {
  search?: string;
  plan?: string;
  isActive?: boolean;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface AdminEstudioDto {
  id: string;
  nombre: string;
  cuit: string;
  plan: string;
  planCodigo: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface AdminEstudiosPaginados {
  items: AdminEstudioDto[];
  total: number;
  page: number;
  limit: number;
}

export class AdminEstudiosService {
  constructor(private readonly em: EntityManager) {}

  async list(filters: AdminEstudioFilters): Promise<AdminEstudiosPaginados> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    const where: FilterQuery<EstudioEntity> = {};

    if (filters.search) {
      const like = `%${filters.search.toLowerCase()}%`;
      (where as any).$or = [
        { nombre: { $ilike: like } },
        { cuit: { $ilike: like } },
      ];
    }

    if (filters.plan) {
      (where as any).plan = { codigo: filters.plan };
    }

    if (filters.isActive !== undefined) {
      (where as any).isActive = filters.isActive;
    }

    if (filters.from) {
      (where as any).createdAt = { ...((where as any).createdAt || {}), $gte: new Date(filters.from) };
    }

    if (filters.to) {
      (where as any).createdAt = { ...((where as any).createdAt || {}), $lte: new Date(filters.to) };
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
