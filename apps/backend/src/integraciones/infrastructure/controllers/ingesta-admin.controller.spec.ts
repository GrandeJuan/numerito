import { IngestaAdminController } from './ingesta-admin.controller';

describe('IngestaAdminController', () => {
  let controller: IngestaAdminController;
  let mockRepo: any;
  let mockActualizarHandler: any;
  let mockListHandler: any;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByFuente: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    mockActualizarHandler = { execute: jest.fn() };
    mockListHandler = { execute: jest.fn() };

    controller = new IngestaAdminController(
      mockRepo,
      mockActualizarHandler,
      mockListHandler,
    );
  });

  describe('list', () => {
    it('should return list from query handler', async () => {
      const items = [
        { id: '1', fuente: 'ARCA', habilitado: false, cadenciaDias: 7 },
        { id: '2', fuente: 'ARBA', habilitado: false, cadenciaDias: 7 },
      ];
      mockListHandler.execute.mockResolvedValue(items);

      const result = await controller.list();
      expect(result.data).toEqual(items);
      expect(mockListHandler.execute).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return config by ID', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'cfg-1',
        fuente: 'ARCA',
        habilitado: false,
        cadenciaDias: 7,
        proximaEjecucion: null,
        ultimaEjecucion: null,
        ultimoResultado: null,
      });

      const result = await controller.getById('cfg-1');
      expect(result.data.id).toBe('cfg-1');
      expect(result.data.fuente).toBe('ARCA');
    });

    it('should throw 404 for unknown ID', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(controller.getById('unknown')).rejects.toThrow('no encontrado');
    });
  });

  describe('update', () => {
    it('should delegate to handler', async () => {
      mockActualizarHandler.execute.mockResolvedValue({ id: 'cfg-1' });

      const result = await controller.update('cfg-1', {
        habilitado: true,
        cadenciaDias: 14,
      });
      expect(result.data).toEqual({ id: 'cfg-1' });
      expect(mockActualizarHandler.execute).toHaveBeenCalledWith({
        id: 'cfg-1',
        habilitado: true,
        cadenciaDias: 14,
      });
    });

    it('should propagate handler errors', async () => {
      mockActualizarHandler.execute.mockRejectedValue(new Error('no encontrado'));
      await expect(
        controller.update('unknown', { habilitado: true }),
      ).rejects.toThrow('no encontrado');
    });
  });
});
