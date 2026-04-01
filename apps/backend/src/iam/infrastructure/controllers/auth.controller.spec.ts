import { AuthController } from './auth.controller';
import { ROL } from '@numerito/shared';

describe('AuthController', () => {
  let controller: AuthController;
  let mockUsuarioRepo: any;
  let mockTokenService: any;

  beforeEach(() => {
    mockUsuarioRepo = {
      findByEmail: jest.fn().mockResolvedValue(null),
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    };
    mockTokenService = {
      generateAccessToken: jest.fn().mockReturnValue('access-token'),
      generateRefreshToken: jest.fn().mockReturnValue('refresh-token'),
      verifyRefreshToken: jest.fn(),
    };
    controller = new AuthController(mockUsuarioRepo, mockTokenService);
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const dto = {
        email: 'test@test.com',
        password: 'SecurePass123!',
        nombre: 'Juan',
        apellido: 'Perez',
        rol: ROL.SOCIO,
      };
      const result = await controller.register(dto);
      expect(result.id).toBeDefined();
      expect(result.email).toBe('test@test.com');
      expect(mockUsuarioRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should throw on duplicate email', async () => {
      const { Email } = await import('../../domain/value-objects/email.vo');
      const { Usuario } = await import('../../domain/entities/usuario.entity');
      mockUsuarioRepo.findByEmail.mockResolvedValue(
        Usuario.create({
          email: Email.create('dup@test.com'),
          password: { hashedValue: 'h' } as any,
          nombre: 'X',
          apellido: 'Y',
          rol: ROL.SOCIO,
        }),
      );

      await expect(
        controller.register({
          email: 'dup@test.com',
          password: 'SecurePass123!',
          nombre: 'A',
          apellido: 'B',
          rol: ROL.SOCIO,
        }),
      ).rejects.toThrow('El email ya está registrado');
    });
  });

  describe('login', () => {
    it('should throw on invalid credentials', async () => {
      await expect(
        controller.login({ email: 'no@test.com', password: 'pass' }),
      ).rejects.toThrow('Credenciales inválidas');
    });
  });
});
