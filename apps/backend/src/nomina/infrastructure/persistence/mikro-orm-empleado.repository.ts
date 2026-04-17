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
import { EmpleadoMapper } from './empleado.mapper';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';

@Injectable()
export class MikroOrmEmpleadoRepository
  extends TenantAwareRepository<Empleado>
  implements EmpleadoRepository
{
  private readonly mapper = new EmpleadoMapper();

  constructor(
    @Inject(REQUEST_CONTEXT) context: RequestContextService,
    private readonly em: EntityManager,
  ) {
    super(context);
  }

  async findById(principal: EstudioPrincipal, id: string): Promise<Empleado | null> {
    const entity = await this.em.findOne(
      EmpleadoEntity,
      {
        id,
        estudio: { id: principal.estudioId },
      },
      {
        populate: ['cliente', 'estudio'],
      },
    );
    if (!entity) return null;
    return this.mapper.toDomain(this.mapper.fromSchema(entity));
  }

  async findByClienteId(principal: EstudioPrincipal, clienteId: string): Promise<Empleado[]> {
    const entities = await this.em.find(
      EmpleadoEntity,
      {
        cliente: { id: clienteId },
        estudio: { id: principal.estudioId },
      },
      {
        populate: ['cliente', 'estudio'],
      },
    );
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async findAll(principal: EstudioPrincipal): Promise<Empleado[]> {
    const entities = await this.em.find(
      EmpleadoEntity,
      {
        estudio: { id: principal.estudioId },
      },
      {
        populate: ['cliente', 'estudio'],
      },
    );
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async save(principal: EstudioPrincipal, empleado: Empleado): Promise<void> {
    const cliente = this.em.getReference(ClienteEntity, empleado.clienteId);
    const estudio = this.em.getReference(EstudioEntity, empleado.estudioId);

    const existing = await this.em.findOne(EmpleadoEntity, { id: empleado.id, estudio: { id: principal.estudioId } });
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

  async delete(principal: EstudioPrincipal, empleado: Empleado): Promise<void> {
    const entity = await this.em.findOne(EmpleadoEntity, { id: empleado.id, estudio: { id: principal.estudioId } });
    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }

}
