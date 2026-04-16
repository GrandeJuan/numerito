import { VencimientoCalendarioHandler } from './vencimiento-calendario.query';

describe('VencimientoCalendarioHandler', () => {
  let handler: VencimientoCalendarioHandler;
  let mockExecute: jest.Mock;
  let mockEm: any;

  const estudioId = 'estudio-uuid';

  beforeEach(() => {
    mockExecute = jest.fn();
    mockEm = {
      getConnection: jest.fn().mockReturnValue({ execute: mockExecute }),
    };
    handler = new VencimientoCalendarioHandler(mockEm);
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

  it('maps rows to DTO shape (no domain-entity leakage)', async () => {
    mockExecute.mockResolvedValueOnce([
      rowFixture(),
      rowFixture({ id: 'v-2', estado: 'PRESENTADO', tipo_obligacion: 'GANANCIAS' }),
    ]);

    const result = await handler.execute({
      estudioId,
      fechaDesde: '2026-04-01',
      fechaHasta: '2026-04-30',
    });

    expect(result).toEqual([
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

  it('returns empty array on empty result (empty range)', async () => {
    mockExecute.mockResolvedValueOnce([]);

    const result = await handler.execute({
      estudioId,
      fechaDesde: '2026-04-10',
      fechaHasta: '2026-04-10',
    });

    expect(result).toEqual([]);
  });

  it('issues a single SQL query with the expected joins, filters, and order', async () => {
    mockExecute.mockResolvedValueOnce([]);

    await handler.execute({
      estudioId,
      fechaDesde: '2026-04-01',
      fechaHasta: '2026-04-30',
    });

    expect(mockExecute).toHaveBeenCalledTimes(1);
    const [sql, params] = mockExecute.mock.calls[0];
    expect(sql).toMatch(/FROM vencimiento v/);
    expect(sql).toMatch(/JOIN cliente c ON v\.cliente_id = c\.id/);
    expect(sql).toMatch(/JOIN tipo_obligacion tobl/);
    expect(sql).toMatch(/JOIN estado_vencimiento ev/);
    expect(sql).toMatch(/WHERE v\.estudio_id = \?/);
    expect(sql).toMatch(/AND v\.fecha_vencimiento >= \?/);
    expect(sql).toMatch(/AND v\.fecha_vencimiento <= \?/);
    expect(sql).toMatch(/ORDER BY v\.fecha_vencimiento ASC, v\.id ASC/);
    expect(params).toEqual([estudioId, '2026-04-01', '2026-04-30']);
  });

  it('casts fecha_vencimiento to ::date::text to keep the YYYY-MM-DD wire format', async () => {
    mockExecute.mockResolvedValueOnce([]);

    await handler.execute({
      estudioId,
      fechaDesde: '2026-04-01',
      fechaHasta: '2026-04-30',
    });

    const [sql] = mockExecute.mock.calls[0];
    expect(sql).toMatch(/v\.fecha_vencimiento::date::text AS fecha_vencimiento/);
  });

  it('handles a range spanning a year boundary', async () => {
    mockExecute.mockResolvedValueOnce([
      rowFixture({ id: 'v-dec', periodo: '2025-12', fecha_vencimiento: '2025-12-31' }),
      rowFixture({ id: 'v-jan', periodo: '2026-01', fecha_vencimiento: '2026-01-05' }),
    ]);

    const result = await handler.execute({
      estudioId,
      fechaDesde: '2025-12-15',
      fechaHasta: '2026-01-15',
    });

    expect(result).toHaveLength(2);
    expect(result[0].fechaVencimiento).toBe('2025-12-31');
    expect(result[1].fechaVencimiento).toBe('2026-01-05');

    const [, params] = mockExecute.mock.calls[0];
    expect(params).toEqual([estudioId, '2025-12-15', '2026-01-15']);
  });

  it('handles a large (multi-year) range without mutating the params', async () => {
    mockExecute.mockResolvedValueOnce([]);

    await handler.execute({
      estudioId,
      fechaDesde: '2020-01-01',
      fechaHasta: '2030-12-31',
    });

    const [, params] = mockExecute.mock.calls[0];
    expect(params).toEqual([estudioId, '2020-01-01', '2030-12-31']);
  });

  it('scopes by estudioId — never queries without the tenant filter', async () => {
    mockExecute.mockResolvedValueOnce([]);

    await handler.execute({
      estudioId: 'other-estudio',
      fechaDesde: '2026-04-01',
      fechaHasta: '2026-04-30',
    });

    const [sql, params] = mockExecute.mock.calls[0];
    expect(sql).toMatch(/v\.estudio_id = \?/);
    expect(params[0]).toBe('other-estudio');
  });

  it('does not call em.find or em.findAll — filtering lives in SQL', async () => {
    mockExecute.mockResolvedValueOnce([]);
    mockEm.find = jest.fn();
    mockEm.findAll = jest.fn();

    await handler.execute({
      estudioId,
      fechaDesde: '2026-04-01',
      fechaHasta: '2026-04-30',
    });

    expect(mockEm.find).not.toHaveBeenCalled();
    expect(mockEm.findAll).not.toHaveBeenCalled();
  });
});
