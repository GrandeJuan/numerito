import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import { Cliente } from '../entities/cliente.entity';
import { Cuit } from '../value-objects/cuit.vo';

export interface ClienteRepository {
  findById(principal: EstudioPrincipal, id: string): Promise<Cliente | null>;
  findAll(principal: EstudioPrincipal): Promise<Cliente[]>;
  save(principal: EstudioPrincipal, entity: Cliente): Promise<void>;
  delete(principal: EstudioPrincipal, entity: Cliente): Promise<void>;
  findByCuit(principal: EstudioPrincipal, cuit: Cuit): Promise<Cliente | null>;
  findByResponsableId(principal: EstudioPrincipal, responsableId: string): Promise<Cliente[]>;
}

export const CLIENTE_REPOSITORY = Symbol('ClienteRepository');
