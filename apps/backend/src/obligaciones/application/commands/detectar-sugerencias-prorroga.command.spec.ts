import { DetectarSugerenciasProrrogaHandler } from './detectar-sugerencias-prorroga.command';
import type { DiffRegla } from '../../../integraciones/application/commands/procesar-resultado-scraping.command';
import type { AjusteDiaHabilService } from '../../domain/services/ajuste-dia-habil.service';

function makeAjusteDiaHabil(adjustments: Record<string, string> = {}): AjusteDiaHabilService {
  return {
    ajustar: jest.fn(async (fecha: Date, _jurisdiccion: string) => {
      const key = fecha.toISOString().slice(0, 10);
      if (adjustments[key]) {
        return new Date(adjustments[key]);
      }
      // Default: return same date (no adjustment needed)
      return new Date(fecha);
    }),
  } as any;
}

function makeEntityManager(pendientes: any[] = [], existingOpen: any[] = []) {
  const created: any[] = [];
  const em = {
    getConnection: () => ({
      execute: jest.fn()
        .mockResolvedValueOnce(pendientes) // first call: find PENDIENTE vencimientos
        .mockResolvedValueOnce(existingOpen), // second call: existing open sugerencias
    }),
    create: jest.fn((_cls: any, data: any) => {
      created.push(data);
      return data;
    }),
    getReference: jest.fn((_cls: any, id: string) => ({ id })),
    flush: jest.fn().mockResolvedValue(undefined),
    _created: created,
  };
  return em;
}

describe('DetectarSugerenciasProrrogaHandler', () => {
  const modifiedDiff: DiffRegla = {
    tipo: 'MODIFICADA',
    propuesta: {
      tipoObligacion: 'IVA',
      jurisdiccion: 'ARCA',
      regimen: 'GENERAL',
      terminacionCuit: '0',
      diaVencimiento: 22,
      mesSiguiente: true,
      vigenciaDesde: '2026-01-01',
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
        fecha_vencimiento: new Date('2026-06-20'), // original date (mesSiguiente was true, dia was 20)
      },
    ];
    const em = makeEntityManager(pendientes, []);
    const handler = new DetectarSugerenciasProrrogaHandler(em as any, makeAjusteDiaHabil());

    const result = await handler.execute({
      reglasModificadas: [modifiedDiff],
      ejecucionIngestaId: 'ejec-1',
    });

    expect(result.sugerenciasCreadas).toBe(1);
    expect(result.sugerenciasOmitidas).toBe(0);
    expect(em.flush).toHaveBeenCalled();
    expect(em._created).toHaveLength(1);
    expect(em._created[0]).toMatchObject({
      tipoObligacion: 'IVA',
      periodo: '2026-05',
      motivo: 'diaVencimiento: 20 → 22',
      estado: 'ABIERTA',
      reglaActivaId: 'regla-1',
      ejecucionIngestaId: 'ejec-1',
    });
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
    const handler = new DetectarSugerenciasProrrogaHandler(em as any, makeAjusteDiaHabil());

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
        fecha_vencimiento: new Date('2026-06-22'), // already at the proposed date
      },
    ];
    const em = makeEntityManager(pendientes, []);
    const handler = new DetectarSugerenciasProrrogaHandler(em as any, makeAjusteDiaHabil());

    const result = await handler.execute({
      reglasModificadas: [modifiedDiff],
      ejecucionIngestaId: null,
    });

    expect(result.sugerenciasCreadas).toBe(0);
    expect(result.sugerenciasOmitidas).toBe(1);
  });

  it('returns zero when no modified rules', async () => {
    const em = makeEntityManager([], []);
    const handler = new DetectarSugerenciasProrrogaHandler(em as any, makeAjusteDiaHabil());

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
        fecha_vencimiento: new Date('2026-06-20'), // original
      },
    ];
    // June 22 2026 is a Monday, but pretend it's a feriado — adjust to June 23
    const ajuste = makeAjusteDiaHabil({ '2026-06-22': '2026-06-23' });
    const em = makeEntityManager(pendientes, []);
    const handler = new DetectarSugerenciasProrrogaHandler(em as any, ajuste);

    const result = await handler.execute({
      reglasModificadas: [modifiedDiff],
      ejecucionIngestaId: 'ejec-1',
    });

    expect(result.sugerenciasCreadas).toBe(1);
    expect(ajuste.ajustar).toHaveBeenCalledWith(
      expect.any(Date),
      'ARCA',
    );
    // The persisted fechaSugerida should be the adjusted date, not the nominal
    const created = em._created[0];
    expect(created.fechaSugerida.toISOString().slice(0, 10)).toBe('2026-06-23');
  });

  it('skips when business-day-adjusted date equals current date', async () => {
    const pendientes = [
      {
        id: 'venc-1',
        estudio_id: 'est-1',
        cliente_id: 'cli-1',
        tipo_obligacion: 'IVA',
        periodo: '2026-05',
        fecha_vencimiento: new Date('2026-06-23'), // current is already at adjusted date
      },
    ];
    // Nominal is June 22 but adjusts to June 23 (same as current)
    const ajuste = makeAjusteDiaHabil({ '2026-06-22': '2026-06-23' });
    const em = makeEntityManager(pendientes, []);
    const handler = new DetectarSugerenciasProrrogaHandler(em as any, ajuste);

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
    const handler = new DetectarSugerenciasProrrogaHandler(em as any, makeAjusteDiaHabil());

    const result = await handler.execute({
      reglasModificadas: [modifiedDiff],
      ejecucionIngestaId: 'ejec-1',
    });

    expect(result.sugerenciasCreadas).toBe(2);
    expect(em._created).toHaveLength(2);
    expect(em._created[0].estudio).toEqual({ id: 'est-1' });
    expect(em._created[1].estudio).toEqual({ id: 'est-2' });
  });
});
