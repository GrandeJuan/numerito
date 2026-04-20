import { Notificacion, TipoNotificacion } from '../../domain/entities/notificacion.entity';
import {
  NotificacionMapper,
  notificacionPersistenceSchema,
  type NotificacionPersistence,
} from './notificacion.mapper';
import type { NotificacionEntity } from './notificacion.schema';

describe('NotificacionMapper', () => {
  const mapper = new NotificacionMapper();
  const validId = '11111111-1111-1111-1111-111111111111';
  const usuarioId = 'uuuuuuuu-uuuu-uuuu-uuuu-uuuuuuuuuuuu';
  const estudioId = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

  const validPersistence: NotificacionPersistence = {
    id: validId,
    usuarioId,
    estudioId,
    tipo: TipoNotificacion.VENCIMIENTO_PROXIMO,
    mensaje: 'Vencimiento de IVA en 3 días',
    leida: false,
  };

  describe('toDomain', () => {
    it('reconstitutes a Notificacion preserving all fields', () => {
      const notif = mapper.toDomain(validPersistence);

      expect(notif).toBeInstanceOf(Notificacion);
      expect(notif.id).toBe(validId);
      expect(notif.usuarioId).toBe(usuarioId);
      expect(notif.estudioId).toBe(estudioId);
      expect(notif.tipo).toBe(TipoNotificacion.VENCIMIENTO_PROXIMO);
      expect(notif.mensaje).toBe('Vencimiento de IVA en 3 días');
      expect(notif.leida).toBe(false);
    });

    it('handles optional estudioId when absent', () => {
      const { estudioId: _ignored, ...rest } = validPersistence;
      const notif = mapper.toDomain(rest as NotificacionPersistence);
      expect(notif.estudioId).toBeUndefined();
    });

    it('preserves leida=true state', () => {
      const notif = mapper.toDomain({ ...validPersistence, leida: true });
      expect(notif.leida).toBe(true);
    });

    it('does not emit domain events on reconstitution', () => {
      const notif = mapper.toDomain(validPersistence);
      expect(notif.getDomainEvents()).toHaveLength(0);
    });

    it('rejects malformed persistence id (Zod validation)', () => {
      const bad = { ...validPersistence, id: '' };
      expect(() => mapper.toDomain(bad)).toThrow();
    });

    it('rejects unknown tipo codes (Zod validation)', () => {
      const bad = {
        ...validPersistence,
        tipo: 'NOT_A_TIPO' as NotificacionPersistence['tipo'],
      };
      expect(() => mapper.toDomain(bad)).toThrow();
    });

    it('rejects missing required fields (Zod validation)', () => {
      const bad = { ...validPersistence } as Partial<NotificacionPersistence>;
      delete bad.mensaje;
      expect(() => mapper.toDomain(bad as NotificacionPersistence)).toThrow();
    });

    it('rejects wrong types (Zod validation)', () => {
      const bad = { ...validPersistence, leida: 'false' as unknown as boolean };
      expect(() => mapper.toDomain(bad)).toThrow();
    });
  });

  describe('toPersistence', () => {
    it('extracts the flat persistence shape from a domain Notificacion', () => {
      const notif = mapper.toDomain(validPersistence);
      expect(mapper.toPersistence(notif)).toEqual(validPersistence);
    });

    it('omits estudioId when absent on the domain entity', () => {
      const { estudioId: _ignored, ...rest } = validPersistence;
      const notif = mapper.toDomain(rest as NotificacionPersistence);
      expect(mapper.toPersistence(notif).estudioId).toBeUndefined();
    });

    it('produces output that satisfies the persistence schema', () => {
      const notif = mapper.toDomain(validPersistence);
      const out = mapper.toPersistence(notif);
      expect(() => notificacionPersistenceSchema.parse(out)).not.toThrow();
    });
  });

  describe('round-trip', () => {
    it('toDomain -> toPersistence is the identity for valid input', () => {
      const notif = mapper.toDomain(validPersistence);
      expect(mapper.toPersistence(notif)).toEqual(validPersistence);
    });
  });

  describe('fromSchema', () => {
    const schemaEntity = {
      id: validId,
      usuarioId,
      estudioId,
      tipo: 'VENCIMIENTO_PROXIMO',
      mensaje: 'Vencimiento de IVA en 3 días',
      leida: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as NotificacionEntity;

    it('maps scalar fields and casts tipo', () => {
      expect(mapper.fromSchema(schemaEntity)).toEqual(validPersistence);
    });

    it('converts empty estudioId to undefined', () => {
      const withEmpty = { ...schemaEntity, estudioId: '' } as NotificacionEntity;
      expect(mapper.fromSchema(withEmpty).estudioId).toBeUndefined();
    });

    it('output of fromSchema is consumable by toDomain', () => {
      const notif = mapper.toDomain(mapper.fromSchema(schemaEntity));
      expect(notif.id).toBe(validId);
      expect(notif.usuarioId).toBe(usuarioId);
      expect(notif.tipo).toBe(TipoNotificacion.VENCIMIENTO_PROXIMO);
    });
  });
});
