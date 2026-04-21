import { FeriadosAdminController } from './feriados-admin.controller';

describe('FeriadosAdminController', () => {
  let controller: FeriadosAdminController;
  let mockCrearHandler: any;
  let mockActualizarHandler: any;
  let mockEliminarHandler: any;
  let mockListHandler: any;

  beforeEach(() => {
    mockCrearHandler = { execute: jest.fn() };
    mockActualizarHandler = { execute: jest.fn() };
    mockEliminarHandler = { execute: jest.fn() };
    mockListHandler = { execute: jest.fn() };

    controller = new FeriadosAdminController(
      mockCrearHandler,
      mockActualizarHandler,
      mockEliminarHandler,
      mockListHandler,
    );
  });

  describe('list', () => {
    it('should return list from query handler', async () => {
      const items = [
        { id: '1', fecha: '2026-05-01', tipo: 'NACIONAL', descripcion: 'Día del Trabajador', jurisdiccionAfectada: null },
      ];
      mockListHandler.execute.mockResolvedValue(items);

      const result = await controller.list();
      expect(result.data).toEqual(items);
      expect(mockListHandler.execute).toHaveBeenCalledWith({
        anio: undefined,
        tipo: undefined,
      });
    });

    it('should parse anio as integer and pass to handler', async () => {
      mockListHandler.execute.mockResolvedValue([]);

      await controller.list('2026');
      expect(mockListHandler.execute).toHaveBeenCalledWith({
        anio: 2026,
        tipo: undefined,
      });
    });

    it('should pass tipo filter to handler', async () => {
      mockListHandler.execute.mockResolvedValue([]);

      await controller.list(undefined, 'BANCARIO');
      expect(mockListHandler.execute).toHaveBeenCalledWith({
        anio: undefined,
        tipo: 'BANCARIO',
      });
    });

    it('should pass both anio and tipo filters', async () => {
      mockListHandler.execute.mockResolvedValue([]);

      await controller.list('2026', 'NACIONAL');
      expect(mockListHandler.execute).toHaveBeenCalledWith({
        anio: 2026,
        tipo: 'NACIONAL',
      });
    });

    it('should treat empty tipo string as undefined', async () => {
      mockListHandler.execute.mockResolvedValue([]);

      await controller.list(undefined, '');
      expect(mockListHandler.execute).toHaveBeenCalledWith({
        anio: undefined,
        tipo: undefined,
      });
    });
  });

  describe('create', () => {
    it('should delegate to crear handler and wrap response', async () => {
      mockCrearHandler.execute.mockResolvedValue({ id: 'new-feriado-id' });

      const dto = {
        fecha: '2026-05-01',
        tipo: 'NACIONAL' as const,
        descripcion: 'Día del Trabajador',
      };
      const result = await controller.create(dto);

      expect(result.data).toEqual({ id: 'new-feriado-id' });
      expect(mockCrearHandler.execute).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('should merge id with dto and delegate to actualizar handler', async () => {
      mockActualizarHandler.execute.mockResolvedValue({ id: 'fer-1' });

      const dto = { descripcion: 'Updated description' };
      const result = await controller.update('fer-1', dto);

      expect(result.data).toEqual({ id: 'fer-1' });
      expect(mockActualizarHandler.execute).toHaveBeenCalledWith({
        id: 'fer-1',
        descripcion: 'Updated description',
      });
    });

    it('should pass all update fields to handler', async () => {
      mockActualizarHandler.execute.mockResolvedValue({ id: 'fer-1' });

      const dto = {
        fecha: '2026-11-10',
        tipo: 'PROVINCIAL' as const,
        descripcion: 'Día de la Tradición',
        jurisdiccionAfectada: 'ARBA',
      };
      await controller.update('fer-1', dto);

      expect(mockActualizarHandler.execute).toHaveBeenCalledWith({
        id: 'fer-1',
        ...dto,
      });
    });
  });

  describe('delete', () => {
    it('should delegate to eliminar handler with id', async () => {
      mockEliminarHandler.execute.mockResolvedValue(undefined);

      await controller.delete('fer-1');
      expect(mockEliminarHandler.execute).toHaveBeenCalledWith({ id: 'fer-1' });
    });

    it('should return undefined (204 No Content)', async () => {
      mockEliminarHandler.execute.mockResolvedValue(undefined);

      const result = await controller.delete('fer-1');
      expect(result).toBeUndefined();
    });
  });
});
