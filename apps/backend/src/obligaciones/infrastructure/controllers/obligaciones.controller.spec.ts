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
    controller = new ObligacionesController(
      mockVencimientoRepo,
      mockCrearVencimientoHandler,
      mockPresentarVencimientoHandler,
      mockMarcarVencidoHandler,
      mockVencimientoKpisHandler,
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
    it('should return paginated vencimientos', async () => {
      const items = [makeVencimiento(), makeVencimiento()];
      mockVencimientoRepo.findAll.mockResolvedValue(items);

      const result = await controller.list(1, 20);
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
    });

    it('should use default page and limit when not provided', async () => {
      mockVencimientoRepo.findAll.mockResolvedValue([]);

      const result = await controller.list();
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });

    it('should filter by periodo', async () => {
      const items = [makeVencimiento({ periodo: '2026-03' })];
      mockVencimientoRepo.findByPeriodo.mockResolvedValue(items);

      await controller.list(1, 20, undefined, '2026-03');
      expect(mockVencimientoRepo.findByPeriodo).toHaveBeenCalledWith('2026-03');
    });

    it('should filter by estado', async () => {
      mockVencimientoRepo.findByEstado.mockResolvedValue([]);

      await controller.list(1, 20, 'PENDIENTE');
      expect(mockVencimientoRepo.findByEstado).toHaveBeenCalledWith('PENDIENTE');
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
