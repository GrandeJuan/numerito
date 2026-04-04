import { AutenticarSsoHandler } from './autenticar-sso.command';
import { Email } from '../../domain/value-objects/email.vo';
import { Password } from '../../domain/value-objects/password.vo';
import { Usuario } from '../../domain/entities/usuario.entity';
import { ROL } from '@numerito/shared';

describe('AutenticarSsoHandler', () => {
  let handler: AutenticarSsoHandler;
  let mockUsuarioRepo: any;
  let mockTokenService: any;
  let activeUsuario: Usuario;

  beforeEach(async () => {
    const email = Email.create('juan@estudio.com');
    const password = await Password.create('SecurePass123!');
    activeUsuario = Usuario.create({
      email,
      password,
      nombre: 'Juan',
      apellido: 'Perez',
      rol: ROL.SOCIO,
    });

    mockUsuarioRepo = {
      findByEmail: jest.fn().mockResolvedValue(activeUsuario),
      save: jest.fn().mockResolvedValue(undefined),
    };

    mockTokenService = {
      generateAccessToken: jest.fn().mockReturnValue('access-token'),
      generateRefreshToken: jest.fn().mockReturnValue('refresh-token'),
    };

    handler = new AutenticarSsoHandler(mockUsuarioRepo, mockTokenService);
  });

  it('should link provider and generate tokens for existing user', async () => {
    const result = await handler.execute({
      provider: 'google',
      providerId: 'google-123',
      email: 'juan@estudio.com',
      nombre: 'Juan',
      apellido: 'Perez',
    });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.usuario.email).toBe('juan@estudio.com');
    expect(result.usuario.rol).toBe(ROL.SOCIO);
    expect(activeUsuario.provider).toBe('google');
    expect(activeUsuario.providerId).toBe('google-123');
    expect(mockUsuarioRepo.save).toHaveBeenCalledWith(activeUsuario);
  });

  it('should work with microsoft provider', async () => {
    const result = await handler.execute({
      provider: 'microsoft',
      providerId: 'ms-456',
      email: 'juan@estudio.com',
      nombre: 'Juan',
      apellido: 'Perez',
    });

    expect(result.accessToken).toBe('access-token');
    expect(activeUsuario.provider).toBe('microsoft');
    expect(activeUsuario.providerId).toBe('ms-456');
  });

  it('should throw when user does not exist', async () => {
    mockUsuarioRepo.findByEmail.mockResolvedValue(null);

    await expect(
      handler.execute({
        provider: 'google',
        providerId: 'google-999',
        email: 'noexiste@test.com',
        nombre: 'Maria',
        apellido: 'Garcia',
      }),
    ).rejects.toThrow('No existe una cuenta con ese email');
  });

  it('should throw when user is inactive', async () => {
    activeUsuario.deactivate();

    await expect(
      handler.execute({
        provider: 'google',
        providerId: 'g-123',
        email: 'juan@estudio.com',
        nombre: 'Juan',
        apellido: 'Perez',
      }),
    ).rejects.toThrow('Usuario inactivo');
  });
});
