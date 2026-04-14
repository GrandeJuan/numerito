import { AnularFacturaHandler } from './anular-factura.command';
import { Factura } from '../../domain/entities/factura.entity';
import { LineaFactura } from '../../domain/entities/linea-factura.entity';
import { ESTADO_FACTURA } from '@numerito/shared';

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

describe('AnularFactura Command', () => {
  let handler: AnularFacturaHandler;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByClienteId: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    };
    handler = new AnularFacturaHandler(mockRepo);
  });

  it('should anular a factura', async () => {
    const factura = makeFactura();
    mockRepo.findById.mockResolvedValue(factura);

    const result = await handler.execute({ id: 'factura-1' });

    expect(result.estado).toBe(ESTADO_FACTURA.ANULADA);
    expect(mockRepo.save).toHaveBeenCalledWith(factura);
  });

  it('should throw when factura not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      handler.execute({ id: 'nonexistent' }),
    ).rejects.toThrow('Factura no encontrado');
    expect(mockRepo.save).not.toHaveBeenCalled();
  });
});
