import { ClienteSummaryView } from './cliente-summary.view';

describe('ClienteSummaryView', () => {
  let view: ClienteSummaryView;
  let mockEm: any;

  beforeEach(() => {
    mockEm = {
      count: jest.fn().mockResolvedValue(0),
    };
    view = new ClienteSummaryView(mockEm);
  });

  it('should return totalClientes count for the given estudio', async () => {
    mockEm.count.mockResolvedValue(12);

    const result = await view.execute({ estudioId: 'estudio-1' });

    expect(result).toEqual({ totalClientes: 12 });
    expect(mockEm.count).toHaveBeenCalledWith(
      expect.anything(),
      { estudio: 'estudio-1' },
    );
  });

  it('should apply responsable filter when responsableId is provided', async () => {
    mockEm.count.mockResolvedValue(5);

    const result = await view.execute({
      estudioId: 'estudio-1',
      responsableId: 'user-42',
    });

    expect(result).toEqual({ totalClientes: 5 });
    expect(mockEm.count).toHaveBeenCalledWith(
      expect.anything(),
      { estudio: 'estudio-1', responsable: 'user-42' },
    );
  });

  it('should not include responsable filter when responsableId is undefined', async () => {
    mockEm.count.mockResolvedValue(0);

    await view.execute({ estudioId: 'estudio-1' });

    const filter = mockEm.count.mock.calls[0][1];
    expect(filter).not.toHaveProperty('responsable');
  });

  it('should return zero when no clients match', async () => {
    mockEm.count.mockResolvedValue(0);

    const result = await view.execute({ estudioId: 'estudio-empty' });

    expect(result).toEqual({ totalClientes: 0 });
  });
});
