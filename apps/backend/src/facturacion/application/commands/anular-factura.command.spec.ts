import { AnularFacturaHandler } from './anular-factura.command';
import { Factura } from '../../domain/entities/factura.entity';
import { LineaFactura } from '../../domain/entities/linea-factura.entity';
import { ESTADO_FACTURA } from '@numerito/shared';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';

const principal: EstudioPrincipal = { estudioId: 'estudio-1', userId: 'user-1', roles: [] };

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

    const result = await handler.execute(principal, { id: 'factura-1' });

    expect(result.estado).toBe(ESTADO_FACTURA.ANULADA);
    expect(mockRepo.findById).toHaveBeenCalledWith(principal, 'factura-1');
    expect(mockRepo.save).toHaveBeenCalledWith(principal, factura);
  });

  it('should throw when factura not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(principal, { id: 'nonexistent' }),
    ).rejects.toThrow('Factura no encontrado');
    expect(mockRepo.save).not.toHaveBeenCalled();
  });
});
