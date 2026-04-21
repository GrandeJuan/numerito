import { ConfiguracionIngestaListHandler } from './configuracion-ingesta-list.query';

function buildMockEm(rows: any[] = []) {
  return {
    getConnection: () => ({
      execute: jest.fn().mockResolvedValue(rows),
    }),
  } as any;
}

describe('ConfiguracionIngestaListHandler', () => {
  it('should return all configurations ordered by fuente', async () => {
    const rows = [
      {
        id: 'c1',
        fuente: 'AGIP',
        habilitado: true,
        cadenciaDias: 7,
        proximaEjecucion: '2026-04-28',
        ultimaEjecucion: '2026-04-21',
        ultimoResultado: 'EXITOSA',
      },
      {
        id: 'c2',
        fuente: 'ARCA',
        habilitado: false,
        cadenciaDias: 14,
        proximaEjecucion: null,
        ultimaEjecucion: null,
        ultimoResultado: null,
      },
    ];
    const handler = new ConfiguracionIngestaListHandler(buildMockEm(rows));

    const result = await handler.execute();

    expect(result).toHaveLength(2);
    expect(result[0].fuente).toBe('AGIP');
    expect(result[1].fuente).toBe('ARCA');
  });

  it('should return empty array when no configurations exist', async () => {
    const handler = new ConfiguracionIngestaListHandler(buildMockEm([]));

    const result = await handler.execute();

    expect(result).toEqual([]);
  });

  it('should map column aliases correctly', async () => {
    const rows = [
      {
        id: 'c1',
        fuente: 'BCRA_FERIADOS',
        habilitado: true,
        cadenciaDias: 30,
        proximaEjecucion: '2026-05-21',
        ultimaEjecucion: '2026-04-21',
        ultimoResultado: 'EXITOSA',
      },
    ];
    const handler = new ConfiguracionIngestaListHandler(buildMockEm(rows));

    const result = await handler.execute();

    expect(result[0]).toEqual({
      id: 'c1',
      fuente: 'BCRA_FERIADOS',
      habilitado: true,
      cadenciaDias: 30,
      proximaEjecucion: '2026-05-21',
      ultimaEjecucion: '2026-04-21',
      ultimoResultado: 'EXITOSA',
    });
  });

  it('should handle null date fields', async () => {
    const rows = [
      {
        id: 'c1',
        fuente: 'ARBA',
        habilitado: false,
        cadenciaDias: 7,
        proximaEjecucion: null,
        ultimaEjecucion: null,
        ultimoResultado: null,
      },
    ];
    const handler = new ConfiguracionIngestaListHandler(buildMockEm(rows));

    const result = await handler.execute();

    expect(result[0].proximaEjecucion).toBeNull();
    expect(result[0].ultimaEjecucion).toBeNull();
    expect(result[0].ultimoResultado).toBeNull();
  });

  it('should execute the correct SQL query', async () => {
    const executeFn = jest.fn().mockResolvedValue([]);
    const em = {
      getConnection: () => ({ execute: executeFn }),
    } as any;
    const handler = new ConfiguracionIngestaListHandler(em);

    await handler.execute();

    expect(executeFn).toHaveBeenCalledTimes(1);
    const sql = executeFn.mock.calls[0][0] as string;
    expect(sql).toContain('configuracion_ingesta');
    expect(sql).toContain('ORDER BY fuente');
  });
});
