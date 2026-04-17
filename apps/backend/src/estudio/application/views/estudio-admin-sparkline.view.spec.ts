import { EstudioAdminSparklineView } from './estudio-admin-sparkline.view';

describe('EstudioAdminSparklineView', () => {
  let view: EstudioAdminSparklineView;
  let mockExecute: jest.Mock;

  function make12Rows(field: string, values: number[]) {
    const now = new Date();
    return values.map((v, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return { mes, [field]: String(v) };
    });
  }

  function makeChurnRows(canceladas: number[], activas: number[]) {
    const now = new Date();
    return canceladas.map((c, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return { mes, canceladas: String(c), activas_inicio: String(activas[i]) };
    });
  }

  beforeEach(() => {
    mockExecute = jest.fn().mockResolvedValue([]);
    const mockEm: any = {
      getConnection: jest.fn().mockReturnValue({ execute: mockExecute }),
    };
    view = new EstudioAdminSparklineView(mockEm);
  });

  it('should return 12-month sparklines by default', async () => {
    const estudios = make12Rows('cantidad', [3, 4, 5, 5, 6, 6, 7, 7, 8, 9, 9, 10]);
    const subs = make12Rows('cantidad', [2, 3, 3, 4, 5, 5, 6, 6, 7, 7, 8, 8]);
    const mrr = make12Rows('mrr', [1000, 1500, 1800, 2000, 2500, 3000, 3200, 3500, 4000, 4200, 4500, 5000]);
    const churn = makeChurnRows([1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0], [10, 12, 14, 15, 16, 18, 20, 20, 22, 24, 25, 27]);

    mockExecute
      .mockResolvedValueOnce(estudios)
      .mockResolvedValueOnce(subs)
      .mockResolvedValueOnce(mrr)
      .mockResolvedValueOnce(churn);

    const result = await view.execute();

    expect(result.estudios).toHaveLength(12);
    expect(result.subscripciones).toHaveLength(12);
    expect(result.mrr).toHaveLength(12);
    expect(result.churn).toHaveLength(12);
  });

  it('should extract numeric values from rows', async () => {
    mockExecute
      .mockResolvedValueOnce([{ mes: '2026-04', cantidad: '10' }])
      .mockResolvedValueOnce([{ mes: '2026-04', cantidad: '8' }])
      .mockResolvedValueOnce([{ mes: '2026-04', mrr: '5000' }])
      .mockResolvedValueOnce([{ mes: '2026-04', canceladas: '2', activas_inicio: '20' }]);

    const result = await view.execute({ meses: 1 });

    expect(result.estudios).toEqual([10]);
    expect(result.subscripciones).toEqual([8]);
    expect(result.mrr).toEqual([5000]);
    expect(result.churn).toEqual([10]);
  });

  it('should calculate churn as (canceladas / activas_inicio) * 100', async () => {
    mockExecute
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ mes: '2026-04', canceladas: '3', activas_inicio: '30' }]);

    const result = await view.execute({ meses: 1 });

    expect(result.churn).toEqual([10]);
  });

  it('should return empty arrays when no data', async () => {
    const result = await view.execute();

    expect(result.estudios).toEqual([]);
    expect(result.subscripciones).toEqual([]);
    expect(result.mrr).toEqual([]);
    expect(result.churn).toEqual([]);
  });

  it('should use generate_series for time window', async () => {
    await view.execute();

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('generate_series'),
    );
  });

  it('should respect custom meses parameter', async () => {
    await view.execute({ meses: 6 });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("INTERVAL '5 months'"),
    );
  });
});
