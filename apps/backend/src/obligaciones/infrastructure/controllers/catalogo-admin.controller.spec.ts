import { CatalogoAdminController } from './catalogo-admin.controller';

describe('CatalogoAdminController', () => {
  let controller: CatalogoAdminController;
  let mockCatalogoRepo: any;
  let mockReglaRepo: any;
  let mockCrearCatalogoHandler: any;
  let mockActualizarCatalogoHandler: any;
  let mockCrearReglaHandler: any;
  let mockActualizarReglaHandler: any;
  let mockCatalogoListHandler: any;
  let mockReglaListHandler: any;

  beforeEach(() => {
    mockCatalogoRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findActivos: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    mockReglaRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findActivas: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    mockCrearCatalogoHandler = { execute: jest.fn() };
    mockActualizarCatalogoHandler = { execute: jest.fn() };
    mockCrearReglaHandler = { execute: jest.fn() };
    mockActualizarReglaHandler = { execute: jest.fn() };
    mockCatalogoListHandler = { execute: jest.fn() };
    mockReglaListHandler = { execute: jest.fn() };

    controller = new CatalogoAdminController(
      mockCatalogoRepo,
      mockReglaRepo,
      mockCrearCatalogoHandler,
      mockActualizarCatalogoHandler,
      mockCrearReglaHandler,
      mockActualizarReglaHandler,
      mockCatalogoListHandler,
      mockReglaListHandler,
    );
  });

  describe('listCatalogo', () => {
    it('should return list from query handler', async () => {
      const items = [{ id: '1', nombre: 'IVA', jurisdiccion: 'ARCA' }];
      mockCatalogoListHandler.execute.mockResolvedValue(items);

      const result = await controller.listCatalogo();
      expect(result.data).toEqual(items);
    });
  });

  describe('createCatalogo', () => {
    it('should delegate to handler', async () => {
      mockCrearCatalogoHandler.execute.mockResolvedValue({ id: 'new-id' });

      const result = await controller.createCatalogo({
        nombre: 'IVA',
        tipoObligacion: 'IVA',
        jurisdiccion: 'ARCA',
        frecuencia: 'MENSUAL',
      });
      expect(result.data).toEqual({ id: 'new-id' });
      expect(mockCrearCatalogoHandler.execute).toHaveBeenCalled();
    });
  });

  describe('getCatalogo', () => {
    it('should return catalogo by ID', async () => {
      mockCatalogoRepo.findById.mockResolvedValue({
        id: 'cat-1',
        nombre: 'IVA',
        tipoObligacion: 'IVA',
        jurisdiccion: 'ARCA',
        frecuencia: 'MENSUAL',
        activo: true,
      });

      const result = await controller.getCatalogo('cat-1');
      expect(result.data.id).toBe('cat-1');
    });

    it('should throw 404 for unknown ID', async () => {
      mockCatalogoRepo.findById.mockResolvedValue(null);
      await expect(controller.getCatalogo('unknown')).rejects.toThrow('no encontrado');
    });
  });

  describe('listReglas', () => {
    it('should return list from query handler', async () => {
      const items = [{ id: 1, tipoObligacion: 'IVA', terminacionCuit: '0' }];
      mockReglaListHandler.execute.mockResolvedValue(items);

      const result = await controller.listReglas();
      expect(result.data).toEqual(items);
    });

    it('should pass estado filter', async () => {
      mockReglaListHandler.execute.mockResolvedValue([]);
      await controller.listReglas('ACTIVA');
      expect(mockReglaListHandler.execute).toHaveBeenCalledWith({ estado: 'ACTIVA' });
    });
  });

  describe('createRegla', () => {
    it('should delegate to handler', async () => {
      mockCrearReglaHandler.execute.mockResolvedValue({ id: 'regla-id' });

      const result = await controller.createRegla({
        tipoObligacion: 'IVA',
        jurisdiccion: 'ARCA',
        regimen: 'GENERAL',
        terminacionCuit: '0',
        diaVencimiento: 18,
        mesSiguiente: true,
        vigenciaDesde: '2026-01-01',
      });
      expect(result.data).toEqual({ id: 'regla-id' });
    });
  });

  describe('getRegla', () => {
    it('should throw 404 for unknown regla', async () => {
      mockReglaRepo.findById.mockResolvedValue(null);
      await expect(controller.getRegla('999')).rejects.toThrow('no encontrado');
    });
  });
});
