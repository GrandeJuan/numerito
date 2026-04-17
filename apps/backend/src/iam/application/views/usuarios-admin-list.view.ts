import { Injectable } from '@nestjs/common';
import { EntityManager, FilterQuery } from '@mikro-orm/core';
import { UsuarioEntity } from '../../infrastructure/persistence/usuario.schema';

export interface UsuariosAdminListViewInput {
  search?: string;
  rol?: string;
  isActive?: boolean;
  estudioId?: string;
  page?: number;
  limit?: number;
}

export interface AdminUsuarioItemDto {
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

export interface UsuariosAdminListDto {
  items: AdminUsuarioItemDto[];
  total: number;
  page: number;
  limit: number;
}

export interface UsuariosAdminStatsDto {
  total: number;
  activos: number;
  verificados: number;
  sinVerificar: number;
}

@Injectable()
export class UsuariosAdminListView {
  constructor(private readonly em: EntityManager) {}

  async execute(input: UsuariosAdminListViewInput): Promise<UsuariosAdminListDto> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 20;
    const offset = (page - 1) * limit;

    const where: FilterQuery<UsuarioEntity> = {};

    if (input.search) {
      const like = `%${input.search.toLowerCase()}%`;
      (where as any).$or = [
        { nombre: { $ilike: like } },
        { apellido: { $ilike: like } },
        { email: { $ilike: like } },
      ];
    }

    if (input.rol) {
      (where as any).rol = { codigo: input.rol };
    }

    if (input.isActive !== undefined) {
      (where as any).isActive = input.isActive;
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

  async getStats(): Promise<UsuariosAdminStatsDto> {
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
