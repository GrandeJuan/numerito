jest.mock('../../../estudio/infrastructure/persistence/estudio.schema', () => ({
  EstudioEntity: class EstudioEntity {},
}));
jest.mock('../../../iam/infrastructure/persistence/usuario.schema', () => ({
  UsuarioEntity: class UsuarioEntity {},
}));
jest.mock('../../../shared/infrastructure/persistence/plan.schema', () => ({
  PlanEntity: class PlanEntity {},
}));
jest.mock('../../../shared/infrastructure/persistence/rol.schema', () => ({
  RolEntity: class RolEntity {},
}));

import { AdminSearchHandler } from './admin-search.query';

describe('AdminSearchHandler', () => {
  let handler: AdminSearchHandler;
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
    handler = new AdminSearchHandler(mockEm);
  });

  it('should return empty results for empty query', async () => {
    const result = await handler.execute('');

    expect(result).toEqual({ estudios: [], usuarios: [] });
    expect(mockEm.find).not.toHaveBeenCalled();
  });

  it('should return empty results for whitespace-only query', async () => {
    const result = await handler.execute('   ');

    expect(result).toEqual({ estudios: [], usuarios: [] });
    expect(mockEm.find).not.toHaveBeenCalled();
  });

  it('should search estudios by nombre and CUIT', async () => {
    mockEm.find.mockResolvedValueOnce(mockEstudios).mockResolvedValueOnce([]);

    await handler.execute('perez');

    const estudiosCall = mockEm.find.mock.calls[0];
    const where = estudiosCall[1];
    expect(where.$or).toHaveLength(2);
    expect(where.$or[0]).toHaveProperty('nombre');
    expect(where.$or[1]).toHaveProperty('cuit');
  });

  it('should search usuarios by email, nombre, and apellido', async () => {
    mockEm.find.mockResolvedValueOnce([]).mockResolvedValueOnce(mockUsuarios);

    await handler.execute('perez');

    const usuariosCall = mockEm.find.mock.calls[1];
    const where = usuariosCall[1];
    expect(where.$or).toHaveLength(3);
    expect(where.$or[0]).toHaveProperty('email');
    expect(where.$or[1]).toHaveProperty('nombre');
    expect(where.$or[2]).toHaveProperty('apellido');
  });

  it('should limit results to 5 per entity type', async () => {
    mockEm.find.mockResolvedValueOnce(mockEstudios).mockResolvedValueOnce(mockUsuarios);

    await handler.execute('test');

    const estudiosOptions = mockEm.find.mock.calls[0][2];
    const usuariosOptions = mockEm.find.mock.calls[1][2];
    expect(estudiosOptions.limit).toBe(5);
    expect(usuariosOptions.limit).toBe(5);
  });

  it('should map estudio fields correctly', async () => {
    mockEm.find.mockResolvedValueOnce(mockEstudios).mockResolvedValueOnce([]);

    const result = await handler.execute('perez');

    expect(result.estudios).toHaveLength(2);
    expect(result.estudios[0]).toEqual({
      id: 'est-1',
      nombre: 'Estudio Contable Perez',
      cuit: '20-12345678-9',
      plan: 'Profesional',
      isActive: true,
    });
  });

  it('should map usuario fields correctly', async () => {
    mockEm.find.mockResolvedValueOnce([]).mockResolvedValueOnce(mockUsuarios);

    const result = await handler.execute('perez');

    expect(result.usuarios).toHaveLength(1);
    expect(result.usuarios[0]).toEqual({
      id: 'usr-1',
      email: 'juan@perez.com',
      nombre: 'Juan',
      apellido: 'Perez',
      rol: 'SOCIO',
      isActive: true,
    });
  });

  it('should handle estudio without plan gracefully', async () => {
    const estudioSinPlan = [{ ...mockEstudios[0], plan: null }];
    mockEm.find.mockResolvedValueOnce(estudioSinPlan).mockResolvedValueOnce([]);

    const result = await handler.execute('perez');

    expect(result.estudios[0].plan).toBe('Sin plan');
  });

  it('should handle usuario without rol gracefully', async () => {
    const usuarioSinRol = [{ ...mockUsuarios[0], rol: null }];
    mockEm.find.mockResolvedValueOnce([]).mockResolvedValueOnce(usuarioSinRol);

    const result = await handler.execute('perez');

    expect(result.usuarios[0].rol).toBe('UNKNOWN');
  });

  it('should use case-insensitive search (ILIKE pattern)', async () => {
    mockEm.find.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    await handler.execute('Perez');

    const estudiosWhere = mockEm.find.mock.calls[0][1];
    expect(estudiosWhere.$or[0].nombre.$ilike).toBe('%perez%');
  });

  it('should search both entity types in parallel', async () => {
    mockEm.find.mockResolvedValueOnce(mockEstudios).mockResolvedValueOnce(mockUsuarios);

    const result = await handler.execute('test');

    expect(mockEm.find).toHaveBeenCalledTimes(2);
    expect(result.estudios).toHaveLength(2);
    expect(result.usuarios).toHaveLength(1);
  });
});
