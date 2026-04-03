import { UsuarioController } from './usuario.controller';

describe('UsuarioController', () => {
  let controller: UsuarioController;
  let mockObtenerEstudiosHandler: any;

  beforeEach(() => {
    mockObtenerEstudiosHandler = {
      execute: jest.fn(),
    };
    controller = new UsuarioController(mockObtenerEstudiosHandler);
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
});
