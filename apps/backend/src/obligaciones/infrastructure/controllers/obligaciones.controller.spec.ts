import { ObligacionesController } from './obligaciones.controller';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';

const principal: EstudioPrincipal = { estudioId: 'estudio-1', userId: 'user-1', roles: [] };

describe('ObligacionesController', () => {
  let controller: ObligacionesController;
  let mockCrearVencimientoHandler: any;
  let mockProyectarCalendarioHandler: any;
  let mockPresentarVencimientoHandler: any;
  let mockMarcarVencidoHandler: any;
  let mockVencimientoKpisHandler: any;
  let mockVencimientoListHandler: any;
  let mockVencimientoCalendarioHandler: any;
  let mockVencimientoByIdHandler: any;

  const byIdFixture = {
    id: 'v-1',
    clienteId: 'cli-1',
    cliente: 'Empresa Alpha SRL',
    tipoObligacion: 'IVA' as const,
    periodo: '2026-04',
    fechaVencimiento: '2026-04-20',
    descripcion: 'DDJJ IVA',
    estado: 'PENDIENTE' as const,
  };

  beforeEach(() => {
    mockCrearVencimientoHandler = {
      execute: jest.fn().mockResolvedValue({ id: 'new-vencimiento-id' }),
    };
    mockProyectarCalendarioHandler = {
      execute: jest.fn().mockResolvedValue({ proyectados: 3, omitidos: 0, errores: [] }),
    };
    mockPresentarVencimientoHandler = {
      execute: jest.fn().mockResolvedValue({ id: 'v-1' }),
    };
    mockMarcarVencidoHandler = {
      execute: jest.fn().mockResolvedValue({ id: 'v-1' }),
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
    mockVencimientoCalendarioHandler = {
      execute: jest.fn().mockResolvedValue([]),
    };
    mockVencimientoByIdHandler = {
      execute: jest.fn().mockResolvedValue(byIdFixture),
    };
    controller = new ObligacionesController(
      mockCrearVencimientoHandler,
      mockProyectarCalendarioHandler,
      mockPresentarVencimientoHandler,
      mockMarcarVencidoHandler,
      mockVencimientoKpisHandler,
      mockVencimientoListHandler,
      mockVencimientoCalendarioHandler,
      mockVencimientoByIdHandler,
    );
  });

  describe('kpis', () => {
    it('should delegate to VencimientoKpisHandler with the principal', async () => {
      mockVencimientoKpisHandler.execute.mockResolvedValue({
        pendientes: 1,
        vencidos: 1,
        presentadosEsteMes: 0,
        proximoVencimiento: '2026-04-20',
      });

      const result = await controller.kpis(principal);

      expect(mockVencimientoKpisHandler.execute).toHaveBeenCalledWith(principal);
      expect(result.data).toEqual({
        pendientes: 1,
        vencidos: 1,
        presentadosEsteMes: 0,
        proximoVencimiento: '2026-04-20',
      });
    });

    it('should pass through null proximoVencimiento from the handler', async () => {
      mockVencimientoKpisHandler.execute.mockResolvedValue({
        pendientes: 0,
        vencidos: 0,
        presentadosEsteMes: 0,
        proximoVencimiento: null,
      });

      const result = await controller.kpis(principal);
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

    it('should delegate to VencimientoListHandler with principal', async () => {
      mockVencimientoListHandler.execute.mockResolvedValue({
        items: [listItem, listItem],
        total: 7,
      });

      const result = await controller.list(principal, 1, 20);

      expect(mockVencimientoListHandler.execute).toHaveBeenCalledWith(principal, {
        estado: undefined,
        periodo: undefined,
        clienteId: undefined,
        fechaDesde: undefined,
        fechaHasta: undefined,
        page: 1,
        limit: 20,
      });
      expect(result.data).toHaveLength(2);
      expect(result.meta).toEqual(expect.objectContaining({ total: 7, page: 1, limit: 20 }));
    });

    it('should use default page and limit when not provided', async () => {
      const result = await controller.list(principal);
      expect(result.meta!.page).toBe(1);
      expect(result.meta!.limit).toBe(20);
    });

    it('should forward periodo filter', async () => {
      await controller.list(principal, 1, 20, undefined, '2026-03');
      expect(mockVencimientoListHandler.execute).toHaveBeenCalledWith(
        principal,
        expect.objectContaining({ periodo: '2026-03' }),
      );
    });

    it('should forward estado filter', async () => {
      await controller.list(principal, 1, 20, 'PENDIENTE');
      expect(mockVencimientoListHandler.execute).toHaveBeenCalledWith(
        principal,
        expect.objectContaining({ estado: 'PENDIENTE' }),
      );
    });

    it('should forward clienteId and date-range filters', async () => {
      await controller.list(
        principal,
        2,
        50,
        undefined,
        undefined,
        'cli-42',
        '2026-04-01',
        '2026-04-30',
      );
      expect(mockVencimientoListHandler.execute).toHaveBeenCalledWith(principal, {
        estado: undefined,
        periodo: undefined,
        clienteId: 'cli-42',
        fechaDesde: '2026-04-01',
        fechaHasta: '2026-04-30',
        page: 2,
        limit: 50,
      });
    });
  });

  describe('getById', () => {
    it('should delegate to VencimientoByIdHandler with principal and id', async () => {
      const result = await controller.getById(principal, 'v-1');

      expect(mockVencimientoByIdHandler.execute).toHaveBeenCalledWith(principal, {
        id: 'v-1',
      });
      expect(result.data).toEqual(byIdFixture);
    });

    it('should propagate RecursoNoEncontradoError from the handler', async () => {
      mockVencimientoByIdHandler.execute.mockRejectedValue(
        new RecursoNoEncontradoError('Vencimiento'),
      );

      await expect(controller.getById(principal, 'bad-id')).rejects.toThrow(
        'Vencimiento no encontrado',
      );
    });
  });

  describe('create', () => {
    it('should delegate to CrearVencimientoHandler with principal', async () => {
      const dto = {
        clienteId: 'cliente-1',
        tipoObligacion: 'IVA',
        periodo: '2026-04',
        fechaVencimiento: '2026-04-20',
        descripcion: 'DDJJ IVA',
      };

      const result = await controller.create(dto as any, principal);
      expect(result.id).toBe('new-vencimiento-id');
      expect(mockCrearVencimientoHandler.execute).toHaveBeenCalledWith(principal, dto);
    });
  });

  describe('proyectarCalendario', () => {
    it('should delegate to ProyectarCalendarioMensualHandler with principal', async () => {
      const dto = { clienteId: 'cliente-1', periodo: '2026-05' };

      const result = await controller.proyectarCalendario(dto, principal);

      expect(mockProyectarCalendarioHandler.execute).toHaveBeenCalledWith(principal, dto);
      expect(result.data).toEqual({ proyectados: 3, omitidos: 0, errores: [] });
    });

    it('should propagate errors from handler', async () => {
      mockProyectarCalendarioHandler.execute.mockRejectedValue(
        new RecursoNoEncontradoError('Cliente'),
      );

      await expect(
        controller.proyectarCalendario({ clienteId: 'bad', periodo: '2026-05' }, principal),
      ).rejects.toThrow('Cliente no encontrado');
    });
  });

  describe('presentar', () => {
    it('should delegate to PresentarVencimientoHandler with principal', async () => {
      await controller.presentar(principal, 'vencimiento-1');

      expect(mockPresentarVencimientoHandler.execute).toHaveBeenCalledWith(principal, {
        vencimientoId: 'vencimiento-1',
      });
    });
  });

  describe('marcarVencido', () => {
    it('should delegate to MarcarVencidoHandler with principal', async () => {
      await controller.marcarVencido(principal, 'vencimiento-1');

      expect(mockMarcarVencidoHandler.execute).toHaveBeenCalledWith(principal, {
        vencimientoId: 'vencimiento-1',
      });
    });
  });

  describe('calendario', () => {
    const calendarioItem = {
      id: 'v-1',
      clienteId: 'cli-1',
      cliente: 'Empresa Alpha SRL',
      tipoObligacion: 'IVA',
      periodo: '2026-04',
      fechaVencimiento: '2026-04-20',
      descripcion: 'DDJJ IVA',
      estado: 'PENDIENTE',
    };

    it('should delegate to VencimientoCalendarioHandler with the derived date range', async () => {
      mockVencimientoCalendarioHandler.execute.mockResolvedValue([calendarioItem]);

      const result = await controller.calendario(principal, '2026-04');

      expect(mockVencimientoCalendarioHandler.execute).toHaveBeenCalledWith(principal, {
        fechaDesde: '2026-04-01',
        fechaHasta: '2026-04-30',
      });
      expect(result.data).toEqual([calendarioItem]);
    });

    it('should compute the last day of months with 31 days', async () => {
      await controller.calendario(principal, '2026-01');

      expect(mockVencimientoCalendarioHandler.execute).toHaveBeenCalledWith(principal, {
        fechaDesde: '2026-01-01',
        fechaHasta: '2026-01-31',
      });
    });

    it('should compute the last day of February in a non-leap year', async () => {
      await controller.calendario(principal, '2026-02');

      expect(mockVencimientoCalendarioHandler.execute).toHaveBeenCalledWith(principal, {
        fechaDesde: '2026-02-01',
        fechaHasta: '2026-02-28',
      });
    });

    it('should compute the last day of February in a leap year', async () => {
      await controller.calendario(principal, '2028-02');

      expect(mockVencimientoCalendarioHandler.execute).toHaveBeenCalledWith(principal, {
        fechaDesde: '2028-02-01',
        fechaHasta: '2028-02-29',
      });
    });
  });
});
