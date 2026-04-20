import { ClienteCountPorEstudioView } from './cliente-count-por-estudio.view';

describe('ClienteCountPorEstudioView', () => {
  let view: ClienteCountPorEstudioView;
  let mockEm: any;

  beforeEach(() => {
    mockEm = {
      count: jest.fn().mockResolvedValue(0),
    };
    view = new ClienteCountPorEstudioView(mockEm);
  });

  it('should filter by estudioId and isActive', async () => {
    await view.execute({ estudioId: 'est-1' });

    const where = mockEm.count.mock.calls[0][1];
    expect(where.estudio).toBe('est-1');
    expect(where.isActive).toBe(true);
  });

  it('should return count from EntityManager', async () => {
    mockEm.count.mockResolvedValue(42);

    const result = await view.execute({ estudioId: 'est-1' });

    expect(result).toEqual({ count: 42 });
  });

  it('should return zero when estudio has no active clients', async () => {
    mockEm.count.mockResolvedValue(0);

    const result = await view.execute({ estudioId: 'est-empty' });

    expect(result).toEqual({ count: 0 });
  });

  it('should isolate counts by estudioId (multi-tenant)', async () => {
    mockEm.count.mockResolvedValueOnce(10).mockResolvedValueOnce(25);

    const resultA = await view.execute({ estudioId: 'est-A' });
    const resultB = await view.execute({ estudioId: 'est-B' });

    expect(mockEm.count.mock.calls[0][1].estudio).toBe('est-A');
    expect(mockEm.count.mock.calls[1][1].estudio).toBe('est-B');
    expect(resultA).toEqual({ count: 10 });
    expect(resultB).toEqual({ count: 25 });
  });
});
