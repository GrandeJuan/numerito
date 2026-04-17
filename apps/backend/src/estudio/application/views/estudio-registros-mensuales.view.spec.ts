import { EstudioRegistrosMensualesView } from './estudio-registros-mensuales.view';

describe('EstudioRegistrosMensualesView', () => {
  let view: EstudioRegistrosMensualesView;
  let mockExecute: jest.Mock;

  beforeEach(() => {
    mockExecute = jest.fn().mockResolvedValue([]);
    const mockEm: any = {
      getConnection: jest.fn().mockReturnValue({ execute: mockExecute }),
    };
    view = new EstudioRegistrosMensualesView(mockEm);
  });

  it('should return 12 months of data by default', async () => {
    const result = await view.execute();

    expect(result).toHaveLength(12);
  });

  it('should fill missing months with zero', async () => {
    const now = new Date();
    const mes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    mockExecute.mockResolvedValue([{ mes, cantidad: 5 }]);

    const result = await view.execute();

    expect(result).toHaveLength(12);
    const currentMonth = result.find((r) => r.mes === mes);
    expect(currentMonth?.cantidad).toBe(5);

    const zeroMonths = result.filter((r) => r.mes !== mes);
    for (const m of zeroMonths) {
      expect(m.cantidad).toBe(0);
    }
  });

  it('should respect custom meses parameter', async () => {
    const result = await view.execute({ meses: 6 });

    expect(result).toHaveLength(6);
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("INTERVAL '6 months'"),
    );
  });

  it('should return month labels in YYYY-MM format', async () => {
    const result = await view.execute();

    for (const item of result) {
      expect(item.mes).toMatch(/^\d{4}-\d{2}$/);
    }
  });

  it('should query estudio table for registrations', async () => {
    await view.execute();

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('FROM estudio'),
    );
  });
});
