import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import { Documento } from '../entities/documento.entity';

export interface DocumentoRepository {
  findById(principal: EstudioPrincipal, id: string): Promise<Documento | null>;
  findAll(principal: EstudioPrincipal): Promise<Documento[]>;
  save(principal: EstudioPrincipal, entity: Documento): Promise<void>;
  delete(principal: EstudioPrincipal, entity: Documento): Promise<void>;
  findByClienteId(principal: EstudioPrincipal, clienteId: string): Promise<Documento[]>;
}

export const DOCUMENTO_REPOSITORY = Symbol('DocumentoRepository');
