import { AdminSearchHandler } from './admin-search.query';

describe('AdminSearchHandler', () => {
  let handler: AdminSearchHandler;
  let mockEstudioSearchView: any;
  let mockUsuarioSearchView: any;

  const mockEstudios = [
    {
      id: 'est-1',
      nombre: 'Estudio Contable Perez',
      cuit: '20-12345678-9',
      plan: 'Profesional',
      isActive: true,
    },
    {
      id: 'est-2',
      nombre: 'Estudio Garcia',
      cuit: '30-98765432-1',
      plan: 'Enterprise',
      isActive: true,
    },
  ];

  const mockUsuarios = [
    {
      id: 'usr-1',
      email: 'juan@perez.com',
      nombre: 'Juan',
      apellido: 'Perez',
      rol: 'SOCIO',
      isActive: true,
    },
  ];

  beforeEach(() => {
    mockEstudioSearchView = {
      execute: jest.fn().mockResolvedValue([]),
    };
    mockUsuarioSearchView = {
      execute: jest.fn().mockResolvedValue([]),
    };
    handler = new AdminSearchHandler(mockEstudioSearchView, mockUsuarioSearchView);
  });

  it('should return empty results for empty query', async () => {
    const result = await handler.execute('');

    expect(result).toEqual({ estudios: [], usuarios: [] });
    expect(mockEstudioSearchView.execute).not.toHaveBeenCalled();
    expect(mockUsuarioSearchView.execute).not.toHaveBeenCalled();
  });

  it('should return empty results for whitespace-only query', async () => {
    const result = await handler.execute('   ');

    expect(result).toEqual({ estudios: [], usuarios: [] });
    expect(mockEstudioSearchView.execute).not.toHaveBeenCalled();
    expect(mockUsuarioSearchView.execute).not.toHaveBeenCalled();
  });

  it('should call estudio search view with correct input', async () => {
    mockEstudioSearchView.execute.mockResolvedValue(mockEstudios);

    await handler.execute('perez');

    expect(mockEstudioSearchView.execute).toHaveBeenCalledWith({
      query: 'perez',
      limit: 5,
    });
  });

  it('should call usuario search view with correct input', async () => {
    mockUsuarioSearchView.execute.mockResolvedValue(mockUsuarios);

    await handler.execute('perez');

    expect(mockUsuarioSearchView.execute).toHaveBeenCalledWith({
      query: 'perez',
      limit: 5,
    });
  });

  it('should compose results from both views', async () => {
    mockEstudioSearchView.execute.mockResolvedValue(mockEstudios);
    mockUsuarioSearchView.execute.mockResolvedValue(mockUsuarios);

    const result = await handler.execute('perez');

    expect(result.estudios).toHaveLength(2);
    expect(result.usuarios).toHaveLength(1);
    expect(result.estudios[0]).toEqual({
      id: 'est-1',
      nombre: 'Estudio Contable Perez',
      cuit: '20-12345678-9',
      plan: 'Profesional',
      isActive: true,
    });
    expect(result.usuarios[0]).toEqual({
      id: 'usr-1',
      email: 'juan@perez.com',
      nombre: 'Juan',
      apellido: 'Perez',
      rol: 'SOCIO',
      isActive: true,
    });
  });

  it('should search both views in parallel', async () => {
    mockEstudioSearchView.execute.mockResolvedValue(mockEstudios);
    mockUsuarioSearchView.execute.mockResolvedValue(mockUsuarios);

    await handler.execute('test');

    expect(mockEstudioSearchView.execute).toHaveBeenCalledTimes(1);
    expect(mockUsuarioSearchView.execute).toHaveBeenCalledTimes(1);
  });

  it('should trim the query before passing to views', async () => {
    await handler.execute('  perez  ');

    expect(mockEstudioSearchView.execute).toHaveBeenCalledWith({
      query: 'perez',
      limit: 5,
    });
  });
});
