import { z } from 'zod';
import type { Mapper } from '../../../shared/domain';
import { AsientoContable, type LineaAsiento } from '../../domain/entities/asiento-contable.entity';
import type { AsientoContableEntity } from './asiento-contable.schema';

const lineaAsientoPersistenceSchema = z.object({
  cuentaId: z.string().min(1),
  debe: z.number(),
  haber: z.number(),
  descripcion: z.string(),
});

export const asientoContablePersistenceSchema = z.object({
  id: z.string().min(1),
  libroId: z.string().min(1),
  clienteId: z.string().min(1),
  estudioId: z.string().min(1),
  fecha: z.date(),
  descripcion: z.string(),
  lineas: z.array(lineaAsientoPersistenceSchema),
});

export type AsientoContablePersistence = z.infer<typeof asientoContablePersistenceSchema>;

export class AsientoContableMapper implements Mapper<AsientoContable, AsientoContablePersistence> {
  toDomain(persistence: AsientoContablePersistence): AsientoContable {
    const data = asientoContablePersistenceSchema.parse(persistence);
    return AsientoContable.reconstitute(
      {
        libroId: data.libroId,
        clienteId: data.clienteId,
        estudioId: data.estudioId,
        fecha: data.fecha,
        descripcion: data.descripcion,
        lineas: data.lineas.map((l) => ({
          cuentaId: l.cuentaId,
          debe: l.debe,
          haber: l.haber,
          descripcion: l.descripcion,
        })),
      },
      data.id,
    );
  }

  toPersistence(domain: AsientoContable): AsientoContablePersistence {
    return {
      id: domain.id,
      libroId: domain.libroId,
      clienteId: domain.clienteId,
      estudioId: domain.estudioId,
      fecha: domain.fecha,
      descripcion: domain.descripcion,
      lineas: domain.lineas.map((l) => ({
        cuentaId: l.cuentaId,
        debe: l.debe,
        haber: l.haber,
        descripcion: l.descripcion,
      })),
    };
  }

  fromSchema(entity: AsientoContableEntity): AsientoContablePersistence {
    return {
      id: entity.id,
      libroId: entity.libro.id,
      clienteId: entity.cliente.id,
      estudioId: entity.estudio.id,
      fecha: entity.fecha,
      descripcion: entity.descripcion,
      lineas: (entity.lineas ?? []).map((l: LineaAsiento) => ({
        cuentaId: l.cuentaId,
        debe: l.debe,
        haber: l.haber,
        descripcion: l.descripcion,
      })),
    };
  }
}
