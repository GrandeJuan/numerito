import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import type {
  PdfGeneratorPort,
  CalendarioPdfInput,
  PdfSection,
  PdfTableRow,
} from '../../domain/ports/pdf-generator.port';

/**
 * Production PDF generator using pdfkit.
 *
 * Produces a branded calendario mensual PDF with:
 * - Header with estudio/client branding
 * - Grouped table sections (by jurisdiction or obligation type)
 * - Footer with generation timestamp
 *
 * Env toggle: set PDF_ENGINE=pdfkit to activate (otherwise SimplePdfGenerator).
 */
@Injectable()
export class PdfKitCalendarioPdfGenerator implements PdfGeneratorPort {
  private readonly logger = new Logger(PdfKitCalendarioPdfGenerator.name);

  async generarCalendarioMensual(input: CalendarioPdfInput): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Uint8Array[] = [];

      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `Calendario de Vencimientos — ${this.formatPeriodo(input.periodo)}`,
          Author: input.estudioNombre ?? 'Numerito',
          Subject: `Vencimientos ${input.periodo} — ${input.clienteNombre}`,
          Creator: 'Numerito ERP',
        },
      });

      doc.on('data', (chunk: Uint8Array) => chunks.push(chunk));
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        this.logger.debug(
          `PDF generated: ${buffer.length} bytes for ${input.clienteNombre} (${input.periodo})`,
        );
        resolve(buffer);
      });
      doc.on('error', reject);

      this.renderDocument(doc, input);
      doc.end();
    });
  }

  private renderDocument(doc: PDFKit.PDFDocument, input: CalendarioPdfInput): void {
    this.renderHeader(doc, input);
    this.renderClientInfo(doc, input);

    for (let i = 0; i < input.sections.length; i++) {
      this.renderSection(doc, input.sections[i]);
    }

    if (input.sections.length === 0) {
      doc.moveDown(2);
      doc.fontSize(11).fillColor('#666666')
        .text('No hay vencimientos proyectados para este período.', { align: 'center' });
    }

    this.renderFooter(doc, input);
  }

  // ── Header ──────────────────────────────────────────────────

  private renderHeader(doc: PDFKit.PDFDocument, input: CalendarioPdfInput): void {
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Primary title bar
    doc.save();
    doc.rect(doc.page.margins.left, doc.y, pageWidth, 36)
      .fill('#1a365d');

    doc.fontSize(16).fillColor('#ffffff')
      .text(
        `Calendario de Vencimientos — ${this.formatPeriodo(input.periodo)}`,
        doc.page.margins.left + 12,
        doc.y + 10,
        { width: pageWidth - 24 },
      );
    doc.restore();

    doc.y += 44;
  }

  // ── Client info ─────────────────────────────────────────────

  private renderClientInfo(doc: PDFKit.PDFDocument, input: CalendarioPdfInput): void {
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#333333');

    if (input.estudioNombre) {
      doc.text(`Estudio: ${input.estudioNombre}`, { continued: false });
    }
    doc.text(`Cliente: ${input.clienteNombre}`, { continued: false });
    if (input.estudioCuit) {
      doc.text(`CUIT Estudio: ${input.estudioCuit}`, { continued: false });
    }
    doc.text(
      `Generado: ${input.generadoEl.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
      { continued: false },
    );
    doc.moveDown(1);
  }

  // ── Section (jurisdiction group) ────────────────────────────

  private renderSection(doc: PDFKit.PDFDocument, section: PdfSection): void {
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Check if we need a new page (header + at least one row ≈ 80pt)
    if (doc.y > doc.page.height - doc.page.margins.bottom - 80) {
      doc.addPage();
    }

    // Section title
    doc.save();
    doc.rect(doc.page.margins.left, doc.y, pageWidth, 22)
      .fill('#edf2f7');
    doc.fontSize(11).fillColor('#1a365d')
      .text(section.title, doc.page.margins.left + 8, doc.y + 5, { width: pageWidth - 16 });
    doc.restore();
    doc.y += 28;

    // Table header
    this.renderTableHeader(doc, pageWidth);

    // Table rows
    for (const row of section.rows) {
      if (doc.y > doc.page.height - doc.page.margins.bottom - 30) {
        doc.addPage();
        this.renderTableHeader(doc, pageWidth);
      }
      this.renderTableRow(doc, row, pageWidth);
    }

    doc.moveDown(0.8);
  }

  private renderTableHeader(doc: PDFKit.PDFDocument, pageWidth: number): void {
    const cols = this.getColumnLayout(pageWidth);
    const y = doc.y;

    doc.save();
    doc.rect(doc.page.margins.left, y, pageWidth, 18).fill('#f7fafc');
    doc.fontSize(8).fillColor('#4a5568');

    let x = doc.page.margins.left + 4;
    for (const col of cols) {
      doc.text(col.header, x, y + 4, { width: col.width, align: 'left' });
      x += col.width;
    }
    doc.restore();

    // Separator line
    doc.moveTo(doc.page.margins.left, y + 18)
      .lineTo(doc.page.margins.left + pageWidth, y + 18)
      .strokeColor('#e2e8f0').lineWidth(0.5).stroke();

    doc.y = y + 20;
  }

  private renderTableRow(doc: PDFKit.PDFDocument, row: PdfTableRow, pageWidth: number): void {
    const cols = this.getColumnLayout(pageWidth);
    const values = [row.obligacion, row.periodo, row.fecha, row.jurisdiccion, row.estado];
    const y = doc.y;

    doc.fontSize(9).fillColor('#2d3748');

    let x = doc.page.margins.left + 4;
    for (let i = 0; i < cols.length; i++) {
      const color = i === 4 ? this.getEstadoColor(values[i]) : '#2d3748';
      doc.fillColor(color)
        .text(values[i], x, y + 2, { width: cols[i].width, align: 'left' });
      x += cols[i].width;
    }

    // Row separator
    doc.moveTo(doc.page.margins.left, y + 16)
      .lineTo(doc.page.margins.left + pageWidth, y + 16)
      .strokeColor('#edf2f7').lineWidth(0.3).stroke();

    doc.y = y + 18;
  }

  // ── Footer ──────────────────────────────────────────────────

  private renderFooter(doc: PDFKit.PDFDocument, input: CalendarioPdfInput): void {
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const bottomY = doc.page.height - doc.page.margins.bottom - 30;

    // If we're already near the bottom, don't overlap
    const footerY = Math.max(doc.y + 20, bottomY);
    if (footerY > doc.page.height - doc.page.margins.bottom - 10) {
      doc.addPage();
    }

    doc.save();
    doc.moveTo(doc.page.margins.left, footerY)
      .lineTo(doc.page.margins.left + pageWidth, footerY)
      .strokeColor('#cbd5e0').lineWidth(0.5).stroke();

    doc.fontSize(7).fillColor('#a0aec0')
      .text(
        `Documento generado automáticamente por Numerito — ${input.generadoEl.toISOString()}`,
        doc.page.margins.left,
        footerY + 6,
        { width: pageWidth, align: 'center' },
      );
    doc.restore();
  }

  // ── Helpers ─────────────────────────────────────────────────

  private getColumnLayout(pageWidth: number): Array<{ header: string; width: number }> {
    return [
      { header: 'Obligación', width: pageWidth * 0.30 },
      { header: 'Período', width: pageWidth * 0.15 },
      { header: 'Fecha', width: pageWidth * 0.18 },
      { header: 'Jurisdicción', width: pageWidth * 0.20 },
      { header: 'Estado', width: pageWidth * 0.17 },
    ];
  }

  private getEstadoColor(estado: string): string {
    const lower = estado.toLowerCase();
    if (lower === 'presentado' || lower === 'cumplido') return '#38a169';
    if (lower === 'vencido') return '#e53e3e';
    if (lower === 'pendiente') return '#dd6b20';
    if (lower === 'prorrogado') return '#3182ce';
    return '#2d3748';
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
