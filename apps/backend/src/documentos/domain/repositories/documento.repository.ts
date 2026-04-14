import { BaseRepository } from '../../../shared/domain';
import { Documento } from '../entities/documento.entity';

export interface DocumentoRepository extends BaseRepository<Documento> {
  findByClienteId(clienteId: string): Promise<Documento[]>;
}

export const DOCUMENTO_REPOSITORY = Symbol('DocumentoRepository');
