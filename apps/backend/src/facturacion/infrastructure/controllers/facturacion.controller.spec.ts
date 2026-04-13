import { FacturacionController } from './facturacion.controller';
import { Factura } from '../../domain/entities/factura.entity';
import { LineaFactura } from '../../domain/entities/linea-factura.entity';

const makeLinea = (
  overrides: Partial<{
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    alicuotaIva: number;
  }> = {},
) =>
  LineaFactura.create({
    facturaId: 'factura-1',
    descripcion: overrides.descripcion ?? 'Servicio contable',
    cantidad: overrides.cantidad ?? 1,
    precioUnitario: overrides.precioUnitario ?? 1000,
    alicuotaIva: overrides.alicuotaIva ?? 21,
  });

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
      lineas: [makeLinea()],
    },
    overrides.id,
  );

describe('FacturacionController', () => {
  let controller: FacturacionController;
  let mockFacturaRepo: any;
  let mockPagoRepo: any;

  beforeEach(() => {
    mockFacturaRepo = {
      findById: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
      findByClienteId: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    };
    mockPagoRepo = {
      findById: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
      findByFacturaId: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    };
    controller = new FacturacionController(mockFacturaRepo, mockPagoRepo);
  });

  describe('stats', () => {
    it('should return facturacion stats', async () => {
      const facturas = [makeFactura(), makeFactura({ numero: 'FAC-002' })];
      mockFacturaRepo.findAll.mockResolvedValue(facturas);

      const result = await controller.stats('estudio-1');
      expect(result.data.facturado).toBeDefined();
      expect(result.data.cobrado).toBeDefined();
      expect(result.data.porEstado).toBeDefined();
      expect(result.data.mensual).toBeDefined();
    });

    it('should return zero stats when no facturas', async () => {
      const result = await controller.stats('estudio-1');
      expect(result.data.facturado).toBe(0);
    });
  });

  describe('list', () => {
    it('should return paginated facturas for estudio', async () => {
      const facturas = [makeFactura(), makeFactura({ numero: 'FAC-002' })];
      mockFacturaRepo.findAll.mockResolvedValue(facturas);

      const result = await controller.list('estudio-1', 1, 20);
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
    });

    it('should return empty list when no facturas', async () => {
      const result = await controller.list('estudio-1', 1, 20);
      expect(result.data).toHaveLength(0);
    });

    it('should use default page and limit when not provided', async () => {
      mockFacturaRepo.findAll.mockResolvedValue([]);

      const result = await controller.list('estudio-1');
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });
  });

  describe('create', () => {
    it('should create a factura with lineas', async () => {
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

      const result = await controller.create(dto as any, 'estudio-1');
      expect(result.data.id).toBeDefined();
      expect(mockFacturaRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should pass estudioId from decorator', async () => {
      const dto = {
        clienteId: 'cliente-1',
        numero: 'FAC-002',
        fechaEmision: '2026-01-01',
        fechaVencimiento: '2026-02-01',
        concepto: 'Honorarios',
        lineas: [{ descripcion: 'Servicio', cantidad: 1, precioUnitario: 500, alicuotaIva: 21 }],
      };

      await controller.create(dto as any, 'estudio-99');
      const savedFactura = mockFacturaRepo.save.mock.calls[0][0];
      expect(savedFactura.estudioId).toBe('estudio-99');
    });
  });

  describe('getById', () => {
    it('should return a factura by id', async () => {
      const factura = makeFactura();
      mockFacturaRepo.findById.mockResolvedValue(factura);

      const result = await controller.getById(factura.id);
      expect(result.data).toBeDefined();
    });

    it('should throw when factura not found', async () => {
      mockFacturaRepo.findById.mockResolvedValue(null);

      await expect(controller.getById('nonexistent')).rejects.toThrow('Factura no encontrado');
    });
  });

  describe('registrarPago', () => {
    it('should register a payment on a factura', async () => {
      const factura = makeFactura();
      mockFacturaRepo.findById.mockResolvedValue(factura);

      const dto = { monto: 500, medioPagoId: 1 };
      const result = await controller.registrarPago(factura.id, dto as any, 'estudio-1');

      expect(mockFacturaRepo.save).toHaveBeenCalledTimes(1);
      expect(mockPagoRepo.save).toHaveBeenCalledTimes(1);
      expect(result.data).toBeDefined();
    });

    it('should throw when factura not found', async () => {
      mockFacturaRepo.findById.mockResolvedValue(null);

      await expect(
        controller.registrarPago('bad-id', { monto: 100, medioPagoId: 1 } as any, 'estudio-1'),
      ).rejects.toThrow('Factura no encontrado');
    });

    it('should save pago with referencia when provided', async () => {
      const factura = makeFactura();
      mockFacturaRepo.findById.mockResolvedValue(factura);

      const dto = { monto: 100, medioPagoId: 2, referencia: 'TRF-123' };
      await controller.registrarPago(factura.id, dto as any, 'estudio-1');

      const savedPago = mockPagoRepo.save.mock.calls[0][0];
      expect(savedPago.referencia).toBe('TRF-123');
    });
  });

  describe('anular', () => {
    it('should anular a factura', async () => {
      const factura = makeFactura();
      mockFacturaRepo.findById.mockResolvedValue(factura);

      const result = await controller.anular(factura.id);
      expect(factura.estado).toBe('ANULADA');
      expect(mockFacturaRepo.save).toHaveBeenCalledTimes(1);
      expect(result.data).toBeDefined();
    });

    it('should throw when factura not found', async () => {
      mockFacturaRepo.findById.mockResolvedValue(null);

      await expect(controller.anular('bad-id')).rejects.toThrow('Factura no encontrado');
    });
  });

  describe('cuentaCorriente', () => {
    it('should return facturas for a client', async () => {
      const facturas = [makeFactura(), makeFactura({ numero: 'FAC-002' })];
      mockFacturaRepo.findByClienteId.mockResolvedValue(facturas);

      const result = await controller.cuentaCorriente('cliente-1', 'estudio-1', 1, 20);
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(mockFacturaRepo.findByClienteId).toHaveBeenCalledWith('cliente-1');
    });

    it('should return empty when client has no facturas', async () => {
      const result = await controller.cuentaCorriente('cliente-1', 'estudio-1', 1, 20);
      expect(result.data).toHaveLength(0);
    });

    it('should use default page and limit when not provided', async () => {
      mockFacturaRepo.findByClienteId.mockResolvedValue([]);

      const result = await controller.cuentaCorriente('cliente-1', 'estudio-1');
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });
  });
});
