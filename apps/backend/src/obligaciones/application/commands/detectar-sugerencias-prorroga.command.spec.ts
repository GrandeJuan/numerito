import {
  DetectarSugerenciasProrrogaHandler,
  type DiffReglaInput,
} from './detectar-sugerencias-prorroga.command';
import type { AjusteDiaHabilService } from '../../domain/services/ajuste-dia-habil.service';
import type { SugerenciaProrrogaRepository } from '../../domain/repositories/sugerencia-prorroga.repository';
import type { SugerenciaProrroga } from '../../domain/entities/sugerencia-prorroga.entity';

function makeAjusteDiaHabil(adjustments: Record<string, string> = {}): AjusteDiaHabilService {
  return {
    ajustar: jest.fn(async (fecha: Date, _jurisdiccion: string) => {
      const key = fecha.toISOString().slice(0, 10);
      if (adjustments[key]) {
        return new Date(adjustments[key]);
      }
      return new Date(fecha);
    }),
  } as any;
}

function makeEntityManager(pendientes: any[] = [], existingOpen: any[] = []) {
  const em = {
    getConnection: () => ({
      execute: jest.fn().mockResolvedValueOnce(pendientes).mockResolvedValueOnce(existingOpen),
    }),
  };
  return em;
}

function makeRepo() {
  const saved: SugerenciaProrroga[] = [];
  const repo: SugerenciaProrrogaRepository = {
    findById: jest.fn(),
    findByVencimientoId: jest.fn(),
    findByEstado: jest.fn(),
    findAbiertas: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    saveManyGlobal: jest.fn(async (entities: SugerenciaProrroga[]) => {
      saved.push(...entities);
    }),
  } as any;
  return { repo, saved };
}

