import { UsuarioMembershipView } from './usuario-membership.view';

describe('UsuarioMembershipView', () => {
  let view: UsuarioMembershipView;
  let mockExecute: jest.Mock;

  const usuarioId = 'user-uuid';
  const estudioId = 'estudio-uuid';

  beforeEach(() => {
    mockExecute = jest.fn();
    const mockEm: any = {
      getConnection: () => ({ execute: mockExecute }),
    };
    view = new UsuarioMembershipView(mockEm);
  });

  it('should return null when no membership exists', async () => {
    mockExecute.mockResolvedValueOnce([]);

    const result = await view.execute({ usuarioId, estudioId });

    expect(result).toBeNull();
  });

  it('should return membership with role and permissions', async () => {
    mockExecute
      .mockResolvedValueOnce([{ is_active: true, rol: 'SOCIO' }])
      .mockResolvedValueOnce([
        { codigo: 'VER_FACTURACION' },
        { codigo: 'VER_CLIENTES' },
        { codigo: 'VER_TAREAS' },
      ]);

    const result = await view.execute({ usuarioId, estudioId });

    expect(result).toEqual({
      isActive: true,
      rol: 'SOCIO',
      permisos: ['VER_FACTURACION', 'VER_CLIENTES', 'VER_TAREAS'],
    });
  });

  it('should return inactive membership', async () => {
    mockExecute
      .mockResolvedValueOnce([{ is_active: false, rol: 'EMPLEADO' }])
      .mockResolvedValueOnce([{ codigo: 'VER_TAREAS' }]);

    const result = await view.execute({ usuarioId, estudioId });

    expect(result).toEqual({
      isActive: false,
      rol: 'EMPLEADO',
      permisos: ['VER_TAREAS'],
    });
  });

  it('should return empty permissions when role has none', async () => {
    mockExecute
      .mockResolvedValueOnce([{ is_active: true, rol: 'CLIENTE' }])
      .mockResolvedValueOnce([]);

    const result = await view.execute({ usuarioId, estudioId });

    expect(result).toEqual({
      isActive: true,
      rol: 'CLIENTE',
      permisos: [],
    });
  });

  it('should pass correct params to membership query', async () => {
    mockExecute.mockResolvedValueOnce([]);

    await view.execute({ usuarioId, estudioId });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('ue.usuario_id = ?'),
      [usuarioId, estudioId],
    );
  });

  it('should pass role to permissions query', async () => {
    mockExecute
      .mockResolvedValueOnce([{ is_active: true, rol: 'RESPONSABLE' }])
      .mockResolvedValueOnce([]);

    await view.execute({ usuarioId, estudioId });

    expect(mockExecute).toHaveBeenCalledTimes(2);
    expect(mockExecute).toHaveBeenLastCalledWith(
      expect.stringContaining('r.codigo = ?'),
      ['RESPONSABLE'],
    );
  });
});
