import { BadRequestException } from '@nestjs/common';
import { UsuarioController } from './usuario.controller';
import { Permiso } from '../../domain/value-objects/permiso.vo';

describe('UsuarioController', () => {
  let controller: UsuarioController;
  let mockObtenerEstudiosHandler: any;
  let mockObtenerPermisosHandler: any;
  let mockUsuarioRepo: any;
  let mockAvatarStorage: any;

  beforeEach(() => {
    mockObtenerEstudiosHandler = {
      execute: jest.fn(),
    };
    mockObtenerPermisosHandler = {
      execute: jest.fn(),
    };
    mockUsuarioRepo = {
      findById: jest.fn(),
      save: jest.fn(),
    };
    mockAvatarStorage = {
      upload: jest.fn(),
      delete: jest.fn(),
    };
    controller = new UsuarioController(
      mockObtenerEstudiosHandler,
      mockObtenerPermisosHandler,
      mockUsuarioRepo,
      mockAvatarStorage,
    );
  });

  describe('getMisEstudios', () => {
    it('should return estudios for authenticated user', async () => {
      mockObtenerEstudiosHandler.execute.mockResolvedValue([
        { id: 'est-1', nombre: 'Estudio A', rol: 'SOCIO' },
      ]);

      const result = await controller.getMisEstudios('user-1');

      expect(result).toEqual([{ id: 'est-1', nombre: 'Estudio A', rol: 'SOCIO' }]);
      expect(mockObtenerEstudiosHandler.execute).toHaveBeenCalledWith({ usuarioId: 'user-1' });
    });

    it('should return empty array for user with no estudios', async () => {
      mockObtenerEstudiosHandler.execute.mockResolvedValue([]);

      const result = await controller.getMisEstudios('user-1');

      expect(result).toEqual([]);
    });

    it('should propagate handler errors', async () => {
      mockObtenerEstudiosHandler.execute.mockRejectedValue(new Error('DB error'));

      await expect(controller.getMisEstudios('user-1')).rejects.toThrow('DB error');
    });
  });

  describe('getMisPermisos', () => {
    it('should call handler with correct params and return wrapped response', async () => {
      const permisos = [Permiso.VER_CLIENTES, Permiso.GESTIONAR_CLIENTES];
      mockObtenerPermisosHandler.execute.mockResolvedValue(permisos);

      const result = await controller.getMisPermisos('user-1', 'est-1');

      expect(mockObtenerPermisosHandler.execute).toHaveBeenCalledWith({
        usuarioId: 'user-1',
        estudioId: 'est-1',
      });
      expect(result).toEqual({
        data: permisos,
        meta: expect.objectContaining({ timestamp: expect.any(String) }),
      });
    });

    it('should throw BadRequestException if estudioId is empty', async () => {
      await expect(controller.getMisPermisos('user-1', '')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if estudioId is undefined', async () => {
      await expect(controller.getMisPermisos('user-1', undefined as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updatePreferencias', () => {
    it('should update theme preference and return it', async () => {
      const mockUsuario = {
        themePreference: 'light',
        changeThemePreference: jest.fn(),
      };
      mockUsuarioRepo.findById.mockResolvedValue(mockUsuario);
      mockUsuarioRepo.save.mockResolvedValue(undefined);

      const result = await controller.updatePreferencias('user-1', { themePreference: 'dark' });

      expect(mockUsuarioRepo.findById).toHaveBeenCalledWith('user-1');
      expect(mockUsuario.changeThemePreference).toHaveBeenCalledWith('dark');
      expect(mockUsuarioRepo.save).toHaveBeenCalledWith(mockUsuario);
      expect(result.data).toHaveProperty('themePreference');
    });

    it('should throw if user not found', async () => {
      mockUsuarioRepo.findById.mockResolvedValue(null);

      await expect(
        controller.updatePreferencias('user-1', { themePreference: 'dark' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getProfile', () => {
    it('should return user profile with all fields', async () => {
      const mockUsuario = {
        id: 'user-1',
        email: { value: 'test@example.com' },
        nombre: 'Juan',
        apellido: 'Pérez',
        rol: 'CONTADOR',
        avatarUrl: 'https://bucket.s3.amazonaws.com/avatars/user-1.jpg',
        themePreference: 'dark',
      };
      mockUsuarioRepo.findById.mockResolvedValue(mockUsuario);

      const result = await controller.getProfile('user-1');

      expect(result.data).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        nombre: 'Juan',
        apellido: 'Pérez',
        rol: 'CONTADOR',
        avatarUrl: 'https://bucket.s3.amazonaws.com/avatars/user-1.jpg',
        themePreference: 'dark',
      });
    });

    it('should return null avatarUrl when no avatar set', async () => {
      const mockUsuario = {
        id: 'user-1',
        email: { value: 'test@example.com' },
        nombre: 'Juan',
        apellido: 'Pérez',
        rol: 'CONTADOR',
        avatarUrl: null,
        themePreference: 'light',
      };
      mockUsuarioRepo.findById.mockResolvedValue(mockUsuario);

      const result = await controller.getProfile('user-1');

      expect(result.data.avatarUrl).toBeNull();
    });

    it('should throw if user not found', async () => {
      mockUsuarioRepo.findById.mockResolvedValue(null);

      await expect(controller.getProfile('user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('uploadAvatar', () => {
    const validFile = {
      buffer: Buffer.from('fake-image'),
      mimetype: 'image/jpeg',
      size: 1024,
    } as Express.Multer.File;

    it('should upload avatar and return URL', async () => {
      const mockUsuario = {
        avatarUrl: null,
        updateAvatarUrl: jest.fn(),
      };
      mockUsuarioRepo.findById.mockResolvedValue(mockUsuario);
      mockAvatarStorage.upload.mockResolvedValue('https://bucket.s3.amazonaws.com/avatars/user-1.jpg');

      const result = await controller.uploadAvatar('user-1', validFile);

      expect(mockAvatarStorage.upload).toHaveBeenCalledWith('user-1', validFile.buffer, 'image/jpeg');
      expect(mockUsuario.updateAvatarUrl).toHaveBeenCalledWith('https://bucket.s3.amazonaws.com/avatars/user-1.jpg');
      expect(mockUsuarioRepo.save).toHaveBeenCalledWith(mockUsuario);
      expect(result.data.avatarUrl).toBe('https://bucket.s3.amazonaws.com/avatars/user-1.jpg');
    });

    it('should delete old avatar before uploading new one', async () => {
      const mockUsuario = {
        avatarUrl: 'https://bucket.s3.amazonaws.com/avatars/user-1.png',
        updateAvatarUrl: jest.fn(),
      };
      mockUsuarioRepo.findById.mockResolvedValue(mockUsuario);
      mockAvatarStorage.upload.mockResolvedValue('https://bucket.s3.amazonaws.com/avatars/user-1.jpg');

      await controller.uploadAvatar('user-1', validFile);

      expect(mockAvatarStorage.delete).toHaveBeenCalledWith('https://bucket.s3.amazonaws.com/avatars/user-1.png');
      expect(mockAvatarStorage.upload).toHaveBeenCalled();
    });

    it('should throw if no file provided', async () => {
      await expect(controller.uploadAvatar('user-1', undefined as any)).rejects.toThrow(
        'No se proporcionó archivo',
      );
    });

    it('should reject invalid mime type', async () => {
      const gifFile = { ...validFile, mimetype: 'image/gif' } as Express.Multer.File;

      await expect(controller.uploadAvatar('user-1', gifFile)).rejects.toThrow(
        'Tipo de archivo no permitido',
      );
    });

    it('should reject file over 2MB', async () => {
      const largeFile = { ...validFile, size: 3 * 1024 * 1024 } as Express.Multer.File;

      await expect(controller.uploadAvatar('user-1', largeFile)).rejects.toThrow(
        'tamaño máximo de 2MB',
      );
    });

    it('should throw if user not found', async () => {
      mockUsuarioRepo.findById.mockResolvedValue(null);

      await expect(controller.uploadAvatar('user-1', validFile)).rejects.toThrow(BadRequestException);
    });

    it('should accept PNG files', async () => {
      const pngFile = { ...validFile, mimetype: 'image/png' } as Express.Multer.File;
      const mockUsuario = { avatarUrl: null, updateAvatarUrl: jest.fn() };
      mockUsuarioRepo.findById.mockResolvedValue(mockUsuario);
      mockAvatarStorage.upload.mockResolvedValue('/avatars/user-1.png');

      await controller.uploadAvatar('user-1', pngFile);

      expect(mockAvatarStorage.upload).toHaveBeenCalledWith('user-1', pngFile.buffer, 'image/png');
    });

    it('should accept WebP files', async () => {
      const webpFile = { ...validFile, mimetype: 'image/webp' } as Express.Multer.File;
      const mockUsuario = { avatarUrl: null, updateAvatarUrl: jest.fn() };
      mockUsuarioRepo.findById.mockResolvedValue(mockUsuario);
      mockAvatarStorage.upload.mockResolvedValue('/avatars/user-1.webp');

      await controller.uploadAvatar('user-1', webpFile);

      expect(mockAvatarStorage.upload).toHaveBeenCalledWith('user-1', webpFile.buffer, 'image/webp');
    });
  });

  describe('deleteAvatar', () => {
    it('should delete avatar and clear URL', async () => {
      const mockUsuario = {
        avatarUrl: 'https://bucket.s3.amazonaws.com/avatars/user-1.jpg',
        removeAvatar: jest.fn(),
      };
      mockUsuarioRepo.findById.mockResolvedValue(mockUsuario);

      const result = await controller.deleteAvatar('user-1');

      expect(mockAvatarStorage.delete).toHaveBeenCalledWith('https://bucket.s3.amazonaws.com/avatars/user-1.jpg');
      expect(mockUsuario.removeAvatar).toHaveBeenCalled();
      expect(mockUsuarioRepo.save).toHaveBeenCalledWith(mockUsuario);
      expect(result.data.avatarUrl).toBeNull();
    });

    it('should be a no-op when no avatar exists', async () => {
      const mockUsuario = { avatarUrl: null, removeAvatar: jest.fn() };
      mockUsuarioRepo.findById.mockResolvedValue(mockUsuario);

      const result = await controller.deleteAvatar('user-1');

      expect(mockAvatarStorage.delete).not.toHaveBeenCalled();
      expect(mockUsuario.removeAvatar).not.toHaveBeenCalled();
      expect(result.data.avatarUrl).toBeNull();
    });

    it('should throw if user not found', async () => {
      mockUsuarioRepo.findById.mockResolvedValue(null);

      await expect(controller.deleteAvatar('user-1')).rejects.toThrow(BadRequestException);
    });
  });
});
