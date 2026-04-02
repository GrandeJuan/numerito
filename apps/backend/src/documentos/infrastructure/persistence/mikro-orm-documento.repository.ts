import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { DocumentoRepository } from '../../domain/repositories/documento.repository';
import { Documento, type TipoDocumento } from '../../domain/entities/documento.entity';
import { DocumentoEntity } from './documento.schema';
import { TipoDocumentoEntity } from '../../../shared/infrastructure/persistence/tipo-documento.schema';
import { ClienteEntity } from '../../../clientes/infrastructure/persistence/cliente.schema';
import { EstudioEntity } from '../../../tenant/infrastructure/persistence/estudio.schema';

@Injectable()
export class MikroOrmDocumentoRepository implements DocumentoRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<Documento | null> {
    const entity = await this.em.findOne(DocumentoEntity, { id }, {
      populate: ['tipoDocumento', 'cliente', 'tenant'],
    });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findByClienteId(clienteId: string, tenantId: string): Promise<Documento[]> {
    const entities = await this.em.find(DocumentoEntity, {
      cliente: { id: clienteId },
      tenant: { id: tenantId },
    }, {
      populate: ['tipoDocumento', 'cliente', 'tenant'],
    });
    return entities.map(e => this.toDomain(e));
  }

  async findByTenantId(tenantId: string): Promise<Documento[]> {
    const entities = await this.em.find(DocumentoEntity, { tenant: { id: tenantId } }, {
      populate: ['tipoDocumento', 'cliente', 'tenant'],
    });
    return entities.map(e => this.toDomain(e));
  }

  async findAll(): Promise<Documento[]> {
    const entities = await this.em.findAll(DocumentoEntity, {
      populate: ['tipoDocumento', 'cliente', 'tenant'],
    });
    return entities.map(e => this.toDomain(e));
  }

  async save(documento: Documento): Promise<void> {
    const tipoDocumento = await this.em.findOneOrFail(TipoDocumentoEntity, { codigo: documento.tipo });
    const cliente = this.em.getReference(ClienteEntity, documento.clienteId);
    const tenant = this.em.getReference(EstudioEntity, documento.tenantId);

    const existing = await this.em.findOne(DocumentoEntity, { id: documento.id });
    if (existing) {
      existing.cliente = cliente;
      existing.tenant = tenant;
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
        tenant,
        tipoDocumento,
        nombre: documento.nombre,
        s3Key: documento.s3Key,
        mimeType: documento.mimeType,
        sizeBytes: documento.sizeBytes,
        version: documento.version,
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
    return Documento.create({
      clienteId: entity.cliente.id,
      tenantId: entity.tenant.id,
      tipo: entity.tipoDocumento.codigo as TipoDocumento,
      nombre: entity.nombre,
      s3Key: entity.s3Key,
      mimeType: entity.mimeType,
      sizeBytes: entity.sizeBytes,
    }, entity.id);
  }
}
