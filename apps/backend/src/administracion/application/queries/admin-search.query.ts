import type { EstudioSearchView } from '../../../estudio/application/views/estudio-search.view';
import type { UsuarioSearchView } from '../../../iam/application/views/usuario-search.view';

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
  constructor(
    private readonly estudioSearch: EstudioSearchView,
    private readonly usuarioSearch: UsuarioSearchView,
  ) {}

  async execute(query: string): Promise<AdminSearchResult> {
    const trimmed = query.trim();
    if (!trimmed) {
      return { estudios: [], usuarios: [] };
    }

    const [estudios, usuarios] = await Promise.all([
      this.estudioSearch.execute({ query: trimmed, limit: MAX_RESULTS_PER_TYPE }),
      this.usuarioSearch.execute({ query: trimmed, limit: MAX_RESULTS_PER_TYPE }),
    ]);

    return { estudios, usuarios };
  }
}
