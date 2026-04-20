import { RecordatoriosController } from './recordatorios.controller';

describe('RecordatoriosController', () => {
  let controller: RecordatoriosController;
  let mockRecordatoriosHandler: any;
  let mockAlertasHandler: any;

  beforeEach(() => {
    mockRecordatoriosHandler = { execute: jest.fn() };
    mockAlertasHandler = { execute: jest.fn() };

    controller = new RecordatoriosController(
      mockRecordatoriosHandler,
      mockAlertasHandler,
    );
  });

  describe('ejecutarRecordatorios', () => {
    it('should delegate to handler and return result', async () => {
      const expected = {
        estudiosProcessados: 2,
        recordatoriosEnviados: 5,
        errores: [],
      };
      mockRecordatoriosHandler.execute.mockResolvedValue(expected);

      const result = await controller.ejecutarRecordatorios();

      expect(result.data).toEqual(expected);
      expect(mockRecordatoriosHandler.execute).toHaveBeenCalled();
    });

    it('should propagate handler errors', async () => {
      mockRecordatoriosHandler.execute.mockRejectedValue(new Error('fail'));
      await expect(controller.ejecutarRecordatorios()).rejects.toThrow('fail');
    });
  });

  describe('ejecutarAlertasEnRiesgo', () => {
    it('should delegate to handler and return result', async () => {
      const expected = {
        estudiosProcessados: 1,
        alertasEnviadas: 3,
        errores: [],
      };
      mockAlertasHandler.execute.mockResolvedValue(expected);

      const result = await controller.ejecutarAlertasEnRiesgo();

      expect(result.data).toEqual(expected);
      expect(mockAlertasHandler.execute).toHaveBeenCalled();
    });

    it('should propagate handler errors', async () => {
      mockAlertasHandler.execute.mockRejectedValue(new Error('fail'));
      await expect(controller.ejecutarAlertasEnRiesgo()).rejects.toThrow('fail');
    });
  });
});
