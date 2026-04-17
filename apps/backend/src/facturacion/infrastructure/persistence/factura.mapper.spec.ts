import { Factura, ESTADO_FACTURA } from '../../domain/entities/factura.entity';
import { LineaFactura } from '../../domain/entities/linea-factura.entity';
import {
  FacturaMapper,
  facturaPersistenceSchema,
  type FacturaPersistence,
} from './factura.mapper';
import type { FacturaEntity } from './factura.schema';

describe('FacturaMapper', () => {
  const mapper = new FacturaMapper();
  const validId = '11111111-1111-1111-1111-111111111111';
  const lineaId = '22222222-2222-2222-2222-222222222222';
  const clienteId = 'cliente-1';
  const estudioId = 'estudio-1';
  const fechaEmision = new Date('2026-01-15');
  const fechaVencimiento = new Date('2026-02-15');

  const validPersistence: FacturaPersistence = {
    id: validId,
    clienteId,
    estudioId,
    numero: 'FAC-0001',
    fechaEmision,
    fechaVencimiento,
    concepto: 'Servicios contables enero 2026',
    lineas: [
      {
        id: lineaId,
        facturaId: validId,
        descripcion: 'Liquidación de sueldos',
        cantidad: 1,
        precioUnitario: 5000,
        alicuotaIva: 21,
      },
    ],
    estado: ESTADO_FACTURA.EMITIDA,
    totalPagado: 0,
  };

  describe('toDomain', () => {
    it('reconstitutes a Factura preserving all fields', () => {
      const factura = mapper.toDomain(validPersistence);

      expect(factura).toBeInstanceOf(Factura);
      expect(factura.id).toBe(validId);
      expect(factura.clienteId).toBe(clienteId);
      expect(factura.estudioId).toBe(estudioId);
      expect(factura.numero).toBe('FAC-0001');
      expect(factura.fechaEmision).toEqual(fechaEmision);
      expect(factura.fechaVencimiento).toEqual(fechaVencimiento);
      expect(factura.concepto).toBe('Servicios contables enero 2026');
      expect(factura.estado).toBe(ESTADO_FACTURA.EMITIDA);
      expect(factura.totalPagado).toBe(0);
    });

    it('reconstitutes nested LineaFactura instances', () => {
      const factura = mapper.toDomain(validPersistence);

      expect(factura.lineas).toHaveLength(1);
      expect(factura.lineas[0]).toBeInstanceOf(LineaFactura);
      expect(factura.lineas[0].id).toBe(lineaId);
      expect(factura.lineas[0].facturaId).toBe(validId);
      expect(factura.lineas[0].descripcion).toBe('Liquidación de sueldos');
      expect(factura.lineas[0].cantidad).toBe(1);
      expect(factura.lineas[0].precioUnitario).toBe(5000);
      expect(factura.lineas[0].alicuotaIva).toBe(21);
    });

    it('handles multiple lineas', () => {
      const secondLineaId = '33333333-3333-3333-3333-333333333333';
      const persistence: FacturaPersistence = {
        ...validPersistence,
        lineas: [
          ...validPersistence.lineas,
          {
            id: secondLineaId,
            facturaId: validId,
            descripcion: 'Asesoría fiscal',
            cantidad: 2,
            precioUnitario: 3000,
            alicuotaIva: 21,
          },
        ],
      };
      const factura = mapper.toDomain(persistence);
      expect(factura.lineas).toHaveLength(2);
      expect(factura.lineas[1].id).toBe(secondLineaId);
    });

    it('does not emit domain events on reconstitution', () => {
      const factura = mapper.toDomain(validPersistence);
      expect(factura.getDomainEvents()).toHaveLength(0);
    });

    it('rejects malformed persistence id (Zod validation)', () => {
      const bad = { ...validPersistence, id: 'not-a-uuid' };
      expect(() => mapper.toDomain(bad)).toThrow();
    });

    it('rejects missing required fields (Zod validation)', () => {
      const bad = { ...validPersistence } as Partial<FacturaPersistence>;
      delete bad.clienteId;
      expect(() => mapper.toDomain(bad as FacturaPersistence)).toThrow();
    });

    it('rejects unknown estado codes (Zod validation)', () => {
      const bad = {
        ...validPersistence,
        estado: 'NOT_A_ESTADO' as FacturaPersistence['estado'],
      };
      expect(() => mapper.toDomain(bad)).toThrow();
    });

    it('rejects wrong types (Zod validation)', () => {
      const bad = {
        ...validPersistence,
        totalPagado: '0' as unknown as number,
      };
      expect(() => mapper.toDomain(bad)).toThrow();
    });

    it('rejects malformed linea id (Zod validation)', () => {
      const bad: FacturaPersistence = {
        ...validPersistence,
        lineas: [{ ...validPersistence.lineas[0], id: 'not-a-uuid' }],
      };
      expect(() => mapper.toDomain(bad)).toThrow();
    });
  });

  describe('toPersistence', () => {
    it('extracts the flat persistence shape from a domain Factura', () => {
      const factura = mapper.toDomain(validPersistence);
      expect(mapper.toPersistence(factura)).toEqual(validPersistence);
    });

    it('reflects mutations made via domain methods', () => {
      const factura = mapper.toDomain({
        ...validPersistence,
        totalPagado: 0,
      });
      factura.anular();

      const persistence = mapper.toPersistence(factura);
      expect(persistence.estado).toBe(ESTADO_FACTURA.ANULADA);
    });

    it('produces output that satisfies the persistence schema', () => {
      const factura = mapper.toDomain(validPersistence);
      const out = mapper.toPersistence(factura);
      expect(() => facturaPersistenceSchema.parse(out)).not.toThrow();
    });
  });

  describe('round-trip', () => {
    it('toDomain -> toPersistence is the identity for valid input', () => {
      const factura = mapper.toDomain(validPersistence);
      expect(mapper.toPersistence(factura)).toEqual(validPersistence);
    });
  });

  describe('fromSchema', () => {
    const schemaEntity = {
      id: validId,
      cliente: { id: clienteId },
      estudio: { id: estudioId },
      numero: 'FAC-0001',
      fechaEmision,
      fechaVencimiento,
      subtotal: 5000,
      iva: 1050,
      total: 6050,
      concepto: 'Servicios contables enero 2026',
      estado: { codigo: ESTADO_FACTURA.EMITIDA },
      totalPagado: 0,
      lineas: {
        getItems: () => [
          {
            id: lineaId,
            descripcion: 'Liquidación de sueldos',
            cantidad: 1,
            precioUnitario: 5000,
            alicuotaIva: 21,
            subtotal: 5000,
          },
        ],
      },
      pagos: { getItems: () => [] },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as FacturaEntity;

    it('flattens populated FK references into flat persistence shape', () => {
      expect(mapper.fromSchema(schemaEntity)).toEqual(validPersistence);
    });

    it('output of fromSchema is consumable by toDomain', () => {
      const factura = mapper.toDomain(mapper.fromSchema(schemaEntity));
      expect(factura.id).toBe(validId);
      expect(factura.clienteId).toBe(clienteId);
      expect(factura.estudioId).toBe(estudioId);
      expect(factura.lineas).toHaveLength(1);
      expect(factura.lineas[0].id).toBe(lineaId);
    });
  });
});
