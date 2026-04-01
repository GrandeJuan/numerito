/**
 * Repository for fiscal credentials.
 * Stored encrypted in DB, actual secrets in AWS Secrets Manager.
 */

export interface CredencialFiscalData {
  id: string;
  clienteId: string;
  tenantId: string;
  organismo: 'ARCA' | 'ARBA' | 'AGIP';
  cuit: string;
  secretArn: string; // AWS Secrets Manager ARN
  ultimaSincronizacion?: Date;
  estado: 'ACTIVA' | 'ERROR' | 'EXPIRADA';
}

export interface CredencialFiscalRepository {
  findByClienteId(clienteId: string, tenantId: string): Promise<CredencialFiscalData[]>;
  findByOrganismo(organismo: string, tenantId: string): Promise<CredencialFiscalData[]>;
  findAllActivas(): Promise<CredencialFiscalData[]>;
  save(credencial: CredencialFiscalData): Promise<void>;
  updateEstado(id: string, estado: string, ultimaSincronizacion?: Date): Promise<void>;
}

export const CREDENCIAL_FISCAL_REPOSITORY = Symbol('CredencialFiscalRepository');
