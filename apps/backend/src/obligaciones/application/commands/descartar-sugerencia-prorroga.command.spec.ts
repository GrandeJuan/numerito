import { DescartarSugerenciaProrrogaHandler } from './descartar-sugerencia-prorroga.command';
import { SugerenciaProrroga, ESTADO_SUGERENCIA } from '../../domain/entities/sugerencia-prorroga.entity';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

function makeSugerencia() {
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
    ejecucionIngestaId: null,
  });
}

const principal = { estudioId: 'est-1', userId: 'user-1', roles: [] as string[] };

describe('DescartarSugerenciaProrrogaHandler', () => {
  it('discards sugerencia without affecting vencimiento', async () => {
    const sugerencia = makeSugerencia();
    const sugerenciaRepo = {
      findById: jest.fn().mockResolvedValue(sugerencia),
      save: jest.fn().mockResolvedValue(undefined),
    };

    const handler = new DescartarSugerenciaProrrogaHandler(sugerenciaRepo as any);
    await handler.execute(principal, { sugerenciaId: sugerencia.id });

    expect(sugerencia.estado).toBe(ESTADO_SUGERENCIA.DESCARTADA);
    expect(sugerenciaRepo.save).toHaveBeenCalledWith(principal, sugerencia);
  });

  it('throws when sugerencia not found', async () => {
    const sugerenciaRepo = {
      findById: jest.fn().mockResolvedValue(null),
    };

    const handler = new DescartarSugerenciaProrrogaHandler(sugerenciaRepo as any);

    await expect(
      handler.execute(principal, { sugerenciaId: 'nonexistent' }),
    ).rejects.toThrow(RecursoNoEncontradoError);
  });
});
