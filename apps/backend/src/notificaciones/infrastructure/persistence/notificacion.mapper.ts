import { z } from 'zod';
import type { Mapper } from '../../../shared/domain';
import { Notificacion, TipoNotificacion } from '../../domain/entities/notificacion.entity';
import type { NotificacionEntity } from './notificacion.schema';

const tipoNotificacionValues = Object.values(TipoNotificacion) as [
  TipoNotificacion,
  ...TipoNotificacion[],
];

export const notificacionPersistenceSchema = z.object({
  id: z.string().min(1),
  usuarioId: z.string().min(1),
  estudioId: z.string().optional(),
  tipo: z.enum(tipoNotificacionValues),
  mensaje: z.string(),
  leida: z.boolean(),
});

export type NotificacionPersistence = z.infer<typeof notificacionPersistenceSchema>;

export class NotificacionMapper implements Mapper<Notificacion, NotificacionPersistence> {
  toDomain(persistence: NotificacionPersistence): Notificacion {
    const data = notificacionPersistenceSchema.parse(persistence);
    return Notificacion.reconstitute(
      {
        usuarioId: data.usuarioId,
        estudioId: data.estudioId,
        tipo: data.tipo,
        mensaje: data.mensaje,
        leida: data.leida,
      },
      data.id,
    );
  }

  toPersistence(domain: Notificacion): NotificacionPersistence {
    return {
      id: domain.id,
      usuarioId: domain.usuarioId,
      estudioId: domain.estudioId,
      tipo: domain.tipo,
      mensaje: domain.mensaje,
      leida: domain.leida,
    };
  }

  fromSchema(entity: NotificacionEntity): NotificacionPersistence {
    return {
      id: entity.id,
      usuarioId: entity.usuarioId,
      estudioId: entity.estudioId || undefined,
      tipo: entity.tipo as TipoNotificacion,
      mensaje: entity.mensaje,
      leida: entity.leida,
    };
  }
}
