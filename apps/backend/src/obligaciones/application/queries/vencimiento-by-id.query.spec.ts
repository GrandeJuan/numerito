import { VencimientoByIdHandler } from './vencimiento-by-id.query';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';

const principal: EstudioPrincipal = { estudioId: 'estudio-uuid', userId: 'user-1', roles: [] };

describe('VencimientoByIdHandler', () => {
  let handler: VencimientoByIdHandler;
  let mockExecute: jest.Mock;
  let mockEm: any;

  const id = 'v-1';

  beforeEach(() => {
    mockExecute = jest.fn();
    mockEm = {
      getConnection: jest.fn().mockReturnValue({ execute: mockExecute }),
    };
    handler = new VencimientoByIdHandler(mockEm);
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

  it('returns a DTO-shaped result (no domain-entity leakage)', async () => {
    mockExecute.mockResolvedValueOnce([rowFixture()]);

    const result = await handler.execute(principal, { id });

    expect(result).toEqual({
      id: 'v-1',
      clienteId: 'cli-1',
      cliente: 'Empresa Alpha SRL',
      tipoObligacion: 'IVA',
      periodo: '2026-04',
      fechaVencimiento: '2026-04-20',
      descripcion: 'DDJJ IVA',
      estado: 'PENDIENTE',
    });
  });

  it('throws RecursoNoEncontradoError when no row is returned', async () => {
    mockExecute.mockResolvedValueOnce([]);

    await expect(handler.execute(principal, { id: 'missing' })).rejects.toThrow(
      RecursoNoEncontradoError,
    );
  });

  it('issues a single SQL query scoped by id AND principal.estudioId', async () => {
    mockExecute.mockResolvedValueOnce([rowFixture()]);

    await handler.execute(principal, { id });

    expect(mockExecute).toHaveBeenCalledTimes(1);
    const [sql, params] = mockExecute.mock.calls[0];
    expect(sql).toMatch(/FROM vencimiento v/);
    expect(sql).toMatch(/JOIN cliente c ON v\.cliente_id = c\.id/);
    expect(sql).toMatch(/JOIN tipo_obligacion tobl/);
    expect(sql).toMatch(/JOIN estado_vencimiento ev/);
    expect(sql).toMatch(/WHERE v\.id = \? AND v\.estudio_id = \?/);
    expect(sql).toMatch(/LIMIT 1/);
    expect(params).toEqual([id, principal.estudioId]);
  });

  it('casts fecha_vencimiento to ::date::text to keep the YYYY-MM-DD wire format', async () => {
    mockExecute.mockResolvedValueOnce([rowFixture()]);

    await handler.execute(principal, { id });

    const [sql] = mockExecute.mock.calls[0];
    expect(sql).toMatch(/v\.fecha_vencimiento::date::text AS fecha_vencimiento/);
  });

  it('treats tenant mismatch as not-found — vencimientos from other estudios are invisible', async () => {
    mockExecute.mockResolvedValueOnce([]);
    const otherPrincipal: EstudioPrincipal = { estudioId: 'my-estudio', userId: 'user-1', roles: [] };

    await expect(
      handler.execute(otherPrincipal, { id: 'v-from-other-tenant' }),
    ).rejects.toThrow(RecursoNoEncontradoError);

    const [, params] = mockExecute.mock.calls[0];
    expect(params).toEqual(['v-from-other-tenant', 'my-estudio']);
  });

  it('does not call em.find or em.findAll — read goes through SQL', async () => {
    mockExecute.mockResolvedValueOnce([rowFixture()]);
    mockEm.find = jest.fn();
    mockEm.findAll = jest.fn();

    await handler.execute(principal, { id });

    expect(mockEm.find).not.toHaveBeenCalled();
    expect(mockEm.findAll).not.toHaveBeenCalled();
  });
});
