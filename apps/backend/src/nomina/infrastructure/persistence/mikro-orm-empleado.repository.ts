import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { EmpleadoRepository } from '../../domain/repositories/empleado.repository';
import { Empleado } from '../../domain/entities/empleado.entity';
import { EmpleadoEntity } from './empleado.schema';
import { ClienteEntity } from '../../../clientes/infrastructure/persistence/cliente.schema';
import { EstudioEntity } from '../../../tenant/infrastructure/persistence/estudio.schema';

@Injectable()
export class MikroOrmEmpleadoRepository implements EmpleadoRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<Empleado | null> {
    const entity = await this.em.findOne(EmpleadoEntity, { id }, {
      populate: ['cliente', 'tenant'],
    });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findByClienteId(clienteId: string, tenantId: string): Promise<Empleado[]> {
    const entities = await this.em.find(EmpleadoEntity, {
      cliente: { id: clienteId },
      tenant: { id: tenantId },
    }, {
      populate: ['cliente', 'tenant'],
    });
    return entities.map(e => this.toDomain(e));
  }

  async findByTenantId(tenantId: string): Promise<Empleado[]> {
    const entities = await this.em.find(EmpleadoEntity, { tenant: { id: tenantId } }, {
      populate: ['cliente', 'tenant'],
    });
    return entities.map(e => this.toDomain(e));
  }

  async findAll(): Promise<Empleado[]> {
    const entities = await this.em.findAll(EmpleadoEntity, {
      populate: ['cliente', 'tenant'],
    });
    return entities.map(e => this.toDomain(e));
  }

  async save(empleado: Empleado): Promise<void> {
    const cliente = this.em.getReference(ClienteEntity, empleado.clienteId);
    const tenant = this.em.getReference(EstudioEntity, empleado.tenantId);

    const existing = await this.em.findOne(EmpleadoEntity, { id: empleado.id });
    if (existing) {
      existing.cliente = cliente;
      existing.tenant = tenant;
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
        tenant,
        nombre: empleado.nombre,
        apellido: empleado.apellido,
        cuil: empleado.cuil,
        fechaIngreso: empleado.fechaIngreso,
        fechaEgreso: empleado.fechaEgreso,
        sueldoBasico: empleado.sueldoBasico,
        categoriaConvenio: empleado.categoriaConvenio,
        isActive: empleado.isActive,
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
    return Empleado.create({
      clienteId: entity.cliente.id,
      tenantId: entity.tenant.id,
      nombre: entity.nombre,
      apellido: entity.apellido,
      cuil: entity.cuil,
      fechaIngreso: entity.fechaIngreso,
      sueldoBasico: entity.sueldoBasico,
      categoriaConvenio: entity.categoriaConvenio,
    }, entity.id);
  }
}
