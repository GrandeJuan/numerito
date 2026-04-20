import { Reenviar2FAHandler, _resetResendLog } from './reenviar-2fa.command';
import { TwoFANoConfiguradoError, RecursoNoEncontradoError, OperacionInvalidaError } from '../../../shared/domain/exceptions';

describe('Reenviar2FAHandler', () => {
  let handler: Reenviar2FAHandler;
  let mockTotpSecretRepo: any;
  let mockUsuarioRepo: any;

  beforeEach(() => {
    _resetResendLog();
    mockTotpSecretRepo = {
      findByUsuarioId: jest.fn().mockResolvedValue({ usuarioId: 'user-1', secret: 'OLD_SECRET', verified: false }),
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockUsuarioRepo = {
      findById: jest.fn().mockResolvedValue({ id: 'user-1', email: { value: 'test@test.com' } }),
    };
    handler = new Reenviar2FAHandler(mockTotpSecretRepo, mockUsuarioRepo);
  });

  it('should regenerate TOTP secret and save it', async () => {
    await handler.execute({ usuarioId: 'user-1' });

    expect(mockTotpSecretRepo.findByUsuarioId).toHaveBeenCalledWith('user-1');
    expect(mockUsuarioRepo.findById).toHaveBeenCalledWith('user-1');
    expect(mockTotpSecretRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        usuarioId: 'user-1',
        verified: false,
      }),
    );
  });

  it('should throw TwoFANoConfiguradoError when no TOTP secret exists', async () => {
    mockTotpSecretRepo.findByUsuarioId.mockResolvedValue(null);

    await expect(handler.execute({ usuarioId: 'user-1' })).rejects.toThrow(TwoFANoConfiguradoError);
  });

  it('should throw RecursoNoEncontradoError when user does not exist', async () => {
    mockUsuarioRepo.findById.mockResolvedValue(null);

    await expect(handler.execute({ usuarioId: 'user-1' })).rejects.toThrow(RecursoNoEncontradoError);
  });

  it('should enforce rate limit after 3 resends within 10 minutes', async () => {
    await handler.execute({ usuarioId: 'user-1' });
    await handler.execute({ usuarioId: 'user-1' });
    await handler.execute({ usuarioId: 'user-1' });

    await expect(handler.execute({ usuarioId: 'user-1' })).rejects.toThrow(OperacionInvalidaError);
  });

  it('should rate limit per user independently', async () => {
    await handler.execute({ usuarioId: 'user-1' });
    await handler.execute({ usuarioId: 'user-1' });
    await handler.execute({ usuarioId: 'user-1' });

    // user-2 should not be rate limited
    mockTotpSecretRepo.findByUsuarioId.mockResolvedValue({ usuarioId: 'user-2', secret: 'SECRET', verified: false });
    mockUsuarioRepo.findById.mockResolvedValue({ id: 'user-2', email: { value: 'user2@test.com' } });

    await expect(handler.execute({ usuarioId: 'user-2' })).resolves.toBeUndefined();
  });
});
