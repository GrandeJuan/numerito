import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { FacturaRepository } from '../../domain/repositories/factura.repository';
import { Factura } from '../../domain/entities/factura.entity';
import { FacturaEntity } from './factura.schema';
import { EstadoFacturaEntity } from '../../../shared/infrastructure/persistence/estado-factura.schema';
import { ClienteEntity } from '../../../clientes/infrastructure/persistence/cliente.schema';
import { EstudioEntity } from '../../../tenant/infrastructure/persistence/estudio.schema';

@Injectable()
export class MikroOrmFacturaRepository implements FacturaRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<Factura | null> {
    const entity = await this.em.findOne(FacturaEntity, { id }, {
      populate: ['estado', 'cliente', 'tenant'],
    });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findByClienteId(clienteId: string, tenantId: string): Promise<Factura[]> {
    const entities = await this.em.find(FacturaEntity, {
      cliente: { id: clienteId },
      tenant: { id: tenantId },
    }, {
      populate: ['estado', 'cliente', 'tenant'],
    });
    return entities.map(e => this.toDomain(e));
  }

  async findByTenantId(tenantId: string): Promise<Factura[]> {
    const entities = await this.em.find(FacturaEntity, { tenant: { id: tenantId } }, {
      populate: ['estado', 'cliente', 'tenant'],
    });
    return entities.map(e => this.toDomain(e));
  }

  async findAll(): Promise<Factura[]> {
    const entities = await this.em.findAll(FacturaEntity, {
      populate: ['estado', 'cliente', 'tenant'],
    });
    return entities.map(e => this.toDomain(e));
  }

  async save(factura: Factura): Promise<void> {
    const estado = await this.em.findOneOrFail(EstadoFacturaEntity, { codigo: factura.estado });
    const cliente = this.em.getReference(ClienteEntity, factura.clienteId);
    const tenant = this.em.getReference(EstudioEntity, factura.tenantId);

    const existing = await this.em.findOne(FacturaEntity, { id: factura.id });
    if (existing) {
      existing.cliente = cliente;
      existing.tenant = tenant;
      existing.numero = factura.numero;
      existing.fechaEmision = factura.fechaEmision;
      existing.fechaVencimiento = factura.fechaVencimiento;
      existing.subtotal = factura.subtotal;
      existing.iva = factura.iva;
      existing.total = factura.total;
      existing.concepto = factura.concepto;
      existing.estado = estado;
      existing.totalPagado = factura.totalPagado;
    } else {
      this.em.create(FacturaEntity, {
        id: factura.id,
        cliente,
        tenant,
        numero: factura.numero,
        fechaEmision: factura.fechaEmision,
        fechaVencimiento: factura.fechaVencimiento,
        subtotal: factura.subtotal,
        iva: factura.iva,
        total: factura.total,
        concepto: factura.concepto,
        estado,
        totalPagado: factura.totalPagado,
      });
    }
    await this.em.flush();
  }

  async delete(factura: Factura): Promise<void> {
    const entity = await this.em.findOne(FacturaEntity, { id: factura.id });
    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }

  private toDomain(entity: FacturaEntity): Factura {
    return Factura.create({
      clienteId: entity.cliente.id,
      tenantId: entity.tenant.id,
      numero: entity.numero,
      fechaEmision: entity.fechaEmision,
      fechaVencimiento: entity.fechaVencimiento,
      subtotal: entity.subtotal,
      iva: entity.iva,
      total: entity.total,
      concepto: entity.concepto,
    }, entity.id);
  }
}
