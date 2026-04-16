import { VencimientoListHandler } from './vencimiento-list.query';

describe('VencimientoListHandler', () => {
  let handler: VencimientoListHandler;
  let mockExecute: jest.Mock;
  let mockEm: any;

  const estudioId = 'estudio-uuid';

  beforeEach(() => {
    mockExecute = jest.fn();
    mockEm = {
      getConnection: jest.fn().mockReturnValue({ execute: mockExecute }),
    };
    handler = new VencimientoListHandler(mockEm);
  });

  const rowFixture = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 'v-1',
    cliente_id: 'cli-1',
    cliente: 'Empresa Alpha SRL',
    tipo_obligacion: 'IVA',
    periodo: '2026-04',
    fecha_vencimiento: '2026-04-20',
    descripcion: 'DDJJ IVA',
    estado: 'PENDIENTE',
    ...overrides,
  });

  const mockQueries = (rows: unknown[], total: number) => {
    mockExecute.mockResolvedValueOnce(rows);
    mockExecute.mockResolvedValueOnce([{ total: String(total) }]);
  };

  it('returns DTO-shaped items and coerces count from string', async () => {
    mockQueries(
      [
        rowFixture(),
        rowFixture({ id: 'v-2', estado: 'PRESENTADO', tipo_obligacion: 'GANANCIAS' }),
      ],
      2,
    );

    const result = await handler.execute({ estudioId });

    expect(result.total).toBe(2);
    expect(typeof result.total).toBe('number');
    expect(result.items).toEqual([
      {
        id: 'v-1',
        clienteId: 'cli-1',
        cliente: 'Empresa Alpha SRL',
        tipoObligacion: 'IVA',
        periodo: '2026-04',
        fechaVencimiento: '2026-04-20',
        descripcion: 'DDJJ IVA',
        estado: 'PENDIENTE',
      },
      {
        id: 'v-2',
        clienteId: 'cli-1',
        cliente: 'Empresa Alpha SRL',
        tipoObligacion: 'GANANCIAS',
        periodo: '2026-04',
        fechaVencimiento: '2026-04-20',
        descripcion: 'DDJJ IVA',
        estado: 'PRESENTADO',
      },
    ]);
  });

  it('returns zero total and empty items on empty result', async () => {
    mockQueries([], 0);

    const result = await handler.execute({ estudioId });

    expect(result).toEqual({ items: [], total: 0 });
  });

  it('defaults total to 0 when the count row is missing', async () => {
    mockExecute.mockResolvedValueOnce([]);
    mockExecute.mockResolvedValueOnce([]);

    const result = await handler.execute({ estudioId });

    expect(result.total).toBe(0);
  });

  it('scopes by estudioId with no filters', async () => {
    mockQueries([], 0);

    await handler.execute({ estudioId });

    const [listSql, listParams] = mockExecute.mock.calls[0];
    expect(listSql).toMatch(/FROM vencimiento v/);
    expect(listSql).toMatch(/JOIN cliente c ON v\.cliente_id = c\.id/);
    expect(listSql).toMatch(/JOIN tipo_obligacion tobl/);
    expect(listSql).toMatch(/JOIN estado_vencimiento ev/);
    expect(listSql).toMatch(/WHERE v\.estudio_id = \?/);
    expect(listSql).toMatch(/ORDER BY v\.fecha_vencimiento DESC/);
    expect(listSql).toMatch(/LIMIT \? OFFSET \?/);
    expect(listParams).toEqual([estudioId, 20, 0]);

    const [countSql, countParams] = mockExecute.mock.calls[1];
    expect(countSql).toMatch(/COUNT\(\*\) AS total/);
    expect(countSql).toMatch(/WHERE v\.estudio_id = \?/);
    expect(countParams).toEqual([estudioId]);
  });

  it('adds estado filter bound to the ev.codigo column', async () => {
    mockQueries([], 0);

    await handler.execute({ estudioId, estado: 'PENDIENTE' });

    const [listSql, listParams] = mockExecute.mock.calls[0];
    expect(listSql).toMatch(/ev\.codigo = \?/);
    expect(listParams).toEqual([estudioId, 'PENDIENTE', 20, 0]);

    const [countSql, countParams] = mockExecute.mock.calls[1];
    expect(countSql).toMatch(/ev\.codigo = \?/);
    expect(countParams).toEqual([estudioId, 'PENDIENTE']);
  });

  it('adds clienteId filter', async () => {
    mockQueries([], 0);

    await handler.execute({ estudioId, clienteId: 'cli-42' });

    const [listSql, listParams] = mockExecute.mock.calls[0];
    expect(listSql).toMatch(/v\.cliente_id = \?/);
    expect(listParams).toEqual([estudioId, 'cli-42', 20, 0]);
  });

  it('adds periodo filter', async () => {
    mockQueries([], 0);

    await handler.execute({ estudioId, periodo: '2026-04' });

    const [listSql, listParams] = mockExecute.mock.calls[0];
    expect(listSql).toMatch(/v\.periodo = \?/);
    expect(listParams).toEqual([estudioId, '2026-04', 20, 0]);
  });

  it('adds fechaDesde and fechaHasta range filters', async () => {
    mockQueries([], 0);

    await handler.execute({
      estudioId,
      fechaDesde: '2026-04-01',
      fechaHasta: '2026-04-30',
    });

    const [listSql, listParams] = mockExecute.mock.calls[0];
    expect(listSql).toMatch(/v\.fecha_vencimiento >= \?/);
    expect(listSql).toMatch(/v\.fecha_vencimiento <= \?/);
    expect(listParams).toEqual([estudioId, '2026-04-01', '2026-04-30', 20, 0]);
  });

  it('combines multiple filters with AND', async () => {
    mockQueries([], 0);

    await handler.execute({
      estudioId,
      estado: 'PENDIENTE',
      clienteId: 'cli-1',
      periodo: '2026-04',
    });

    const [listSql, listParams] = mockExecute.mock.calls[0];
    expect(listSql).toMatch(/v\.estudio_id = \? AND ev\.codigo = \? AND v\.cliente_id = \? AND v\.periodo = \?/);
    expect(listParams).toEqual([estudioId, 'PENDIENTE', 'cli-1', '2026-04', 20, 0]);
  });

  it('applies pagination via LIMIT/OFFSET', async () => {
    mockQueries([], 0);

    await handler.execute({ estudioId, page: 3, limit: 50 });

    const [, listParams] = mockExecute.mock.calls[0];
    expect(listParams).toEqual([estudioId, 50, 100]);
  });

  it('clamps page and limit to minimum 1 when invalid values are provided', async () => {
    mockQueries([], 0);

    await handler.execute({ estudioId, page: 0, limit: -5 });

    const [, listParams] = mockExecute.mock.calls[0];
    expect(listParams).toEqual([estudioId, 1, 0]);
  });

  it('does not call em.find or em.findAll — filtering lives in SQL', async () => {
    mockQueries([], 0);
    mockEm.find = jest.fn();
    mockEm.findAll = jest.fn();

    await handler.execute({ estudioId, estado: 'PENDIENTE' });

    expect(mockEm.find).not.toHaveBeenCalled();
    expect(mockEm.findAll).not.toHaveBeenCalled();
  });
});
