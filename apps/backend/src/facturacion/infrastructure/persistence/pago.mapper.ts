import { z } from 'zod';
import type { Mapper } from '../../../shared/domain';
import { Pago } from '../../domain/entities/pago.entity';
import type { PagoEntity } from './pago.schema';

export const pagoPersistenceSchema = z.object({
  id: z.string().uuid(),
  facturaId: z.string().min(1),
  estudioId: z.string().min(1),
  fecha: z.date(),
  monto: z.number(),
  medioPagoId: z.number(),
  referencia: z.string().optional(),
});

export type PagoPersistence = z.infer<typeof pagoPersistenceSchema>;

export class PagoMapper implements Mapper<Pago, PagoPersistence> {
  toDomain(persistence: PagoPersistence): Pago {
    const data = pagoPersistenceSchema.parse(persistence);
    return Pago.reconstitute(
      {
        facturaId: data.facturaId,
        estudioId: data.estudioId,
        fecha: data.fecha,
        monto: data.monto,
        medioPagoId: data.medioPagoId,
        referencia: data.referencia,
      },
      data.id,
    );
  }

  toPersistence(domain: Pago): PagoPersistence {
    return {
      id: domain.id,
      facturaId: domain.facturaId,
      estudioId: domain.estudioId,
      fecha: domain.fecha,
      monto: domain.monto,
      medioPagoId: domain.medioPagoId,
      referencia: domain.referencia,
    };
  }

  fromSchema(entity: PagoEntity): PagoPersistence {
    return {
      id: entity.id,
      facturaId: entity.factura.id,
      estudioId: entity.estudio.id,
      fecha: entity.fecha,
      monto: entity.monto,
      medioPagoId: entity.medioPago.id,
      referencia: entity.referencia,
    };
  }
}
