import { Injectable, Inject } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type {
  CredencialFiscalRepository,
  CredencialFiscalData,
} from '../../domain/repositories/credencial-fiscal.repository';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import { TenantAwareRepository } from '../../../shared/domain';
import {
  RequestContextService,
  REQUEST_CONTEXT,
} from '../../../shared/infrastructure/services/request-context.service';
import { CredencialFiscalEntity } from './credencial-fiscal.schema';
import { ClienteEntity } from '../../../clientes/infrastructure/persistence/cliente.schema';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';
import { OrganismoFiscalEntity } from '../../../shared/infrastructure/persistence/organismo-fiscal.schema';
import { CredencialFiscalMapper } from './credencial-fiscal.mapper';

@Injectable()
export class MikroOrmCredencialFiscalRepository
  extends TenantAwareRepository<CredencialFiscalData>
  implements CredencialFiscalRepository
{
  private readonly mapper = new CredencialFiscalMapper();

  constructor(
    @Inject(REQUEST_CONTEXT) context: RequestContextService,
    private readonly em: EntityManager,
  ) {
    super(context);
  }

  async findById(principal: EstudioPrincipal, id: string): Promise<CredencialFiscalData | null> {
    const entity = await this.em.findOne(
      CredencialFiscalEntity,
      {
        id,
        estudio: { id: principal.estudioId },
      },
      {
        populate: ['cliente', 'estudio', 'organismo'],
      },
    );
    if (!entity) return null;
    return this.mapper.toDomain(this.mapper.fromSchema(entity));
  }

  async findAll(principal: EstudioPrincipal): Promise<CredencialFiscalData[]> {
    const entities = await this.em.find(
      CredencialFiscalEntity,
      {
        estudio: { id: principal.estudioId },
      },
      {
        populate: ['cliente', 'estudio', 'organismo'],
      },
    );
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async findByClienteId(principal: EstudioPrincipal, clienteId: string): Promise<CredencialFiscalData[]> {
    const entities = await this.em.find(
      CredencialFiscalEntity,
      {
        cliente: { id: clienteId },
        estudio: { id: principal.estudioId },
      },
      {
        populate: ['cliente', 'estudio', 'organismo'],
      },
    );
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async findByOrganismo(principal: EstudioPrincipal, organismo: string): Promise<CredencialFiscalData[]> {
    const entities = await this.em.find(
      CredencialFiscalEntity,
      {
        organismo: { codigo: organismo },
        estudio: { id: principal.estudioId },
      },
      {
        populate: ['cliente', 'estudio', 'organismo'],
      },
    );
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async findAllActivas(principal: EstudioPrincipal): Promise<CredencialFiscalData[]> {
    const entities = await this.em.find(
      CredencialFiscalEntity,
      {
        estado: 'ACTIVA',
        estudio: { id: principal.estudioId },
      },
      {
        populate: ['cliente', 'estudio', 'organismo'],
      },
    );
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async save(principal: EstudioPrincipal, credencial: CredencialFiscalData): Promise<void> {
    const cliente = this.em.getReference(ClienteEntity, credencial.clienteId);
    const estudio = this.em.getReference(EstudioEntity, credencial.estudioId);
    const organismo = await this.em.findOneOrFail(OrganismoFiscalEntity, {
      id: Number(credencial.organismoId),
    });

    const existing = await this.em.findOne(CredencialFiscalEntity, { id: credencial.id, estudio: { id: principal.estudioId } });
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

  async updateEstado(principal: EstudioPrincipal, id: string, estado: string, ultimaSincronizacion?: Date): Promise<void> {
    const entity = await this.em.findOneOrFail(CredencialFiscalEntity, {
      id,
      estudio: { id: principal.estudioId },
    });
    entity.estado = estado;
    if (ultimaSincronizacion) {
      entity.ultimaSincronizacion = ultimaSincronizacion;
    }
    await this.em.flush();
  }

  async delete(principal: EstudioPrincipal, credencial: CredencialFiscalData): Promise<void> {
    const entity = await this.em.findOne(CredencialFiscalEntity, { id: credencial.id, estudio: { id: principal.estudioId } });
    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }

}
