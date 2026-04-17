import { EstudioTopTenantsView } from './estudio-top-tenants.view';

describe('EstudioTopTenantsView', () => {
  let view: EstudioTopTenantsView;
  let mockExecute: jest.Mock;

  beforeEach(() => {
    mockExecute = jest.fn().mockResolvedValue([]);
    const mockEm: any = {
      getConnection: () => ({ execute: mockExecute }),
    };
    view = new EstudioTopTenantsView(mockEm);
  });

  it('should return empty array when no active estudios exist', async () => {
    const result = await view.execute();

    expect(result).toEqual([]);
  });

  it('should return top tenants with normalized activity scores', async () => {
    mockExecute.mockResolvedValueOnce([
      { id: 'e1', nombre: 'Big Corp', plan: 'Enterprise', usuarios: '10', clientes: '30', raw_score: '90' },
      { id: 'e2', nombre: 'Small LLC', plan: 'Basic', usuarios: '2', clientes: '5', raw_score: '16' },
    ]);

    const result = await view.execute();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: 'e1',
      nombre: 'Big Corp',
      plan: 'Enterprise',
      usuarios: 10,
      clientes: 30,
      actividad: 100,
    });
    expect(result[1].actividad).toBe(18); // round(16/90 * 100)
  });

  it('should default to limit 8', async () => {
    await view.execute();

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT ?'),
      [8],
    );
  });

  it('should accept custom limit', async () => {
    await view.execute({ limite: 3 });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT ?'),
      [3],
    );
  });

  it('should convert string numbers to numeric values', async () => {
    mockExecute.mockResolvedValueOnce([
      { id: 'e1', nombre: 'Test', plan: 'Pro', usuarios: '5', clientes: '10', raw_score: '35' },
    ]);

    const result = await view.execute();

    expect(result[0].usuarios).toBe(5);
    expect(result[0].clientes).toBe(10);
    expect(typeof result[0].usuarios).toBe('number');
    expect(typeof result[0].clientes).toBe('number');
  });

  it('should handle single tenant (actividad = 100)', async () => {
    mockExecute.mockResolvedValueOnce([
      { id: 'e1', nombre: 'Solo', plan: 'Basic', usuarios: '1', clientes: '2', raw_score: '7' },
    ]);

    const result = await view.execute();

    expect(result[0].actividad).toBe(100);
  });
});
