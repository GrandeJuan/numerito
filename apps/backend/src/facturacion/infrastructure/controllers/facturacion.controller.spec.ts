import { FacturacionController } from './facturacion.controller';
import { Factura } from '../../domain/entities/factura.entity';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';

const principal: EstudioPrincipal = { estudioId: 'estudio-1', userId: 'user-1', roles: [] };

const makeFactura = (
  overrides: Partial<{ id: string; clienteId: string; estudioId: string; numero: string }> = {},
) =>
  Factura.create(
    {
      clienteId: overrides.clienteId ?? 'cliente-1',
      estudioId: overrides.estudioId ?? 'estudio-1',
      numero: overrides.numero ?? 'FAC-001',
      fechaEmision: new Date('2026-01-01'),
      fechaVencimiento: new Date('2026-02-01'),
      concepto: 'Honorarios enero',
      lineas: [{ descripcion: 'Servicio contable', cantidad: 1, precioUnitario: 1000, alicuotaIva: 21 }],
    },
    overrides.id,
  );

describe('FacturacionController', () => {
  let controller: FacturacionController;
  let mockFacturaRepo: any;
  let mockCrearFacturaHandler: any;
  let mockRegistrarPagoHandler: any;
  let mockAnularFacturaHandler: any;

  beforeEach(() => {
    mockFacturaRepo = {
      findById: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
      findByClienteId: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    };
    mockCrearFacturaHandler = {
      execute: jest.fn().mockResolvedValue({ id: 'factura-new' }),
    };
    mockRegistrarPagoHandler = {
      execute: jest.fn().mockResolvedValue({ id: 'pago-new', monto: 500 }),
    };
    mockAnularFacturaHandler = {
      execute: jest.fn().mockResolvedValue(makeFactura()),
    };
    controller = new FacturacionController(
      mockFacturaRepo,
      mockCrearFacturaHandler,
      mockRegistrarPagoHandler,
      mockAnularFacturaHandler,
    );
  });

  describe('stats', () => {
    it('should return facturacion stats', async () => {
      const facturas = [makeFactura(), makeFactura({ numero: 'FAC-002' })];
      mockFacturaRepo.findAll.mockResolvedValue(facturas);

      const result = await controller.stats(principal);
      expect(result.data.facturado).toBeDefined();
      expect(result.data.cobrado).toBeDefined();
      expect(result.data.porEstado).toBeDefined();
      expect(result.data.mensual).toBeDefined();
      expect(mockFacturaRepo.findAll).toHaveBeenCalledWith(principal);
    });

    it('should return zero stats when no facturas', async () => {
      const result = await controller.stats(principal);
      expect(result.data.facturado).toBe(0);
    });
  });

  describe('list', () => {
    it('should return paginated facturas for estudio', async () => {
      const facturas = [makeFactura(), makeFactura({ numero: 'FAC-002' })];
      mockFacturaRepo.findAll.mockResolvedValue(facturas);

      const result = await controller.list(principal, 1, 20);
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(mockFacturaRepo.findAll).toHaveBeenCalledWith(principal);
    });

    it('should return empty list when no facturas', async () => {
      const result = await controller.list(principal, 1, 20);
      expect(result.data).toHaveLength(0);
    });

    it('should use default page and limit when not provided', async () => {
      mockFacturaRepo.findAll.mockResolvedValue([]);

      const result = await controller.list(principal);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });
  });

  describe('create', () => {
    it('should dispatch to CrearFacturaHandler with principal', async () => {
      const dto = {
        clienteId: 'cliente-1',
        numero: 'FAC-001',
        fechaEmision: '2026-01-01',
        fechaVencimiento: '2026-02-01',
        concepto: 'Honorarios enero',
        lineas: [
          { descripcion: 'Servicio contable', cantidad: 1, precioUnitario: 1000, alicuotaIva: 21 },
        ],
      };

      const result = await controller.create(dto as any, principal);
      expect(result.data.id).toBe('factura-new');
      expect(mockCrearFacturaHandler.execute).toHaveBeenCalledTimes(1);
      expect(mockCrearFacturaHandler.execute).toHaveBeenCalledWith(principal, dto);
    });

    it('should not call repository directly', async () => {
      const dto = {
        clienteId: 'cliente-1',
        numero: 'FAC-002',
        fechaEmision: '2026-01-01',
        fechaVencimiento: '2026-02-01',
        concepto: 'Honorarios',
        lineas: [{ descripcion: 'Servicio', cantidad: 1, precioUnitario: 500, alicuotaIva: 21 }],
      };

      await controller.create(dto as any, principal);
      expect(mockFacturaRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return a factura by id', async () => {
      const factura = makeFactura();
      mockFacturaRepo.findById.mockResolvedValue(factura);

      const result = await controller.getById(principal, factura.id);
      expect(result.data).toBeDefined();
      expect(mockFacturaRepo.findById).toHaveBeenCalledWith(principal, factura.id);
    });

    it('should throw when factura not found', async () => {
      mockFacturaRepo.findById.mockResolvedValue(null);

      await expect(controller.getById(principal, 'nonexistent')).rejects.toThrow('Factura no encontrado');
    });
  });

  describe('registrarPago', () => {
    it('should dispatch to RegistrarPagoHandler with principal', async () => {
      const dto = { monto: 500, medioPagoId: 1 };
      const result = await controller.registrarPago(principal, 'factura-1', dto as any);

      expect(result.data).toBeDefined();
      expect(mockRegistrarPagoHandler.execute).toHaveBeenCalledWith(principal, {
        facturaId: 'factura-1',
        monto: 500,
        medioPagoId: 1,
        referencia: undefined,
      });
    });

    it('should pass referencia when provided', async () => {
      const dto = { monto: 100, medioPagoId: 2, referencia: 'TRF-123' };
      await controller.registrarPago(principal, 'factura-1', dto as any);

      expect(mockRegistrarPagoHandler.execute).toHaveBeenCalledWith(principal, {
        facturaId: 'factura-1',
        monto: 100,
        medioPagoId: 2,
        referencia: 'TRF-123',
      });
    });
  });

  describe('anular', () => {
    it('should dispatch to AnularFacturaHandler with principal', async () => {
      const result = await controller.anular(principal, 'factura-1');
      expect(result.data).toBeDefined();
      expect(mockAnularFacturaHandler.execute).toHaveBeenCalledWith(principal, { id: 'factura-1' });
    });
  });

  describe('cuentaCorriente', () => {
    it('should return facturas for a client', async () => {
      const facturas = [makeFactura(), makeFactura({ numero: 'FAC-002' })];
      mockFacturaRepo.findByClienteId.mockResolvedValue(facturas);

      const result = await controller.cuentaCorriente(principal, 'cliente-1', 1, 20);
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(mockFacturaRepo.findByClienteId).toHaveBeenCalledWith(principal, 'cliente-1');
    });

    it('should return empty when client has no facturas', async () => {
      const result = await controller.cuentaCorriente(principal, 'cliente-1', 1, 20);
      expect(result.data).toHaveLength(0);
    });

    it('should use default page and limit when not provided', async () => {
      mockFacturaRepo.findByClienteId.mockResolvedValue([]);

      const result = await controller.cuentaCorriente(principal, 'cliente-1');
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });
  });
});