describe('DetectarSugerenciasProrrogaHandler', () => {
  const modifiedDiff: DiffReglaInput = {
    tipo: 'MODIFICADA',
    propuesta: {
      tipoObligacion: 'IVA',
      jurisdiccion: 'ARCA',
      diaVencimiento: 22,
      mesSiguiente: true,
    },
    reglaActivaId: 'regla-1',
    cambios: ['diaVencimiento: 20 → 22'],
  };

  it('creates sugerencias for PENDIENTE vencimientos affected by modified rules', async () => {
    const pendientes = [
      {
        id: 'venc-1',
        estudio_id: 'est-1',
        cliente_id: 'cli-1',
        tipo_obligacion: 'IVA',
        periodo: '2026-05',
        fecha_vencimiento: new Date('2026-06-20'),
      },
    ];
    const em = makeEntityManager(pendientes, []);
    const { repo, saved } = makeRepo();
    const handler = new DetectarSugerenciasProrrogaHandler(em as any, makeAjusteDiaHabil(), repo);

    const result = await handler.execute({
      reglasModificadas: [modifiedDiff],
      ejecucionIngestaId: 'ejec-1',
    });

    expect(result.sugerenciasCreadas).toBe(1);
    expect(result.sugerenciasOmitidas).toBe(0);
    expect(saved).toHaveLength(1);
    expect(saved[0].tipoObligacion).toBe('IVA');
    expect(saved[0].periodo).toBe('2026-05');
    expect(saved[0].motivo).toBe('diaVencimiento: 20 → 22');
    expect(saved[0].reglaActivaId).toBe('regla-1');
    expect(saved[0].ejecucionIngestaId).toBe('ejec-1');
  });

  it('skips vencimientos that already have an open sugerencia', async () => {
    const pendientes = [
      {
        id: 'venc-1',
        estudio_id: 'est-1',
        cliente_id: 'cli-1',
        tipo_obligacion: 'IVA',
        periodo: '2026-05',
        fecha_vencimiento: new Date('2026-06-20'),
      },
    ];
    const existingOpen = [{ vencimiento_id: 'venc-1' }];
    const em = makeEntityManager(pendientes, existingOpen);
    const { repo } = makeRepo();
    const handler = new DetectarSugerenciasProrrogaHandler(em as any, makeAjusteDiaHabil(), repo);

    const result = await handler.execute({
      reglasModificadas: [modifiedDiff],
      ejecucionIngestaId: null,
    });

    expect(result.sugerenciasCreadas).toBe(0);
    expect(result.sugerenciasOmitidas).toBe(1);
  });

  it('skips when suggested date equals current date', async () => {
    const pendientes = [
      {
        id: 'venc-1',
        estudio_id: 'est-1',
        cliente_id: 'cli-1',
        tipo_obligacion: 'IVA',
        periodo: '2026-05',
        fecha_vencimiento: new Date('2026-06-22'),
      },
    ];
    const em = makeEntityManager(pendientes, []);
    const { repo } = makeRepo();
    const handler = new DetectarSugerenciasProrrogaHandler(em as any, makeAjusteDiaHabil(), repo);

    const result = await handler.execute({
      reglasModificadas: [modifiedDiff],
      ejecucionIngestaId: null,
    });

    expect(result.sugerenciasCreadas).toBe(0);
    expect(result.sugerenciasOmitidas).toBe(1);
  });

  it('returns zero when no modified rules', async () => {
    const em = makeEntityManager([], []);
    const { repo } = makeRepo();
    const handler = new DetectarSugerenciasProrrogaHandler(em as any, makeAjusteDiaHabil(), repo);

    const result = await handler.execute({
      reglasModificadas: [{ tipo: 'NUEVA', propuesta: {} as any }],
      ejecucionIngestaId: null,
    });

    expect(result.sugerenciasCreadas).toBe(0);
    expect(result.sugerenciasOmitidas).toBe(0);
  });

  it('adjusts suggested date for business days via AjusteDiaHabilService', async () => {
    const pendientes = [
      {
        id: 'venc-1',
        estudio_id: 'est-1',
        cliente_id: 'cli-1',
        tipo_obligacion: 'IVA',
        periodo: '2026-05',
        fecha_vencimiento: new Date('2026-06-20'),
      },
    ];
    const ajuste = makeAjusteDiaHabil({ '2026-06-22': '2026-06-23' });
    const em = makeEntityManager(pendientes, []);
    const { repo, saved } = makeRepo();
    const handler = new DetectarSugerenciasProrrogaHandler(em as any, ajuste, repo);

    const result = await handler.execute({
      reglasModificadas: [modifiedDiff],
      ejecucionIngestaId: 'ejec-1',
    });

    expect(result.sugerenciasCreadas).toBe(1);
    expect(ajuste.ajustar).toHaveBeenCalledWith(expect.any(Date), 'ARCA');
    expect(saved[0].fechaSugerida.toISOString().slice(0, 10)).toBe('2026-06-23');
  });

  it('skips when business-day-adjusted date equals current date', async () => {
    const pendientes = [
      {
        id: 'venc-1',
        estudio_id: 'est-1',
        cliente_id: 'cli-1',
        tipo_obligacion: 'IVA',
        periodo: '2026-05',
        fecha_vencimiento: new Date('2026-06-23'),
      },
    ];
    const ajuste = makeAjusteDiaHabil({ '2026-06-22': '2026-06-23' });
    const em = makeEntityManager(pendientes, []);
    const { repo } = makeRepo();
    const handler = new DetectarSugerenciasProrrogaHandler(em as any, ajuste, repo);

    const result = await handler.execute({
      reglasModificadas: [modifiedDiff],
      ejecucionIngestaId: null,
    });

    expect(result.sugerenciasCreadas).toBe(0);
    expect(result.sugerenciasOmitidas).toBe(1);
  });

  it('handles multiple vencimientos across different estudios', async () => {
    const pendientes = [
      {
        id: 'venc-1',
        estudio_id: 'est-1',
        cliente_id: 'cli-1',
        tipo_obligacion: 'IVA',
        periodo: '2026-05',
        fecha_vencimiento: new Date('2026-06-20'),
      },
      {
        id: 'venc-2',
        estudio_id: 'est-2',
        cliente_id: 'cli-2',
        tipo_obligacion: 'IVA',
        periodo: '2026-05',
        fecha_vencimiento: new Date('2026-06-20'),
      },
    ];
    const em = makeEntityManager(pendientes, []);
    const { repo, saved } = makeRepo();
    const handler = new DetectarSugerenciasProrrogaHandler(em as any, makeAjusteDiaHabil(), repo);

    const result = await handler.execute({
      reglasModificadas: [modifiedDiff],
      ejecucionIngestaId: 'ejec-1',
    });

    expect(result.sugerenciasCreadas).toBe(2);
    expect(saved).toHaveLength(2);
    expect(saved[0].estudioId).toBe('est-1');
    expect(saved[1].estudioId).toBe('est-2');
  });
});
