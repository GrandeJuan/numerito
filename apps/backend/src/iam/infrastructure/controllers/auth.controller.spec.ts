import { AuthController } from './auth.controller';
import { ROL } from '@numerito/shared';

describe('AuthController', () => {
  let controller: AuthController;
  let mockRegistrarHandler: any;
  let mockIniciarSesionHandler: any;
  let mockSolicitarResetHandler: any;
  let mockResetearPasswordHandler: any;
  let mockActivar2FAHandler: any;
  let mockVerificar2FAHandler: any;
  let mockTokenService: any;
  let mockTotpSecretRepo: any;

  beforeEach(() => {
    mockRegistrarHandler = {
      execute: jest.fn().mockResolvedValue({ id: 'user-1', email: 'test@test.com' }),
    };
    mockIniciarSesionHandler = {
      execute: jest.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        usuario: { id: 'user-1', email: 'test@test.com', nombre: 'Juan', apellido: 'Perez', rol: ROL.SOCIO },
      }),
    };
    mockSolicitarResetHandler = {
      execute: jest.fn().mockResolvedValue({ token: 'reset-token' }),
    };
    mockResetearPasswordHandler = {
      execute: jest.fn().mockResolvedValue(undefined),
    };
    mockActivar2FAHandler = {
      execute: jest.fn().mockResolvedValue({ secret: 'SECRET', otpauthUrl: 'otpauth://totp/...' }),
    };
    mockVerificar2FAHandler = {
      execute: jest.fn().mockResolvedValue({ valid: true }),
    };
    mockTokenService = {
      generateAccessToken: jest.fn().mockReturnValue('access-token'),
      generateRefreshToken: jest.fn().mockReturnValue('refresh-token'),
      verifyRefreshToken: jest.fn(),
    };
    mockTotpSecretRepo = {
      save: jest.fn().mockResolvedValue(undefined),
      findByUsuarioId: jest.fn().mockResolvedValue(null),
      deleteByUsuarioId: jest.fn().mockResolvedValue(undefined),
    };
    controller = new AuthController(
      mockRegistrarHandler,
      mockIniciarSesionHandler,
      mockSolicitarResetHandler,
      mockResetearPasswordHandler,
      mockActivar2FAHandler,
      mockVerificar2FAHandler,
      mockTokenService,
      mockTotpSecretRepo,
    );
  });

  describe('register', () => {
    it('should delegate to registrar handler', async () => {
      const dto = {
        email: 'test@test.com',
        password: 'SecurePass123!',
        nombre: 'Juan',
        apellido: 'Perez',
        rol: ROL.SOCIO,
      };
      const result = await controller.register(dto);
      expect(result.id).toBe('user-1');
      expect(result.email).toBe('test@test.com');
      expect(mockRegistrarHandler.execute).toHaveBeenCalledWith({
        ...dto,
        rol: ROL.SOCIO,
      });
    });

    it('should propagate handler errors', async () => {
      mockRegistrarHandler.execute.mockRejectedValue(new Error('El email ya está registrado'));

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
    it('should delegate to iniciar sesion handler', async () => {
      const dto = { email: 'test@test.com', password: 'pass' };
      const result = await controller.login(dto);
      expect(result.accessToken).toBe('access-token');
      expect(mockIniciarSesionHandler.execute).toHaveBeenCalledWith(dto);
    });

    it('should propagate handler errors', async () => {
      mockIniciarSesionHandler.execute.mockRejectedValue(new Error('Credenciales inválidas'));

      await expect(
        controller.login({ email: 'no@test.com', password: 'pass' }),
      ).rejects.toThrow('Credenciales inválidas');
    });
  });

  describe('forgotPassword', () => {
    it('should delegate to solicitar reset handler', async () => {
      const result = await controller.forgotPassword({ email: 'user@test.com' });
      expect(result.token).toBe('reset-token');
      expect(mockSolicitarResetHandler.execute).toHaveBeenCalledWith({ email: 'user@test.com' });
    });

    it('should return null token when handler returns null', async () => {
      mockSolicitarResetHandler.execute.mockResolvedValue({ token: null });

      const result = await controller.forgotPassword({ email: 'nobody@test.com' });
      expect(result.token).toBeNull();
    });
  });

  describe('resetPassword', () => {
    it('should delegate to resetear password handler', async () => {
      await controller.resetPassword({ token: 'valid-token', newPassword: 'NewPass123!' });
      expect(mockResetearPasswordHandler.execute).toHaveBeenCalledWith({
        token: 'valid-token',
        newPassword: 'NewPass123!',
      });
    });

    it('should propagate handler errors', async () => {
      mockResetearPasswordHandler.execute.mockRejectedValue(new Error('Token inválido o expirado'));

      await expect(
        controller.resetPassword({ token: 'invalid', newPassword: 'NewPass123!' }),
      ).rejects.toThrow('Token inválido o expirado');
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
    it('should delegate to activar 2FA handler and save secret', async () => {
      const result = await controller.activate2FA('user-1');
      expect(result.secret).toBe('SECRET');
      expect(result.otpauthUrl).toBe('otpauth://totp/...');
      expect(mockTotpSecretRepo.save).toHaveBeenCalledWith({
        usuarioId: 'user-1',
        secret: 'SECRET',
        verified: false,
      });
    });

    it('should propagate handler errors', async () => {
      mockActivar2FAHandler.execute.mockRejectedValue(new Error('Usuario no encontrado'));

      await expect(controller.activate2FA('nonexistent-id')).rejects.toThrow('Usuario no encontrado');
    });
  });

  describe('verify2FA', () => {
    it('should delegate to verificar 2FA handler', async () => {
      const result = await controller.verify2FA('user-1', { code: '123456' });
      expect(result.valid).toBe(true);
      expect(mockVerificar2FAHandler.execute).toHaveBeenCalledWith({
        usuarioId: 'user-1',
        code: '123456',
      });
    });

    it('should propagate handler errors', async () => {
      mockVerificar2FAHandler.execute.mockRejectedValue(new Error('2FA no configurado'));

      await expect(
        controller.verify2FA('user-1', { code: '123456' }),
      ).rejects.toThrow('2FA no configurado');
    });
  });
});
