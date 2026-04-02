import { Verificar2FAHandler } from './verificar-2fa.command';
import { generateTotpSecret, generateTotp } from '../../../shared/utils/totp';

describe('Verificar2FA Command - already verified branch', () => {
  let handler: Verificar2FAHandler;
  let mockTotpSecretRepo: any;
  const secret = generateTotpSecret();

  beforeEach(() => {
    mockTotpSecretRepo = {
      findByUsuarioId: jest.fn().mockResolvedValue({ secret, verified: true }),
      save: jest.fn().mockResolvedValue(undefined),
    };
    handler = new Verificar2FAHandler(mockTotpSecretRepo);
  });

  it('should not save when already verified', async () => {
    const validCode = generateTotp(secret);
    const result = await handler.execute({ usuarioId: 'user-1', code: validCode });
    expect(result.valid).toBe(true);
    expect(mockTotpSecretRepo.save).not.toHaveBeenCalled();
  });
});
