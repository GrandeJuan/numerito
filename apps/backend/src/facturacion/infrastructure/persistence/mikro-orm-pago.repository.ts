import { Injectable, Inject } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { PagoRepository } from '../../domain/repositories/pago.repository';
import { Pago } from '../../domain/entities/pago.entity';
import { TenantAwareRepository } from '../../../shared/domain';
import {
  RequestContextService,
  REQUEST_CONTEXT,
} from '../../../shared/infrastructure/services/request-context.service';
import { PagoEntity } from './pago.schema';
import { FacturaEntity } from './factura.schema';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';
import { MedioPagoEntity } from '../../../shared/infrastructure/persistence/medio-pago.schema';
import { PagoMapper } from './pago.mapper';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';

@Injectable()
export class MikroOrmPagoRepository extends TenantAwareRepository<Pago> implements PagoRepository {
  private readonly mapper = new PagoMapper();

  constructor(
    @Inject(REQUEST_CONTEXT) context: RequestContextService,
    private readonly em: EntityManager,
  ) {
    super(context);
  }

  async findById(principal: EstudioPrincipal, id: string): Promise<Pago | null> {
    const entity = await this.em.findOne(
      PagoEntity,
      {
        id,
        estudio: { id: principal.estudioId },
      },
      {
        populate: ['factura', 'estudio', 'medioPago'],
      },
    );
    if (!entity) return null;
    return this.mapper.toDomain(this.mapper.fromSchema(entity));
  }

  async findByFacturaId(principal: EstudioPrincipal, facturaId: string): Promise<Pago[]> {
    const entities = await this.em.find(
      PagoEntity,
      {
        factura: { id: facturaId },
        estudio: { id: principal.estudioId },
      },
      {
        populate: ['factura', 'estudio', 'medioPago'],
      },
    );
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async findAll(principal: EstudioPrincipal): Promise<Pago[]> {
    const entities = await this.em.find(
      PagoEntity,
      {
        estudio: { id: principal.estudioId },
      },
      {
        populate: ['factura', 'estudio', 'medioPago'],
      },
    );
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async save(principal: EstudioPrincipal, pago: Pago): Promise<void> {
    const factura = this.em.getReference(FacturaEntity, pago.facturaId);
    const estudio = this.em.getReference(EstudioEntity, pago.estudioId);
    const medioPago = this.em.getReference(MedioPagoEntity, pago.medioPagoId);

    const existing = await this.em.findOne(PagoEntity, { id: pago.id, estudio: { id: principal.estudioId } });

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

  async delete(principal: EstudioPrincipal, pago: Pago): Promise<void> {
    const entity = await this.em.findOne(PagoEntity, { id: pago.id, estudio: { id: principal.estudioId } });
    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }

}
