import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { ClienteRepository } from '../../domain/repositories/cliente.repository';
import { Cliente, type TipoCliente, type Regimen } from '../../domain/entities/cliente.entity';
import { Cuit } from '../../domain/value-objects/cuit.vo';
import { RazonSocial } from '../../domain/value-objects/razon-social.vo';
import { ClienteEntity } from './cliente.schema';
import { CondicionIvaEntity } from '../../../shared/infrastructure/persistence/condicion-iva.schema';
import { TipoClienteEntity } from '../../../shared/infrastructure/persistence/tipo-cliente.schema';
import { RegimenEntity } from '../../../shared/infrastructure/persistence/regimen.schema';
import { EstudioEntity } from '../../../tenant/infrastructure/persistence/estudio.schema';
import { UsuarioEntity } from '../../../iam/infrastructure/persistence/usuario.schema';
import type { CondicionIVA } from '@numerito/shared';

@Injectable()
export class MikroOrmClienteRepository implements ClienteRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<Cliente | null> {
    const entity = await this.em.findOne(ClienteEntity, { id }, {
      populate: ['condicionIva', 'tipoCliente', 'regimen', 'tenant', 'responsable'],
    });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findByCuit(cuit: Cuit, tenantId: string): Promise<Cliente | null> {
    const entity = await this.em.findOne(ClienteEntity, {
      cuit: cuit.raw,
      tenant: { id: tenantId },
    }, {
      populate: ['condicionIva', 'tipoCliente', 'regimen', 'tenant', 'responsable'],
    });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findByTenantId(tenantId: string): Promise<Cliente[]> {
    const entities = await this.em.find(ClienteEntity, { tenant: { id: tenantId } }, {
      populate: ['condicionIva', 'tipoCliente', 'regimen', 'tenant', 'responsable'],
    });
    return entities.map(e => this.toDomain(e));
  }

  async findByResponsableId(responsableId: string, tenantId: string): Promise<Cliente[]> {
    const entities = await this.em.find(ClienteEntity, {
      responsable: { id: responsableId },
      tenant: { id: tenantId },
    }, {
      populate: ['condicionIva', 'tipoCliente', 'regimen', 'tenant', 'responsable'],
    });
    return entities.map(e => this.toDomain(e));
  }

  async findAll(): Promise<Cliente[]> {
    const entities = await this.em.findAll(ClienteEntity, {
      populate: ['condicionIva', 'tipoCliente', 'regimen', 'tenant', 'responsable'],
    });
    return entities.map(e => this.toDomain(e));
  }

  async save(cliente: Cliente): Promise<void> {
    const [condicionIva, tipoCliente, regimen] = await Promise.all([
      this.em.findOneOrFail(CondicionIvaEntity, { codigo: cliente.condicionIva }),
      this.em.findOneOrFail(TipoClienteEntity, { codigo: cliente.tipo }),
      this.em.findOneOrFail(RegimenEntity, { codigo: cliente.regimen }),
    ]);
    const tenant = this.em.getReference(EstudioEntity, cliente.tenantId);
    const responsable = cliente.responsableId
      ? this.em.getReference(UsuarioEntity, cliente.responsableId)
      : undefined;

    const existing = await this.em.findOne(ClienteEntity, { id: cliente.id });
    if (existing) {
      existing.cuit = cliente.cuit.raw;
      existing.razonSocial = cliente.razonSocial.value;
      existing.condicionIva = condicionIva;
      existing.tipoCliente = tipoCliente;
      existing.regimen = regimen;
      existing.tenant = tenant;
      existing.responsable = responsable;
      existing.isActive = cliente.isActive;
    } else {
      this.em.create(ClienteEntity, {
        id: cliente.id,
        cuit: cliente.cuit.raw,
        razonSocial: cliente.razonSocial.value,
        condicionIva,
        tipoCliente,
        regimen,
        tenant,
        responsable,
        isActive: cliente.isActive,
      });
    }
    await this.em.flush();
  }

  async delete(cliente: Cliente): Promise<void> {
    const entity = await this.em.findOne(ClienteEntity, { id: cliente.id });
    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }

  private toDomain(entity: ClienteEntity): Cliente {
    return Cliente.create({
      cuit: Cuit.create(entity.cuit),
      razonSocial: RazonSocial.create(entity.razonSocial),
      condicionIva: entity.condicionIva.codigo as CondicionIVA,
      tipo: entity.tipoCliente.codigo as TipoCliente,
      regimen: entity.regimen.codigo as Regimen,
      tenantId: entity.tenant.id,
    }, entity.id);
  }
}
