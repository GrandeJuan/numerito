import { IngestaEjecucionController } from './ingesta-ejecucion.controller';
import type { ProcesarResultadoScrapingHandler } from '../../application/commands/procesar-resultado-scraping.command';
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

  const list = {
    execute: jest.fn().mockResolvedValue([]),
  } as unknown as jest.Mocked<EjecucionIngestaListHandler>;

  const controller = new IngestaEjecucionController(procesar, list);
  return { controller, procesar, list };
}

describe('IngestaEjecucionController', () => {
  it('should receive and process scraping resultado', async () => {
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

    const result = await controller.recibirResultado('ARCA', dto);
    expect(procesar.execute).toHaveBeenCalledTimes(1);
    expect(result).toHaveProperty('data');
  });

  it('should list ejecuciones', async () => {
    const { controller, list } = createController();
    const result = await controller.listEjecuciones('ARCA', undefined);
    expect(list.execute).toHaveBeenCalledWith({ fuente: 'ARCA', estado: undefined });
    expect(result).toHaveProperty('data');
  });

  it('should return ejecutar-ahora placeholder', async () => {
    const { controller } = createController();
    const result = await controller.ejecutarAhora('ARCA');
    expect(result).toHaveProperty('data');
    expect(result.data).toHaveProperty('fuente', 'ARCA');
  });

  it('should propagate errors from procesarHandler', async () => {
    const { controller, procesar } = createController();
    (procesar as any).execute.mockRejectedValue(new Error('processing failed'));

    await expect(
      controller.recibirResultado('ARCA', {
        fuente: 'ARCA',
        ejecutadoEn: '2026-04-20T10:00:00Z',
        reglas: [],
        errores: [],
      }),
    ).rejects.toThrow('processing failed');
  });
});
