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

  function rawRow(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      id: 'e1',
      nombre: 'Big Corp',
      cuit: '30-12345678-9',
      plan_codigo: 'ENTERPRISE',
      plan_nombre: 'Enterprise',
      max_clientes: 500,
      precio: 49999,
      estado_subscripcion: 'ACTIVA',
      usuarios: '10',
      clientes: '30',
      raw_score: '90',
      ...overrides,
    };
  }

  it('should return empty array when no active estudios exist', async () => {
    const result = await view.execute();
    expect(result).toEqual([]);
  });

  it('should return top tenants with normalized activity scores and full fields', async () => {
    mockExecute.mockResolvedValueOnce([
      rawRow(),
      rawRow({
        id: 'e2',
        nombre: 'Small LLC',
        cuit: '30-99999999-1',
        plan_codigo: 'FREE',
        plan_nombre: 'Free',
        max_clientes: 5,
        precio: 0,
        estado_subscripcion: 'TRIAL',
        usuarios: '2',
        clientes: '5',
        raw_score: '16',
      }),
    ]);

    const result = await view.execute();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: 'e1',
      nombre: 'Big Corp',
      cuit: '30-12345678-9',
      planCodigo: 'ENTERPRISE',
      planNombre: 'Enterprise',
      maxClientes: 500,
      estadoSubscripcion: 'ACTIVA',
      mrr: 49999,
      usuarios: 10,
      clientes: 30,
      actividad: 100,
    });
    expect(result[1].actividad).toBe(18);
    expect(result[1].estadoSubscripcion).toBe('TRIAL');
  });

  it('should default to limit 8', async () => {
    await view.execute();
    expect(mockExecute).toHaveBeenCalledWith(expect.stringContaining('LIMIT ?'), [8]);
  });

  it('should accept custom limit', async () => {
    await view.execute({ limite: 3 });
    expect(mockExecute).toHaveBeenCalledWith(expect.stringContaining('LIMIT ?'), [3]);
  });

  it('should convert string numbers to numeric values', async () => {
    mockExecute.mockResolvedValueOnce([rawRow({ usuarios: '5', clientes: '10', raw_score: '35' })]);

    const result = await view.execute();

    expect(typeof result[0].usuarios).toBe('number');
    expect(typeof result[0].clientes).toBe('number');
    expect(typeof result[0].mrr).toBe('number');
    expect(typeof result[0].maxClientes).toBe('number');
  });

  it('should handle single tenant (actividad = 100)', async () => {
    mockExecute.mockResolvedValueOnce([rawRow({ id: 'solo', raw_score: '7' })]);
    const result = await view.execute();
    expect(result[0].actividad).toBe(100);
  });

  it('should null out estadoSubscripcion when no subscripcion exists', async () => {
    mockExecute.mockResolvedValueOnce([rawRow({ estado_subscripcion: null })]);
    const result = await view.execute();
    expect(result[0].estadoSubscripcion).toBeNull();
  });
});
