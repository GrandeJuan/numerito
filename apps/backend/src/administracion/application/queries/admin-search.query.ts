import { EntityManager } from '@mikro-orm/core';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';
import { UsuarioEntity } from '../../../iam/infrastructure/persistence/usuario.schema';

export interface AdminSearchResultEstudio {
  id: string;
  nombre: string;
  cuit: string;
  plan: string;
  isActive: boolean;
}

export interface AdminSearchResultUsuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;
  isActive: boolean;
}

export interface AdminSearchResult {
  estudios: AdminSearchResultEstudio[];
  usuarios: AdminSearchResultUsuario[];
}

const MAX_RESULTS_PER_TYPE = 5;

export class AdminSearchHandler {
  constructor(private readonly em: EntityManager) {}

  async execute(query: string): Promise<AdminSearchResult> {
    const trimmed = query.trim();
    if (!trimmed) {
      return { estudios: [], usuarios: [] };
    }

    const like = `%${trimmed.toLowerCase()}%`;

    const [estudios, usuarios] = await Promise.all([
      this.searchEstudios(like),
      this.searchUsuarios(like),
    ]);

    return { estudios, usuarios };
  }

  private async searchEstudios(like: string): Promise<AdminSearchResultEstudio[]> {
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
        limit: MAX_RESULTS_PER_TYPE,
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

  private async searchUsuarios(like: string): Promise<AdminSearchResultUsuario[]> {
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
        limit: MAX_RESULTS_PER_TYPE,
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
