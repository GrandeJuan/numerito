import { IngestaEjecucionController } from './ingesta-ejecucion.controller';
import type { ProcesarResultadoScrapingHandler } from '../../application/commands/procesar-resultado-scraping.command';
import type { EjecutarIngestaManualHandler } from '../../application/commands/ejecutar-ingesta-manual.command';
import type { EjecucionIngestaListHandler } from '../../application/queries/ejecucion-ingesta-list.query';

function createController() {
  const procesar = {
    execute: jest.fn().mockResolvedValue({
      ejecucionId: 'ej-1',
      reglasNuevas: 2,
      reglasModificadas: 1,
      sinCambios: 0,
      errores: [],
      diff: [],
    }),
  } as unknown as jest.Mocked<ProcesarResultadoScrapingHandler>;

  const ejecutarManual = {
    execute: jest.fn().mockResolvedValue({
      mode: 'async',
      fuente: 'ARCA',
      taskArn: 'arn:aws:ecs:us-east-1:123:task/abc',
    }),
  } as unknown as jest.Mocked<EjecutarIngestaManualHandler>;

  const list = {
    execute: jest.fn().mockResolvedValue([]),
  } as unknown as jest.Mocked<EjecucionIngestaListHandler>;

  const controller = new IngestaEjecucionController(procesar, ejecutarManual, list);
  return { controller, procesar, ejecutarManual, list };
}

describe('IngestaEjecucionController', () => {
  it('should receive resultado via webhook (Fargate) with SCHEDULE disparador', async () => {
    const { controller, procesar } = createController();

    const dto = {
      fuente: 'ARCA' as const,
      ejecutadoEn: '2026-04-20T10:00:00Z',
      reglas: [
        {
          tipoObligacion: 'IVA',
          jurisdiccion: 'ARCA',
          regimen: 'GENERAL',
          terminacionCuit: '0',
          diaVencimiento: 22,
          mesSiguiente: true,
          vigenciaDesde: '2026-01-01',
        },
      ],
      errores: [],
    };

    const req = { headers: { 'x-ingesta-secret': 'test-secret' } };
    const result = await controller.recibirResultado('ARCA', dto, req as any);
    expect(procesar.execute).toHaveBeenCalledWith(
      expect.objectContaining({ disparador: 'SCHEDULE', disparadoPor: null }),
    );
    expect(result).toHaveProperty('data');
  });

  it('should receive resultado via admin JWT with MANUAL disparador', async () => {
    const { controller, procesar } = createController();

    const dto = {
      fuente: 'ARCA' as const,
      ejecutadoEn: '2026-04-20T10:00:00Z',
      reglas: [],
      errores: [],
    };

    const req = { headers: {}, user: { sub: 'user-123' } };
    const result = await controller.recibirResultado('ARCA', dto, req as any);
    expect(procesar.execute).toHaveBeenCalledWith(
      expect.objectContaining({ disparador: 'MANUAL', disparadoPor: 'user-123' }),
    );
    expect(result).toHaveProperty('data');
  });

  it('should list ejecuciones', async () => {
    const { controller, list } = createController();
    const result = await controller.listEjecuciones('ARCA', undefined);
    expect(list.execute).toHaveBeenCalledWith({ fuente: 'ARCA', estado: undefined });
    expect(result).toHaveProperty('data');
  });

  it('should delegate ejecutar-ahora to handler', async () => {
    const { controller, ejecutarManual } = createController();
    const result = await controller.ejecutarAhora('ARCA');
    expect(ejecutarManual.execute).toHaveBeenCalledWith({
      fuente: 'ARCA',
      disparadoPor: 'admin',
    });
    expect(result).toHaveProperty('data');
    expect(result.data).toHaveProperty('mode', 'async');
    expect(result.data).toHaveProperty('taskArn');
  });

  it('should propagate errors from procesarHandler', async () => {
    const { controller, procesar } = createController();
    (procesar as any).execute.mockRejectedValue(new Error('processing failed'));

    const req = { headers: {}, user: { sub: 'admin' } };
    await expect(
      controller.recibirResultado('ARCA', {
        fuente: 'ARCA',
        ejecutadoEn: '2026-04-20T10:00:00Z',
        reglas: [],
        errores: [],
      }, req as any),
    ).rejects.toThrow('processing failed');
  });

  it('should propagate errors from ejecutarManualHandler', async () => {
    const { controller, ejecutarManual } = createController();
    (ejecutarManual as any).execute.mockRejectedValue(new Error('launch failed'));

    await expect(controller.ejecutarAhora('ARCA')).rejects.toThrow('launch failed');
  });
});
