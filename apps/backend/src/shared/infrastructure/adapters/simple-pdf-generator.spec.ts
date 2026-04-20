import { SimplePdfGenerator } from './simple-pdf-generator';
import type { CalendarioPdfInput } from '../../domain/ports/pdf-generator.port';

describe('SimplePdfGenerator', () => {
  const generator = new SimplePdfGenerator();

  const input: CalendarioPdfInput = {
    clienteNombre: 'Empresa Test SRL',
    estudioNombre: 'Estudio Pini',
    periodo: '2026-05',
    generadoEl: new Date('2026-05-01'),
    sections: [
      {
        title: 'Vencimientos Mayo 2026',
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
            estado: 'Pendiente',
          },
        ],
      },
    ],
  };

  it('should generate a buffer with correct content', async () => {
    const buffer = await generator.generarCalendarioMensual(input);

    expect(buffer).toBeInstanceOf(Buffer);
    const content = buffer.toString('utf-8');
    expect(content).toContain('CALENDARIO DE VENCIMIENTOS');
    expect(content).toContain('Mayo 2026');
    expect(content).toContain('Empresa Test SRL');
    expect(content).toContain('Estudio Pini');
  });

  it('should include all table rows', async () => {
    const buffer = await generator.generarCalendarioMensual(input);
    const content = buffer.toString('utf-8');

    expect(content).toContain('IVA');
    expect(content).toContain('SICOSS');
    expect(content).toContain('2026-05-20');
    expect(content).toContain('Pendiente');
  });

  it('should handle empty sections', async () => {
    const emptyInput: CalendarioPdfInput = {
      ...input,
      sections: [],
    };

    const buffer = await generator.generarCalendarioMensual(emptyInput);
    const content = buffer.toString('utf-8');

    expect(content).toContain('CALENDARIO DE VENCIMIENTOS');
    expect(content).toContain('Empresa Test SRL');
  });

  it('should format periodo correctly for all months', async () => {
    const decInput: CalendarioPdfInput = {
      ...input,
      periodo: '2026-12',
    };

    const buffer = await generator.generarCalendarioMensual(decInput);
    const content = buffer.toString('utf-8');

    expect(content).toContain('Diciembre 2026');
  });
});
