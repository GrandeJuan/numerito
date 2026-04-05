jest.mock('../../../documentos/infrastructure/persistence/documento.schema', () => ({
  DocumentoEntity: class DocumentoEntity {},
}));
jest.mock('../../../obligaciones/infrastructure/persistence/vencimiento.schema', () => ({
  VencimientoEntity: class VencimientoEntity {},
}));
jest.mock('../../../facturacion/infrastructure/persistence/factura.schema', () => ({
  FacturaEntity: class FacturaEntity {},
}));

import { ObtenerPortalStatsHandler } from './obtener-portal-stats.query';
import { ForbiddenException } from '@nestjs/common';

describe('ObtenerPortalStatsHandler', () => {
  let handler: ObtenerPortalStatsHandler;
  let mockEm: any;
  let mockExecute: jest.Mock;

  const usuarioId = 'user-uuid';
  const clienteId = 'cliente-uuid';

  beforeEach(() => {
    mockExecute = jest.fn().mockResolvedValue([]);
    mockEm = {
      count: jest.fn().mockResolvedValue(0),
      getConnection: jest.fn().mockReturnValue({ execute: mockExecute }),
    };
  });

  function createHandler() {
    handler = new ObtenerPortalStatsHandler(mockEm);
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
    it('should throw ForbiddenException', async () => {
      mockExecute.mockResolvedValueOnce([]); // no cliente found
      createHandler();
      await expect(
        handler.execute({ usuarioId, rol: 'CLIENTE' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('when user is CLIENTE with linked cliente', () => {
    beforeEach(() => {
      // First call: find cliente linked to user
      mockExecute.mockResolvedValueOnce([{ id: clienteId, razon_social: 'Mi Empresa SRL' }]);
      // Subsequent calls for stats
      mockEm.count
        .mockResolvedValueOnce(3)  // vencimientos pendientes
        .mockResolvedValueOnce(2)  // facturas pendientes
        .mockResolvedValueOnce(10); // documentos
    });

    it('should return clienteNombre', async () => {
      createHandler();
      const result = await handler.execute({ usuarioId, rol: 'CLIENTE' });
      expect(result.clienteNombre).toBe('Mi Empresa SRL');
    });

    it('should return KPIs', async () => {
      createHandler();
      const result = await handler.execute({ usuarioId, rol: 'CLIENTE' });
      expect(result.kpis.vencimientosPendientes).toBe(3);
      expect(result.kpis.facturasPendientes).toBe(2);
      expect(result.kpis.documentos).toBe(10);
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
      mockEm.count.mockResolvedValue(0);
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
