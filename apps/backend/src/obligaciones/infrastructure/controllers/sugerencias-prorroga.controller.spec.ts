import { SugerenciasProrrogaController } from './sugerencias-prorroga.controller';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';

const mockPrincipal: EstudioPrincipal = {
  estudioId: 'estudio-1',
  userId: 'user-1',
  roles: ['RESPONSABLE'],
};

describe('SugerenciasProrrogaController', () => {
  let controller: SugerenciasProrrogaController;
  let mockAprobarHandler: any;
  let mockDescartarHandler: any;
  let mockListHandler: any;

  beforeEach(() => {
    mockAprobarHandler = { execute: jest.fn() };
    mockDescartarHandler = { execute: jest.fn() };
    mockListHandler = { execute: jest.fn() };

    controller = new SugerenciasProrrogaController(
      mockAprobarHandler,
      mockDescartarHandler,
      mockListHandler,
    );
  });

  describe('list', () => {
    it('should return sugerencias list from handler', async () => {
      const items = [
        { id: 'sug-1', vencimientoId: 'v-1', estado: 'ABIERTA', motivo: 'Prórroga ARCA' },
        { id: 'sug-2', vencimientoId: 'v-2', estado: 'APROBADA', motivo: 'Feriado bancario' },
      ];
      mockListHandler.execute.mockResolvedValue(items);

      const result = await controller.list(mockPrincipal);

      expect(result.data).toEqual(items);
      expect(mockListHandler.execute).toHaveBeenCalledWith(mockPrincipal, { estado: undefined });
    });

    it('should pass estado filter to handler', async () => {
      mockListHandler.execute.mockResolvedValue([]);

      await controller.list(mockPrincipal, 'ABIERTA');

      expect(mockListHandler.execute).toHaveBeenCalledWith(mockPrincipal, { estado: 'ABIERTA' });
    });

    it('should handle empty list', async () => {
      mockListHandler.execute.mockResolvedValue([]);

      const result = await controller.list(mockPrincipal);

      expect(result.data).toEqual([]);
    });
  });

  describe('aprobar', () => {
    it('should delegate to aprobar handler and return success message', async () => {
      mockAprobarHandler.execute.mockResolvedValue(undefined);

      const result = await controller.aprobar(mockPrincipal, 'sug-1');

      expect(result.data).toEqual({ message: 'Sugerencia aprobada y prórroga aplicada' });
      expect(mockAprobarHandler.execute).toHaveBeenCalledWith(mockPrincipal, {
        sugerenciaId: 'sug-1',
      });
    });
  });

  describe('descartar', () => {
    it('should delegate to descartar handler and return success message', async () => {
      mockDescartarHandler.execute.mockResolvedValue(undefined);

      const result = await controller.descartar(mockPrincipal, 'sug-2');

      expect(result.data).toEqual({ message: 'Sugerencia descartada' });
      expect(mockDescartarHandler.execute).toHaveBeenCalledWith(mockPrincipal, {
        sugerenciaId: 'sug-2',
      });
    });
  });
});
