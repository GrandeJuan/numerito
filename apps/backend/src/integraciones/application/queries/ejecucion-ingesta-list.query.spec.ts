import { EjecucionIngestaListHandler } from './ejecucion-ingesta-list.query';

function buildMockEm(rows: any[] = []) {
  const executeFn = jest.fn().mockResolvedValue(rows);
  return {
    em: {
      getConnection: () => ({ execute: executeFn }),
    } as any,
    executeFn,
  };
}

describe('EjecucionIngestaListHandler', () => {
  it('should return all executions when no filters provided', async () => {
    const rows = [
      {
        id: 'e1',
        fuente: 'ARCA',
        estado: 'EXITOSA',
        disparador: 'SCHEDULE',
        disparadoPor: null,
        ingestaId: 'i1',
        inicio: '2026-04-21T10:00:00Z',
        fin: '2026-04-21T10:01:00Z',
        reglasNuevas: 5,
        reglasModificadas: 2,
        errores: [],
      },
    ];
    const { em } = buildMockEm(rows);
    const handler = new EjecucionIngestaListHandler(em);

    const result = await handler.execute();

    expect(result).toHaveLength(1);
    expect(result[0].fuente).toBe('ARCA');
    expect(result[0].estado).toBe('EXITOSA');
  });

  it('should return empty array when no executions exist', async () => {
    const { em } = buildMockEm([]);
    const handler = new EjecucionIngestaListHandler(em);

    const result = await handler.execute();

    expect(result).toEqual([]);
  });

  it('should filter by fuente', async () => {
    const { em, executeFn } = buildMockEm([]);
    const handler = new EjecucionIngestaListHandler(em);

    await handler.execute({ fuente: 'ARBA' });

    const sql = executeFn.mock.calls[0][0] as string;
    const params = executeFn.mock.calls[0][1] as unknown[];
    expect(sql).toContain('WHERE');
    expect(sql).toContain('fuente = $1');
    expect(params).toContain('ARBA');
  });

  it('should filter by estado', async () => {
    const { em, executeFn } = buildMockEm([]);
    const handler = new EjecucionIngestaListHandler(em);

    await handler.execute({ estado: 'FALLIDA' });

    const sql = executeFn.mock.calls[0][0] as string;
    const params = executeFn.mock.calls[0][1] as unknown[];
    expect(sql).toContain('estado = $1');
    expect(params).toContain('FALLIDA');
  });

  it('should filter by both fuente and estado', async () => {
    const { em, executeFn } = buildMockEm([]);
    const handler = new EjecucionIngestaListHandler(em);

    await handler.execute({ fuente: 'ARCA', estado: 'EXITOSA' });

    const sql = executeFn.mock.calls[0][0] as string;
    const params = executeFn.mock.calls[0][1] as unknown[];
    expect(sql).toContain('fuente = $1');
    expect(sql).toContain('estado = $2');
    expect(params).toEqual(['ARCA', 'EXITOSA']);
  });

  it('should order by inicio DESC with LIMIT 100', async () => {
    const { em, executeFn } = buildMockEm([]);
    const handler = new EjecucionIngestaListHandler(em);

    await handler.execute();

    const sql = executeFn.mock.calls[0][0] as string;
    expect(sql).toContain('ORDER BY inicio DESC');
    expect(sql).toContain('LIMIT 100');
  });

  it('should handle execution with null optional fields', async () => {
    const rows = [
      {
        id: 'e1',
        fuente: 'AGIP',
        estado: 'EN_CURSO',
        disparador: 'MANUAL',
        disparadoPor: 'admin-1',
        ingestaId: null,
        inicio: '2026-04-21T12:00:00Z',
        fin: null,
        reglasNuevas: 0,
        reglasModificadas: 0,
        errores: [],
      },
    ];
    const { em } = buildMockEm(rows);
    const handler = new EjecucionIngestaListHandler(em);

    const result = await handler.execute();

    expect(result[0].fin).toBeNull();
    expect(result[0].ingestaId).toBeNull();
    expect(result[0].disparadoPor).toBe('admin-1');
  });

  it('should not add WHERE clause when filters are empty object', async () => {
    const { em, executeFn } = buildMockEm([]);
    const handler = new EjecucionIngestaListHandler(em);

    await handler.execute({});

    const sql = executeFn.mock.calls[0][0] as string;
    expect(sql).not.toContain('WHERE');
  });
});
