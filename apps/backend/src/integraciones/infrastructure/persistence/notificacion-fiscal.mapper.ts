import { z } from 'zod';
import type { Mapper } from '../../../shared/domain';
import {
  NotificacionFiscal,
  ESTADO_NOTIFICACION,
  type EstadoNotificacion,
} from '../../domain/entities/notificacion-fiscal.entity';
import type { NotificacionFiscalEntity } from './notificacion-fiscal.schema';

const estadoNotificacionValues = Object.values(ESTADO_NOTIFICACION) as [
  EstadoNotificacion,
  ...EstadoNotificacion[],
];

export const notificacionFiscalPersistenceSchema = z.object({
  id: z.string().min(1),
  clienteId: z.string().min(1),
  estudioId: z.string().min(1),
  organismoId: z.string(),
  cuitCliente: z.string(),
  asunto: z.string(),
  contenido: z.string(),
  fechaNotificacion: z.date(),
  estado: z.enum(estadoNotificacionValues),
  notaGestion: z.string().optional(),
});

export type NotificacionFiscalPersistence = z.infer<typeof notificacionFiscalPersistenceSchema>;

export class NotificacionFiscalMapper implements Mapper<
  NotificacionFiscal,
  NotificacionFiscalPersistence
> {
  toDomain(persistence: NotificacionFiscalPersistence): NotificacionFiscal {
    const data = notificacionFiscalPersistenceSchema.parse(persistence);
    return NotificacionFiscal.reconstitute(
      {
        clienteId: data.clienteId,
        estudioId: data.estudioId,
        organismoId: data.organismoId,
        cuitCliente: data.cuitCliente,
        asunto: data.asunto,
        contenido: data.contenido,
        fechaNotificacion: data.fechaNotificacion,
        estado: data.estado,
        notaGestion: data.notaGestion,
      },
      data.id,
    );
  }

  toPersistence(domain: NotificacionFiscal): NotificacionFiscalPersistence {
    return {
      id: domain.id,
      clienteId: domain.clienteId,
      estudioId: domain.estudioId,
      organismoId: domain.organismoId,
      cuitCliente: domain.cuitCliente,
      asunto: domain.asunto,
      contenido: domain.contenido,
      fechaNotificacion: domain.fechaNotificacion,
      estado: domain.estado,
      notaGestion: domain.notaGestion,
    };
  }

  fromSchema(entity: NotificacionFiscalEntity): NotificacionFiscalPersistence {
    return {
      id: entity.id,
      clienteId: entity.cliente.id,
      estudioId: entity.estudio.id,
      organismoId: String(entity.organismo.id),
      cuitCliente: entity.cuitCliente,
      asunto: entity.asunto,
      contenido: entity.contenido,
      fechaNotificacion: entity.fechaNotificacion,
      estado: entity.estado as EstadoNotificacion,
      notaGestion: entity.notaGestion,
    };
  }
}
