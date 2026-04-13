import { Injectable, Inject } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { EmpleadoRepository } from '../../domain/repositories/empleado.repository';
import { Empleado } from '../../domain/entities/empleado.entity';
import { TenantAwareRepository } from '../../../shared/domain';
import {
  RequestContextService,
  REQUEST_CONTEXT,
} from '../../../shared/infrastructure/services/request-context.service';
import { EmpleadoEntity } from './empleado.schema';
import { ClienteEntity } from '../../../clientes/infrastructure/persistence/cliente.schema';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';

@Injectable()
export class MikroOrmEmpleadoRepository
  extends TenantAwareRepository<Empleado>
  implements EmpleadoRepository
{
  constructor(
    @Inject(REQUEST_CONTEXT) context: RequestContextService,
    private readonly em: EntityManager,
  ) {
    super(context);
  }

  async findById(id: string): Promise<Empleado | null> {
    const tenantId = this.getTenantId();
    const entity = await this.em.findOne(
      EmpleadoEntity,
      {
        id,
        estudio: { id: tenantId },
      },
      {
        populate: ['cliente', 'estudio'],
      },
    );
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findByClienteId(clienteId: string): Promise<Empleado[]> {
    const tenantId = this.getTenantId();
    const entities = await this.em.find(
      EmpleadoEntity,
      {
        cliente: { id: clienteId },
        estudio: { id: tenantId },
      },
      {
        populate: ['cliente', 'estudio'],
      },
    );
    return entities.map((e) => this.toDomain(e));
  }

  async findAll(): Promise<Empleado[]> {
    const tenantId = this.getTenantId();
    const entities = await this.em.find(
      EmpleadoEntity,
      {
        estudio: { id: tenantId },
      },
      {
        populate: ['cliente', 'estudio'],
      },
    );
    return entities.map((e) => this.toDomain(e));
  }

  async save(empleado: Empleado): Promise<void> {
    const cliente = this.em.getReference(ClienteEntity, empleado.clienteId);
    const estudio = this.em.getReference(EstudioEntity, empleado.estudioId);

    const existing = await this.em.findOne(EmpleadoEntity, { id: empleado.id });
    if (existing) {
      existing.cliente = cliente;
      existing.estudio = estudio;
      existing.nombre = empleado.nombre;
      existing.apellido = empleado.apellido;
      existing.cuil = empleado.cuil;
      existing.fechaIngreso = empleado.fechaIngreso;
      existing.fechaEgreso = empleado.fechaEgreso;
      existing.sueldoBasico = empleado.sueldoBasico;
      existing.categoriaConvenio = empleado.categoriaConvenio;
      existing.isActive = empleado.isActive;
    } else {
      this.em.create(EmpleadoEntity, {
        id: empleado.id,
        cliente,
        estudio,
        nombre: empleado.nombre,
        apellido: empleado.apellido,
        cuil: empleado.cuil,
        fechaIngreso: empleado.fechaIngreso,
        fechaEgreso: empleado.fechaEgreso,
        sueldoBasico: empleado.sueldoBasico,
        categoriaConvenio: empleado.categoriaConvenio,
        isActive: empleado.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await this.em.flush();
  }

  async delete(empleado: Empleado): Promise<void> {
    const entity = await this.em.findOne(EmpleadoEntity, { id: empleado.id });
    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }

  private toDomain(entity: EmpleadoEntity): Empleado {
    return Empleado.create(
      {
        clienteId: entity.cliente.id,
        estudioId: entity.estudio.id,
        nombre: entity.nombre,
        apellido: entity.apellido,
        cuil: entity.cuil,
        fechaIngreso: entity.fechaIngreso,
        sueldoBasico: entity.sueldoBasico,
        categoriaConvenio: entity.categoriaConvenio,
      },
      entity.id,
    );
  }
}
