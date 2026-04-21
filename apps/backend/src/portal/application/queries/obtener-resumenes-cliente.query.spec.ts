import { ObtenerResumenesClienteHandler } from './obtener-resumenes-cliente.query';
import { ResumenMensual } from '../../../notificaciones/domain/entities/resumen-mensual.entity';
import type { ResumenMensualRepository } from '../../../notificaciones/domain/repositories/resumen-mensual.repository';

function buildResumen(overrides?: Partial<{
  periodo: string;
  totalVencimientos: number;
  emailEnviado: boolean;
  estado: string;
}>) {
  const resumen = ResumenMensual.create({
    estudioId: 'est-1',
    clienteId: 'cli-1',
    clienteNombre: 'Empresa SRL',
    periodo: overrides?.periodo ?? '2026-04',
    totalVencimientos: overrides?.totalVencimientos ?? 10,
  });
  if (overrides?.estado === 'LISTO') {
    resumen.marcarListo(Buffer.from('pdf-data'));
  }
  if (overrides?.emailEnviado) {
    resumen.marcarEmailEnviado();
  }
  return resumen;
}

function buildRepo(resumenes: ResumenMensual[] = []): jest.Mocked<ResumenMensualRepository> {
  return {
    findById: jest.fn(),
    findByClienteAndPeriodo: jest.fn(),
    findByEstudioAndPeriodo: jest.fn(),
    findByClienteRecientes: jest.fn().mockResolvedValue(resumenes),
    save: jest.fn(),
  };
}

describe('ObtenerResumenesClienteHandler', () => {
  it('should return mapped resumenes for a client', async () => {
    const resumen = buildResumen({ periodo: '2026-04', totalVencimientos: 8 });
    const repo = buildRepo([resumen]);
    const handler = new ObtenerResumenesClienteHandler(repo);

    const result = await handler.execute({ clienteId: 'cli-1' });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(resumen.id);
    expect(result[0].periodo).toBe('2026-04');
    expect(result[0].totalVencimientos).toBe(8);
  });

  it('should return empty array when no resumenes exist', async () => {
    const repo = buildRepo([]);
    const handler = new ObtenerResumenesClienteHandler(repo);

    const result = await handler.execute({ clienteId: 'cli-1' });

    expect(result).toEqual([]);
  });

  it('should default limit to 12 when not specified', async () => {
    const repo = buildRepo([]);
    const handler = new ObtenerResumenesClienteHandler(repo);

    await handler.execute({ clienteId: 'cli-1' });

    expect(repo.findByClienteRecientes).toHaveBeenCalledWith('cli-1', 12);
  });

  it('should respect custom limit', async () => {
    const repo = buildRepo([]);
    const handler = new ObtenerResumenesClienteHandler(repo);

    await handler.execute({ clienteId: 'cli-1', limit: 6 });

    expect(repo.findByClienteRecientes).toHaveBeenCalledWith('cli-1', 6);
  });

  it('should map estado correctly', async () => {
    const resumen = buildResumen({ estado: 'LISTO' });
    const repo = buildRepo([resumen]);
    const handler = new ObtenerResumenesClienteHandler(repo);

    const result = await handler.execute({ clienteId: 'cli-1' });

    expect(result[0].estado).toBe('LISTO');
  });

  it('should map emailEnviado correctly', async () => {
    const resumen = buildResumen({ estado: 'LISTO', emailEnviado: true });
    const repo = buildRepo([resumen]);
    const handler = new ObtenerResumenesClienteHandler(repo);

    const result = await handler.execute({ clienteId: 'cli-1' });

    expect(result[0].emailEnviado).toBe(true);
  });

  it('should return multiple resumenes in order from repo', async () => {
    const r1 = buildResumen({ periodo: '2026-04', totalVencimientos: 10 });
    const r2 = buildResumen({ periodo: '2026-03', totalVencimientos: 8 });
    const r3 = buildResumen({ periodo: '2026-02', totalVencimientos: 12 });
    const repo = buildRepo([r1, r2, r3]);
    const handler = new ObtenerResumenesClienteHandler(repo);

    const result = await handler.execute({ clienteId: 'cli-1' });

    expect(result).toHaveLength(3);
    expect(result[0].periodo).toBe('2026-04');
    expect(result[1].periodo).toBe('2026-03');
    expect(result[2].periodo).toBe('2026-02');
  });
});
