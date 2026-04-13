/**
 * Repository for fiscal credentials.
 * Stored encrypted in DB, actual secrets in AWS Secrets Manager.
 */

export interface CredencialFiscalData {
  id: string;
  clienteId: string;
  estudioId: string;
  organismoId: string;
  cuit: string;
  secretArn: string;
  ultimaSincronizacion?: Date;
  estado: string;
}

export interface CredencialFiscalRepository {
  findById(id: string): Promise<CredencialFiscalData | null>;
  findAll(): Promise<CredencialFiscalData[]>;
  findByClienteId(clienteId: string): Promise<CredencialFiscalData[]>;
  findByOrganismo(organismo: string): Promise<CredencialFiscalData[]>;
  findAllActivas(): Promise<CredencialFiscalData[]>;
  save(credencial: CredencialFiscalData): Promise<void>;
  updateEstado(id: string, estado: string, ultimaSincronizacion?: Date): Promise<void>;
  delete(credencial: CredencialFiscalData): Promise<void>;
}

export const CREDENCIAL_FISCAL_REPOSITORY = Symbol('CredencialFiscalRepository');
