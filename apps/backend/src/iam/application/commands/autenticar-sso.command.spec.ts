import { AutenticarSsoHandler } from './autenticar-sso.command';

describe('AutenticarSsoHandler', () => {
  let handler: AutenticarSsoHandler;
  let mockUsuarioRepo: any;
  let mockTokenService: any;

  const mockExistingUser = {
    id: 'user-1',
    email: { value: 'test@test.com' },
    nombre: 'Juan',
    apellido: 'Perez',
    rol: 'SOCIO',
    isActive: true,
    provider: null,
    providerId: null,
    linkSsoProvider: jest.fn(),
  };

  beforeEach(() => {
    mockUsuarioRepo = {
      findByEmail: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockTokenService = {
      generateAccessToken: jest.fn().mockReturnValue('access-token'),
      generateRefreshToken: jest.fn().mockReturnValue('refresh-token'),
    };
    handler = new AutenticarSsoHandler(mockUsuarioRepo, mockTokenService);
  });

  it('should generate tokens for existing user with matching email', async () => {
    mockUsuarioRepo.findByEmail.mockResolvedValue(mockExistingUser);

    const result = await handler.execute({
      provider: 'google',
      providerId: 'google-123',
      email: 'test@test.com',
      nombre: 'Juan',
      apellido: 'Perez',
    });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.usuario.email).toBe('test@test.com');
  });

  it('should link SSO provider to existing user', async () => {
    mockUsuarioRepo.findByEmail.mockResolvedValue(mockExistingUser);

    await handler.execute({
      provider: 'google',
      providerId: 'google-123',
      email: 'test@test.com',
      nombre: 'Juan',
      apellido: 'Perez',
    });

    expect(mockExistingUser.linkSsoProvider).toHaveBeenCalledWith('google', 'google-123');
    expect(mockUsuarioRepo.save).toHaveBeenCalled();
  });

  it('should create new user when none exists', async () => {
    mockUsuarioRepo.findByEmail.mockResolvedValue(null);

    const result = await handler.execute({
      provider: 'microsoft',
      providerId: 'ms-456',
      email: 'new@test.com',
      nombre: 'Maria',
      apellido: 'Garcia',
    });

    expect(mockUsuarioRepo.save).toHaveBeenCalled();
    expect(result.accessToken).toBe('access-token');
    expect(result.usuario.email).toBe('new@test.com');
  });

  it('should throw if existing user is inactive', async () => {
    mockUsuarioRepo.findByEmail.mockResolvedValue({ ...mockExistingUser, isActive: false });

    await expect(
      handler.execute({
        provider: 'google',
        providerId: 'g-123',
        email: 'test@test.com',
        nombre: 'Juan',
        apellido: 'Perez',
      }),
    ).rejects.toThrow();
  });
});
