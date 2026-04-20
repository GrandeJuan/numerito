import type { VencimientoRepository } from '../../domain/repositories/vencimiento.repository';
import type { AlertaConfigRepository } from '../../domain/repositories/alerta-config.repository';
import type { RecordatorioEnviadoRepository } from '../../domain/repositories/recordatorio-enviado.repository';
import type { NotificacionRepository } from '../../../notificaciones/domain/repositories/notificacion.repository';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import {
  RecordatorioEnviado,
  TIPO_RECORDATORIO,
  CANAL_RECORDATORIO,
} from '../../domain/entities/recordatorio-enviado.entity';
import { Notificacion, TipoNotificacion } from '../../../notificaciones/domain/entities/notificacion.entity';

export interface ProcesarAlertasEnRiesgoResult {
  estudiosProcessados: number;
  alertasEnviadas: number;
  errores: string[];
}

/** Vencimientos PENDIENTE within 2 days that still have no presentación */
const DIAS_EN_RIESGO = 2;

export class ProcesarAlertasEnRiesgoHandler {
  constructor(
    private readonly alertaConfigRepo: AlertaConfigRepository,
    private readonly vencimientoRepo: VencimientoRepository,
    private readonly recordatorioRepo: RecordatorioEnviadoRepository,
    private readonly notificacionRepo: NotificacionRepository,
  ) {}

  async execute(): Promise<ProcesarAlertasEnRiesgoResult> {
    const configs = await this.alertaConfigRepo.findAllActivas();
    let totalAlertas = 0;
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
          DIAS_EN_RIESGO,
        );

        for (const vencimiento of vencimientos) {
          try {
            if (!vencimiento.responsableId) continue;

            const yaEnviado = await this.recordatorioRepo.existsForVencimiento(
              vencimiento.id,
              TIPO_RECORDATORIO.EN_RIESGO,
            );
            if (yaEnviado) continue;

            const notificacion = Notificacion.create({
              usuarioId: vencimiento.responsableId,
              estudioId: config.estudioId,
              tipo: TipoNotificacion.VENCIMIENTO_PROXIMO,
              mensaje: `⚠ EN RIESGO: ${vencimiento.descripcion} vence el ${vencimiento.fechaVencimiento.toLocaleDateString('es-AR')} y aún no fue presentado`,
            });
            await this.notificacionRepo.save(notificacion);

            const record = RecordatorioEnviado.create({
              vencimientoId: vencimiento.id,
              estudioId: config.estudioId,
              clienteId: vencimiento.clienteId,
              tipoRecordatorio: TIPO_RECORDATORIO.EN_RIESGO,
              canal: CANAL_RECORDATORIO.INTERNAL,
              destinatarioId: vencimiento.responsableId,
            });
            await this.recordatorioRepo.save(record);

            totalAlertas++;
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
      alertasEnviadas: totalAlertas,
      errores,
    };
  }
}
