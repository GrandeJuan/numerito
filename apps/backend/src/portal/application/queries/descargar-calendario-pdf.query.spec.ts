import { DescargarCalendarioPdfHandler } from './descargar-calendario-pdf.query';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

function buildMockEm(entity: any | null = null) {
  return {
    findOne: jest.fn().mockResolvedValue(entity),
  } as any;
}

describe('DescargarCalendarioPdfHandler', () => {
  it('should throw RecursoNoEncontradoError when resumen not found', async () => {
    const handler = new DescargarCalendarioPdfHandler(buildMockEm(null));

    await expect(
      handler.execute({ clienteId: 'cli-1', periodo: '2026-04' }),
    ).rejects.toThrow(RecursoNoEncontradoError);
  });

  it('should throw RecursoNoEncontradoError when resumen has no pdfBuffer', async () => {
    const entity = {
      clienteNombre: 'Empresa SRL',
      pdfBuffer: null,
    };
    const handler = new DescargarCalendarioPdfHandler(buildMockEm(entity));

    await expect(
      handler.execute({ clienteId: 'cli-1', periodo: '2026-04' }),
    ).rejects.toThrow(RecursoNoEncontradoError);
  });

  it('should return buffer and filename when PDF exists', async () => {
    const pdfData = Buffer.from('fake-pdf-content');
    const entity = {
      clienteNombre: 'Empresa SRL',
      pdfBuffer: pdfData,
    };
    const handler = new DescargarCalendarioPdfHandler(buildMockEm(entity));

    const result = await handler.execute({ clienteId: 'cli-1', periodo: '2026-04' });

    expect(result.buffer).toBe(pdfData);
    expect(result.filename).toBe('calendario-2026-04-empresa-srl.pdf');
  });

  it('should sanitize spaces in clienteNombre for filename', async () => {
    const entity = {
      clienteNombre: 'Mi  Gran  Empresa  SA',
      pdfBuffer: Buffer.from('pdf'),
    };
    const handler = new DescargarCalendarioPdfHandler(buildMockEm(entity));

    const result = await handler.execute({ clienteId: 'cli-1', periodo: '2026-03' });

    expect(result.filename).toBe('calendario-2026-03-mi-gran-empresa-sa.pdf');
  });

  it('should query for LISTO estado with matching clienteId and periodo', async () => {
    const em = buildMockEm(null);
    const handler = new DescargarCalendarioPdfHandler(em);

    await expect(
      handler.execute({ clienteId: 'cli-1', periodo: '2026-04' }),
    ).rejects.toThrow();

    expect(em.findOne).toHaveBeenCalledWith(
      expect.anything(),
      {
        clienteId: 'cli-1',
        periodo: '2026-04',
        estado: 'LISTO',
      },
    );
  });

  it('should handle single-word clienteNombre', async () => {
    const entity = {
      clienteNombre: 'Acme',
      pdfBuffer: Buffer.from('pdf'),
    };
    const handler = new DescargarCalendarioPdfHandler(buildMockEm(entity));

    const result = await handler.execute({ clienteId: 'cli-1', periodo: '2026-01' });

    expect(result.filename).toBe('calendario-2026-01-acme.pdf');
  });
});
