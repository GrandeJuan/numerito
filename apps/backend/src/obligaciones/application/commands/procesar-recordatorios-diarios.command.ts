import type { VencimientoRepository } from '../../domain/repositories/vencimiento.repository';
import type { AlertaConfigRepository } from '../../domain/repositories/alerta-config.repository';
import type { RecordatorioEnviadoRepository } from '../../domain/repositories/recordatorio-enviado.repository';
import type { ClienteRepository } from '../../../clientes/domain/repositories/cliente.repository';
import type { NotificacionRepository } from '../../../notificaciones/domain/repositories/notificacion.repository';
import type { MailSenderPort } from '../../../shared/domain/ports/mail-sender.port';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import {
  RecordatorioEnviado,
  TIPO_RECORDATORIO,
  CANAL_RECORDATORIO,
} from '../../domain/entities/recordatorio-enviado.entity';
import {
  Notificacion,
  TipoNotificacion,
} from '../../../notificaciones/domain/entities/notificacion.entity';

export interface ProcesarRecordatoriosResult {
  estudiosProcessados: number;
  recordatoriosEnviados: number;
  errores: string[];
}

export class ProcesarRecordatoriosDiariosHandler {
  constructor(
    private readonly alertaConfigRepo: AlertaConfigRepository,
    private readonly vencimientoRepo: VencimientoRepository,
    private readonly clienteRepo: ClienteRepository,
    private readonly recordatorioRepo: RecordatorioEnviadoRepository,
    private readonly notificacionRepo: NotificacionRepository,
    private readonly mailSender: MailSenderPort,
  ) {}

  async execute(): Promise<ProcesarRecordatoriosResult> {
    const configs = await this.alertaConfigRepo.findAllActivas();
    let totalEnviados = 0;
    const errores: string[] = [];

    for (const config of configs) {
      try {
        const principal: EstudioPrincipal = {
          estudioId: config.estudioId,
          userId: 'SYSTEM',
          roles: [],
        };

        const vencimientos = await this.vencimientoRepo.findProximosAVencer(
          principal,
          config.diasAnticipacion,
        );

        for (const vencimiento of vencimientos) {
          try {
            // --- Per-client diasAnticipacion override ---
            const cliente = await this.clienteRepo.findById(principal, vencimiento.clienteId);
            if (cliente?.diasAnticipacion) {
              // Re-check if within client's custom window
              if (!vencimiento.isProximoAVencer(cliente.diasAnticipacion)) {
                continue;
              }
            }

            // --- Idempotency: skip if already sent ---
            const yaSendEmail = await this.recordatorioRepo.existsForVencimiento(
              vencimiento.id,
              TIPO_RECORDATORIO.ANTICIPACION,
            );
            if (yaSendEmail) continue;

            // --- Send email to client ---
            if (config.canalNotificacion === 'EMAIL' || config.canalNotificacion === 'BOTH') {
              const subject = `Recordatorio: ${vencimiento.descripcion} vence el ${vencimiento.fechaVencimiento.toLocaleDateString('es-AR')}`;
              const body = [
                `Estimado cliente,`,
                ``,
                `Le recordamos que tiene un vencimiento próximo:`,
                `- Descripción: ${vencimiento.descripcion}`,
                `- Fecha de vencimiento: ${vencimiento.fechaVencimiento.toLocaleDateString('es-AR')}`,
                `- Período: ${vencimiento.periodo}`,
                `- Tipo: ${vencimiento.tipoObligacion}`,
                ``,
                `Por favor, gestione la presentación a la brevedad.`,
              ].join('\n');

              await this.mailSender.send(vencimiento.clienteId, subject, body);

              const emailRecord = RecordatorioEnviado.create({
                vencimientoId: vencimiento.id,
                estudioId: config.estudioId,
                clienteId: vencimiento.clienteId,
                tipoRecordatorio: TIPO_RECORDATORIO.ANTICIPACION,
                canal: CANAL_RECORDATORIO.EMAIL,
                destinatarioId: vencimiento.clienteId,
              });
              await this.recordatorioRepo.save(emailRecord);
            }

            // --- Internal notification to responsable ---
            if (config.canalNotificacion === 'INTERNAL' || config.canalNotificacion === 'BOTH') {
              const responsableId = vencimiento.responsableId;
              if (responsableId) {
                const notificacion = Notificacion.create({
                  usuarioId: responsableId,
                  estudioId: config.estudioId,
                  tipo: TipoNotificacion.VENCIMIENTO_PROXIMO,
                  mensaje: `Vencimiento próximo: ${vencimiento.descripcion} — ${vencimiento.fechaVencimiento.toLocaleDateString('es-AR')}`,
                });
                await this.notificacionRepo.save(notificacion);

                const internalRecord = RecordatorioEnviado.create({
                  vencimientoId: vencimiento.id,
                  estudioId: config.estudioId,
                  clienteId: vencimiento.clienteId,
                  tipoRecordatorio: TIPO_RECORDATORIO.ANTICIPACION,
                  canal: CANAL_RECORDATORIO.INTERNAL,
                  destinatarioId: responsableId,
                });
                await this.recordatorioRepo.save(internalRecord);
              }
            }

            totalEnviados++;
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            errores.push(`Vencimiento ${vencimiento.id}: ${msg}`);
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errores.push(`Estudio ${config.estudioId}: ${msg}`);
      }
    }

    return {
      estudiosProcessados: configs.length,
      recordatoriosEnviados: totalEnviados,
      errores,
    };
  }
}
