import { BaseRepository } from '../../../shared/domain';
import { Documento } from '../entities/documento.entity';

export interface DocumentoRepository extends BaseRepository<Documento> {
  findByClienteId(clienteId: string, estudioId: string): Promise<Documento[]>;
  findByEstudioId(estudioId: string): Promise<Documento[]>;
}

export const DOCUMENTO_REPOSITORY = Symbol('DocumentoRepository');
