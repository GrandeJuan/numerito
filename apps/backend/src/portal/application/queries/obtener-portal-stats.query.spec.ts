import { ObtenerPortalStatsHandler } from './obtener-portal-stats.query';
import { ForbiddenException } from '@nestjs/common';

describe('ObtenerPortalStatsHandler', () => {
  let handler: ObtenerPortalStatsHandler;
  let mockEm: any;
  let mockExecute: jest.Mock;
  let mockVencimientosPendientesCliente: any;
  let mockFacturasPendientesCliente: any;
  let mockDocumentosClienteCount: any;

  const usuarioId = 'user-uuid';
  const clienteId = 'cliente-uuid';

  beforeEach(() => {
    mockExecute = jest.fn().mockResolvedValue([]);
    mockEm = {
      count: jest.fn().mockResolvedValue(0),
      getConnection: jest.fn().mockReturnValue({ execute: mockExecute }),
    };
    mockVencimientosPendientesCliente = {
      execute: jest.fn().mockResolvedValue({ totalVencimientosPendientes: 0 }),
    };
    mockFacturasPendientesCliente = {
      execute: jest.fn().mockResolvedValue({ totalFacturasPendientes: 0 }),
    };
    mockDocumentosClienteCount = {
      execute: jest.fn().mockResolvedValue({ totalDocumentos: 0 }),
    };
  });

  function createHandler() {
    handler = new ObtenerPortalStatsHandler(
      mockEm,
      mockVencimientosPendientesCliente,
      mockFacturasPendientesCliente,
      mockDocumentosClienteCount,
    );
  }

  describe('when user has no CLIENTE rol', () => {
    it('should throw ForbiddenException', async () => {
      createHandler();
      await expect(
        handler.execute({ usuarioId, rol: 'SOCIO' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('when user is CLIENTE but has no linked cliente', () => {
    it('should return empty stats', async () => {
      mockExecute.mockResolvedValueOnce([]); // no cliente found
      createHandler();
      const result = await handler.execute({ usuarioId, rol: 'CLIENTE' });
      expect(result.clienteNombre).toBe('');
      expect(result.kpis).toEqual({ vencimientosPendientes: 0, facturasPendientes: 0, documentos: 0 });
    });
  });

  describe('when user is CLIENTE with linked cliente', () => {
    beforeEach(() => {
      // First call: find cliente linked to user
      mockExecute.mockResolvedValueOnce([{ id: clienteId, razon_social: 'Mi Empresa SRL' }]);
      // Views return KPI values
      mockVencimientosPendientesCliente.execute.mockResolvedValue({ totalVencimientosPendientes: 3 });
      mockFacturasPendientesCliente.execute.mockResolvedValue({ totalFacturasPendientes: 2 });
      mockDocumentosClienteCount.execute.mockResolvedValue({ totalDocumentos: 10 });
    });

    it('should return clienteNombre', async () => {
      createHandler();
      const result = await handler.execute({ usuarioId, rol: 'CLIENTE' });
      expect(result.clienteNombre).toBe('Mi Empresa SRL');
    });

    it('should return KPIs from composed views', async () => {
      createHandler();
      const result = await handler.execute({ usuarioId, rol: 'CLIENTE' });
      expect(result.kpis.vencimientosPendientes).toBe(3);
      expect(result.kpis.facturasPendientes).toBe(2);
      expect(result.kpis.documentos).toBe(10);
    });

    it('should call views with clienteId', async () => {
      createHandler();
      await handler.execute({ usuarioId, rol: 'CLIENTE' });
      expect(mockVencimientosPendientesCliente.execute).toHaveBeenCalledWith({ clienteId });
      expect(mockFacturasPendientesCliente.execute).toHaveBeenCalledWith({ clienteId });
      expect(mockDocumentosClienteCount.execute).toHaveBeenCalledWith({ clienteId });
    });

    it('should return empty arrays when no recent data', async () => {
      createHandler();
      const result = await handler.execute({ usuarioId, rol: 'CLIENTE' });
      expect(result.vencimientosRecientes).toEqual([]);
      expect(result.facturasRecientes).toEqual([]);
      expect(result.documentosRecientes).toEqual([]);
    });
  });

  describe('when recent data exists', () => {
    beforeEach(() => {
      // find cliente
      mockExecute
        .mockResolvedValueOnce([{ id: clienteId, razon_social: 'Empresa Test' }]);
      // vencimientos recientes
      mockExecute.mockResolvedValueOnce([
        { id: 'v1', obligacion: 'IVA', fecha: '2026-04-15', estado: 'Pendiente' },
      ]);
      // facturas recientes
      mockExecute.mockResolvedValueOnce([
        { id: 'f1', numero: 'A-0001-00001', monto: 5000, estado: 'Pendiente', fecha: '2026-04-01' },
      ]);
      // documentos recientes
      mockExecute.mockResolvedValueOnce([
        { id: 'd1', nombre: 'Balance.pdf', tipo: 'PDF', fecha: '2026-04-01' },
      ]);
    });

    it('should return recent items', async () => {
      createHandler();
      const result = await handler.execute({ usuarioId, rol: 'CLIENTE' });
      expect(result.vencimientosRecientes).toHaveLength(1);
      expect(result.vencimientosRecientes[0].obligacion).toBe('IVA');
      expect(result.facturasRecientes).toHaveLength(1);
      expect(result.facturasRecientes[0].numero).toBe('A-0001-00001');
      expect(result.documentosRecientes).toHaveLength(1);
      expect(result.documentosRecientes[0].nombre).toBe('Balance.pdf');
    });
  });
});
