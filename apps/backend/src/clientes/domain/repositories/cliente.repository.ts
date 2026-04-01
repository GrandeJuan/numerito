import { BaseRepository } from '../../../shared/domain';
import { Cliente } from '../entities/cliente.entity';
import { Cuit } from '../value-objects/cuit.vo';

export interface ClienteRepository extends BaseRepository<Cliente> {
  findByCuit(cuit: Cuit, tenantId: string): Promise<Cliente | null>;
  findByTenantId(tenantId: string): Promise<Cliente[]>;
  findByResponsableId(responsableId: string, tenantId: string): Promise<Cliente[]>;
}

export const CLIENTE_REPOSITORY = Symbol('ClienteRepository');
