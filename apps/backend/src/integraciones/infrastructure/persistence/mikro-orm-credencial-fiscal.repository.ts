import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { CredencialFiscalRepository, CredencialFiscalData } from '../../domain/repositories/credencial-fiscal.repository';
import { CredencialFiscalEntity } from './credencial-fiscal.schema';
import { ClienteEntity } from '../../../clientes/infrastructure/persistence/cliente.schema';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';
import { OrganismoFiscalEntity } from '../../../shared/infrastructure/persistence/organismo-fiscal.schema';

@Injectable()
export class MikroOrmCredencialFiscalRepository implements CredencialFiscalRepository {
  constructor(private readonly em: EntityManager) {}

  async findByClienteId(clienteId: string, estudioId: string): Promise<CredencialFiscalData[]> {
    const entities = await this.em.find(CredencialFiscalEntity, {
      cliente: { id: clienteId },
      estudio: { id: estudioId },
    }, {
      populate: ['cliente', 'estudio', 'organismo'],
    });
    return entities.map(e => this.toData(e));
  }

  async findByOrganismo(organismo: string, estudioId: string): Promise<CredencialFiscalData[]> {
    const entities = await this.em.find(CredencialFiscalEntity, {
      organismo: { codigo: organismo },
      estudio: { id: estudioId },
    }, {
      populate: ['cliente', 'estudio', 'organismo'],
    });
    return entities.map(e => this.toData(e));
  }

  async findAllActivas(): Promise<CredencialFiscalData[]> {
    const entities = await this.em.find(CredencialFiscalEntity, { estado: 'ACTIVA' }, {
      populate: ['cliente', 'estudio', 'organismo'],
    });
    return entities.map(e => this.toData(e));
  }

  async save(credencial: CredencialFiscalData): Promise<void> {
    const cliente = this.em.getReference(ClienteEntity, credencial.clienteId);
    const estudio = this.em.getReference(EstudioEntity, credencial.estudioId);
    const organismo = await this.em.findOneOrFail(OrganismoFiscalEntity, { id: Number(credencial.organismoId) });

    const existing = await this.em.findOne(CredencialFiscalEntity, { id: credencial.id });
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
    const entity = await this.em.findOneOrFail(CredencialFiscalEntity, { id });
    entity.estado = estado;
    if (ultimaSincronizacion) {
      entity.ultimaSincronizacion = ultimaSincronizacion;
    }
    await this.em.flush();
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
