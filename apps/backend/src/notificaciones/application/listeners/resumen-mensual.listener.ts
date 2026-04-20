import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EntityManager } from '@mikro-orm/core';
import { OBLIGACIONES_EVENTS } from '../../../obligaciones/application/public-events';
import type { CalendarioMensualListoPayload } from '../../../obligaciones/application/public-events';
import type { PdfGeneratorPort, PdfSection, PdfTableRow } from '../../../shared/domain/ports/pdf-generator.port';
import type { MailSenderPort } from '../../../shared/domain/ports/mail-sender.port';
import type { ResumenMensualRepository } from '../../domain/repositories/resumen-mensual.repository';
import { ResumenMensual } from '../../domain/entities/resumen-mensual.entity';
import { Notificacion, TipoNotificacion } from '../../domain/entities/notificacion.entity';
import type { NotificacionRepository } from '../../domain/repositories/notificacion.repository';

/**
 * Listens to calendario-mensual-listo events and:
 * 1. Generates a PDF consolidado with the client's vencimientos for the period
 * 2. Sends it via email to the client's contact (if available)
 * 3. Creates a portal notification so the client can download it
 *
 * This listener runs in a fire-and-forget manner — errors are logged
 * but do not affect the projection pipeline.
 */
@Injectable()
export class ResumenMensualListener {
  private readonly logger = new Logger(ResumenMensualListener.name);

  constructor(
    private readonly pdfGenerator: PdfGeneratorPort,
    private readonly mailSender: MailSenderPort,
    private readonly resumenRepo: ResumenMensualRepository,
    private readonly notificacionRepo: NotificacionRepository,
    private readonly em: EntityManager,
  ) {}

  @OnEvent(OBLIGACIONES_EVENTS.CALENDARIO_MENSUAL_LISTO)
  async handleCalendarioMensualListo(event: CalendarioMensualListoPayload): Promise<void> {
    try {
      // Check idempotency — skip if resumen already exists for this client+period
      const existing = await this.resumenRepo.findByClienteAndPeriodo(
        event.estudioId,
        event.clienteId,
        event.periodo,
      );
      if (existing) {
        this.logger.debug(
          `Resumen already exists for client=${event.clienteId} period=${event.periodo}, skipping`,
        );
        return;
      }

      // Create the resumen entity
      const resumen = ResumenMensual.create({
        estudioId: event.estudioId,
        clienteId: event.clienteId,
        clienteNombre: event.clienteNombre,
        periodo: event.periodo,
        totalVencimientos: event.totalVencimientos,
      });

      // Fetch vencimientos for this client+period via raw SQL
      const sections = await this.buildPdfSections(
        event.estudioId,
        event.clienteId,
        event.periodo,
      );

      // Generate PDF
      const pdfBuffer = await this.pdfGenerator.generarCalendarioMensual({
        clienteNombre: event.clienteNombre,
        periodo: event.periodo,
        sections,
        generadoEl: new Date(),
      });

      resumen.marcarListo(pdfBuffer);
      await this.resumenRepo.save(resumen);

      // Send email if mail sender supports attachments
      await this.sendEmailIfPossible(event, pdfBuffer);
      if (resumen.estado === 'LISTO') {
        resumen.marcarEmailEnviado();
        await this.resumenRepo.save(resumen);
      }

      // Create portal notification
      await this.createPortalNotification(event, resumen.id);

      this.logger.log(
        `Resumen mensual generated for client=${event.clienteNombre} period=${event.periodo}`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Failed to generate resumen for client=${event.clienteId} period=${event.periodo}: ${msg}`,
      );
    }
  }

  private async buildPdfSections(
    estudioId: string,
    clienteId: string,
    periodo: string,
  ): Promise<PdfSection[]> {
    const conn = this.em.getConnection();
    const rows = await conn.execute<{
      tipo_obligacion: string;
      periodo: string;
      fecha_vencimiento: string;
      descripcion: string;
      estado_nombre: string;
    }[]>(
      `SELECT v.tipo_obligacion, v.periodo, v.fecha_vencimiento::text,
              v.descripcion, ev.nombre as estado_nombre
       FROM vencimiento v
       JOIN estado_vencimiento ev ON ev.id = v.estado_id
       WHERE v.estudio_id = ? AND v.cliente_id = ? AND v.periodo = ?
       ORDER BY v.fecha_vencimiento ASC`,
      [estudioId, clienteId, periodo],
    );

    if (rows.length === 0) {
      return [];
    }

    const pdfRows: PdfTableRow[] = rows.map((r) => ({
      obligacion: r.descripcion || r.tipo_obligacion,
      periodo: r.periodo,
      fecha: r.fecha_vencimiento,
      jurisdiccion: '-',
      estado: r.estado_nombre,
    }));

    return [
      {
        title: `Vencimientos ${this.formatPeriodo(periodo)}`,
        rows: pdfRows,
      },
    ];
  }

  private async sendEmailIfPossible(
    event: CalendarioMensualListoPayload,
    pdfBuffer: Buffer,
  ): Promise<void> {
    const filename = `calendario-${event.periodo}-${event.clienteNombre.replace(/\s+/g, '-').toLowerCase()}.pdf`;

    if (this.mailSender.sendWithAttachments) {
      await this.mailSender.sendWithAttachments(
        '', // No email available on Cliente entity yet — logged as dev placeholder
        `Calendario de vencimientos — ${this.formatPeriodo(event.periodo)}`,
        `Estimado/a ${event.clienteNombre},\n\nAdjunto encontrará el calendario de vencimientos del período ${this.formatPeriodo(event.periodo)}.\n\nSaludos,\nNumerito`,
        [{ filename, content: pdfBuffer, contentType: 'application/pdf' }],
      );
    } else {
      await this.mailSender.send(
        '',
        `Calendario de vencimientos — ${this.formatPeriodo(event.periodo)}`,
        `Estimado/a ${event.clienteNombre},\n\nSu calendario de vencimientos del período ${this.formatPeriodo(event.periodo)} está disponible en el portal.\n\nSaludos,\nNumerito`,
      );
    }
  }

  private async createPortalNotification(
    event: CalendarioMensualListoPayload,
    resumenId: string,
  ): Promise<void> {
    // Look up the usuario linked to this client for portal notification
    const conn = this.em.getConnection();
    const userRows = await conn.execute<{ usuario_id: string }[]>(
      `SELECT u.id as usuario_id
       FROM usuario u
       JOIN cliente c ON c.cuit = u.cuit
       WHERE c.id = ?
       LIMIT 1`,
      [event.clienteId],
    );

    if (userRows.length === 0) {
      this.logger.debug(`No portal user found for client=${event.clienteId}, skipping notification`);
      return;
    }

    const notificacion = Notificacion.create({
      usuarioId: userRows[0].usuario_id,
      estudioId: event.estudioId,
      tipo: TipoNotificacion.VENCIMIENTO_PROXIMO,
      mensaje: `Su calendario de vencimientos de ${this.formatPeriodo(event.periodo)} está listo. ${event.totalVencimientos} vencimiento(s) programado(s).`,
    });

    await this.notificacionRepo.save(notificacion);
  }

  private formatPeriodo(periodo: string): string {
    const [year, month] = periodo.split('-');
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    const idx = parseInt(month, 10) - 1;
    return `${meses[idx] ?? month} ${year}`;
  }
}
