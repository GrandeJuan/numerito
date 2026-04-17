import type { UsuariosAdminListView } from '../../../iam/application/views/usuarios-admin-list.view';

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
  constructor(private readonly usuariosAdminList: UsuariosAdminListView) {}

  async execute(filters: AdminUsuarioFilters): Promise<AdminUsuariosPaginados> {
    return this.usuariosAdminList.execute(filters);
  }

  async getStats(): Promise<AdminUsuariosStats> {
    return this.usuariosAdminList.getStats();
  }
}
