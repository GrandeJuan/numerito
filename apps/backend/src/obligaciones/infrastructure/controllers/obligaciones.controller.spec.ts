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
    controller = new ObligacionesController(mockVencimientoRepo);
  });

  describe('kpis', () => {
    it('should return KPI counts', async () => {
      const pendiente = makeVencimiento();
      const vencido = makeVencimiento();
      vencido.marcarVencido();
      mockVencimientoRepo.findAll.mockResolvedValue([pendiente, vencido]);

      const result = await controller.kpis();
      expect(result.data.pendientes).toBe(1);
      expect(result.data.vencidos).toBe(1);
      expect(result.data.presentadosEsteMes).toBe(0);
      expect(result.data.proximoVencimiento).toBeDefined();
    });

    it('should return null proximoVencimiento when no pendientes', async () => {
      mockVencimientoRepo.findAll.mockResolvedValue([]);

      const result = await controller.kpis();
      expect(result.data.pendientes).toBe(0);
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
    it('should create a vencimiento', async () => {
      const dto = {
        clienteId: 'cliente-1',
        tipoObligacion: 'IVA',
        periodo: '2026-04',
        fechaVencimiento: '2026-04-20',
        descripcion: 'DDJJ IVA',
      };

      const result = await controller.create(dto, 'estudio-1');
      expect(result.id).toBeDefined();
      expect(mockVencimientoRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('presentar', () => {
    it('should mark vencimiento as presentado', async () => {
      const v = makeVencimiento();
      mockVencimientoRepo.findById.mockResolvedValue(v);

      await controller.presentar(v.id);
      expect(v.estado).toBe('PRESENTADO');
      expect(mockVencimientoRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should throw when not found', async () => {
      mockVencimientoRepo.findById.mockResolvedValue(null);

      await expect(controller.presentar('bad-id')).rejects.toThrow('Vencimiento no encontrado');
    });

    it('should throw when already vencido', async () => {
      const v = makeVencimiento();
      v.marcarVencido();
      mockVencimientoRepo.findById.mockResolvedValue(v);

      await expect(controller.presentar(v.id)).rejects.toThrow();
    });
  });

  describe('marcarVencido', () => {
    it('should mark vencimiento as vencido', async () => {
      const v = makeVencimiento();
      mockVencimientoRepo.findById.mockResolvedValue(v);

      await controller.marcarVencido(v.id);
      expect(v.estado).toBe('VENCIDO');
      expect(mockVencimientoRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should throw when not found', async () => {
      mockVencimientoRepo.findById.mockResolvedValue(null);

      await expect(controller.marcarVencido('bad-id')).rejects.toThrow('Vencimiento no encontrado');
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
