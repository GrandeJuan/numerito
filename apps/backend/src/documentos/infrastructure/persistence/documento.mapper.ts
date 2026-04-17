import { z } from 'zod';
import { TIPO_DOCUMENTO, type TipoDocumento } from '@numerito/shared';
import type { Mapper } from '../../../shared/domain';
import { Documento } from '../../domain/entities/documento.entity';
import type { DocumentoEntity } from './documento.schema';

const tipoDocumentoValues = Object.values(TIPO_DOCUMENTO) as [TipoDocumento, ...TipoDocumento[]];

export const documentoPersistenceSchema = z.object({
  id: z.string().uuid(),
  clienteId: z.string().min(1),
  estudioId: z.string().min(1),
  tipo: z.enum(tipoDocumentoValues),
  nombre: z.string(),
  s3Key: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number(),
  version: z.number(),
});

export type DocumentoPersistence = z.infer<typeof documentoPersistenceSchema>;

export class DocumentoMapper implements Mapper<Documento, DocumentoPersistence> {
  toDomain(persistence: DocumentoPersistence): Documento {
    const data = documentoPersistenceSchema.parse(persistence);
    return Documento.reconstitute(
      {
        clienteId: data.clienteId,
        estudioId: data.estudioId,
        tipo: data.tipo,
        nombre: data.nombre,
        s3Key: data.s3Key,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        version: data.version,
      },
      data.id,
    );
  }

  toPersistence(domain: Documento): DocumentoPersistence {
    return {
      id: domain.id,
      clienteId: domain.clienteId,
      estudioId: domain.estudioId,
      tipo: domain.tipo,
      nombre: domain.nombre,
      s3Key: domain.s3Key,
      mimeType: domain.mimeType,
      sizeBytes: domain.sizeBytes,
      version: domain.version,
    };
  }

  fromSchema(entity: DocumentoEntity): DocumentoPersistence {
    return {
      id: entity.id,
      clienteId: entity.cliente.id,
      estudioId: entity.estudio.id,
      tipo: entity.tipoDocumento.codigo as TipoDocumento,
      nombre: entity.nombre,
      s3Key: entity.s3Key,
      mimeType: entity.mimeType,
      sizeBytes: entity.sizeBytes,
      version: entity.version,
    };
  }
}
