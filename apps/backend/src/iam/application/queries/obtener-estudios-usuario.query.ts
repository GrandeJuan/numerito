import type { UsuarioEstudioRepository } from '../../domain/repositories/usuario-estudio.repository';
import type { EstudioLookupService } from '../services/estudio-lookup.service';

export interface ObtenerEstudiosUsuarioQuery {
  usuarioId: string;
}

export interface EstudioUsuarioResult {
  id: string;
  nombre: string;
  rol: string;
}

export class ObtenerEstudiosUsuarioHandler {
  constructor(
    private readonly usuarioEstudioRepo: UsuarioEstudioRepository,
    private readonly estudioLookup: EstudioLookupService,
  ) {}

  async execute(query: ObtenerEstudiosUsuarioQuery): Promise<EstudioUsuarioResult[]> {
    const memberships = await this.usuarioEstudioRepo.findByUsuarioId(query.usuarioId);
    const activeMemberships = memberships.filter((m) => m.isActive);

    const results: EstudioUsuarioResult[] = [];

    for (const membership of activeMemberships) {
      const estudio = await this.estudioLookup.findById(membership.estudioId);
      if (estudio) {
        results.push({
          id: estudio.id,
          nombre: estudio.nombre,
          rol: membership.rol,
        });
      }
    }

    return results;
  }
}
