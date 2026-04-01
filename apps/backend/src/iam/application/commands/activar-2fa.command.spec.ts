import { Activar2FAHandler } from './activar-2fa.command';
import { Email } from '../../domain/value-objects/email.vo';
import { Password } from '../../domain/value-objects/password.vo';
import { Usuario } from '../../domain/entities/usuario.entity';
import { ROL } from '@numerito/shared';

describe('Activar2FA Command', () => {
  let handler: Activar2FAHandler;
  let mockUsuarioRepo: any;
  let testUsuario: Usuario;

  beforeEach(async () => {
    testUsuario = Usuario.create({
      email: Email.create('user@test.com'),
      password: await Password.create('SecurePass123!'),
      nombre: 'Juan',
      apellido: 'Perez',
      rol: ROL.SOCIO,
    });

    mockUsuarioRepo = {
      findById: jest.fn().mockResolvedValue(testUsuario),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    };

    handler = new Activar2FAHandler(mockUsuarioRepo);
  });

  it('should generate a TOTP secret and QR code URI', async () => {
    const result = await handler.execute({ usuarioId: testUsuario.id });
    expect(result.secret).toBeDefined();
    expect(result.secret.length).toBeGreaterThan(0);
    expect(result.otpauthUrl).toContain('otpauth://totp/');
    expect(result.otpauthUrl).toContain('user%40test.com');
  });

  it('should throw if usuario not found', async () => {
    mockUsuarioRepo.findById.mockResolvedValue(null);
    await expect(handler.execute({ usuarioId: 'non-existent' })).rejects.toThrow(
      'Usuario no encontrado',
    );
  });
});
