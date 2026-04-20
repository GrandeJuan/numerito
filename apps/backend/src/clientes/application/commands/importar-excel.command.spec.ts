import { ImportarExcelHandler } from './importar-excel.command';
import type { ImportRow } from '../services/excel-parser.service';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import { TIPO_OBLIGACION, ESTADO_VENCIMIENTO } from '@numerito/shared';
import { Cuit } from '../../domain/value-objects/cuit.vo';
import { RazonSocial } from '../../domain/value-objects/razon-social.vo';
import { Cliente } from '../../domain/entities/cliente.entity';
import { CONDICION_IVA, TIPO_CLIENTE, REGIMEN } from '@numerito/shared';

const principal: EstudioPrincipal = {
  estudioId: 'estudio-1',
  userId: 'user-1',
  roles: [],
};

function makeImportRow(overrides: Partial<ImportRow> = {}): ImportRow {
  return {
    fila: 2,
    razonSocial: 'MAFISSA',
    responsable: 'LORENA',
    cuitTerminacion: 0,
    detalle: 'CONV MULT',
    calendario: true,
    obligaciones: [
      {
        tipoObligacion: TIPO_OBLIGACION.IVA,
        headerOriginal: 'IVA',
        fecha: new Date('2026-02-18'),
      },
    ],
    ...overrides,
  };
}

function makeExistingCliente(razonSocial: string, id: string): Cliente {
  return Cliente.create({
    cuit: Cuit.create('20-12345678-0'),
    razonSocial: RazonSocial.create(razonSocial),
    condicionIva: CONDICION_IVA.RESPONSABLE_INSCRIPTO,
    tipo: TIPO_CLIENTE.PERSONA_JURIDICA,
    regimen: REGIMEN.GENERAL,
    estudioId: 'estudio-1',
  }, id);
}

