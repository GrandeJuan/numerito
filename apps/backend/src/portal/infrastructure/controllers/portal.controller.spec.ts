jest.mock('../../../documentos/infrastructure/persistence/documento.schema', () => ({
  DocumentoEntity: class DocumentoEntity {},
}));
jest.mock('../../../obligaciones/infrastructure/persistence/vencimiento.schema', () => ({
  VencimientoEntity: class VencimientoEntity {},
}));
jest.mock('../../../facturacion/infrastructure/persistence/factura.schema', () => ({
  FacturaEntity: class FacturaEntity {},
}));

import { PortalController } from './portal.controller';
import { ObtenerPortalStatsHandler } from '../../application/queries/obtener-portal-stats.query';

describe('PortalController', () => {
  let controller: PortalController;
  let mockHandler: jest.Mocked<ObtenerPortalStatsHandler>;

  const mockStats = {
    clienteNombre: 'Mi Empresa SRL',
    kpis: {
      vencimientosPendientes: 3,
      facturasPendientes: 2,
      documentos: 10,
    },
    vencimientosRecientes: [
      { id: 'v1', obligacion: 'IVA', fecha: '2026-04-15', estado: 'Pendiente' },
    ],
    facturasRecientes: [
      { id: 'f1', numero: 'A-0001-00001', monto: 5000, estado: 'Pendiente', fecha: '2026-04-01' },
    ],
    documentosRecientes: [
      { id: 'd1', nombre: 'Balance.pdf', tipo: 'PDF', fecha: '2026-04-01' },
    ],
  };

  beforeEach(() => {
    mockHandler = {
      execute: jest.fn().mockResolvedValue(mockStats),
    } as any;
    controller = new PortalController(mockHandler);
  });

  describe('getStats', () => {
    it('should call handler with usuarioId and rol from JWT', async () => {
      await controller.getStats({ sub: 'user-1', rol: 'CLIENTE' });

      expect(mockHandler.execute).toHaveBeenCalledWith({
        usuarioId: 'user-1',
        rol: 'CLIENTE',
      });
    });

    it('should return wrapped response with data and meta', async () => {
      const result = await controller.getStats({ sub: 'user-1', rol: 'CLIENTE' });

      expect(result.data).toEqual(mockStats);
      expect(result.meta).toHaveProperty('timestamp');
    });

    it('should return clienteNombre in data', async () => {
      const result = await controller.getStats({ sub: 'user-1', rol: 'CLIENTE' });

      expect(result.data.clienteNombre).toBe('Mi Empresa SRL');
    });

    it('should return KPIs in data', async () => {
      const result = await controller.getStats({ sub: 'user-1', rol: 'CLIENTE' });

      expect(result.data.kpis.vencimientosPendientes).toBe(3);
      expect(result.data.kpis.facturasPendientes).toBe(2);
      expect(result.data.kpis.documentos).toBe(10);
    });
  });
});
