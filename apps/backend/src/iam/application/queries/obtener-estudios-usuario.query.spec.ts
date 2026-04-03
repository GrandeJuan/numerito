import { ObtenerEstudiosUsuarioHandler } from './obtener-estudios-usuario.query';

describe('ObtenerEstudiosUsuarioHandler', () => {
  let handler: ObtenerEstudiosUsuarioHandler;
  let mockUsuarioEstudioRepo: any;
  let mockEstudioLookup: any;

  beforeEach(() => {
    mockUsuarioEstudioRepo = {
      findByUsuarioId: jest.fn(),
    };
    mockEstudioLookup = {
      findById: jest.fn(),
    };
    handler = new ObtenerEstudiosUsuarioHandler(mockUsuarioEstudioRepo, mockEstudioLookup);
  });

  it('should return empty array for user with no estudios', async () => {
    mockUsuarioEstudioRepo.findByUsuarioId.mockResolvedValue([]);

    const result = await handler.execute({ usuarioId: 'user-1' });

    expect(result).toEqual([]);
  });

  it('should return estudios with id, nombre, and rol', async () => {
    mockUsuarioEstudioRepo.findByUsuarioId.mockResolvedValue([
      { estudioId: 'est-1', rol: 'SOCIO', isActive: true },
      { estudioId: 'est-2', rol: 'EMPLEADO', isActive: true },
    ]);
    mockEstudioLookup.findById
      .mockResolvedValueOnce({ id: 'est-1', nombre: 'Estudio Perez' })
      .mockResolvedValueOnce({ id: 'est-2', nombre: 'Estudio Garcia' });

    const result = await handler.execute({ usuarioId: 'user-1' });

    expect(result).toEqual([
      { id: 'est-1', nombre: 'Estudio Perez', rol: 'SOCIO' },
      { id: 'est-2', nombre: 'Estudio Garcia', rol: 'EMPLEADO' },
    ]);
  });

  it('should skip inactive memberships', async () => {
    mockUsuarioEstudioRepo.findByUsuarioId.mockResolvedValue([
      { estudioId: 'est-1', rol: 'SOCIO', isActive: true },
      { estudioId: 'est-2', rol: 'EMPLEADO', isActive: false },
    ]);
    mockEstudioLookup.findById.mockResolvedValueOnce({
      id: 'est-1',
      nombre: 'Estudio Perez',
    });

    const result = await handler.execute({ usuarioId: 'user-1' });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('est-1');
  });

  it('should skip estudios not found', async () => {
    mockUsuarioEstudioRepo.findByUsuarioId.mockResolvedValue([
      { estudioId: 'est-1', rol: 'SOCIO', isActive: true },
    ]);
    mockEstudioLookup.findById.mockResolvedValueOnce(null);

    const result = await handler.execute({ usuarioId: 'user-1' });

    expect(result).toEqual([]);
  });
});
