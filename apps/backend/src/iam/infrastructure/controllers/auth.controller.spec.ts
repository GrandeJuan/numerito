import { AuthController } from './auth.controller';
import { ROL } from '@numerito/shared';

describe('AuthController', () => {
  let controller: AuthController;
  let mockUsuarioRepo: any;
  let mockTokenService: any;
  let mockResetTokenRepo: any;
  let mockTotpSecretRepo: any;
  let mockSesionRepo: any;

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
    mockResetTokenRepo = {
      save: jest.fn().mockResolvedValue(undefined),
      findByToken: jest.fn().mockResolvedValue(null),
      deleteByUsuarioId: jest.fn().mockResolvedValue(undefined),
    };
    mockTotpSecretRepo = {
      save: jest.fn().mockResolvedValue(undefined),
      findByUsuarioId: jest.fn().mockResolvedValue(null),
      deleteByUsuarioId: jest.fn().mockResolvedValue(undefined),
    };
    mockSesionRepo = {
      findByUsuarioId: jest.fn().mockResolvedValue([]),
      findByRefreshToken: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(undefined),
      revokeAllByUsuarioId: jest.fn().mockResolvedValue(undefined),
    };
    controller = new AuthController(
      mockUsuarioRepo,
      mockTokenService,
      mockResetTokenRepo,
      mockTotpSecretRepo,
      mockSesionRepo,
    );
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

  describe('forgotPassword', () => {
    it('should return token when user exists', async () => {
      const { Email } = await import('../../domain/value-objects/email.vo');
      const { Usuario } = await import('../../domain/entities/usuario.entity');
      mockUsuarioRepo.findByEmail.mockResolvedValue(
        Usuario.create({
          email: Email.create('user@test.com'),
          password: { hashedValue: 'h' } as any,
          nombre: 'X',
          apellido: 'Y',
          rol: ROL.SOCIO,
        }),
      );

      const result = await controller.forgotPassword({ email: 'user@test.com' });
      expect(result.token).toBeDefined();
      expect(mockResetTokenRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should return null token when user does not exist', async () => {
      const result = await controller.forgotPassword({ email: 'nobody@test.com' });
      expect(result.token).toBeNull();
    });
  });

  describe('resetPassword', () => {
    it('should throw on invalid token', async () => {
      await expect(
        controller.resetPassword({ token: 'invalid', newPassword: 'NewPass123!' }),
      ).rejects.toThrow('Token inválido o expirado');
    });

    it('should throw on expired token', async () => {
      mockResetTokenRepo.findByToken.mockResolvedValue({
        usuarioId: 'user-1',
        token: 'valid-token',
        expiresAt: new Date(Date.now() - 10000),
      });

      await expect(
        controller.resetPassword({ token: 'valid-token', newPassword: 'NewPass123!' }),
      ).rejects.toThrow('Token inválido o expirado');
    });

    it('should reset password with valid token', async () => {
      const { Email } = await import('../../domain/value-objects/email.vo');
      const { Password } = await import('../../domain/value-objects/password.vo');
      const { Usuario } = await import('../../domain/entities/usuario.entity');
      const hashedPw = await Password.create('OldPass123!');
      const usuario = Usuario.create({
        email: Email.create('user@test.com'),
        password: hashedPw,
        nombre: 'X',
        apellido: 'Y',
        rol: ROL.SOCIO,
      });
      mockResetTokenRepo.findByToken.mockResolvedValue({
        usuarioId: usuario.id,
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 3600000),
      });
      mockUsuarioRepo.findById.mockResolvedValue(usuario);

      await controller.resetPassword({ token: 'valid-token', newPassword: 'NewPass123!' });
      expect(mockUsuarioRepo.save).toHaveBeenCalledTimes(1);
      expect(mockResetTokenRepo.deleteByUsuarioId).toHaveBeenCalledWith(usuario.id);
    });
  });

  describe('refreshToken', () => {
    it('should throw on invalid refresh token', async () => {
      mockTokenService.verifyRefreshToken.mockImplementation(() => {
        throw new Error('invalid');
      });

      await expect(
        controller.refreshToken({ refreshToken: 'bad-token' }),
      ).rejects.toThrow();
    });

    it('should return new tokens with valid refresh token', async () => {
      const payload = { sub: 'user-1', email: 'u@test.com', rol: 'SOCIO' };
      mockTokenService.verifyRefreshToken.mockReturnValue(payload);
      mockTokenService.generateAccessToken.mockReturnValue('new-access');
      mockTokenService.generateRefreshToken.mockReturnValue('new-refresh');

      const result = await controller.refreshToken({ refreshToken: 'valid-token' });
      expect(result.accessToken).toBe('new-access');
      expect(result.refreshToken).toBe('new-refresh');
    });
  });

  describe('activate2FA', () => {
    it('should throw when user not found', async () => {
      mockUsuarioRepo.findById.mockResolvedValue(null);

      await expect(
        controller.activate2FA('nonexistent-id'),
      ).rejects.toThrow('Usuario no encontrado');
    });

    it('should return secret and otpauth URL', async () => {
      const { Email } = await import('../../domain/value-objects/email.vo');
      const { Usuario } = await import('../../domain/entities/usuario.entity');
      const usuario = Usuario.create({
        email: Email.create('user@test.com'),
        password: { hashedValue: 'h' } as any,
        nombre: 'X',
        apellido: 'Y',
        rol: ROL.SOCIO,
      });
      mockUsuarioRepo.findById.mockResolvedValue(usuario);

      const result = await controller.activate2FA(usuario.id);
      expect(result.secret).toBeDefined();
      expect(result.otpauthUrl).toBeDefined();
      expect(mockTotpSecretRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('verify2FA', () => {
    it('should throw when 2FA not configured', async () => {
      await expect(
        controller.verify2FA('user-1', { code: '123456' }),
      ).rejects.toThrow('2FA no configurado');
    });

    it('should return valid:false for wrong code', async () => {
      mockTotpSecretRepo.findByUsuarioId.mockResolvedValue({
        usuarioId: 'user-1',
        secret: 'TESTSECRET',
        verified: false,
      });

      const result = await controller.verify2FA('user-1', { code: '000000' });
      expect(result.valid).toBe(false);
    });
  });
});
