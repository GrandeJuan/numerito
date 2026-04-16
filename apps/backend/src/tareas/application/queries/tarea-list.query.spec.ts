import { TareaListHandler } from './tarea-list.query';

describe('TareaListHandler', () => {
  let handler: TareaListHandler;
  let mockExecute: jest.Mock;
  let mockEm: any;

  const estudioId = 'estudio-uuid';

  beforeEach(() => {
    mockExecute = jest.fn();
    mockEm = {
      getConnection: jest.fn().mockReturnValue({ execute: mockExecute }),
    };
    handler = new TareaListHandler(mockEm);
  });

  const rowFixture = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 't-1',
    titulo: 'Preparar balance',
    descripcion: 'Balance mensual cliente X',
    cliente_id: 'cli-1',
    cliente_nombre: 'Empresa Alpha SRL',
    responsable_id: 'u-1',
    responsable_nombre: 'Ana Perez',
    estado: 'PENDIENTE',
    prioridad: 'MEDIA',
    horas_registradas: '2.50',
    ...overrides,
  });

  const mockQueries = (rows: unknown[], total: number) => {
    mockExecute.mockResolvedValueOnce(rows);
    mockExecute.mockResolvedValueOnce([{ total: String(total) }]);
  };

  it('returns DTO-shaped items and coerces count and horas to numbers', async () => {
    mockQueries(
      [
        rowFixture(),
        rowFixture({
          id: 't-2',
          estado: 'COMPLETADO',
          prioridad: 'ALTA',
          cliente_id: null,
          cliente_nombre: null,
          responsable_id: null,
          responsable_nombre: null,
          descripcion: null,
          horas_registradas: '0',
        }),
      ],
      2,
    );

    const result = await handler.execute({ estudioId });

    expect(result.total).toBe(2);
    expect(typeof result.total).toBe('number');
    expect(result.items).toEqual([
      {
        id: 't-1',
        titulo: 'Preparar balance',
        descripcion: 'Balance mensual cliente X',
        clienteId: 'cli-1',
        clienteNombre: 'Empresa Alpha SRL',
        responsableId: 'u-1',
        responsableNombre: 'Ana Perez',
        estado: 'PENDIENTE',
        prioridad: 'MEDIA',
        horasRegistradas: 2.5,
      },
      {
        id: 't-2',
        titulo: 'Preparar balance',
        descripcion: null,
        clienteId: null,
        clienteNombre: null,
        responsableId: null,
        responsableNombre: null,
        estado: 'COMPLETADO',
        prioridad: 'ALTA',
        horasRegistradas: 0,
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
    expect(listSql).toMatch(/FROM tarea t/);
    expect(listSql).toMatch(/LEFT JOIN cliente c ON t\.cliente_id = c\.id/);
    expect(listSql).toMatch(/LEFT JOIN usuario u ON t\.responsable_id = u\.id/);
    expect(listSql).toMatch(/JOIN estado_tarea et/);
    expect(listSql).toMatch(/JOIN prioridad p/);
    expect(listSql).toMatch(/WHERE t\.estudio_id = \?/);
    expect(listSql).toMatch(/ORDER BY t\.created_at DESC/);
    expect(listSql).toMatch(/LIMIT \? OFFSET \?/);
    expect(listParams).toEqual([estudioId, 20, 0]);

    const [countSql, countParams] = mockExecute.mock.calls[1];
    expect(countSql).toMatch(/COUNT\(\*\) AS total/);
    expect(countSql).toMatch(/WHERE t\.estudio_id = \?/);
    expect(countParams).toEqual([estudioId]);
  });

  it('adds estado filter bound to the et.codigo column', async () => {
    mockQueries([], 0);

    await handler.execute({ estudioId, estado: 'PENDIENTE' });

    const [listSql, listParams] = mockExecute.mock.calls[0];
    expect(listSql).toMatch(/et\.codigo = \?/);
    expect(listParams).toEqual([estudioId, 'PENDIENTE', 20, 0]);

    const [countSql, countParams] = mockExecute.mock.calls[1];
    expect(countSql).toMatch(/et\.codigo = \?/);
    expect(countParams).toEqual([estudioId, 'PENDIENTE']);
  });

  it('adds clienteId filter', async () => {
    mockQueries([], 0);

    await handler.execute({ estudioId, clienteId: 'cli-42' });

    const [listSql, listParams] = mockExecute.mock.calls[0];
    expect(listSql).toMatch(/t\.cliente_id = \?/);
    expect(listParams).toEqual([estudioId, 'cli-42', 20, 0]);
  });

  it('adds responsableId filter', async () => {
    mockQueries([], 0);

    await handler.execute({ estudioId, responsableId: 'u-42' });

    const [listSql, listParams] = mockExecute.mock.calls[0];
    expect(listSql).toMatch(/t\.responsable_id = \?/);
    expect(listParams).toEqual([estudioId, 'u-42', 20, 0]);
  });

  it('adds prioridad filter bound to the p.codigo column', async () => {
    mockQueries([], 0);

    await handler.execute({ estudioId, prioridad: 'URGENTE' });

    const [listSql, listParams] = mockExecute.mock.calls[0];
    expect(listSql).toMatch(/p\.codigo = \?/);
    expect(listParams).toEqual([estudioId, 'URGENTE', 20, 0]);
  });

  it('combines multiple filters with AND', async () => {
    mockQueries([], 0);

    await handler.execute({
      estudioId,
      estado: 'EN_PROGRESO',
      clienteId: 'cli-1',
      responsableId: 'u-1',
      prioridad: 'ALTA',
    });

    const [listSql, listParams] = mockExecute.mock.calls[0];
    expect(listSql).toMatch(
      /t\.estudio_id = \? AND et\.codigo = \? AND t\.cliente_id = \? AND t\.responsable_id = \? AND p\.codigo = \?/,
    );
    expect(listParams).toEqual([
      estudioId,
      'EN_PROGRESO',
      'cli-1',
      'u-1',
      'ALTA',
      20,
      0,
    ]);
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
