import {
  NotificacionFiscal,
  ESTADO_NOTIFICACION,
} from '../../domain/entities/notificacion-fiscal.entity';
import {
  NotificacionFiscalMapper,
  notificacionFiscalPersistenceSchema,
  type NotificacionFiscalPersistence,
} from './notificacion-fiscal.mapper';
import type { NotificacionFiscalEntity } from './notificacion-fiscal.schema';

describe('NotificacionFiscalMapper', () => {
  const mapper = new NotificacionFiscalMapper();
  const validId = '11111111-1111-1111-1111-111111111111';
  const clienteId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  const estudioId = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
  const fechaNotificacion = new Date('2024-11-20');

  const validPersistence: NotificacionFiscalPersistence = {
    id: validId,
    clienteId,
    estudioId,
    organismoId: '1',
    cuitCliente: '20-12345678-6',
    asunto: 'Intimación ARCA',
    contenido: 'Se intima al contribuyente...',
    fechaNotificacion,
    estado: ESTADO_NOTIFICACION.PENDIENTE,
    notaGestion: undefined,
  };

  describe('toDomain', () => {
    it('reconstitutes a NotificacionFiscal preserving all fields', () => {
      const nf = mapper.toDomain(validPersistence);

      expect(nf).toBeInstanceOf(NotificacionFiscal);
      expect(nf.id).toBe(validId);
      expect(nf.clienteId).toBe(clienteId);
      expect(nf.estudioId).toBe(estudioId);
      expect(nf.organismoId).toBe('1');
      expect(nf.cuitCliente).toBe('20-12345678-6');
      expect(nf.asunto).toBe('Intimación ARCA');
      expect(nf.contenido).toBe('Se intima al contribuyente...');
      expect(nf.fechaNotificacion).toEqual(fechaNotificacion);
      expect(nf.estado).toBe(ESTADO_NOTIFICACION.PENDIENTE);
      expect(nf.notaGestion).toBeUndefined();
    });

    it('handles optional notaGestion when present', () => {
      const nf = mapper.toDomain({
        ...validPersistence,
        estado: ESTADO_NOTIFICACION.GESTIONADA,
        notaGestion: 'Respondido vía TAD',
      });
      expect(nf.notaGestion).toBe('Respondido vía TAD');
    });

    it('does not emit domain events on reconstitution', () => {
      const nf = mapper.toDomain(validPersistence);
      expect(nf.getDomainEvents()).toHaveLength(0);
    });

    it('rejects malformed persistence id (Zod validation)', () => {
      const bad = { ...validPersistence, id: '' };
      expect(() => mapper.toDomain(bad)).toThrow();
    });

    it('rejects unknown estado codes (Zod validation)', () => {
      const bad = {
        ...validPersistence,
        estado: 'INEXISTENTE' as NotificacionFiscalPersistence['estado'],
      };
      expect(() => mapper.toDomain(bad)).toThrow();
    });

    it('rejects missing required fields (Zod validation)', () => {
      const bad = { ...validPersistence } as Partial<NotificacionFiscalPersistence>;
      delete bad.asunto;
      expect(() => mapper.toDomain(bad as NotificacionFiscalPersistence)).toThrow();
    });
  });

  describe('toPersistence', () => {
    it('extracts the flat persistence shape from a domain NotificacionFiscal', () => {
      const nf = mapper.toDomain(validPersistence);
      expect(mapper.toPersistence(nf)).toEqual(validPersistence);
    });

    it('includes notaGestion when present', () => {
      const withNota = {
        ...validPersistence,
        estado: ESTADO_NOTIFICACION.GESTIONADA,
        notaGestion: 'Gestionado',
      };
      const nf = mapper.toDomain(withNota);
      expect(mapper.toPersistence(nf).notaGestion).toBe('Gestionado');
    });

    it('produces output that satisfies the persistence schema', () => {
      const nf = mapper.toDomain(validPersistence);
      const out = mapper.toPersistence(nf);
      expect(() => notificacionFiscalPersistenceSchema.parse(out)).not.toThrow();
    });
  });

  describe('round-trip', () => {
    it('toDomain -> toPersistence is the identity for valid input', () => {
      const nf = mapper.toDomain(validPersistence);
      expect(mapper.toPersistence(nf)).toEqual(validPersistence);
    });
  });

  describe('fromSchema', () => {
    const schemaEntity = {
      id: validId,
      cliente: { id: clienteId },
      estudio: { id: estudioId },
      organismo: { id: 1 },
      cuitCliente: '20-12345678-6',
      asunto: 'Intimación ARCA',
      contenido: 'Se intima al contribuyente...',
      fechaNotificacion,
      estado: 'PENDIENTE',
      notaGestion: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as NotificacionFiscalEntity;

    it('flattens populated FK references and casts organismo.id to string', () => {
      expect(mapper.fromSchema(schemaEntity)).toEqual(validPersistence);
    });

    it('preserves notaGestion when present', () => {
      const withNota = {
        ...schemaEntity,
        estado: 'GESTIONADA',
        notaGestion: 'Nota test',
      } as NotificacionFiscalEntity;
      expect(mapper.fromSchema(withNota).notaGestion).toBe('Nota test');
    });

    it('output of fromSchema is consumable by toDomain', () => {
      const nf = mapper.toDomain(mapper.fromSchema(schemaEntity));
      expect(nf.id).toBe(validId);
      expect(nf.clienteId).toBe(clienteId);
      expect(nf.organismoId).toBe('1');
    });
  });
});
