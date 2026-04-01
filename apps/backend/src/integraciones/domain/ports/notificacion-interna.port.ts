/**
 * Port for internal notification dispatch.
 *
 * Infrastructure:
 * - SQS queue for async processing
 * - Lambda for email dispatch via SES
 * - WebSocket (NestJS Gateway) for real-time in-app notifications
 */

export interface NotificacionInternaPayload {
  usuarioId: string;
  tenantId: string;
  tipo: 'VENCIMIENTO_PROXIMO' | 'TAREA_ASIGNADA' | 'DOCUMENTO_NUEVO' | 'NOTIFICACION_FISCAL' | 'SISTEMA';
  titulo: string;
  mensaje: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificacionInternaPort {
  enviar(payload: NotificacionInternaPayload): Promise<void>;
  enviarEmail(usuarioId: string, asunto: string, contenido: string): Promise<void>;
  marcarLeida(notificacionId: string): Promise<void>;
  obtenerNoLeidas(usuarioId: string): Promise<NotificacionInternaPayload[]>;
}

export const NOTIFICACION_INTERNA = Symbol('NotificacionInterna');
