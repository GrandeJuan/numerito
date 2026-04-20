import { z } from 'zod';
import { ESTADO_FACTURA, type EstadoFactura } from '@numerito/shared';
import type { Mapper } from '../../../shared/domain';
import { Factura } from '../../domain/entities/factura.entity';
import { LineaFactura } from '../../domain/entities/linea-factura.entity';
import type { FacturaEntity } from './factura.schema';

const estadoFacturaValues = Object.values(ESTADO_FACTURA) as [EstadoFactura, ...EstadoFactura[]];

/* ── LineaFactura persistence ─────────────────────────────────── */

export const lineaFacturaPersistenceSchema = z.object({
  id: z.string().min(1),
  facturaId: z.string().min(1),
  descripcion: z.string(),
  cantidad: z.number(),
  precioUnitario: z.number(),
  alicuotaIva: z.number(),
});

export type LineaFacturaPersistence = z.infer<typeof lineaFacturaPersistenceSchema>;

/* ── Factura persistence ──────────────────────────────────────── */

export const facturaPersistenceSchema = z.object({
  id: z.string().min(1),
  clienteId: z.string().min(1),
  estudioId: z.string().min(1),
  numero: z.string(),
  fechaEmision: z.date(),
  fechaVencimiento: z.date(),
  concepto: z.string(),
  lineas: z.array(lineaFacturaPersistenceSchema),
  estado: z.enum(estadoFacturaValues),
  totalPagado: z.number(),
});

export type FacturaPersistence = z.infer<typeof facturaPersistenceSchema>;

/* ── Mapper ────────────────────────────────────────────────────── */

export class FacturaMapper implements Mapper<Factura, FacturaPersistence> {
  toDomain(persistence: FacturaPersistence): Factura {
    const data = facturaPersistenceSchema.parse(persistence);

    const lineas = data.lineas.map((l) =>
      LineaFactura.reconstitute(
        {
          facturaId: l.facturaId,
          descripcion: l.descripcion,
          cantidad: l.cantidad,
          precioUnitario: l.precioUnitario,
          alicuotaIva: l.alicuotaIva,
        },
        l.id,
      ),
    );

    return Factura.reconstitute(
      {
        clienteId: data.clienteId,
        estudioId: data.estudioId,
        numero: data.numero,
        fechaEmision: data.fechaEmision,
        fechaVencimiento: data.fechaVencimiento,
        concepto: data.concepto,
        lineas,
        estado: data.estado,
        totalPagado: data.totalPagado,
      },
      data.id,
    );
  }

  toPersistence(domain: Factura): FacturaPersistence {
    return {
      id: domain.id,
      clienteId: domain.clienteId,
      estudioId: domain.estudioId,
      numero: domain.numero,
      fechaEmision: domain.fechaEmision,
      fechaVencimiento: domain.fechaVencimiento,
      concepto: domain.concepto,
      lineas: domain.lineas.map((l) => ({
        id: l.id,
        facturaId: l.facturaId,
        descripcion: l.descripcion,
        cantidad: l.cantidad,
        precioUnitario: l.precioUnitario,
        alicuotaIva: l.alicuotaIva,
      })),
      estado: domain.estado,
      totalPagado: domain.totalPagado,
    };
  }

  fromSchema(entity: FacturaEntity): FacturaPersistence {
    return {
      id: entity.id,
      clienteId: entity.cliente.id,
      estudioId: entity.estudio.id,
      numero: entity.numero,
      fechaEmision: entity.fechaEmision,
      fechaVencimiento: entity.fechaVencimiento,
      concepto: entity.concepto,
      lineas: entity.lineas.getItems().map((l) => ({
        id: l.id,
        facturaId: entity.id,
        descripcion: l.descripcion,
        cantidad: l.cantidad,
        precioUnitario: l.precioUnitario,
        alicuotaIva: l.alicuotaIva,
      })),
      estado: entity.estado.codigo as EstadoFactura,
      totalPagado: entity.totalPagado,
    };
  }
}
