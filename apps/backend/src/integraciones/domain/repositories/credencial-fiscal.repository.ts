/**
 * Repository for fiscal credentials.
 * Stored encrypted in DB, actual secrets in AWS Secrets Manager.
 */

import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';

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
  findById(principal: EstudioPrincipal, id: string): Promise<CredencialFiscalData | null>;
  findAll(principal: EstudioPrincipal): Promise<CredencialFiscalData[]>;
  findByClienteId(principal: EstudioPrincipal, clienteId: string): Promise<CredencialFiscalData[]>;
  findByOrganismo(principal: EstudioPrincipal, organismo: string): Promise<CredencialFiscalData[]>;
  findAllActivas(principal: EstudioPrincipal): Promise<CredencialFiscalData[]>;
  save(principal: EstudioPrincipal, credencial: CredencialFiscalData): Promise<void>;
  updateEstado(principal: EstudioPrincipal, id: string, estado: string, ultimaSincronizacion?: Date): Promise<void>;
  delete(principal: EstudioPrincipal, credencial: CredencialFiscalData): Promise<void>;
}

export const CREDENCIAL_FISCAL_REPOSITORY = Symbol('CredencialFiscalRepository');
