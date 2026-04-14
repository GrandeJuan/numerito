import { RegistrarPagoHandler } from './registrar-pago.command';
import { Factura } from '../../domain/entities/factura.entity';
import { LineaFactura } from '../../domain/entities/linea-factura.entity';

const makeFactura = (id = 'factura-1') => {
  const linea = LineaFactura.create({
    facturaId: id,
    descripcion: 'Servicio contable',
    cantidad: 1,
    precioUnitario: 1000,
    alicuotaIva: 21,
  });
  return Factura.create(
    {
      clienteId: 'cliente-1',
      estudioId: 'estudio-1',
      numero: 'FAC-001',
      fechaEmision: new Date('2026-01-01'),
      fechaVencimiento: new Date('2026-02-01'),
      concepto: 'Honorarios enero',
      lineas: [linea],
    },
    id,
  );
};

describe('RegistrarPago Command', () => {
  let handler: RegistrarPagoHandler;
  let mockFacturaRepo: any;
  let mockPagoRepo: any;

  beforeEach(() => {
    mockFacturaRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByClienteId: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    };
    mockPagoRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByFacturaId: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    };
    handler = new RegistrarPagoHandler(mockFacturaRepo, mockPagoRepo);
  });

  it('should register a pago and update factura', async () => {
    const factura = makeFactura();
    mockFacturaRepo.findById.mockResolvedValue(factura);

    const result = await handler.execute({
      facturaId: 'factura-1',
      estudioId: 'estudio-1',
      monto: 500,
      medioPagoId: 1,
      referencia: 'TRF-001',
    });

    expect(result.monto).toBe(500);
    expect(mockFacturaRepo.save).toHaveBeenCalledWith(factura);
    expect(mockPagoRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should throw when factura not found', async () => {
    mockFacturaRepo.findById.mockResolvedValue(null);

    await expect(
      handler.execute({
        facturaId: 'nonexistent',
        estudioId: 'estudio-1',
        monto: 100,
        medioPagoId: 1,
      }),
    ).rejects.toThrow('Factura no encontrado');
    expect(mockPagoRepo.save).not.toHaveBeenCalled();
  });

  it('should throw when pago exceeds saldo pendiente', async () => {
    const factura = makeFactura();
    mockFacturaRepo.findById.mockResolvedValue(factura);

    await expect(
      handler.execute({
        facturaId: 'factura-1',
        estudioId: 'estudio-1',
        monto: 999999,
        medioPagoId: 1,
      }),
    ).rejects.toThrow();
  });
});
