jest.mock('../../../iam/domain/value-objects/password.vo', () => ({
  Password: {
    create: jest.fn().mockResolvedValue({ value: 'hashed' }),
  },
}));

import { InvitarUsuarioAdminHandler } from './invitar-usuario-admin.command';
import { EmailYaRegistradoError } from '../../../shared/domain/exceptions';

describe('InvitarUsuarioAdminHandler', () => {
  let handler: InvitarUsuarioAdminHandler;
  let mockUsuarioRepo: any;
  let mockEventBus: any;

  beforeEach(() => {
    mockUsuarioRepo = {
      findByEmail: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    };

    handler = new InvitarUsuarioAdminHandler(mockUsuarioRepo, mockEventBus);
  });

  it('should create user and return invitation result', async () => {
    const result = await handler.execute({
      email: 'admin@test.com',
      nombre: 'Admin',
      rol: 'SUPERADMIN',
    });

    expect(result.email).toBe('admin@test.com');
    expect(result.nombre).toBe('Admin');
    expect(result.rol).toBe('SUPERADMIN');
    expect(result.id).toBeDefined();

    expect(mockUsuarioRepo.save).toHaveBeenCalled();
    expect(mockEventBus.publishAll).toHaveBeenCalled();
  });

  it('should throw EmailYaRegistradoError when email exists', async () => {
    mockUsuarioRepo.findByEmail.mockResolvedValue({ id: 'existing' });

    await expect(
      handler.execute({
        email: 'existing@test.com',
        rol: 'SUPERADMIN',
      }),
    ).rejects.toThrow(EmailYaRegistradoError);

    expect(mockUsuarioRepo.save).not.toHaveBeenCalled();
  });

  it('should default nombre to empty string when not provided', async () => {
    const result = await handler.execute({
      email: 'noname@test.com',
      rol: 'SUPERADMIN',
    });

    expect(result.nombre).toBe('');
  });

  it('should accept different roles', async () => {
    const result = await handler.execute({
      email: 'socio@test.com',
      nombre: 'Socio User',
      rol: 'SOCIO',
    });

    expect(result.rol).toBe('SOCIO');
  });
});
