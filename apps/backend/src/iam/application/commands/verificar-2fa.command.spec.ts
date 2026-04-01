import { Verificar2FAHandler } from './verificar-2fa.command';
import { generateTotpSecret, generateTotp } from '../../../shared/utils/totp';

describe('Verificar2FA Command', () => {
  let handler: Verificar2FAHandler;
  let mockUsuarioRepo: any;
  let mockTotpSecretRepo: any;
  const secret = generateTotpSecret();

  beforeEach(() => {
    mockUsuarioRepo = {
      findById: jest.fn().mockResolvedValue({ id: 'user-1' }),
      save: jest.fn(),
    };
    mockTotpSecretRepo = {
      findByUsuarioId: jest.fn().mockResolvedValue({ secret, verified: false }),
      save: jest.fn().mockResolvedValue(undefined),
    };
    handler = new Verificar2FAHandler(mockUsuarioRepo, mockTotpSecretRepo);
  });

  it('should verify a valid TOTP code', async () => {
    const validCode = generateTotp(secret);
    const result = await handler.execute({ usuarioId: 'user-1', code: validCode });
    expect(result.valid).toBe(true);
    expect(mockTotpSecretRepo.save).toHaveBeenCalled();
  });

  it('should reject an invalid TOTP code', async () => {
    const result = await handler.execute({ usuarioId: 'user-1', code: '000000' });
    expect(result.valid).toBe(false);
  });

  it('should throw if no secret configured', async () => {
    mockTotpSecretRepo.findByUsuarioId.mockResolvedValue(null);
    await expect(
      handler.execute({ usuarioId: 'user-1', code: '123456' }),
    ).rejects.toThrow('2FA no configurado');
  });
});
