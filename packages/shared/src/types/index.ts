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

/**
 * Frontend display types. Estos describen la forma que las pages del frontend
 * consumen desde la API. El backend produce estas DTOs via mappers.
 *
 * Campos optional = pueden venir null desde el backend o ser omitidos según el
 * contexto. No cubren el 100% del aggregate; solo lo que la UI lee.
 */

export interface Cliente {
  id: string;
  razonSocial: string;
  cuit: string;
  tipo: string;
  tipoCliente?: string;
  condicionIVA?: string;
  condicionIva: string;
  provincia?: string;
  email?: string;
  telefono?: string;
  estado?: 'ACTIVO' | 'INACTIVO' | string;
  facturacion?: number;
  saldo?: number;
  responsable?: string | null;
  vencimientosPendientes?: number;
  vencimientosVencidos?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Obligacion {
  id: string;
  titulo?: string;
  descripcion?: string;
  tipo: string;
  periodo: string;
  fecha: string;
  fechaVencimiento?: string;
  estado: 'PENDIENTE' | 'PRESENTADO' | 'VENCIDO';
  cliente: string;
  monto?: number;
  responsable?: string | null;
}

export interface Factura {
  id: string;
  numero: string;
  tipo: string;
  fecha: string;
  fechaEmision?: string;
  fechaVencimiento?: string;
  cliente: string;
  total: number;
  monto?: number;
  saldo?: number;
  estado: 'PAGADA' | 'PENDIENTE' | 'VENCIDA' | 'PARCIAL' | string;
}

export interface Tarea {
  id: string;
  titulo: string;
  descripcion?: string;
  estado: 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADA' | string;
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE' | string;
  vencimiento?: string;
  fecha?: string;
  asignadoA?: string | null;
  responsable?: string | null;
  cliente?: string | null;
  horas?: number;
  horasEstimadas?: number;
  horasReales?: number;
}
