import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { PagoRepository } from '../../domain/repositories/pago.repository';
import { Pago } from '../../domain/entities/pago.entity';
import { PagoEntity } from './pago.schema';
import { FacturaEntity } from './factura.schema';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';
import { MedioPagoEntity } from '../../../shared/infrastructure/persistence/medio-pago.schema';

@Injectable()
export class MikroOrmPagoRepository implements PagoRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<Pago | null> {
    const entity = await this.em.findOne(PagoEntity, { id }, {
      populate: ['factura', 'estudio', 'medioPago'],
    });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findByFacturaId(facturaId: string): Promise<Pago[]> {
    const entities = await this.em.find(PagoEntity, {
      factura: { id: facturaId },
    }, {
      populate: ['factura', 'estudio', 'medioPago'],
    });
    return entities.map(e => this.toDomain(e));
  }

  async findByEstudioId(estudioId: string): Promise<Pago[]> {
    const entities = await this.em.find(PagoEntity, {
      estudio: { id: estudioId },
    }, {
      populate: ['factura', 'estudio', 'medioPago'],
    });
    return entities.map(e => this.toDomain(e));
  }

  async findAll(): Promise<Pago[]> {
    const entities = await this.em.findAll(PagoEntity, {
      populate: ['factura', 'estudio', 'medioPago'],
    });
    return entities.map(e => this.toDomain(e));
  }

  async save(pago: Pago): Promise<void> {
    const factura = this.em.getReference(FacturaEntity, pago.facturaId);
    const estudio = this.em.getReference(EstudioEntity, pago.estudioId);
    const medioPago = this.em.getReference(MedioPagoEntity, pago.medioPagoId);

    const existing = await this.em.findOne(PagoEntity, { id: pago.id });

    if (existing) {
      existing.factura = factura;
      existing.estudio = estudio;
      existing.fecha = pago.fecha;
      existing.monto = pago.monto;
      existing.medioPago = medioPago;
      existing.referencia = pago.referencia;
    } else {
      this.em.create(PagoEntity, {
        id: pago.id,
        factura,
        estudio,
        fecha: pago.fecha,
        monto: pago.monto,
        medioPago,
        referencia: pago.referencia,
        createdAt: new Date(),
      });
    }
    await this.em.flush();
  }

  async delete(pago: Pago): Promise<void> {
    const entity = await this.em.findOne(PagoEntity, { id: pago.id });
    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }

  private toDomain(entity: PagoEntity): Pago {
    return Pago.create({
      facturaId: entity.factura.id,
      estudioId: entity.estudio.id,
      fecha: entity.fecha,
      monto: entity.monto,
      medioPagoId: entity.medioPago.id,
      referencia: entity.referencia,
    }, entity.id);
  }
}
