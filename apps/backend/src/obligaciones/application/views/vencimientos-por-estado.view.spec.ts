import { VencimientosPorEstadoView } from './vencimientos-por-estado.view';

describe('VencimientosPorEstadoView', () => {
  let view: VencimientosPorEstadoView;
  let mockExecute: jest.Mock;
  let mockEm: any;

  beforeEach(() => {
    mockExecute = jest.fn().mockResolvedValue([]);
    mockEm = {
      getConnection: jest.fn().mockReturnValue({ execute: mockExecute }),
    };
    view = new VencimientosPorEstadoView(mockEm);
  });

  it('should return vencimientos grouped by estado', async () => {
    mockExecute.mockResolvedValue([
      { estado: 'PENDIENTE', cantidad: 10 },
      { estado: 'PRESENTADO', cantidad: 5 },
    ]);

    const result = await view.execute({ estudioId: 'estudio-1' });

    expect(result).toEqual([
      { estado: 'PENDIENTE', cantidad: 10 },
      { estado: 'PRESENTADO', cantidad: 5 },
    ]);
  });

  it('should filter by estudioId', async () => {
    await view.execute({ estudioId: 'estudio-1' });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('v.estudio_id = ?'),
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

  it('should return empty array when no data', async () => {
    const result = await view.execute({ estudioId: 'estudio-empty' });
    expect(result).toEqual([]);
  });
});
