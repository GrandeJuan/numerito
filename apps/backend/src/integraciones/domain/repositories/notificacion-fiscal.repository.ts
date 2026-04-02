import { BaseRepository } from '../../../shared/domain';
import { NotificacionFiscal } from '../entities/notificacion-fiscal.entity';

export interface NotificacionFiscalRepository extends BaseRepository<NotificacionFiscal> {
  findByClienteId(clienteId: string, estudioId: string): Promise<NotificacionFiscal[]>;
  findByEstudioId(estudioId: string): Promise<NotificacionFiscal[]>;
}

export const NOTIFICACION_FISCAL_REPOSITORY = Symbol('NotificacionFiscalRepository');
