import { TareaKpisHandler } from './tarea-kpis.query';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';

describe('TareaKpisHandler', () => {
  let handler: TareaKpisHandler;
  let mockExecute: jest.Mock;
  let mockEm: any;

  const principal: EstudioPrincipal = { estudioId: 'estudio-uuid', userId: 'user-1', roles: [] };

  beforeEach(() => {
    mockExecute = jest.fn();
    mockEm = {
      getConnection: jest.fn().mockReturnValue({ execute: mockExecute }),
    };
    handler = new TareaKpisHandler(mockEm);
  });

  it('returns aggregate counts and totalHoras from a single SQL row', async () => {
    mockExecute.mockResolvedValue([
      {
        pendientes: '3',
        en_progreso: '2',
        completadas: '5',
        total_horas: '12.50',
      },
    ]);

    const result = await handler.execute(principal);

    expect(result).toEqual({
      pendientes: 3,
      enProgreso: 2,
      completadas: 5,
      totalHoras: 12.5,
    });
  });

  it('coerces string counts to numbers', async () => {
    mockExecute.mockResolvedValue([
      {
        pendientes: '10',
        en_progreso: '0',
        completadas: '4',
        total_horas: '0',
      },
    ]);

    const result = await handler.execute(principal);

    expect(typeof result.pendientes).toBe('number');
    expect(typeof result.enProgreso).toBe('number');
    expect(typeof result.completadas).toBe('number');
    expect(typeof result.totalHoras).toBe('number');
    expect(result.pendientes).toBe(10);
  });

  it('returns zeros when the aggregate row is missing (empty table)', async () => {
    mockExecute.mockResolvedValue([]);

    const result = await handler.execute(principal);

    expect(result).toEqual({
      pendientes: 0,
      enProgreso: 0,
      completadas: 0,
      totalHoras: 0,
    });
  });

  it('handles null totalHoras from a COALESCE-less edge case', async () => {
    mockExecute.mockResolvedValue([
      {
        pendientes: '0',
        en_progreso: '0',
        completadas: '0',
        total_horas: null,
      },
    ]);

    const result = await handler.execute(principal);

    expect(result.totalHoras).toBe(0);
  });

  it('scopes by estudioId and aggregates via SQL FILTER clauses', async () => {
    mockExecute.mockResolvedValue([]);

    await handler.execute(principal);

    expect(mockExecute).toHaveBeenCalledTimes(1);
    const [sql, params] = mockExecute.mock.calls[0];
    expect(sql).toMatch(/FROM tarea t/);
    expect(sql).toMatch(/JOIN estado_tarea et/);
    expect(sql).toMatch(/WHERE t\.estudio_id = \?/);
    expect(sql).toMatch(/COUNT\(\*\) FILTER \(WHERE et\.codigo = 'PENDIENTE'\)/);
    expect(sql).toMatch(/COUNT\(\*\) FILTER \(WHERE et\.codigo = 'EN_PROGRESO'\)/);
    expect(sql).toMatch(/COUNT\(\*\) FILTER \(WHERE et\.codigo = 'COMPLETADO'\)/);
    expect(sql).toMatch(/COALESCE\(SUM\(t\.horas_registradas\), 0\)/);
    expect(params).toEqual(['estudio-uuid']);
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
