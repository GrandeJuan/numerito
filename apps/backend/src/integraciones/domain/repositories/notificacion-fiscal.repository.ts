import { BaseRepository } from '../../../shared/domain';
import { NotificacionFiscal } from '../entities/notificacion-fiscal.entity';

export interface NotificacionFiscalRepository extends BaseRepository<NotificacionFiscal> {
  findByClienteId(clienteId: string): Promise<NotificacionFiscal[]>;
}

export const NOTIFICACION_FISCAL_REPOSITORY = Symbol('NotificacionFiscalRepository');
