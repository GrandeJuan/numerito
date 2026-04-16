import { ObligacionesController } from './obligaciones.controller';
import { Vencimiento } from '../../domain/entities/vencimiento.entity';

const makeVencimiento = (
  overrides: Partial<{ id: string; periodo: string; estado: string }> = {},
) =>
  Vencimiento.create(
    {
      clienteId: 'cliente-1',
      estudioId: 'estudio-1',
      tipoObligacion: 'IVA',
      periodo: overrides.periodo ?? '2026-04',
      fechaVencimiento: new Date('2026-04-20'),
      descripcion: 'DDJJ IVA',
    },
    overrides.id,
  );

describe('ObligacionesController', () => {
  let controller: ObligacionesController;
  let mockVencimientoRepo: any;
  let mockCrearVencimientoHandler: any;
  let mockPresentarVencimientoHandler: any;
  let mockMarcarVencidoHandler: any;
  let mockVencimientoKpisHandler: any;
  let mockVencimientoListHandler: any;

  beforeEach(() => {
    mockVencimientoRepo = {
      findById: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
      findByClienteId: jest.fn().mockResolvedValue([]),
      findByPeriodo: jest.fn().mockResolvedValue([]),
      findByEstado: jest.fn().mockResolvedValue([]),
      findProximosAVencer: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    };
    mockCrearVencimientoHandler = {
      execute: jest.fn().mockResolvedValue({ id: 'new-vencimiento-id' }),
    };
    mockPresentarVencimientoHandler = {
      execute: jest.fn().mockResolvedValue(makeVencimiento()),
    };
    mockMarcarVencidoHandler = {
      execute: jest.fn().mockResolvedValue(makeVencimiento()),
    };
    mockVencimientoKpisHandler = {
      execute: jest.fn().mockResolvedValue({
        pendientes: 0,
        vencidos: 0,
        presentadosEsteMes: 0,
        proximoVencimiento: null,
      }),
    };
    mockVencimientoListHandler = {
      execute: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    };
    controller = new ObligacionesController(
      mockVencimientoRepo,
      mockCrearVencimientoHandler,
      mockPresentarVencimientoHandler,
      mockMarcarVencidoHandler,
      mockVencimientoKpisHandler,
      mockVencimientoListHandler,
    );
  });

  describe('kpis', () => {
    it('should delegate to VencimientoKpisHandler with the estudioId', async () => {
      mockVencimientoKpisHandler.execute.mockResolvedValue({
        pendientes: 1,
        vencidos: 1,
        presentadosEsteMes: 0,
        proximoVencimiento: '2026-04-20',
      });

      const result = await controller.kpis('estudio-1');

      expect(mockVencimientoKpisHandler.execute).toHaveBeenCalledWith({ estudioId: 'estudio-1' });
      expect(result.data).toEqual({
        pendientes: 1,
        vencidos: 1,
        presentadosEsteMes: 0,
        proximoVencimiento: '2026-04-20',
      });
    });

    it('should not call findAll on the repository (KPI math leaves the controller)', async () => {
      await controller.kpis('estudio-1');

      expect(mockVencimientoRepo.findAll).not.toHaveBeenCalled();
    });

    it('should pass through null proximoVencimiento from the handler', async () => {
      mockVencimientoKpisHandler.execute.mockResolvedValue({
        pendientes: 0,
        vencidos: 0,
        presentadosEsteMes: 0,
        proximoVencimiento: null,
      });

      const result = await controller.kpis('estudio-1');
      expect(result.data.proximoVencimiento).toBeNull();
    });
  });

  describe('list', () => {
    const listItem = {
      id: 'v-1',
      clienteId: 'cli-1',
      cliente: 'Empresa Alpha SRL',
      tipoObligacion: 'IVA',
      periodo: '2026-04',
      fechaVencimiento: '2026-04-20',
      descripcion: 'DDJJ IVA',
      estado: 'PENDIENTE',
    };

    it('should delegate to VencimientoListHandler with estudioId', async () => {
      mockVencimientoListHandler.execute.mockResolvedValue({
        items: [listItem, listItem],
        total: 7,
      });

      const result = await controller.list('estudio-1', 1, 20);

      expect(mockVencimientoListHandler.execute).toHaveBeenCalledWith({
        estudioId: 'estudio-1',
        estado: undefined,
        periodo: undefined,
        clienteId: undefined,
        fechaDesde: undefined,
        fechaHasta: undefined,
        page: 1,
        limit: 20,
      });
      expect(result.data).toHaveLength(2);
      expect(result.meta).toEqual({ total: 7, page: 1, limit: 20 });
    });

    it('should use default page and limit when not provided', async () => {
      const result = await controller.list('estudio-1');
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });

    it('should forward periodo filter', async () => {
      await controller.list('estudio-1', 1, 20, undefined, '2026-03');
      expect(mockVencimientoListHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({ periodo: '2026-03' }),
      );
    });

    it('should forward estado filter', async () => {
      await controller.list('estudio-1', 1, 20, 'PENDIENTE');
      expect(mockVencimientoListHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({ estado: 'PENDIENTE' }),
      );
    });

    it('should forward clienteId and date-range filters', async () => {
      await controller.list(
        'estudio-1',
        2,
        50,
        undefined,
        undefined,
        'cli-42',
        '2026-04-01',
        '2026-04-30',
      );
      expect(mockVencimientoListHandler.execute).toHaveBeenCalledWith({
        estudioId: 'estudio-1',
        estado: undefined,
        periodo: undefined,
        clienteId: 'cli-42',
        fechaDesde: '2026-04-01',
        fechaHasta: '2026-04-30',
        page: 2,
        limit: 50,
      });
    });

    it('should not call findAll/findByEstado/findByPeriodo on the repo — filtering leaves the controller', async () => {
      await controller.list('estudio-1', 1, 20, 'PENDIENTE', '2026-04');

      expect(mockVencimientoRepo.findAll).not.toHaveBeenCalled();
      expect(mockVencimientoRepo.findByEstado).not.toHaveBeenCalled();
      expect(mockVencimientoRepo.findByPeriodo).not.toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return vencimiento by id', async () => {
      const v = makeVencimiento();
      mockVencimientoRepo.findById.mockResolvedValue(v);

      const result = await controller.getById(v.id);
      expect(result).toBeDefined();
    });

    it('should throw when not found', async () => {
      mockVencimientoRepo.findById.mockResolvedValue(null);

      await expect(controller.getById('bad-id')).rejects.toThrow('Vencimiento no encontrado');
    });
  });

  describe('create', () => {
    it('should delegate to CrearVencimientoHandler', async () => {
      const dto = {
        clienteId: 'cliente-1',
        tipoObligacion: 'IVA',
        periodo: '2026-04',
        fechaVencimiento: '2026-04-20',
        descripcion: 'DDJJ IVA',
      };

      const result = await controller.create(dto);
      expect(result.id).toBe('new-vencimiento-id');
      expect(mockCrearVencimientoHandler.execute).toHaveBeenCalledWith(dto);
    });
  });

  describe('presentar', () => {
    it('should delegate to PresentarVencimientoHandler', async () => {
      await controller.presentar('vencimiento-1');

      expect(mockPresentarVencimientoHandler.execute).toHaveBeenCalledWith({
        vencimientoId: 'vencimiento-1',
      });
    });
  });

  describe('marcarVencido', () => {
    it('should delegate to MarcarVencidoHandler', async () => {
      await controller.marcarVencido('vencimiento-1');

      expect(mockMarcarVencidoHandler.execute).toHaveBeenCalledWith({
        vencimientoId: 'vencimiento-1',
      });
    });
  });

  describe('calendario', () => {
    it('should return vencimientos for a periodo', async () => {
      const items = [makeVencimiento({ periodo: '2026-04' })];
      mockVencimientoRepo.findByPeriodo.mockResolvedValue(items);

      const result = await controller.calendario('2026-04');
      expect(result.data).toHaveLength(1);
      expect(mockVencimientoRepo.findByPeriodo).toHaveBeenCalledWith('2026-04');
    });
  });
});
