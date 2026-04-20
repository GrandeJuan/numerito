import { AprobarSugerenciaProrrogaHandler } from './aprobar-sugerencia-prorroga.command';
import { SugerenciaProrroga, ESTADO_SUGERENCIA } from '../../domain/entities/sugerencia-prorroga.entity';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

function makeSugerencia(overrides: Partial<Parameters<typeof SugerenciaProrroga.create>[0]> = {}) {
  return SugerenciaProrroga.create({
    vencimientoId: 'venc-1',
    estudioId: 'est-1',
    clienteId: 'cli-1',
    tipoObligacion: 'IVA',
    periodo: '2026-05',
    fechaOriginal: new Date('2026-05-20'),
    fechaSugerida: new Date('2026-05-22'),
    motivo: 'diaVencimiento: 20 → 22',
    reglaActivaId: 'regla-1',
    ejecucionIngestaId: 'ejec-1',
    ...overrides,
  });
}

const principal = { estudioId: 'est-1', userId: 'user-1', roles: [] as string[] };

describe('AprobarSugerenciaProrrogaHandler', () => {
  it('approves sugerencia and calls prorrogar on the vencimiento', async () => {
    const sugerencia = makeSugerencia();
    const sugerenciaRepo = {
      findById: jest.fn().mockResolvedValue(sugerencia),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const prorrogarHandler = {
      execute: jest.fn().mockResolvedValue({}),
    };

    const handler = new AprobarSugerenciaProrrogaHandler(
      sugerenciaRepo as any,
      prorrogarHandler as any,
    );

    await handler.execute(principal, { sugerenciaId: sugerencia.id });

    expect(sugerencia.estado).toBe(ESTADO_SUGERENCIA.APROBADA);
    expect(sugerenciaRepo.save).toHaveBeenCalledWith(principal, sugerencia);
    expect(prorrogarHandler.execute).toHaveBeenCalledWith(principal, {
      vencimientoId: 'venc-1',
      motivo: expect.stringContaining('Prórroga automática por scraping'),
      nuevaFecha: '2026-05-22',
    });
  });

  it('throws when sugerencia not found', async () => {
    const sugerenciaRepo = {
      findById: jest.fn().mockResolvedValue(null),
    };
    const prorrogarHandler = { execute: jest.fn() };

    const handler = new AprobarSugerenciaProrrogaHandler(
      sugerenciaRepo as any,
      prorrogarHandler as any,
    );

    await expect(
      handler.execute(principal, { sugerenciaId: 'nonexistent' }),
    ).rejects.toThrow(RecursoNoEncontradoError);
    expect(prorrogarHandler.execute).not.toHaveBeenCalled();
  });
});
