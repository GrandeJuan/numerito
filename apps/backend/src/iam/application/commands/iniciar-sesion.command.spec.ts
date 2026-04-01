import { IniciarSesionHandler } from './iniciar-sesion.command';
import { Email } from '../../domain/value-objects/email.vo';
import { Password } from '../../domain/value-objects/password.vo';
import { Usuario } from '../../domain/entities/usuario.entity';
import { ROL } from '@numerito/shared';

describe('IniciarSesion Command', () => {
  let handler: IniciarSesionHandler;
  let mockUsuarioRepo: any;
  let mockTokenService: any;
  let testUsuario: Usuario;

  beforeEach(async () => {
    const email = Email.create('login@test.com');
    const password = await Password.create('SecurePass123!');
    testUsuario = Usuario.create({
      email,
      password,
      nombre: 'Juan',
      apellido: 'Perez',
      rol: ROL.SOCIO,
    });

    mockUsuarioRepo = {
      findByEmail: jest.fn().mockResolvedValue(testUsuario),
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    mockTokenService = {
      generateAccessToken: jest.fn().mockReturnValue('access-token-123'),
      generateRefreshToken: jest.fn().mockReturnValue('refresh-token-456'),
      verifyRefreshToken: jest.fn(),
    };

    handler = new IniciarSesionHandler(mockUsuarioRepo, mockTokenService);
  });

  it('should return tokens on valid credentials', async () => {
    const result = await handler.execute({
      email: 'login@test.com',
      password: 'SecurePass123!',
    });

    expect(result.accessToken).toBe('access-token-123');
    expect(result.refreshToken).toBe('refresh-token-456');
    expect(result.usuario.email).toBe('login@test.com');
  });

  it('should throw on non-existent email', async () => {
    mockUsuarioRepo.findByEmail.mockResolvedValue(null);

    await expect(
      handler.execute({ email: 'noexiste@test.com', password: 'SecurePass123!' }),
    ).rejects.toThrow('Credenciales inválidas');
  });

  it('should throw on wrong password', async () => {
    await expect(
      handler.execute({ email: 'login@test.com', password: 'WrongPassword123!' }),
    ).rejects.toThrow('Credenciales inválidas');
  });

  it('should throw on inactive usuario', async () => {
    testUsuario.deactivate();

    await expect(
      handler.execute({ email: 'login@test.com', password: 'SecurePass123!' }),
    ).rejects.toThrow('Usuario inactivo');
  });
});
