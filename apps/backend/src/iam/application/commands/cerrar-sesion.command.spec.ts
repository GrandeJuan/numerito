import { CerrarSesionHandler } from './cerrar-sesion.command';

describe('CerrarSesionHandler', () => {
  let handler: CerrarSesionHandler;
  let mockSesionRepo: any;

  beforeEach(() => {
    mockSesionRepo = {
      revokeAllByUsuarioId: jest.fn().mockResolvedValue(undefined),
    };
    handler = new CerrarSesionHandler(mockSesionRepo);
  });

  it('should revoke all sessions for the user', async () => {
    await handler.execute({ usuarioId: 'user-1' });

    expect(mockSesionRepo.revokeAllByUsuarioId).toHaveBeenCalledWith('user-1');
  });

  it('should return success message', async () => {
    const result = await handler.execute({ usuarioId: 'user-1' });

    expect(result).toEqual({ message: 'Sesión cerrada exitosamente' });
  });

  it('should propagate repository errors', async () => {
    mockSesionRepo.revokeAllByUsuarioId.mockRejectedValue(new Error('DB error'));

    await expect(handler.execute({ usuarioId: 'user-1' })).rejects.toThrow('DB error');
  });
});
