import { ResetearPasswordHandler } from './resetear-password.command';
import { Email } from '../../domain/value-objects/email.vo';
import { Password } from '../../domain/value-objects/password.vo';
import { Usuario } from '../../domain/entities/usuario.entity';
import { ROL } from '@numerito/shared';

describe('ResetearPassword Command', () => {
  let handler: ResetearPasswordHandler;
  let mockUsuarioRepo: any;
  let mockResetTokenRepo: any;
  let testUsuario: Usuario;

  beforeEach(async () => {
    const email = Email.create('user@test.com');
    const password = await Password.create('OldPass123!');
    testUsuario = Usuario.create({
      email,
      password,
      nombre: 'Juan',
      apellido: 'Perez',
      rol: ROL.SOCIO,
    });

    mockUsuarioRepo = {
      findByEmail: jest.fn(),
      findById: jest.fn().mockResolvedValue(testUsuario),
      findAll: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    };

    mockResetTokenRepo = {
      save: jest.fn(),
      findByToken: jest.fn().mockResolvedValue({
        usuarioId: testUsuario.id,
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 3600000),
      }),
      deleteByUsuarioId: jest.fn().mockResolvedValue(undefined),
    };

    handler = new ResetearPasswordHandler(mockUsuarioRepo, mockResetTokenRepo);
  });

  it('should reset password with valid token', async () => {
    await handler.execute({ token: 'valid-token', newPassword: 'NewSecure123!' });
    expect(mockUsuarioRepo.save).toHaveBeenCalledTimes(1);
    expect(mockResetTokenRepo.deleteByUsuarioId).toHaveBeenCalledWith(testUsuario.id);
  });

  it('should throw on invalid token', async () => {
    mockResetTokenRepo.findByToken.mockResolvedValue(null);
    await expect(
      handler.execute({ token: 'invalid', newPassword: 'NewSecure123!' }),
    ).rejects.toThrow('Token inválido o expirado');
  });

  it('should throw on expired token', async () => {
    mockResetTokenRepo.findByToken.mockResolvedValue({
      usuarioId: testUsuario.id,
      token: 'expired-token',
      expiresAt: new Date(Date.now() - 1000),
    });
    await expect(
      handler.execute({ token: 'expired-token', newPassword: 'NewSecure123!' }),
    ).rejects.toThrow('Token inválido o expirado');
  });
});
