import { BaseRepository } from '../../../shared/domain';
import { Notificacion } from '../entities/notificacion.entity';

export interface NotificacionRepository extends BaseRepository<Notificacion> {
  findByUsuarioAndEstudio(
    usuarioId: string,
    estudioId: string,
    options?: { leida?: boolean; limit?: number; offset?: number },
  ): Promise<{ data: Notificacion[]; total: number }>;

  countUnread(usuarioId: string, estudioId: string): Promise<number>;
}

export const NOTIFICACION_REPOSITORY = Symbol('NotificacionRepository');
