import { Injectable, Inject } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import type { ClienteRepository } from '../../domain/repositories/cliente.repository';
import { Cliente } from '../../domain/entities/cliente.entity';
import { Cuit } from '../../domain/value-objects/cuit.vo';
import { TenantAwareRepository } from '../../../shared/domain';
import {
  RequestContextService,
  REQUEST_CONTEXT,
} from '../../../shared/infrastructure/services/request-context.service';
import { ClienteEntity } from './cliente.schema';
import { CondicionIvaEntity } from '../../../shared/infrastructure/persistence/condicion-iva.schema';
import { TipoClienteEntity } from '../../../shared/infrastructure/persistence/tipo-cliente.schema';
import { RegimenEntity } from '../../../shared/infrastructure/persistence/regimen.schema';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';
import { UsuarioEntity } from '../../../iam/infrastructure/persistence/usuario.schema';
import { ClienteMapper } from './cliente.mapper';

@Injectable()
export class MikroOrmClienteRepository
  extends TenantAwareRepository<Cliente>
  implements ClienteRepository
{
  private readonly mapper = new ClienteMapper();

  constructor(
    @Inject(REQUEST_CONTEXT) context: RequestContextService,
    private readonly em: EntityManager,
  ) {
    super(context);
  }

  async findById(principal: EstudioPrincipal, id: string): Promise<Cliente | null> {
    const entity = await this.em.findOne(
      ClienteEntity,
      {
        id,
        estudio: { id: principal.estudioId },
      },
      {
        populate: ['condicionIva', 'tipoCliente', 'regimen', 'estudio', 'responsable'],
      },
    );
    if (!entity) return null;
    return this.mapper.toDomain(this.mapper.fromSchema(entity));
  }

  async findByCuit(principal: EstudioPrincipal, cuit: Cuit): Promise<Cliente | null> {
    const entity = await this.em.findOne(
      ClienteEntity,
      {
        cuit: cuit.raw,
        estudio: { id: principal.estudioId },
      },
      {
        populate: ['condicionIva', 'tipoCliente', 'regimen', 'estudio', 'responsable'],
      },
    );
    if (!entity) return null;
    return this.mapper.toDomain(this.mapper.fromSchema(entity));
  }

  async findAll(principal: EstudioPrincipal): Promise<Cliente[]> {
    const entities = await this.em.find(
      ClienteEntity,
      {
        estudio: { id: principal.estudioId },
      },
      {
        populate: ['condicionIva', 'tipoCliente', 'regimen', 'estudio', 'responsable'],
      },
    );
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async findByResponsableId(principal: EstudioPrincipal, responsableId: string): Promise<Cliente[]> {
    const entities = await this.em.find(
      ClienteEntity,
      {
        responsable: { id: responsableId },
        estudio: { id: principal.estudioId },
      },
      {
        populate: ['condicionIva', 'tipoCliente', 'regimen', 'estudio', 'responsable'],
      },
    );
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async save(principal: EstudioPrincipal, cliente: Cliente): Promise<void> {
    const data = this.mapper.toPersistence(cliente);
    const [condicionIva, tipoCliente, regimen] = await Promise.all([
      this.em.findOneOrFail(CondicionIvaEntity, { codigo: data.condicionIva }),
      this.em.findOneOrFail(TipoClienteEntity, { codigo: data.tipo }),
      this.em.findOneOrFail(RegimenEntity, { codigo: data.regimen }),
    ]);
    const estudio = this.em.getReference(EstudioEntity, data.estudioId);
    const responsable = data.responsableId
      ? this.em.getReference(UsuarioEntity, data.responsableId)
      : undefined;

    const existing = await this.em.findOne(ClienteEntity, { id: data.id, estudio: { id: principal.estudioId } });
    if (existing) {
      existing.cuit = data.cuit;
      existing.razonSocial = data.razonSocial;
      existing.condicionIva = condicionIva;
      existing.tipoCliente = tipoCliente;
      existing.regimen = regimen;
      existing.estudio = estudio;
      existing.responsable = responsable;
      existing.isActive = data.isActive;
    } else {
      this.em.create(ClienteEntity, {
        id: data.id,
        cuit: data.cuit,
        razonSocial: data.razonSocial,
        condicionIva,
        tipoCliente,
        regimen,
        estudio,
        responsable,
        isActive: data.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await this.em.flush();
  }

  async delete(principal: EstudioPrincipal, cliente: Cliente): Promise<void> {
    const entity = await this.em.findOne(ClienteEntity, { id: cliente.id, estudio: { id: principal.estudioId } });
    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }
}
