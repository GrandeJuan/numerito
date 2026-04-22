import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EntityManager } from '@mikro-orm/core';
import { OBLIGACIONES_EVENTS } from '../../../obligaciones/application/public-events';
import type { CalendarioMensualListoPayload } from '../../../obligaciones/application/public-events';
import type {
  PdfGeneratorPort,
  PdfSection,
  PdfTableRow,
} from '../../../shared/domain/ports/pdf-generator.port';
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

      // Look up the portal user linked to this client (for email + notification)
      const portalUser = await this.findPortalUser(event.clienteId);

      // Create the resumen entity
      const resumen = ResumenMensual.create({
        estudioId: event.estudioId,
        clienteId: event.clienteId,
        clienteNombre: event.clienteNombre,
        periodo: event.periodo,
        totalVencimientos: event.totalVencimientos,
      });

      // Fetch vencimientos for this client+period via raw SQL
      const sections = await this.buildPdfSections(event.estudioId, event.clienteId, event.periodo);

      // Generate PDF
      const pdfBuffer = await this.pdfGenerator.generarCalendarioMensual({
        clienteNombre: event.clienteNombre,
        periodo: event.periodo,
        sections,
        generadoEl: new Date(),
      });

      resumen.marcarListo(pdfBuffer);
      await this.resumenRepo.save(resumen);

      // Send email to the portal user if we found one with an email
      if (portalUser?.email) {
        await this.sendEmailToClient(event, pdfBuffer, portalUser.email);
        resumen.marcarEmailEnviado();
        await this.resumenRepo.save(resumen);
      } else {
        this.logger.debug(
          `No portal user email found for client=${event.clienteId}, skipping email`,
        );
      }

      // Create portal notification
      if (portalUser?.usuarioId) {
        await this.createPortalNotification(event, resumen.id, portalUser.usuarioId);
      }

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
    const rows = await conn.execute<
      {
        tipo_obligacion: string;
        periodo: string;
        fecha_vencimiento: string;
        descripcion: string;
        estado_nombre: string;
      }[]
    >(
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

    const pdfRows: PdfTableRow[] = (
      rows as Array<{
        tipo_obligacion: string;
        periodo: string;
        fecha_vencimiento: string;
        descripcion: string;
        estado_nombre: string;
      }>
    ).map((r) => ({
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

  /**
   * Finds the portal user (Usuario) linked to a client via CUIT.
   * Returns the usuario ID and email, or null if no user is found.
   */
  private async findPortalUser(
    clienteId: string,
  ): Promise<{ usuarioId: string; email: string | null } | null> {
    const conn = this.em.getConnection();
    const rows = await conn.execute<{ usuario_id: string; email: string | null }[]>(
      `SELECT u.id as usuario_id, u.email
       FROM usuario u
       JOIN cliente c ON c.cuit = u.cuit
       WHERE c.id = ?
       LIMIT 1`,
      [clienteId],
    );

    if (rows.length === 0) {
      return null;
    }

    return { usuarioId: rows[0].usuario_id, email: rows[0].email };
  }

  private async sendEmailToClient(
    event: CalendarioMensualListoPayload,
    pdfBuffer: Buffer,
    email: string,
  ): Promise<void> {
    const filename = `calendario-${event.periodo}-${event.clienteNombre.replace(/\s+/g, '-').toLowerCase()}.pdf`;
    const subject = `Calendario de vencimientos — ${this.formatPeriodo(event.periodo)}`;
    const body = `Estimado/a ${event.clienteNombre},\n\nAdjunto encontrará el calendario de vencimientos del período ${this.formatPeriodo(event.periodo)}.\n\nSaludos,\nNumerito`;

    if (this.mailSender.sendWithAttachments) {
      await this.mailSender.sendWithAttachments(email, subject, body, [
        { filename, content: pdfBuffer, contentType: 'application/pdf' },
      ]);
    } else {
      await this.mailSender.send(
        email,
        subject,
        `Estimado/a ${event.clienteNombre},\n\nSu calendario de vencimientos del período ${this.formatPeriodo(event.periodo)} está disponible en el portal.\n\nSaludos,\nNumerito`,
      );
    }
  }

  private async createPortalNotification(
    event: CalendarioMensualListoPayload,
    resumenId: string,
    usuarioId: string,
  ): Promise<void> {
    const notificacion = Notificacion.create({
      usuarioId,
      estudioId: event.estudioId,
      tipo: TipoNotificacion.VENCIMIENTO_PROXIMO,
      mensaje: `Su calendario de vencimientos de ${this.formatPeriodo(event.periodo)} está listo. ${event.totalVencimientos} vencimiento(s) programado(s).`,
    });

    await this.notificacionRepo.save(notificacion);
  }

  private formatPeriodo(periodo: string): string {
    const [year, month] = periodo.split('-');
    const meses = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    const idx = parseInt(month, 10) - 1;
    return `${meses[idx] ?? month} ${year}`;
  }
}
