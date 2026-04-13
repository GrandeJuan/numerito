import type { VencimientoRepository } from '../../domain/repositories/vencimiento.repository';
import type { AlertaConfigRepository } from '../../domain/repositories/alerta-config.repository';
import type { MailSenderPort } from '../../../shared/domain/ports/mail-sender.port';

export class NotificacionVencimientoService {
  constructor(
    private readonly vencimientoRepo: VencimientoRepository,
    private readonly alertaConfigRepo: AlertaConfigRepository,
    private readonly mailSender: MailSenderPort,
  ) {}

  async notificarProximos(): Promise<number> {
    const config = await this.alertaConfigRepo.findConfig();

    if (!config || !config.activa) {
      return 0;
    }

    const vencimientos = await this.vencimientoRepo.findProximosAVencer(config.diasAnticipacion);

    for (const vencimiento of vencimientos) {
      const subject = `Vencimiento próximo: ${vencimiento.descripcion}`;
      const body = [
        `Vencimiento próximo a vencer:`,
        `- Descripción: ${vencimiento.descripcion}`,
        `- Fecha: ${vencimiento.fechaVencimiento.toLocaleDateString('es-AR')}`,
        `- Periodo: ${vencimiento.periodo}`,
        `- Tipo: ${vencimiento.tipoObligacion}`,
      ].join('\n');

      await this.mailSender.send(config.estudioId, subject, body);
    }

    return vencimientos.length;
  }
}
