import { UsuarioAdminKpisView } from './usuario-admin-kpis.view';

describe('UsuarioAdminKpisView', () => {
  let view: UsuarioAdminKpisView;
  let mockExecute: jest.Mock;

  beforeEach(() => {
    mockExecute = jest.fn().mockResolvedValue([{ count: 0 }]);
    const mockEm: any = {
      getConnection: jest.fn().mockReturnValue({ execute: mockExecute }),
    };
    view = new UsuarioAdminKpisView(mockEm);
  });

  it('should return total usuarios count', async () => {
    mockExecute
      .mockResolvedValueOnce([{ count: 50 }])
      .mockResolvedValueOnce([]);

    const result = await view.execute();

    expect(result.totalUsuarios).toBe(50);
  });

  it('should return 12-month sparkline by default', async () => {
    const now = new Date();
    const sparklineRows = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return { mes, cantidad: String(20 + i * 3) };
    });

    mockExecute
      .mockResolvedValueOnce([{ count: 53 }])
      .mockResolvedValueOnce(sparklineRows);

    const result = await view.execute();

    expect(result.sparkline).toHaveLength(12);
    expect(result.sparkline[0]).toBe(20);
    expect(result.sparkline[11]).toBe(53);
  });

  it('should return empty sparkline when no data', async () => {
    mockExecute
      .mockResolvedValueOnce([{ count: 0 }])
      .mockResolvedValueOnce([]);

    const result = await view.execute();

    expect(result.totalUsuarios).toBe(0);
    expect(result.sparkline).toEqual([]);
  });

  it('should respect custom meses parameter', async () => {
    mockExecute
      .mockResolvedValueOnce([{ count: 10 }])
      .mockResolvedValueOnce([]);

    await view.execute({ meses: 6 });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("INTERVAL '5 months'"),
    );
  });

  it('should use generate_series for sparkline', async () => {
    mockExecute
      .mockResolvedValueOnce([{ count: 10 }])
      .mockResolvedValueOnce([]);

    await view.execute();

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('generate_series'),
    );
  });

  it('should convert sparkline values to numbers', async () => {
    mockExecute
      .mockResolvedValueOnce([{ count: 10 }])
      .mockResolvedValueOnce([{ mes: '2026-04', cantidad: '42' }]);

    const result = await view.execute({ meses: 1 });

    expect(typeof result.sparkline[0]).toBe('number');
    expect(result.sparkline[0]).toBe(42);
  });
});
