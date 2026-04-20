import { z } from 'zod';
import {
  ESTADO_VENCIMIENTO,
  TIPO_OBLIGACION,
  type EstadoVencimiento,
  type TipoObligacion,
} from '@numerito/shared';
import type { Mapper } from '../../../shared/domain';
import { Vencimiento } from '../../domain/entities/vencimiento.entity';
import type { VencimientoEntity } from './vencimiento.schema';

const tipoObligacionValues = Object.values(TIPO_OBLIGACION) as [
  TipoObligacion,
  ...TipoObligacion[],
];
const estadoVencimientoValues = Object.values(ESTADO_VENCIMIENTO) as [
  EstadoVencimiento,
  ...EstadoVencimiento[],
];

export const vencimientoPersistenceSchema = z.object({
  id: z.string().min(1),
  clienteId: z.string().min(1),
  estudioId: z.string().min(1),
  tipoObligacion: z.enum(tipoObligacionValues),
  periodo: z.string().min(1),
  fechaVencimiento: z.date(),
  fechaNominal: z.date().nullable(),
  descripcion: z.string(),
  estado: z.enum(estadoVencimientoValues),
});

export type VencimientoPersistence = z.infer<typeof vencimientoPersistenceSchema>;

export class VencimientoMapper implements Mapper<Vencimiento, VencimientoPersistence> {
  toDomain(persistence: VencimientoPersistence): Vencimiento {
    const data = vencimientoPersistenceSchema.parse(persistence);
    return Vencimiento.reconstitute(
      {
        clienteId: data.clienteId,
        estudioId: data.estudioId,
        tipoObligacion: data.tipoObligacion,
        periodo: data.periodo,
        fechaVencimiento: data.fechaVencimiento,
        fechaNominal: data.fechaNominal,
        descripcion: data.descripcion,
        estado: data.estado,
      },
      data.id,
    );
  }

  toPersistence(domain: Vencimiento): VencimientoPersistence {
    return {
      id: domain.id,
      clienteId: domain.clienteId,
      estudioId: domain.estudioId,
      tipoObligacion: domain.tipoObligacion,
      periodo: domain.periodo,
      fechaVencimiento: domain.fechaVencimiento,
      fechaNominal: domain.fechaNominal,
      descripcion: domain.descripcion,
      estado: domain.estado,
    };
  }

  fromSchema(entity: VencimientoEntity): VencimientoPersistence {
    return {
      id: entity.id,
      clienteId: entity.cliente.id,
      estudioId: entity.estudio.id,
      tipoObligacion: entity.tipoObligacion.codigo as TipoObligacion,
      periodo: entity.periodo,
      fechaVencimiento: entity.fechaVencimiento,
      fechaNominal: entity.fechaNominal,
      descripcion: entity.descripcion,
      estado: entity.estado.codigo as EstadoVencimiento,
    };
  }
}
