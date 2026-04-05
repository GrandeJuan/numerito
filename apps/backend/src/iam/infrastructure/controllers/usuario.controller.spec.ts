import { BadRequestException } from '@nestjs/common';
import { UsuarioController } from './usuario.controller';
import { Permiso } from '../../domain/value-objects/permiso.vo';

describe('UsuarioController', () => {
  let controller: UsuarioController;
  let mockObtenerEstudiosHandler: any;
  let mockObtenerPermisosHandler: any;
  let mockUsuarioRepo: any;

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
    controller = new UsuarioController(mockObtenerEstudiosHandler, mockObtenerPermisosHandler, mockUsuarioRepo);
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
});
