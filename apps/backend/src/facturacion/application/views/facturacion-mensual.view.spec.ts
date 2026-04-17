import { FacturacionMensualView } from './facturacion-mensual.view';

describe('FacturacionMensualView', () => {
  let view: FacturacionMensualView;
  let mockExecute: jest.Mock;
  let mockEm: any;

  beforeEach(() => {
    mockExecute = jest.fn().mockResolvedValue([]);
    mockEm = {
      getConnection: jest.fn().mockReturnValue({ execute: mockExecute }),
    };
    view = new FacturacionMensualView(mockEm);
  });

  it('should return monthly facturacion data', async () => {
    mockExecute.mockResolvedValue([
      { mes: '2026-01', monto: 100000 },
      { mes: '2026-02', monto: 120000 },
      { mes: '2026-03', monto: 95000 },
    ]);

    const result = await view.execute({ estudioId: 'estudio-1' });

    expect(result).toEqual([
      { mes: '2026-01', monto: 100000 },
      { mes: '2026-02', monto: 120000 },
      { mes: '2026-03', monto: 95000 },
    ]);
  });

  it('should filter by estudioId', async () => {
    await view.execute({ estudioId: 'estudio-1' });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('estudio_id = ?'),
      expect.arrayContaining(['estudio-1']),
    );
  });

  it('should default to 6 months lookback', async () => {
    await view.execute({ estudioId: 'estudio-1' });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining([6]),
    );
  });

  it('should accept custom mesesAtras', async () => {
    await view.execute({ estudioId: 'estudio-1', mesesAtras: 12 });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining([12]),
    );
  });

  it('should return empty array when no facturacion data', async () => {
    const result = await view.execute({ estudioId: 'estudio-empty' });
    expect(result).toEqual([]);
  });
});
