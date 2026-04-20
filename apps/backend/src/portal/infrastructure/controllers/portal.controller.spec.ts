jest.mock('../../../documentos/infrastructure/persistence/documento.schema', () => ({
  DocumentoEntity: class DocumentoEntity {},
}));
jest.mock('../../../obligaciones/infrastructure/persistence/vencimiento.schema', () => ({
  VencimientoEntity: class VencimientoEntity {},
}));
jest.mock('../../../facturacion/infrastructure/persistence/factura.schema', () => ({
  FacturaEntity: class FacturaEntity {},
}));
jest.mock('../../../notificaciones/infrastructure/persistence/resumen-mensual.schema', () => ({
  ResumenMensualEntity: class ResumenMensualEntity {},
}));

import { ForbiddenException } from '@nestjs/common';
import { PortalController } from './portal.controller';
import { ObtenerPortalStatsHandler } from '../../application/queries/obtener-portal-stats.query';
import { ObtenerResumenesClienteHandler } from '../../application/queries/obtener-resumenes-cliente.query';
import { DescargarCalendarioPdfHandler } from '../../application/queries/descargar-calendario-pdf.query';
import type { ClientePorUsuarioPortalView } from '../../../clientes/application/views/cliente-por-usuario-portal.view';

describe('PortalController', () => {
  let controller: PortalController;
  let mockStatsHandler: jest.Mocked<ObtenerPortalStatsHandler>;
  let mockResumenesHandler: jest.Mocked<ObtenerResumenesClienteHandler>;
  let mockPdfHandler: jest.Mocked<DescargarCalendarioPdfHandler>;
  let mockClienteView: jest.Mocked<ClientePorUsuarioPortalView>;

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
    mockStatsHandler = {
      execute: jest.fn().mockResolvedValue(mockStats),
    } as any;
    mockResumenesHandler = {
      execute: jest.fn().mockResolvedValue([
        { id: 'r1', periodo: '2026-05', totalVencimientos: 8, estado: 'LISTO', emailEnviado: true, createdAt: new Date() },
      ]),
    } as any;
    mockPdfHandler = {
      execute: jest.fn().mockResolvedValue({
        buffer: Buffer.from('pdf-data'),
        filename: 'calendario-2026-05-mi-empresa-srl.pdf',
      }),
    } as any;
    mockClienteView = {
      execute: jest.fn().mockResolvedValue({ clienteId: 'cliente-1', razonSocial: 'Mi Empresa SRL' }),
    } as any;

    controller = new PortalController(
      mockStatsHandler,
      mockResumenesHandler,
      mockPdfHandler,
      mockClienteView,
    );
  });

  describe('getStats', () => {
    it('should call handler with usuarioId and rol from JWT', async () => {
      await controller.getStats({ sub: 'user-1', rol: 'CLIENTE' });

      expect(mockStatsHandler.execute).toHaveBeenCalledWith({
        usuarioId: 'user-1',
        rol: 'CLIENTE',
      });
    });

    it('should return wrapped response with data and meta', async () => {
      const result = await controller.getStats({ sub: 'user-1', rol: 'CLIENTE' });

      expect(result.data).toEqual(mockStats);
      expect(result.meta).toHaveProperty('timestamp');
    });

    it('should return KPIs in data', async () => {
      const result = await controller.getStats({ sub: 'user-1', rol: 'CLIENTE' });

      expect(result.data.kpis.vencimientosPendientes).toBe(3);
      expect(result.data.kpis.facturasPendientes).toBe(2);
      expect(result.data.kpis.documentos).toBe(10);
    });
  });

  describe('getResumenes', () => {
    it('should resolve client and return resumenes', async () => {
      const result = await controller.getResumenes({ sub: 'user-1', rol: 'CLIENTE' });

      expect(mockClienteView.execute).toHaveBeenCalledWith({ usuarioId: 'user-1' });
      expect(mockResumenesHandler.execute).toHaveBeenCalledWith({ clienteId: 'cliente-1' });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].periodo).toBe('2026-05');
    });

    it('should throw ForbiddenException when client not found', async () => {
      mockClienteView.execute.mockResolvedValue(null);

      await expect(
        controller.getResumenes({ sub: 'user-1', rol: 'CLIENTE' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('descargarPdf', () => {
    it('should stream PDF with correct headers', async () => {
      const mockRes = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as any;

      await controller.descargarPdf('2026-05', { sub: 'user-1', rol: 'CLIENTE' }, mockRes);

      expect(mockPdfHandler.execute).toHaveBeenCalledWith({
        clienteId: 'cliente-1',
        periodo: '2026-05',
      });
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="calendario-2026-05-mi-empresa-srl.pdf"',
      );
      expect(mockRes.send).toHaveBeenCalledWith(Buffer.from('pdf-data'));
    });
  });
});
