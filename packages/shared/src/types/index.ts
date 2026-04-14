export type { CondicionIVA } from '../constants/condicion-iva';
export type { Rol } from '../constants/roles';
export type { TipoObligacion } from '../constants/tipo-obligacion';
export type { Provincia } from '../constants/provincias';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export type { DashboardStats } from './dashboard.types';
