import { Injectable, Inject } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type {
  CredencialFiscalRepository,
  CredencialFiscalData,
} from '../../domain/repositories/credencial-fiscal.repository';
import { TenantAwareRepository } from '../../../shared/domain';
import {
  RequestContextService,
  REQUEST_CONTEXT,
} from '../../../shared/infrastructure/services/request-context.service';
import { CredencialFiscalEntity } from './credencial-fiscal.schema';
import { ClienteEntity } from '../../../clientes/infrastructure/persistence/cliente.schema';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';
import { OrganismoFiscalEntity } from '../../../shared/infrastructure/persistence/organismo-fiscal.schema';

@Injectable()
export class MikroOrmCredencialFiscalRepository
  extends TenantAwareRepository<CredencialFiscalData>
  implements CredencialFiscalRepository
{
  constructor(
    @Inject(REQUEST_CONTEXT) context: RequestContextService,
    private readonly em: EntityManager,
  ) {
    super(context);
  }

  async findById(id: string): Promise<CredencialFiscalData | null> {
    const tenantId = this.getTenantId();
    const entity = await this.em.findOne(
      CredencialFiscalEntity,
      {
        id,
        estudio: { id: tenantId },
      },
      {
        populate: ['cliente', 'estudio', 'organismo'],
      },
    );
    if (!entity) return null;
    return this.toData(entity);
  }

  async findAll(): Promise<CredencialFiscalData[]> {
    const tenantId = this.getTenantId();
    const entities = await this.em.find(
      CredencialFiscalEntity,
      {
        estudio: { id: tenantId },
      },
      {
        populate: ['cliente', 'estudio', 'organismo'],
      },
    );
    return entities.map((e) => this.toData(e));
  }

  async findByClienteId(clienteId: string): Promise<CredencialFiscalData[]> {
    const tenantId = this.getTenantId();
    const entities = await this.em.find(
      CredencialFiscalEntity,
      {
        cliente: { id: clienteId },
        estudio: { id: tenantId },
      },
      {
        populate: ['cliente', 'estudio', 'organismo'],
      },
    );
    return entities.map((e) => this.toData(e));
  }

  async findByOrganismo(organismo: string): Promise<CredencialFiscalData[]> {
    const tenantId = this.getTenantId();
    const entities = await this.em.find(
      CredencialFiscalEntity,
      {
        organismo: { codigo: organismo },
        estudio: { id: tenantId },
      },
      {
        populate: ['cliente', 'estudio', 'organismo'],
      },
    );
    return entities.map((e) => this.toData(e));
  }

  async findAllActivas(): Promise<CredencialFiscalData[]> {
    const tenantId = this.getTenantId();
    const entities = await this.em.find(
      CredencialFiscalEntity,
      {
        estado: 'ACTIVA',
        estudio: { id: tenantId },
      },
      {
        populate: ['cliente', 'estudio', 'organismo'],
      },
    );
    return entities.map((e) => this.toData(e));
  }

  async save(credencial: CredencialFiscalData): Promise<void> {
    const cliente = this.em.getReference(ClienteEntity, credencial.clienteId);
    const estudio = this.em.getReference(EstudioEntity, credencial.estudioId);
    const organismo = await this.em.findOneOrFail(OrganismoFiscalEntity, {
      id: Number(credencial.organismoId),
    });

    const tenantId = this.getTenantId();
    const existing = await this.em.findOne(CredencialFiscalEntity, { id: credencial.id, estudio: { id: tenantId } });
    if (existing) {
      existing.cliente = cliente;
      existing.estudio = estudio;
      existing.organismo = organismo;
      existing.cuit = credencial.cuit;
      existing.secretArn = credencial.secretArn;
      existing.ultimaSincronizacion = credencial.ultimaSincronizacion;
      existing.estado = credencial.estado;
    } else {
      this.em.create(CredencialFiscalEntity, {
        id: credencial.id,
        cliente,
        estudio,
        organismo,
        cuit: credencial.cuit,
        secretArn: credencial.secretArn,
        ultimaSincronizacion: credencial.ultimaSincronizacion,
        estado: credencial.estado,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await this.em.flush();
  }

  async updateEstado(id: string, estado: string, ultimaSincronizacion?: Date): Promise<void> {
    const tenantId = this.getTenantId();
    const entity = await this.em.findOneOrFail(CredencialFiscalEntity, {
      id,
      estudio: { id: tenantId },
    });
    entity.estado = estado;
    if (ultimaSincronizacion) {
      entity.ultimaSincronizacion = ultimaSincronizacion;
    }
    await this.em.flush();
  }

  async delete(credencial: CredencialFiscalData): Promise<void> {
    const tenantId = this.getTenantId();
    const entity = await this.em.findOne(CredencialFiscalEntity, { id: credencial.id, estudio: { id: tenantId } });
    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }

  private toData(entity: CredencialFiscalEntity): CredencialFiscalData {
    return {
      id: entity.id,
      clienteId: entity.cliente.id,
      estudioId: entity.estudio.id,
      organismoId: String(entity.organismo.id),
      cuit: entity.cuit,
      secretArn: entity.secretArn,
      ultimaSincronizacion: entity.ultimaSincronizacion,
      estado: entity.estado,
    };
  }
}
