export interface PdfSection {
  title: string;
  rows: PdfTableRow[];
}

export interface PdfTableRow {
  obligacion: string;
  periodo: string;
  fecha: string;
  jurisdiccion: string;
  estado: string;
}

export interface CalendarioPdfInput {
  clienteNombre: string;
  estudioCuit?: string;
  estudioNombre?: string;
  periodo: string; // YYYY-MM
  sections: PdfSection[];
  generadoEl: Date;
}

export interface PdfGeneratorPort {
  generarCalendarioMensual(input: CalendarioPdfInput): Promise<Buffer>;
}

export const PDF_GENERATOR = Symbol('PdfGenerator');
