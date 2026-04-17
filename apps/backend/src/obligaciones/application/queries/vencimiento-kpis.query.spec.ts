import { VencimientoKpisHandler } from './vencimiento-kpis.query';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';

const principal: EstudioPrincipal = { estudioId: 'estudio-uuid', userId: 'user-1', roles: [] };

describe('VencimientoKpisHandler', () => {
  let handler: VencimientoKpisHandler;
  let mockExecute: jest.Mock;
  let mockEm: any;

  beforeEach(() => {
    mockExecute = jest.fn();
    mockEm = {
      getConnection: jest.fn().mockReturnValue({ execute: mockExecute }),
    };
    handler = new VencimientoKpisHandler(mockEm);
  });

  it('returns aggregate counts and proximoVencimiento from a single SQL row', async () => {
    mockExecute.mockResolvedValue([
      {
        pendientes: '3',
        vencidos: '1',
        presentados_este_mes: '2',
        proximo_vencimiento: '2026-04-20',
      },
    ]);

    const result = await handler.execute(principal);

    expect(result).toEqual({
      pendientes: 3,
      vencidos: 1,
      presentadosEsteMes: 2,
      proximoVencimiento: '2026-04-20',
    });
  });

  it('coerces string counts to numbers', async () => {
    mockExecute.mockResolvedValue([
      {
        pendientes: '10',
        vencidos: '0',
        presentados_este_mes: '5',
        proximo_vencimiento: null,
      },
    ]);

    const result = await handler.execute(principal);

    expect(typeof result.pendientes).toBe('number');
    expect(typeof result.vencidos).toBe('number');
    expect(typeof result.presentadosEsteMes).toBe('number');
    expect(result.pendientes).toBe(10);
  });

  it('returns null proximoVencimiento when there are no pendientes', async () => {
    mockExecute.mockResolvedValue([
      {
        pendientes: '0',
        vencidos: '0',
        presentados_este_mes: '0',
        proximo_vencimiento: null,
      },
    ]);

    const result = await handler.execute(principal);

    expect(result.proximoVencimiento).toBeNull();
    expect(result.pendientes).toBe(0);
  });

  it('returns zeros when the aggregate row is missing (empty table)', async () => {
    mockExecute.mockResolvedValue([]);

    const result = await handler.execute(principal);

    expect(result).toEqual({
      pendientes: 0,
      vencidos: 0,
      presentadosEsteMes: 0,
      proximoVencimiento: null,
    });
  });

  it('scopes by principal.estudioId and current month period', async () => {
    mockExecute.mockResolvedValue([]);

    const now = new Date();
    const expectedPeriodo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    await handler.execute(principal);

    expect(mockExecute).toHaveBeenCalledTimes(1);
    const [sql, params] = mockExecute.mock.calls[0];
    expect(sql).toMatch(/FROM vencimiento v/);
    expect(sql).toMatch(/JOIN estado_vencimiento ev/);
    expect(sql).toMatch(/WHERE v\.estudio_id = \?/);
    expect(sql).toMatch(/COUNT\(\*\) FILTER \(WHERE ev\.codigo = 'PENDIENTE'\)/);
    expect(params).toEqual([expectedPeriodo, principal.estudioId]);
  });

  it('does not call findAll or any row-materialising API on the EntityManager', async () => {
    mockExecute.mockResolvedValue([]);
    mockEm.find = jest.fn();
    mockEm.findAll = jest.fn();

    await handler.execute(principal);

    expect(mockEm.find).not.toHaveBeenCalled();
    expect(mockEm.findAll).not.toHaveBeenCalled();
  });
});
