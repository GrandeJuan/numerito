export interface AdminPlanData {
  id?: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  maxClientes: number;
  maxUsuarios: number;
  precio: number;
  isPublico: boolean;
  isActivo: boolean;
  condiciones?: Record<string, unknown>;
}

export interface AdminPlanRepository {
  findAll(): Promise<AdminPlanData[]>;
  findById(id: number): Promise<AdminPlanData | null>;
  findByCodigo(codigo: string): Promise<AdminPlanData | null>;
  save(data: AdminPlanData): Promise<AdminPlanData>;
}

export const ADMIN_PLAN_REPOSITORY = Symbol('AdminPlanRepository');
