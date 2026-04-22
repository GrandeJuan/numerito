import { PdfKitCalendarioPdfGenerator } from './pdfkit-calendario-pdf-generator';
import type { CalendarioPdfInput } from '../../domain/ports/pdf-generator.port';

// ── Mock pdfkit ───────────────────────────────────────────────
// PDFKit streams data via 'data' events and emits 'end' when done.
// We mock the entire PDFDocument to capture method calls and emit
// a fake PDF buffer, so tests verify rendering logic without the
// native pdfkit binary.

const mockDocInstance = {
  on: jest.fn(),
  end: jest.fn(),
  page: { width: 595.28, height: 841.89, margins: { left: 50, right: 50, top: 50, bottom: 50 } },
  y: 50,
  fontSize: jest.fn().mockReturnThis(),
  fillColor: jest.fn().mockReturnThis(),
  text: jest.fn().mockReturnThis(),
  rect: jest.fn().mockReturnThis(),
  fill: jest.fn().mockReturnThis(),
  save: jest.fn().mockReturnThis(),
  restore: jest.fn().mockReturnThis(),
  moveDown: jest.fn().mockReturnThis(),
  moveTo: jest.fn().mockReturnThis(),
  lineTo: jest.fn().mockReturnThis(),
  strokeColor: jest.fn().mockReturnThis(),
  lineWidth: jest.fn().mockReturnThis(),
  stroke: jest.fn().mockReturnThis(),
  addPage: jest.fn().mockReturnThis(),
};

jest.mock('pdfkit', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => {
      // Reset y for each new instance
      mockDocInstance.y = 50;
      // Wire up on/end to emit data+end events synchronously on end()
      const listeners: Record<string, (...args: unknown[]) => void[]> = {};
      mockDocInstance.on.mockImplementation((event: string, cb: (...args: unknown[]) => void) => {
        listeners[event] = listeners[event] || [];
        listeners[event].push(cb);
        return mockDocInstance;
      });
      mockDocInstance.end.mockImplementation(() => {
        const pdfHeader = Buffer.from('%PDF-1.4 mock content');
        for (const cb of listeners['data'] ?? []) cb(pdfHeader);
        for (const cb of listeners['end'] ?? []) cb();
      });
      return mockDocInstance;
    }),
  };
});

