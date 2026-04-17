import type { EstudiosAdminListView } from '../../../estudio/application/views/estudios-admin-list.view';

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
  constructor(private readonly estudiosAdminList: EstudiosAdminListView) {}

  async list(filters: AdminEstudioFilters): Promise<AdminEstudiosPaginados> {
    return this.estudiosAdminList.execute(filters);
  }
}
