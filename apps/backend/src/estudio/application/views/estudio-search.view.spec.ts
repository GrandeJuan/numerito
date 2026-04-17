import { EstudioSearchView } from './estudio-search.view';

describe('EstudioSearchView', () => {
  let view: EstudioSearchView;
  let mockEm: any;

  const mockEstudios = [
    {
      id: 'est-1',
      nombre: 'Estudio Contable Perez',
      cuit: '20-12345678-9',
      plan: { nombre: 'Profesional' },
      isActive: true,
    },
    {
      id: 'est-2',
      nombre: 'Estudio Garcia',
      cuit: '30-98765432-1',
      plan: { nombre: 'Enterprise' },
      isActive: true,
    },
  ];

  beforeEach(() => {
    mockEm = {
      find: jest.fn().mockResolvedValue([]),
    };
    view = new EstudioSearchView(mockEm);
  });

  it('should search estudios by nombre and cuit with $ilike', async () => {
    mockEm.find.mockResolvedValue(mockEstudios);

    await view.execute({ query: 'perez' });

    const where = mockEm.find.mock.calls[0][1];
    expect(where.$or).toHaveLength(2);
    expect(where.$or[0].nombre.$ilike).toBe('%perez%');
    expect(where.$or[1].cuit.$ilike).toBe('%perez%');
  });

  it('should use default limit of 5', async () => {
    mockEm.find.mockResolvedValue([]);

    await view.execute({ query: 'test' });

    const options = mockEm.find.mock.calls[0][2];
    expect(options.limit).toBe(5);
  });

  it('should respect custom limit', async () => {
    mockEm.find.mockResolvedValue([]);

    await view.execute({ query: 'test', limit: 10 });

    const options = mockEm.find.mock.calls[0][2];
    expect(options.limit).toBe(10);
  });

  it('should map estudio fields correctly', async () => {
    mockEm.find.mockResolvedValue(mockEstudios);

    const result = await view.execute({ query: 'perez' });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: 'est-1',
      nombre: 'Estudio Contable Perez',
      cuit: '20-12345678-9',
      plan: 'Profesional',
      isActive: true,
    });
  });

  it('should handle estudio without plan gracefully', async () => {
    mockEm.find.mockResolvedValue([{ ...mockEstudios[0], plan: null }]);

    const result = await view.execute({ query: 'perez' });

    expect(result[0].plan).toBe('Sin plan');
  });

  it('should order by nombre ASC', async () => {
    mockEm.find.mockResolvedValue([]);

    await view.execute({ query: 'test' });

    const options = mockEm.find.mock.calls[0][2];
    expect(options.orderBy).toEqual({ nombre: 'ASC' });
  });

  it('should populate plan relation', async () => {
    mockEm.find.mockResolvedValue([]);

    await view.execute({ query: 'test' });

    const options = mockEm.find.mock.calls[0][2];
    expect(options.populate).toEqual(['plan']);
  });
});
