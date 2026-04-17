import { VencimientosProximosView } from './vencimientos-proximos.view';

describe('VencimientosProximosView', () => {
  let view: VencimientosProximosView;
  let mockEm: any;

  beforeEach(() => {
    mockEm = {
      count: jest.fn().mockResolvedValue(0),
    };
    view = new VencimientosProximosView(mockEm);
  });

  it('should return totalVencimientosProximos count for the given estudio', async () => {
    mockEm.count.mockResolvedValue(7);

    const result = await view.execute({ estudioId: 'estudio-1' });

    expect(result).toEqual({ totalVencimientosProximos: 7 });
    expect(mockEm.count).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        estudio: 'estudio-1',
        fechaVencimiento: expect.objectContaining({
          $gte: expect.any(Date),
          $lte: expect.any(Date),
        }),
      }),
    );
  });

  it('should default to 30-day window when diasAnticipacion is not provided', async () => {
    mockEm.count.mockResolvedValue(3);

    await view.execute({ estudioId: 'estudio-1' });

    const filter = mockEm.count.mock.calls[0][1];
    const gte: Date = filter.fechaVencimiento.$gte;
    const lte: Date = filter.fechaVencimiento.$lte;
    const diffMs = lte.getTime() - gte.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    expect(diffDays).toBe(30);
  });

  it('should use custom diasAnticipacion when provided', async () => {
    mockEm.count.mockResolvedValue(2);

    await view.execute({ estudioId: 'estudio-1', diasAnticipacion: 7 });

    const filter = mockEm.count.mock.calls[0][1];
    const gte: Date = filter.fechaVencimiento.$gte;
    const lte: Date = filter.fechaVencimiento.$lte;
    const diffMs = lte.getTime() - gte.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    expect(diffDays).toBe(7);
  });

  it('should filter by estudio tenant', async () => {
    mockEm.count.mockResolvedValue(0);

    await view.execute({ estudioId: 'estudio-42' });

    const filter = mockEm.count.mock.calls[0][1];
    expect(filter.estudio).toBe('estudio-42');
  });

  it('should return zero when no vencimientos match', async () => {
    mockEm.count.mockResolvedValue(0);

    const result = await view.execute({ estudioId: 'estudio-empty' });

    expect(result).toEqual({ totalVencimientosProximos: 0 });
  });
});
