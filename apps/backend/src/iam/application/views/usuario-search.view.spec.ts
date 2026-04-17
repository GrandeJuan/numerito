import { UsuarioSearchView } from './usuario-search.view';

describe('UsuarioSearchView', () => {
  let view: UsuarioSearchView;
  let mockEm: any;

  const mockUsuarios = [
    {
      id: 'usr-1',
      email: 'juan@perez.com',
      nombre: 'Juan',
      apellido: 'Perez',
      rol: { codigo: 'SOCIO' },
      isActive: true,
    },
  ];

  beforeEach(() => {
    mockEm = {
      find: jest.fn().mockResolvedValue([]),
    };
    view = new UsuarioSearchView(mockEm);
  });

  it('should search usuarios by email, nombre, and apellido with $ilike', async () => {
    mockEm.find.mockResolvedValue(mockUsuarios);

    await view.execute({ query: 'perez' });

    const where = mockEm.find.mock.calls[0][1];
    expect(where.$or).toHaveLength(3);
    expect(where.$or[0].email.$ilike).toBe('%perez%');
    expect(where.$or[1].nombre.$ilike).toBe('%perez%');
    expect(where.$or[2].apellido.$ilike).toBe('%perez%');
  });

  it('should use default limit of 5', async () => {
    await view.execute({ query: 'test' });

    const options = mockEm.find.mock.calls[0][2];
    expect(options.limit).toBe(5);
  });

  it('should respect custom limit', async () => {
    await view.execute({ query: 'test', limit: 10 });

    const options = mockEm.find.mock.calls[0][2];
    expect(options.limit).toBe(10);
  });

  it('should map usuario fields correctly', async () => {
    mockEm.find.mockResolvedValue(mockUsuarios);

    const result = await view.execute({ query: 'perez' });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 'usr-1',
      email: 'juan@perez.com',
      nombre: 'Juan',
      apellido: 'Perez',
      rol: 'SOCIO',
      isActive: true,
    });
  });

  it('should handle usuario without rol gracefully', async () => {
    mockEm.find.mockResolvedValue([{ ...mockUsuarios[0], rol: null }]);

    const result = await view.execute({ query: 'perez' });

    expect(result[0].rol).toBe('UNKNOWN');
  });

  it('should order by nombre ASC', async () => {
    await view.execute({ query: 'test' });

    const options = mockEm.find.mock.calls[0][2];
    expect(options.orderBy).toEqual({ nombre: 'ASC' });
  });

  it('should populate rol relation', async () => {
    await view.execute({ query: 'test' });

    const options = mockEm.find.mock.calls[0][2];
    expect(options.populate).toEqual(['rol']);
  });
});
