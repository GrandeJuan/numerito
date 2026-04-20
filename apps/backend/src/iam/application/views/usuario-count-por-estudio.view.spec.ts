import { UsuarioCountPorEstudioView } from './usuario-count-por-estudio.view';

describe('UsuarioCountPorEstudioView', () => {
  let view: UsuarioCountPorEstudioView;
  let mockEm: any;

  beforeEach(() => {
    mockEm = {
      count: jest.fn().mockResolvedValue(0),
    };
    view = new UsuarioCountPorEstudioView(mockEm);
  });

  it('should filter by estudioId and isActive', async () => {
    await view.execute({ estudioId: 'est-1' });

    const where = mockEm.count.mock.calls[0][1];
    expect(where.estudio).toBe('est-1');
    expect(where.isActive).toBe(true);
  });

  it('should return count from EntityManager', async () => {
    mockEm.count.mockResolvedValue(7);

    const result = await view.execute({ estudioId: 'est-1' });

    expect(result).toEqual({ count: 7 });
  });

  it('should return zero when estudio has no active users', async () => {
    mockEm.count.mockResolvedValue(0);

    const result = await view.execute({ estudioId: 'est-empty' });

    expect(result).toEqual({ count: 0 });
  });

  it('should isolate counts by estudioId (multi-tenant)', async () => {
    mockEm.count.mockResolvedValueOnce(3).mockResolvedValueOnce(5);

    const resultA = await view.execute({ estudioId: 'est-A' });
    const resultB = await view.execute({ estudioId: 'est-B' });

    expect(mockEm.count.mock.calls[0][1].estudio).toBe('est-A');
    expect(mockEm.count.mock.calls[1][1].estudio).toBe('est-B');
    expect(resultA).toEqual({ count: 3 });
    expect(resultB).toEqual({ count: 5 });
  });
});