describe('PdfKitCalendarioPdfGenerator', () => {
  let generator: PdfKitCalendarioPdfGenerator;

  const baseInput: CalendarioPdfInput = {
    clienteNombre: 'Empresa Test SRL',
    estudioNombre: 'Estudio Pini',
    estudioCuit: '30-12345678-9',
    periodo: '2026-05',
    generadoEl: new Date('2026-05-01T10:00:00Z'),
    sections: [
      {
        title: 'Vencimientos Nacionales',
        rows: [
          {
            obligacion: 'IVA',
            periodo: '2026-05',
            fecha: '2026-05-20',
            jurisdiccion: 'NACIONAL',
            estado: 'Pendiente',
          },
          {
            obligacion: 'SICOSS',
            periodo: '2026-05',
            fecha: '2026-05-15',
            jurisdiccion: 'NACIONAL',
            estado: 'Presentado',
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    generator = new PdfKitCalendarioPdfGenerator();
  });

  it('should return a Buffer', async () => {
    const result = await generator.generarCalendarioMensual(baseInput);
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should create PDFDocument with A4 size and metadata', async () => {
    await generator.generarCalendarioMensual(baseInput);

    const PDFDocument = (await import('pdfkit')).default;
    expect(PDFDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        size: 'A4',
        info: expect.objectContaining({
          Title: 'Calendario de Vencimientos — Mayo 2026',
          Author: 'Estudio Pini',
          Creator: 'Numerito ERP',
        }),
      }),
    );
  });

  it('should render header with periodo formatted in Spanish', async () => {
    await generator.generarCalendarioMensual(baseInput);

    const textCalls = mockDocInstance.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toContainEqual(expect.stringContaining('Mayo 2026'));
  });

  it('should render client and estudio info', async () => {
    await generator.generarCalendarioMensual(baseInput);

    const textCalls = mockDocInstance.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toContainEqual(expect.stringContaining('Empresa Test SRL'));
    expect(textCalls).toContainEqual(expect.stringContaining('Estudio Pini'));
    expect(textCalls).toContainEqual(expect.stringContaining('30-12345678-9'));
  });

  it('should render table rows for each vencimiento', async () => {
    await generator.generarCalendarioMensual(baseInput);

    const textCalls = mockDocInstance.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toContain('IVA');
    expect(textCalls).toContain('SICOSS');
    expect(textCalls).toContain('2026-05-20');
    expect(textCalls).toContain('2026-05-15');
  });

  it('should render table headers', async () => {
    await generator.generarCalendarioMensual(baseInput);

    const textCalls = mockDocInstance.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toContain('Obligación');
    expect(textCalls).toContain('Período');
    expect(textCalls).toContain('Fecha');
    expect(textCalls).toContain('Jurisdicción');
    expect(textCalls).toContain('Estado');
  });

  it('should handle empty sections gracefully', async () => {
    const emptyInput: CalendarioPdfInput = { ...baseInput, sections: [] };

    const result = await generator.generarCalendarioMensual(emptyInput);
    expect(result).toBeInstanceOf(Buffer);

    const textCalls = mockDocInstance.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toContainEqual(expect.stringContaining('No hay vencimientos proyectados'));
  });

  it('should use color coding for estado values', async () => {
    const inputWithEstados: CalendarioPdfInput = {
      ...baseInput,
      sections: [
        {
          title: 'Test',
          rows: [
            {
              obligacion: 'A',
              periodo: '2026-05',
              fecha: '2026-05-01',
              jurisdiccion: 'NAC',
              estado: 'Presentado',
            },
            {
              obligacion: 'B',
              periodo: '2026-05',
              fecha: '2026-05-02',
              jurisdiccion: 'NAC',
              estado: 'Vencido',
            },
            {
              obligacion: 'C',
              periodo: '2026-05',
              fecha: '2026-05-03',
              jurisdiccion: 'NAC',
              estado: 'Pendiente',
            },
          ],
        },
      ],
    };

    await generator.generarCalendarioMensual(inputWithEstados);

    const fillColorCalls = mockDocInstance.fillColor.mock.calls.map((c: any[]) => c[0]);
    // Green for presentado, red for vencido, orange for pendiente
    expect(fillColorCalls).toContain('#38a169');
    expect(fillColorCalls).toContain('#e53e3e');
    expect(fillColorCalls).toContain('#dd6b20');
  });

  it('should render footer with generation timestamp', async () => {
    await generator.generarCalendarioMensual(baseInput);

    const textCalls = mockDocInstance.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).toContainEqual(
      expect.stringContaining('Documento generado automáticamente por Numerito'),
    );
  });

  it('should call doc.end() to finalize the PDF', async () => {
    await generator.generarCalendarioMensual(baseInput);
    expect(mockDocInstance.end).toHaveBeenCalledTimes(1);
  });

  it('should format all 12 months correctly', async () => {
    const months = [
      ['01', 'Enero'],
      ['02', 'Febrero'],
      ['03', 'Marzo'],
      ['04', 'Abril'],
      ['05', 'Mayo'],
      ['06', 'Junio'],
      ['07', 'Julio'],
      ['08', 'Agosto'],
      ['09', 'Septiembre'],
      ['10', 'Octubre'],
      ['11', 'Noviembre'],
      ['12', 'Diciembre'],
    ];

    for (const [num, name] of months) {
      jest.clearAllMocks();
      const input: CalendarioPdfInput = { ...baseInput, periodo: `2026-${num}` };
      await generator.generarCalendarioMensual(input);

      const PDFDocument = (await import('pdfkit')).default;
      expect(PDFDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          info: expect.objectContaining({
            Title: `Calendario de Vencimientos — ${name} 2026`,
          }),
        }),
      );
    }
  });

  it('should omit estudio fields when not provided', async () => {
    const minimalInput: CalendarioPdfInput = {
      clienteNombre: 'Test SRL',
      periodo: '2026-06',
      generadoEl: new Date('2026-06-01'),
      sections: [],
    };

    await generator.generarCalendarioMensual(minimalInput);

    const textCalls = mockDocInstance.text.mock.calls.map((c: any[]) => c[0]);
    const estudioTexts = textCalls.filter(
      (t: string) => typeof t === 'string' && t.includes('Estudio:'),
    );
    const cuitTexts = textCalls.filter(
      (t: string) => typeof t === 'string' && t.includes('CUIT Estudio:'),
    );
    expect(estudioTexts).toHaveLength(0);
    expect(cuitTexts).toHaveLength(0);
  });

  it('should propagate pdfkit errors', async () => {
    // Override end to emit error
    mockDocInstance.end.mockImplementationOnce(() => {
      const listeners: Record<string, (...args: unknown[]) => void[]> = {};
      // Re-wire to capture the actual listeners from `on` calls
      const onCalls = mockDocInstance.on.mock.calls;
      for (const [event, cb] of onCalls) {
        listeners[event] = listeners[event] || [];
        listeners[event].push(cb);
      }
      for (const cb of listeners['error'] ?? []) cb(new Error('PDF generation failed'));
    });

    await expect(generator.generarCalendarioMensual(baseInput)).rejects.toThrow(
      'PDF generation failed',
    );
  });
});
