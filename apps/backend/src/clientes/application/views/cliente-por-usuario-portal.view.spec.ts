import { ClientePorUsuarioPortalView } from './cliente-por-usuario-portal.view';

describe('ClientePorUsuarioPortalView', () => {
  let view: ClientePorUsuarioPortalView;
  let mockExecute: jest.Mock;

  const usuarioId = 'user-uuid';

  beforeEach(() => {
    mockExecute = jest.fn().mockResolvedValue([]);
    const mockEm: any = {
      getConnection: () => ({ execute: mockExecute }),
    };
    view = new ClientePorUsuarioPortalView(mockEm);
  });

  it('should return null when no cliente is linked to user', async () => {
    const result = await view.execute({ usuarioId });

    expect(result).toBeNull();
  });

  it('should return cliente id and razon social when found', async () => {
    mockExecute.mockResolvedValueOnce([{ id: 'cliente-uuid', razon_social: 'Mi Empresa SRL' }]);

    const result = await view.execute({ usuarioId });

    expect(result).toEqual({
      clienteId: 'cliente-uuid',
      razonSocial: 'Mi Empresa SRL',
    });
  });

  it('should pass usuario id as parameter', async () => {
    await view.execute({ usuarioId });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('ue.usuario_id = ?'),
      [usuarioId],
    );
  });

  it('should filter by CLIENTE role', async () => {
    await view.execute({ usuarioId });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("r.codigo = 'CLIENTE'"),
      expect.any(Array),
    );
  });

  it('should return only first match', async () => {
    mockExecute.mockResolvedValueOnce([
      { id: 'c1', razon_social: 'First' },
      { id: 'c2', razon_social: 'Second' },
    ]);

    const result = await view.execute({ usuarioId });

    expect(result).toEqual({
      clienteId: 'c1',
      razonSocial: 'First',
    });
  });
});
