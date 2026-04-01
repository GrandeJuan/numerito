import { RegistrarUsuarioHandler } from './registrar-usuario.command';
import { Email } from '../../domain/value-objects/email.vo';
import { Usuario } from '../../domain/entities/usuario.entity';
import { ROL } from '@numerito/shared';

describe('RegistrarUsuario Command', () => {
  let handler: RegistrarUsuarioHandler;
  let mockUsuarioRepo: {
    findByEmail: jest.Mock;
    findById: jest.Mock;
    findAll: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    mockUsuarioRepo = {
      findByEmail: jest.fn().mockResolvedValue(null),
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    };
    handler = new RegistrarUsuarioHandler(mockUsuarioRepo);
  });

  it('should register a new usuario', async () => {
    const result = await handler.execute({
      email: 'nuevo@test.com',
      password: 'SecurePass123!',
      nombre: 'Juan',
      apellido: 'Perez',
      rol: ROL.SOCIO,
    });

    expect(result.id).toBeDefined();
    expect(result.email).toBe('nuevo@test.com');
    expect(mockUsuarioRepo.save).toHaveBeenCalledTimes(1);
    const savedUsuario = mockUsuarioRepo.save.mock.calls[0][0];
    expect(savedUsuario).toBeInstanceOf(Usuario);
  });

  it('should throw if email already exists', async () => {
    const existingEmail = Email.create('existente@test.com');
    mockUsuarioRepo.findByEmail.mockResolvedValue(
      Usuario.create({
        email: existingEmail,
        password: { hashedValue: 'hash' } as any,
        nombre: 'Existing',
        apellido: 'User',
        rol: ROL.SOCIO,
      }),
    );

    await expect(
      handler.execute({
        email: 'existente@test.com',
        password: 'SecurePass123!',
        nombre: 'Juan',
        apellido: 'Perez',
        rol: ROL.SOCIO,
      }),
    ).rejects.toThrow('El email ya está registrado');
  });
});
