import { EntityManager, FilterQuery } from '@mikro-orm/core';
import { UsuarioEntity } from '../../../iam/infrastructure/persistence/usuario.schema';

export interface AdminUsuarioFilters {
  search?: string;
  rol?: string;
  isActive?: boolean;
  estudioId?: string;
  page?: number;
  limit?: number;
}

export interface AdminUsuarioDto {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;
  provider: string | null;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUsuariosPaginados {
  items: AdminUsuarioDto[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminUsuariosStats {
  total: number;
  activos: number;
  verificados: number;
  sinVerificar: number;
}

export class ObtenerAdminUsuariosHandler {
  constructor(private readonly em: EntityManager) {}

  async execute(filters: AdminUsuarioFilters): Promise<AdminUsuariosPaginados> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    const where: FilterQuery<UsuarioEntity> = {};

    if (filters.search) {
      const like = `%${filters.search.toLowerCase()}%`;
      (where as any).$or = [
        { nombre: { $ilike: like } },
        { apellido: { $ilike: like } },
        { email: { $ilike: like } },
      ];
    }

    if (filters.rol) {
      (where as any).rol = { codigo: filters.rol };
    }

    if (filters.isActive !== undefined) {
      (where as any).isActive = filters.isActive;
    }

    const [items, total] = await this.em.findAndCount(UsuarioEntity, where, {
      populate: ['rol'],
      orderBy: { createdAt: 'DESC' },
      limit,
      offset,
    });

    return {
      items: items.map((u) => ({
        id: u.id,
        email: u.email,
        nombre: u.nombre,
        apellido: u.apellido,
        rol: u.rol?.codigo ?? 'UNKNOWN',
        provider: u.provider,
        emailVerified: u.emailVerified,
        isActive: u.isActive,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      })),
      total,
      page,
      limit,
    };
  }

  async getStats(): Promise<AdminUsuariosStats> {
    const [total, activos, verificados] = await Promise.all([
      this.em.count(UsuarioEntity, {}),
      this.em.count(UsuarioEntity, { isActive: true }),
      this.em.count(UsuarioEntity, { emailVerified: true }),
    ]);

    return {
      total,
      activos,
      verificados,
      sinVerificar: total - verificados,
    };
  }
}
