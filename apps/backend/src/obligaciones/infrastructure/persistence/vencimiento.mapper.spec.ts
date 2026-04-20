import { ESTADO_VENCIMIENTO, TIPO_OBLIGACION } from '@numerito/shared';
import { Vencimiento } from '../../domain/entities/vencimiento.entity';
import {
  VencimientoMapper,
  vencimientoPersistenceSchema,
  type VencimientoPersistence,
} from './vencimiento.mapper';
import type { VencimientoEntity } from './vencimiento.schema';

describe('VencimientoMapper', () => {
  const mapper = new VencimientoMapper();
  const validId = '11111111-1111-1111-1111-111111111111';
  const clienteId = '22222222-2222-2222-2222-222222222222';
  const estudioId = '33333333-3333-3333-3333-333333333333';
  const fechaVencimiento = new Date('2030-06-15T00:00:00.000Z');

  const validPersistence: VencimientoPersistence = {
    id: validId,
    clienteId,
    estudioId,
    tipoObligacion: TIPO_OBLIGACION.IVA,
    periodo: '2026-04',
    fechaVencimiento,
    fechaNominal: null,
    descripcion: 'IVA mensual',
    estado: ESTADO_VENCIMIENTO.PENDIENTE,
    motivo: null,
    fechaProrrogada: null,
  };

  describe('toDomain', () => {
    it('reconstitutes a Vencimiento preserving all fields', () => {
      const vencimiento = mapper.toDomain(validPersistence);

      expect(vencimiento).toBeInstanceOf(Vencimiento);
      expect(vencimiento.id).toBe(validId);
      expect(vencimiento.clienteId).toBe(clienteId);
      expect(vencimiento.estudioId).toBe(estudioId);
      expect(vencimiento.tipoObligacion).toBe(TIPO_OBLIGACION.IVA);
      expect(vencimiento.periodo).toBe('2026-04');
      expect(vencimiento.fechaVencimiento).toBe(fechaVencimiento);
      expect(vencimiento.descripcion).toBe('IVA mensual');
      expect(vencimiento.estado).toBe(ESTADO_VENCIMIENTO.PENDIENTE);
      expect(vencimiento.motivo).toBeNull();
      expect(vencimiento.fechaProrrogada).toBeNull();
    });

    it('preserves PRESENTADO state', () => {
      const vencimiento = mapper.toDomain({
        ...validPersistence,
        estado: ESTADO_VENCIMIENTO.PRESENTADO,
      });
      expect(vencimiento.estado).toBe(ESTADO_VENCIMIENTO.PRESENTADO);
    });

    it('preserves VENCIDO state', () => {
      const vencimiento = mapper.toDomain({
        ...validPersistence,
        estado: ESTADO_VENCIMIENTO.VENCIDO,
      });
      expect(vencimiento.estado).toBe(ESTADO_VENCIMIENTO.VENCIDO);
    });

    it('preserves PRORROGADO state with motivo and fechaProrrogada', () => {
      const fechaProrrogada = new Date('2030-07-01T00:00:00.000Z');
      const vencimiento = mapper.toDomain({
        ...validPersistence,
        estado: ESTADO_VENCIMIENTO.PRORROGADO,
        motivo: 'Prórroga RG 1234',
        fechaProrrogada,
      });
      expect(vencimiento.estado).toBe(ESTADO_VENCIMIENTO.PRORROGADO);
      expect(vencimiento.motivo).toBe('Prórroga RG 1234');
      expect(vencimiento.fechaProrrogada).toEqual(fechaProrrogada);
    });

    it('preserves NO_APLICA state with motivo', () => {
      const vencimiento = mapper.toDomain({
        ...validPersistence,
        estado: ESTADO_VENCIMIENTO.NO_APLICA,
        motivo: 'Cliente dado de baja',
      });
      expect(vencimiento.estado).toBe(ESTADO_VENCIMIENTO.NO_APLICA);
      expect(vencimiento.motivo).toBe('Cliente dado de baja');
    });

    it('does not emit domain events on reconstitution', () => {
      const vencimiento = mapper.toDomain(validPersistence);
      expect(vencimiento.getDomainEvents()).toHaveLength(0);
    });

    it('rejects malformed persistence id (Zod validation)', () => {
      const bad = { ...validPersistence, id: '' };
      expect(() => mapper.toDomain(bad)).toThrow();
    });

    it('rejects missing required fields (Zod validation)', () => {
      const bad = { ...validPersistence } as Partial<VencimientoPersistence>;
      delete bad.periodo;
      expect(() => mapper.toDomain(bad as VencimientoPersistence)).toThrow();
    });

    it('rejects empty periodo (Zod validation)', () => {
      expect(() => mapper.toDomain({ ...validPersistence, periodo: '' })).toThrow();
    });

    it('rejects unknown tipoObligacion codes (Zod validation)', () => {
      const bad = {
        ...validPersistence,
        tipoObligacion: 'NOT_A_TIPO' as VencimientoPersistence['tipoObligacion'],
      };
      expect(() => mapper.toDomain(bad)).toThrow();
    });

    it('rejects unknown estado codes (Zod validation)', () => {
      const bad = {
        ...validPersistence,
        estado: 'NOT_AN_ESTADO' as VencimientoPersistence['estado'],
      };
      expect(() => mapper.toDomain(bad)).toThrow();
    });

    it('rejects wrong types (Zod validation)', () => {
      const bad = {
        ...validPersistence,
        fechaVencimiento: '2030-06-15' as unknown as Date,
      };
      expect(() => mapper.toDomain(bad)).toThrow();
    });
  });

  describe('toPersistence', () => {
    it('extracts the flat persistence shape from a domain Vencimiento', () => {
      const vencimiento = Vencimiento.reconstitute(
        {
          clienteId,
          estudioId,
          tipoObligacion: TIPO_OBLIGACION.IVA,
          periodo: '2026-04',
          fechaVencimiento,
          fechaNominal: null,
          descripcion: 'IVA mensual',
          estado: ESTADO_VENCIMIENTO.PENDIENTE,
          motivo: null,
          fechaProrrogada: null,
        },
        validId,
      );

      expect(mapper.toPersistence(vencimiento)).toEqual(validPersistence);
    });

    it('reflects mutations made via domain methods (presentar)', () => {
      const vencimiento = mapper.toDomain(validPersistence);
      vencimiento.presentar();

      const persistence = mapper.toPersistence(vencimiento);
      expect(persistence.estado).toBe(ESTADO_VENCIMIENTO.PRESENTADO);
    });

    it('reflects mutations made via domain methods (marcarVencido)', () => {
      const vencimiento = mapper.toDomain(validPersistence);
      vencimiento.marcarVencido();

      const persistence = mapper.toPersistence(vencimiento);
      expect(persistence.estado).toBe(ESTADO_VENCIMIENTO.VENCIDO);
    });

    it('reflects mutations made via domain methods (prorrogar)', () => {
      const vencimiento = mapper.toDomain(validPersistence);
      const nuevaFecha = new Date('2030-07-01');
      vencimiento.prorrogar('Prórroga oficial', nuevaFecha);

      const persistence = mapper.toPersistence(vencimiento);
      expect(persistence.estado).toBe(ESTADO_VENCIMIENTO.PRORROGADO);
      expect(persistence.motivo).toBe('Prórroga oficial');
      expect(persistence.fechaProrrogada).toEqual(nuevaFecha);
    });

    it('reflects mutations made via domain methods (marcarNoAplica)', () => {
      const vencimiento = mapper.toDomain(validPersistence);
      vencimiento.marcarNoAplica('No aplica');

      const persistence = mapper.toPersistence(vencimiento);
      expect(persistence.estado).toBe(ESTADO_VENCIMIENTO.NO_APLICA);
      expect(persistence.motivo).toBe('No aplica');
    });

    it('produces output that satisfies the persistence schema', () => {
      const vencimiento = mapper.toDomain(validPersistence);
      const out = mapper.toPersistence(vencimiento);
      expect(() => vencimientoPersistenceSchema.parse(out)).not.toThrow();
    });
  });

  describe('round-trip', () => {
    it('toDomain -> toPersistence is the identity for valid input', () => {
      const vencimiento = mapper.toDomain(validPersistence);
      expect(mapper.toPersistence(vencimiento)).toEqual(validPersistence);
    });
  });

  describe('fromSchema', () => {
    const schemaEntity = {
      id: validId,
      cliente: { id: clienteId },
      estudio: { id: estudioId },
      tipoObligacion: { codigo: TIPO_OBLIGACION.IVA },
      periodo: '2026-04',
      fechaVencimiento,
      fechaNominal: null,
      descripcion: 'IVA mensual',
      estado: { codigo: ESTADO_VENCIMIENTO.PENDIENTE },
      motivo: null,
      fechaProrrogada: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as VencimientoEntity;

    it('flattens populated FK references into ids and codes', () => {
      expect(mapper.fromSchema(schemaEntity)).toEqual(validPersistence);
    });

    it('output of fromSchema is consumable by toDomain', () => {
      const vencimiento = mapper.toDomain(mapper.fromSchema(schemaEntity));
      expect(vencimiento.id).toBe(validId);
      expect(vencimiento.clienteId).toBe(clienteId);
      expect(vencimiento.estudioId).toBe(estudioId);
      expect(vencimiento.tipoObligacion).toBe(TIPO_OBLIGACION.IVA);
      expect(vencimiento.estado).toBe(ESTADO_VENCIMIENTO.PENDIENTE);
    });

    it('handles PRORROGADO schema entity with motivo and fechaProrrogada', () => {
      const fechaProrrogada = new Date('2030-07-01T00:00:00.000Z');
      const prorrogadoSchema = {
        ...schemaEntity,
        estado: { codigo: ESTADO_VENCIMIENTO.PRORROGADO },
        motivo: 'Prórroga RG 1234',
        fechaProrrogada,
      } as unknown as VencimientoEntity;

      const persistence = mapper.fromSchema(prorrogadoSchema);
      expect(persistence.estado).toBe(ESTADO_VENCIMIENTO.PRORROGADO);
      expect(persistence.motivo).toBe('Prórroga RG 1234');
      expect(persistence.fechaProrrogada).toEqual(fechaProrrogada);

      const domain = mapper.toDomain(persistence);
      expect(domain.estado).toBe(ESTADO_VENCIMIENTO.PRORROGADO);
      expect(domain.motivo).toBe('Prórroga RG 1234');
    });
  });
});
