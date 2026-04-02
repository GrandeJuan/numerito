import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { FacturaRepository } from '../../domain/repositories/factura.repository';
import { Factura } from '../../domain/entities/factura.entity';
import { LineaFactura } from '../../domain/entities/linea-factura.entity';
import { FacturaEntity } from './factura.schema';
import { LineaFacturaEntity } from './linea-factura.schema';
import { EstadoFacturaEntity } from '../../../shared/infrastructure/persistence/estado-factura.schema';
import { ClienteEntity } from '../../../clientes/infrastructure/persistence/cliente.schema';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';

@Injectable()
export class MikroOrmFacturaRepository implements FacturaRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<Factura | null> {
    const entity = await this.em.findOne(FacturaEntity, { id }, {
      populate: ['estado', 'cliente', 'estudio', 'lineas'],
    });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findByClienteId(clienteId: string, estudioId: string): Promise<Factura[]> {
    const entities = await this.em.find(FacturaEntity, {
      cliente: { id: clienteId },
      estudio: { id: estudioId },
    }, {
      populate: ['estado', 'cliente', 'estudio', 'lineas'],
    });
    return entities.map(e => this.toDomain(e));
  }

  async findByEstudioId(estudioId: string): Promise<Factura[]> {
    const entities = await this.em.find(FacturaEntity, { estudio: { id: estudioId } }, {
      populate: ['estado', 'cliente', 'estudio', 'lineas'],
    });
    return entities.map(e => this.toDomain(e));
  }

  async findAll(): Promise<Factura[]> {
    const entities = await this.em.findAll(FacturaEntity, {
      populate: ['estado', 'cliente', 'estudio', 'lineas'],
    });
    return entities.map(e => this.toDomain(e));
  }

  async save(factura: Factura): Promise<void> {
    const estado = await this.em.findOneOrFail(EstadoFacturaEntity, { codigo: factura.estado });
    const cliente = this.em.getReference(ClienteEntity, factura.clienteId);
    const estudio = this.em.getReference(EstudioEntity, factura.estudioId);

    const existing = await this.em.findOne(FacturaEntity, { id: factura.id }, {
      populate: ['lineas'],
    });

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
    const entity = await this.em.findOne(FacturaEntity, { id: factura.id });
    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }

  private toDomain(entity: FacturaEntity): Factura {
    const lineas = entity.lineas.getItems().map(l =>
      LineaFactura.create({
        facturaId: entity.id,
        descripcion: l.descripcion,
        cantidad: l.cantidad,
        precioUnitario: l.precioUnitario,
        alicuotaIva: l.alicuotaIva,
      }, l.id),
    );

    const factura = Factura.create({
      clienteId: entity.cliente.id,
      estudioId: entity.estudio.id,
      numero: entity.numero,
      fechaEmision: entity.fechaEmision,
      fechaVencimiento: entity.fechaVencimiento,
      concepto: entity.concepto,
      lineas,
    }, entity.id);

    // Restore totalPagado from DB
    if (entity.totalPagado > 0) {
      factura.registrarPagoExterno(entity.totalPagado);
    }

    return factura;
  }
}
