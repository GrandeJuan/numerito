import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import { NotificacionFiscal } from '../entities/notificacion-fiscal.entity';

export interface NotificacionFiscalRepository {
  findById(principal: EstudioPrincipal, id: string): Promise<NotificacionFiscal | null>;
  findAll(principal: EstudioPrincipal): Promise<NotificacionFiscal[]>;
  findByClienteId(principal: EstudioPrincipal, clienteId: string): Promise<NotificacionFiscal[]>;
  save(principal: EstudioPrincipal, notificacion: NotificacionFiscal): Promise<void>;
  delete(principal: EstudioPrincipal, notificacion: NotificacionFiscal): Promise<void>;
}

export const NOTIFICACION_FISCAL_REPOSITORY = Symbol('NotificacionFiscalRepository');
