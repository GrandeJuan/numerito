import { Injectable, Inject } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { DocumentoRepository } from '../../domain/repositories/documento.repository';
import { Documento, type TipoDocumento } from '../../domain/entities/documento.entity';
import { TenantAwareRepository } from '../../../shared/domain';
import {
  RequestContextService,
  REQUEST_CONTEXT,
} from '../../../shared/infrastructure/services/request-context.service';
import { DocumentoEntity } from './documento.schema';
import { TipoDocumentoEntity } from '../../../shared/infrastructure/persistence/tipo-documento.schema';
import { ClienteEntity } from '../../../clientes/infrastructure/persistence/cliente.schema';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';

@Injectable()
export class MikroOrmDocumentoRepository
  extends TenantAwareRepository<Documento>
  implements DocumentoRepository
{
  constructor(
    @Inject(REQUEST_CONTEXT) context: RequestContextService,
    private readonly em: EntityManager,
  ) {
    super(context);
  }

  async findById(id: string): Promise<Documento | null> {
    const tenantId = this.getTenantId();
    const entity = await this.em.findOne(
      DocumentoEntity,
      {
        id,
        estudio: { id: tenantId },
      },
      {
        populate: ['tipoDocumento', 'cliente', 'estudio'],
      },
    );
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findByClienteId(clienteId: string): Promise<Documento[]> {
    const tenantId = this.getTenantId();
    const entities = await this.em.find(
      DocumentoEntity,
      {
        cliente: { id: clienteId },
        estudio: { id: tenantId },
      },
      {
        populate: ['tipoDocumento', 'cliente', 'estudio'],
      },
    );
    return entities.map((e) => this.toDomain(e));
  }

  async findAll(): Promise<Documento[]> {
    const tenantId = this.getTenantId();
    const entities = await this.em.find(
      DocumentoEntity,
      {
        estudio: { id: tenantId },
      },
      {
        populate: ['tipoDocumento', 'cliente', 'estudio'],
      },
    );
    return entities.map((e) => this.toDomain(e));
  }

  async save(documento: Documento): Promise<void> {
    const tipoDocumento = await this.em.findOneOrFail(TipoDocumentoEntity, {
      codigo: documento.tipo,
    });
    const cliente = this.em.getReference(ClienteEntity, documento.clienteId);
    const estudio = this.em.getReference(EstudioEntity, documento.estudioId);

    const existing = await this.em.findOne(DocumentoEntity, { id: documento.id });
    if (existing) {
      existing.cliente = cliente;
      existing.estudio = estudio;
      existing.tipoDocumento = tipoDocumento;
      existing.nombre = documento.nombre;
      existing.s3Key = documento.s3Key;
      existing.mimeType = documento.mimeType;
      existing.sizeBytes = documento.sizeBytes;
      existing.version = documento.version;
    } else {
      this.em.create(DocumentoEntity, {
        id: documento.id,
        cliente,
        estudio,
        tipoDocumento,
        nombre: documento.nombre,
        s3Key: documento.s3Key,
        mimeType: documento.mimeType,
        sizeBytes: documento.sizeBytes,
        version: documento.version,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await this.em.flush();
  }

  async delete(documento: Documento): Promise<void> {
    const entity = await this.em.findOne(DocumentoEntity, { id: documento.id });
    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }

  private toDomain(entity: DocumentoEntity): Documento {
    return Documento.create(
      {
        clienteId: entity.cliente.id,
        estudioId: entity.estudio.id,
        tipo: entity.tipoDocumento.codigo as TipoDocumento,
        nombre: entity.nombre,
        s3Key: entity.s3Key,
        mimeType: entity.mimeType,
        sizeBytes: entity.sizeBytes,
      },
      entity.id,
    );
  }
}
