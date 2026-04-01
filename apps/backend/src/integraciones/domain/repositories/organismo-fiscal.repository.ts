/**
 * Organismos fiscales come from DB — new ones can be added
 * without code changes (e.g., ATP Tucumán, RENTAS Córdoba, etc.)
 */

export interface OrganismoFiscalData {
  id: string;
  codigo: string;
  nombre: string;
  jurisdiccion: string;
  urlPortal?: string;
  requiereScraping: boolean;
  tieneWebService: boolean;
  activo: boolean;
}

export interface OrganismoFiscalRepository {
  findByCodigo(codigo: string): Promise<OrganismoFiscalData | null>;
  findAll(): Promise<OrganismoFiscalData[]>;
  findActivos(): Promise<OrganismoFiscalData[]>;
  save(organismo: OrganismoFiscalData): Promise<void>;
}

export const ORGANISMO_FISCAL_REPOSITORY = Symbol('OrganismoFiscalRepository');