describe('ImportarExcelHandler', () => {
  let handler: ImportarExcelHandler;
  let mockClienteRepo: any;
  let mockVencimientoRepo: any;

  beforeEach(() => {
    mockClienteRepo = {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue(null),
      findByCuit: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      findByResponsableId: jest.fn().mockResolvedValue([]),
    };
    mockVencimientoRepo = {
      findByClienteId: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn().mockResolvedValue(null),
      findAll: jest.fn().mockResolvedValue([]),
      findByPeriodo: jest.fn().mockResolvedValue([]),
      findByEstado: jest.fn().mockResolvedValue([]),
      findProximosAVencer: jest.fn().mockResolvedValue([]),
      findByClienteAndPeriodo: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    handler = new ImportarExcelHandler(mockClienteRepo, mockVencimientoRepo);
  });

  describe('dry-run mode', () => {
    it('should return preview without creating anything', async () => {
      const rows = [makeImportRow()];
      const result = await handler.execute(principal, {
        rows,
        dryRun: true,
        estadoHistoricos: 'PRESENTADO',
      });

      expect(result.dryRun).toBe(true);
      expect(result.totalFilas).toBe(1);
      expect(result.clientesNuevos).toBe(1);
      expect(result.vencimientosCreados).toBe(1);
      expect(mockClienteRepo.save).not.toHaveBeenCalled();
      expect(mockVencimientoRepo.save).not.toHaveBeenCalled();
    });

    it('should detect existing clients by name match', async () => {
      const existing = makeExistingCliente('MAFISSA', 'client-1');
      mockClienteRepo.findAll.mockResolvedValue([existing]);
      mockVencimientoRepo.findByClienteId.mockResolvedValue([]);

      const result = await handler.execute(principal, {
        rows: [makeImportRow()],
        dryRun: true,
        estadoHistoricos: 'PRESENTADO',
      });

      expect(result.clientesExistentes).toBe(1);
      expect(result.clientesNuevos).toBe(0);
      expect(result.detalle[0].accion).toBe('EXISTENTE');
      expect(result.detalle[0].clienteId).toBe('client-1');
    });

    it('should count duplicate vencimientos for existing clients', async () => {
      const existing = makeExistingCliente('MAFISSA', 'client-1');
      mockClienteRepo.findAll.mockResolvedValue([existing]);

      // Simulate existing vencimiento for IVA 2026-02
      mockVencimientoRepo.findByClienteId.mockResolvedValue([
        {
          id: 'v-1',
          tipoObligacion: TIPO_OBLIGACION.IVA,
          periodo: '2026-02',
        },
      ]);

      const result = await handler.execute(principal, {
        rows: [makeImportRow()],
        dryRun: true,
        estadoHistoricos: 'PRESENTADO',
      });

      expect(result.vencimientosDuplicados).toBe(1);
      expect(result.vencimientosCreados).toBe(0);
      expect(result.detalle[0].vencimientosDuplicados).toBe(1);
    });
  });

  describe('confirm mode', () => {
    it('should create new clients', async () => {
      const result = await handler.execute(principal, {
        rows: [makeImportRow()],
        dryRun: false,
        estadoHistoricos: 'PRESENTADO',
      });

      expect(result.dryRun).toBe(false);
      expect(result.clientesNuevos).toBe(1);
      expect(mockClienteRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should create vencimientos with PRESENTADO estado', async () => {
      const result = await handler.execute(principal, {
        rows: [makeImportRow()],
        dryRun: false,
        estadoHistoricos: 'PRESENTADO',
      });

      expect(result.vencimientosCreados).toBe(1);
      expect(mockVencimientoRepo.save).toHaveBeenCalledTimes(1);

      const savedVencimiento = mockVencimientoRepo.save.mock.calls[0][1];
      expect(savedVencimiento.estado).toBe(ESTADO_VENCIMIENTO.PRESENTADO);
    });

    it('should create vencimientos with PENDIENTE estado when specified', async () => {
      const result = await handler.execute(principal, {
        rows: [makeImportRow()],
        dryRun: false,
        estadoHistoricos: 'PENDIENTE',
      });

      const savedVencimiento = mockVencimientoRepo.save.mock.calls[0][1];
      expect(savedVencimiento.estado).toBe(ESTADO_VENCIMIENTO.PENDIENTE);
    });

    it('should not create duplicate vencimientos', async () => {
      const existing = makeExistingCliente('MAFISSA', 'client-1');
      mockClienteRepo.findAll.mockResolvedValue([existing]);

      mockVencimientoRepo.findByClienteId.mockResolvedValue([
        {
          id: 'v-1',
          tipoObligacion: TIPO_OBLIGACION.IVA,
          periodo: '2026-02',
        },
      ]);

      const result = await handler.execute(principal, {
        rows: [makeImportRow()],
        dryRun: false,
        estadoHistoricos: 'PRESENTADO',
      });

      expect(result.vencimientosDuplicados).toBe(1);
      expect(result.vencimientosCreados).toBe(0);
      expect(mockVencimientoRepo.save).not.toHaveBeenCalled();
    });

    it('should handle multiple rows with different clients', async () => {
      const rows = [
        makeImportRow({ razonSocial: 'MAFISSA' }),
        makeImportRow({
          fila: 3,
          razonSocial: 'PINI SRL',
          obligaciones: [
            {
              tipoObligacion: TIPO_OBLIGACION.SICOSS,
              headerOriginal: 'SICOSS',
              fecha: new Date('2026-02-09'),
            },
            {
              tipoObligacion: TIPO_OBLIGACION.IVA,
              headerOriginal: 'IVA',
              fecha: new Date('2026-02-18'),
            },
          ],
        }),
      ];

      const result = await handler.execute(principal, {
        rows,
        dryRun: false,
        estadoHistoricos: 'PRESENTADO',
      });

      expect(result.clientesNuevos).toBe(2);
      expect(result.vencimientosCreados).toBe(3);
      expect(mockClienteRepo.save).toHaveBeenCalledTimes(2);
      expect(mockVencimientoRepo.save).toHaveBeenCalledTimes(3);
    });

    it('should reuse existing client for matching name', async () => {
      const existing = makeExistingCliente('MAFISSA', 'client-1');
      mockClienteRepo.findAll.mockResolvedValue([existing]);

      const result = await handler.execute(principal, {
        rows: [makeImportRow()],
        dryRun: false,
        estadoHistoricos: 'PRESENTADO',
      });

      expect(result.clientesExistentes).toBe(1);
      expect(result.clientesNuevos).toBe(0);
      // Should not create the client again
      expect(mockClienteRepo.save).not.toHaveBeenCalled();
      // But should create the vencimiento
      expect(mockVencimientoRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should match client names case-insensitively', async () => {
      const existing = makeExistingCliente('Mafissa', 'client-1');
      mockClienteRepo.findAll.mockResolvedValue([existing]);

      const result = await handler.execute(principal, {
        rows: [makeImportRow({ razonSocial: 'MAFISSA' })],
        dryRun: false,
        estadoHistoricos: 'PRESENTADO',
      });

      expect(result.clientesExistentes).toBe(1);
      expect(result.clientesNuevos).toBe(0);
    });

    it('should prevent duplicate vencimientos within same import file', async () => {
      const existing = makeExistingCliente('MAFISSA', 'client-1');
      mockClienteRepo.findAll.mockResolvedValue([existing]);
      mockVencimientoRepo.findByClienteId.mockResolvedValue([]);

      const duplicateObl = {
        tipoObligacion: TIPO_OBLIGACION.IVA,
        headerOriginal: 'IVA',
        fecha: new Date('2026-02-18'), // same month
      };

      const rows = [
        makeImportRow({
          obligaciones: [duplicateObl, { ...duplicateObl, headerOriginal: 'IVA DIF.' }],
        }),
      ];

      const result = await handler.execute(principal, {
        rows,
        dryRun: false,
        estadoHistoricos: 'PRESENTADO',
      });

      // Second IVA for same period should be counted as duplicate
      expect(result.vencimientosCreados).toBe(1);
      expect(result.vencimientosDuplicados).toBe(1);
    });
  });

  describe('placeholder CUIT generation', () => {
    it('should create client with a valid placeholder CUIT', async () => {
      await handler.execute(principal, {
        rows: [makeImportRow({ cuitTerminacion: 5 })],
        dryRun: false,
        estadoHistoricos: 'PRESENTADO',
      });

      const savedCliente = mockClienteRepo.save.mock.calls[0][1];
      // Placeholder uses Cuit.placeholder() which generates a valid CUIT
      expect(savedCliente.cuit).toBeDefined();
      expect(savedCliente.cuit.raw).toHaveLength(11);
    });

    it('should default terminacion to 0 when null', async () => {
      await handler.execute(principal, {
        rows: [makeImportRow({ cuitTerminacion: null })],
        dryRun: false,
        estadoHistoricos: 'PRESENTADO',
      });

      const savedCliente = mockClienteRepo.save.mock.calls[0][1];
      expect(savedCliente.cuit).toBeDefined();
    });
  });
});
