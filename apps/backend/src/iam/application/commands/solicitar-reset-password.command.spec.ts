import { SolicitarResetPasswordHandler } from './solicitar-reset-password.command';
import { Email } from '../../domain/value-objects/email.vo';
import { Password } from '../../domain/value-objects/password.vo';
import { Usuario } from '../../domain/entities/usuario.entity';
import { ROL } from '@numerito/shared';

describe('SolicitarResetPassword Command', () => {
  let handler: SolicitarResetPasswordHandler;
  let mockUsuarioRepo: any;
  let mockResetTokenRepo: any;

  beforeEach(async () => {
    const email = Email.create('user@test.com');
    const password = await Password.create('OldPass123!');
    const usuario = Usuario.create({
      email,
      password,
      nombre: 'Juan',
      apellido: 'Perez',
      rol: ROL.SOCIO,
    });

    mockUsuarioRepo = {
      findByEmail: jest.fn().mockResolvedValue(usuario),
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    mockResetTokenRepo = {
      save: jest.fn().mockResolvedValue(undefined),
      findByToken: jest.fn(),
      deleteByUsuarioId: jest.fn(),
    };

    handler = new SolicitarResetPasswordHandler(mockUsuarioRepo, mockResetTokenRepo);
  });

  it('should generate a reset token for existing user', async () => {
    const result = await handler.execute({ email: 'user@test.com' });
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');
    expect(result.token!.length).toBeGreaterThan(0);
    expect(mockResetTokenRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should not throw for non-existent email (security)', async () => {
    mockUsuarioRepo.findByEmail.mockResolvedValue(null);
    const result = await handler.execute({ email: 'noexiste@test.com' });
    expect(result.token).toBeNull();
  });
});
