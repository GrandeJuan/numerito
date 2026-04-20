import { Injectable, Logger } from '@nestjs/common';
import type {
  PdfGeneratorPort,
  CalendarioPdfInput,
} from '../../domain/ports/pdf-generator.port';

/**
 * Simple PDF generator that produces a structured text buffer.
 *
 * In production, replace with a pdfkit or Puppeteer-based adapter
 * that renders proper PDF with branding. This stub allows the full
 * pipeline (projection → PDF → email → portal) to work end-to-end
 * without native PDF dependencies.
 */
@Injectable()
export class SimplePdfGenerator implements PdfGeneratorPort {
  private readonly logger = new Logger(SimplePdfGenerator.name);

  async generarCalendarioMensual(input: CalendarioPdfInput): Promise<Buffer> {
    const lines: string[] = [];

    lines.push('='.repeat(60));
    lines.push(`CALENDARIO DE VENCIMIENTOS — ${this.formatPeriodo(input.periodo)}`);
    lines.push('='.repeat(60));
    lines.push('');

    if (input.estudioNombre) {
      lines.push(`Estudio: ${input.estudioNombre}`);
    }
    lines.push(`Cliente: ${input.clienteNombre}`);
    lines.push(`Generado: ${input.generadoEl.toLocaleDateString('es-AR')}`);
    lines.push('');

    for (const section of input.sections) {
      lines.push('-'.repeat(60));
      lines.push(section.title);
      lines.push('-'.repeat(60));
      lines.push(
        this.padRight('Obligacion', 25) +
        this.padRight('Periodo', 10) +
        this.padRight('Fecha', 12) +
        this.padRight('Jurisd.', 12) +
        'Estado',
      );
      lines.push('');

      for (const row of section.rows) {
        lines.push(
          this.padRight(row.obligacion, 25) +
          this.padRight(row.periodo, 10) +
          this.padRight(row.fecha, 12) +
          this.padRight(row.jurisdiccion, 12) +
          row.estado,
        );
      }
      lines.push('');
    }

    lines.push('='.repeat(60));
    lines.push('Documento generado automaticamente por Numerito.');
    lines.push('='.repeat(60));

    const content = lines.join('\n');
    this.logger.debug(`[DEV PDF] Generated ${content.length} bytes for ${input.clienteNombre}`);

    return Buffer.from(content, 'utf-8');
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

  private padRight(str: string, len: number): string {
    return str.length >= len ? str.slice(0, len) : str + ' '.repeat(len - str.length);
  }
}
