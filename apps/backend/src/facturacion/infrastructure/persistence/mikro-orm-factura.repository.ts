import { Injectable, Inject } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { FacturaRepository } from '../../domain/repositories/factura.repository';
import { Factura } from '../../domain/entities/factura.entity';
import { TenantAwareRepository } from '../../../shared/domain';
import {
  RequestContextService,
  REQUEST_CONTEXT,
} from '../../../shared/infrastructure/services/request-context.service';
import { FacturaEntity } from './factura.schema';
import { LineaFacturaEntity } from './linea-factura.schema';
import { EstadoFacturaEntity } from '../../../shared/infrastructure/persistence/estado-factura.schema';
import { ClienteEntity } from '../../../clientes/infrastructure/persistence/cliente.schema';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';

@Injectable()
export class MikroOrmFacturaRepository
  extends TenantAwareRepository<Factura>
  implements FacturaRepository
{
  constructor(
    @Inject(REQUEST_CONTEXT) context: RequestContextService,
    private readonly em: EntityManager,
  ) {
    super(context);
  }

  async findById(id: string): Promise<Factura | null> {
    const tenantId = this.getTenantId();
    const entity = await this.em.findOne(
      FacturaEntity,
      {
        id,
        estudio: { id: tenantId },
      },
      {
        populate: ['estado', 'cliente', 'estudio', 'lineas'],
      },
    );
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findByClienteId(clienteId: string): Promise<Factura[]> {
    const tenantId = this.getTenantId();
    const entities = await this.em.find(
      FacturaEntity,
      {
        cliente: { id: clienteId },
        estudio: { id: tenantId },
      },
      {
        populate: ['estado', 'cliente', 'estudio', 'lineas'],
      },
    );
    return entities.map((e) => this.toDomain(e));
  }

  async findAll(): Promise<Factura[]> {
    const tenantId = this.getTenantId();
    const entities = await this.em.find(
      FacturaEntity,
      {
        estudio: { id: tenantId },
      },
      {
        populate: ['estado', 'cliente', 'estudio', 'lineas'],
      },
    );
    return entities.map((e) => this.toDomain(e));
  }

  async save(factura: Factura): Promise<void> {
    const estado = await this.em.findOneOrFail(EstadoFacturaEntity, { codigo: factura.estado });
    const cliente = this.em.getReference(ClienteEntity, factura.clienteId);
    const estudio = this.em.getReference(EstudioEntity, factura.estudioId);

    const tenantId = this.getTenantId();
    const existing = await this.em.findOne(
      FacturaEntity,
      { id: factura.id, estudio: { id: tenantId } },
      {
        populate: ['lineas'],
      },
    );

    if (existing) {
      existing.cliente = cliente;
      existing.estudio = estudio;
      existing.numero = factura.numero;
      existing.fechaEmision = factura.fechaEmision;
      existing.fechaVencimiento = factura.fechaVencimiento;
      existing.subtotal = factura.subtotal;
      existing.iva = factura.iva;
      existing.total = factura.total;
      existing.concepto = factura.concepto;
      existing.estado = estado;
      existing.totalPagado = factura.totalPagado;

      // Sync lineas
      existing.lineas.removeAll();
      for (const linea of factura.lineas) {
        this.em.create(LineaFacturaEntity, {
          id: linea.id,
          factura: existing,
          descripcion: linea.descripcion,
          cantidad: linea.cantidad,
          precioUnitario: linea.precioUnitario,
          alicuotaIva: linea.alicuotaIva,
          subtotal: linea.subtotal,
        });
      }
    } else {
      const facturaEntity = this.em.create(FacturaEntity, {
        id: factura.id,
        cliente,
        estudio,
        numero: factura.numero,
        fechaEmision: factura.fechaEmision,
        fechaVencimiento: factura.fechaVencimiento,
        subtotal: factura.subtotal,
        iva: factura.iva,
        total: factura.total,
        concepto: factura.concepto,
        estado,
        totalPagado: factura.totalPagado,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      for (const linea of factura.lineas) {
        this.em.create(LineaFacturaEntity, {
          id: linea.id,
          factura: facturaEntity,
          descripcion: linea.descripcion,
          cantidad: linea.cantidad,
          precioUnitario: linea.precioUnitario,
          alicuotaIva: linea.alicuotaIva,
          subtotal: linea.subtotal,
        });
      }
    }
    await this.em.flush();
  }

  async delete(factura: Factura): Promise<void> {
    const tenantId = this.getTenantId();
    const entity = await this.em.findOne(FacturaEntity, { id: factura.id, estudio: { id: tenantId } });
    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }

  private toDomain(entity: FacturaEntity): Factura {
    const factura = Factura.create(
      {
        clienteId: entity.cliente.id,
        estudioId: entity.estudio.id,
        numero: entity.numero,
        fechaEmision: entity.fechaEmision,
        fechaVencimiento: entity.fechaVencimiento,
        concepto: entity.concepto,
        lineas: entity.lineas.getItems().map((l) => ({
          descripcion: l.descripcion,
          cantidad: l.cantidad,
          precioUnitario: l.precioUnitario,
          alicuotaIva: l.alicuotaIva,
          id: l.id,
        })),
      },
      entity.id,
    );

    // Restore totalPagado from DB
    if (entity.totalPagado > 0) {
      factura.registrarPagoExterno(entity.totalPagado);
    }

    return factura;
  }
}
