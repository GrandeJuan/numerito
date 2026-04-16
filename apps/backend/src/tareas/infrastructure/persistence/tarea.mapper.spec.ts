import { ESTADO_TAREA, PRIORIDAD } from '@numerito/shared';
import { Tarea } from '../../domain/entities/tarea.entity';
import {
  TareaMapper,
  tareaPersistenceSchema,
  type TareaPersistence,
} from './tarea.mapper';
import type { TareaEntity } from './tarea.schema';

describe('TareaMapper', () => {
  const mapper = new TareaMapper();
  const validId = '11111111-1111-1111-1111-111111111111';
  const clienteId = '22222222-2222-2222-2222-222222222222';
  const estudioId = '33333333-3333-3333-3333-333333333333';
  const responsableId = '44444444-4444-4444-4444-444444444444';
  const comentarioFechaIso = '2026-04-10T12:00:00.000Z';

  const validPersistence: TareaPersistence = {
    id: validId,
    titulo: 'Preparar balance Q1',
    descripcion: 'Armar balance del primer trimestre',
    clienteId,
    estudioId,
    estado: ESTADO_TAREA.PENDIENTE,
    prioridad: PRIORIDAD.ALTA,
    responsableId,
    horasRegistradas: 3.5,
    comentarios: [
      {
        usuarioId: responsableId,
        texto: 'Falta info del cliente',
        fecha: comentarioFechaIso,
      },
    ],
  };

  describe('toDomain', () => {
    it('reconstitutes a Tarea preserving all fields', () => {
      const tarea = mapper.toDomain(validPersistence);

      expect(tarea).toBeInstanceOf(Tarea);
      expect(tarea.id).toBe(validId);
      expect(tarea.titulo).toBe('Preparar balance Q1');
      expect(tarea.descripcion).toBe('Armar balance del primer trimestre');
      expect(tarea.clienteId).toBe(clienteId);
      expect(tarea.estudioId).toBe(estudioId);
      expect(tarea.estado).toBe(ESTADO_TAREA.PENDIENTE);
      expect(tarea.prioridad).toBe(PRIORIDAD.ALTA);
      expect(tarea.responsableId).toBe(responsableId);
      expect(tarea.horasRegistradas).toBe(3.5);
    });

    it('converts comentario fecha from ISO string to Date', () => {
      const tarea = mapper.toDomain(validPersistence);

      expect(tarea.comentarios).toHaveLength(1);
      expect(tarea.comentarios[0].fecha).toBeInstanceOf(Date);
      expect(tarea.comentarios[0].fecha.toISOString()).toBe(comentarioFechaIso);
      expect(tarea.comentarios[0].usuarioId).toBe(responsableId);
      expect(tarea.comentarios[0].texto).toBe('Falta info del cliente');
    });

    it('omits clienteId and responsableId when not present', () => {
      const { clienteId: _c, responsableId: _r, ...rest } = validPersistence;
      const tarea = mapper.toDomain(rest as TareaPersistence);

      expect(tarea.clienteId).toBeUndefined();
      expect(tarea.responsableId).toBeUndefined();
    });

    it('preserves EN_PROGRESO state', () => {
      const tarea = mapper.toDomain({
        ...validPersistence,
        estado: ESTADO_TAREA.EN_PROGRESO,
      });
      expect(tarea.estado).toBe(ESTADO_TAREA.EN_PROGRESO);
    });

    it('preserves COMPLETADO state', () => {
      const tarea = mapper.toDomain({
        ...validPersistence,
        estado: ESTADO_TAREA.COMPLETADO,
      });
      expect(tarea.estado).toBe(ESTADO_TAREA.COMPLETADO);
    });

    it('does not emit domain events on reconstitution', () => {
      const tarea = mapper.toDomain(validPersistence);
      expect(tarea.getDomainEvents()).toHaveLength(0);
    });

    it('accepts empty comentarios array', () => {
      const tarea = mapper.toDomain({ ...validPersistence, comentarios: [] });
      expect(tarea.comentarios).toEqual([]);
    });

    it('rejects malformed persistence id (Zod validation)', () => {
      const bad = { ...validPersistence, id: 'not-a-uuid' };
      expect(() => mapper.toDomain(bad)).toThrow();
    });

    it('rejects missing required fields (Zod validation)', () => {
      const bad = { ...validPersistence } as Partial<TareaPersistence>;
      delete bad.titulo;
      expect(() => mapper.toDomain(bad as TareaPersistence)).toThrow();
    });

    it('rejects empty titulo (Zod validation)', () => {
      expect(() => mapper.toDomain({ ...validPersistence, titulo: '' })).toThrow();
    });

    it('rejects unknown estado codes (Zod validation)', () => {
      const bad = {
        ...validPersistence,
        estado: 'NOT_AN_ESTADO' as TareaPersistence['estado'],
      };
      expect(() => mapper.toDomain(bad)).toThrow();
    });

    it('rejects unknown prioridad codes (Zod validation)', () => {
      const bad = {
        ...validPersistence,
        prioridad: 'NOT_A_PRIORIDAD' as TareaPersistence['prioridad'],
      };
      expect(() => mapper.toDomain(bad)).toThrow();
    });

    it('rejects wrong types (Zod validation)', () => {
      const bad = {
        ...validPersistence,
        horasRegistradas: '3.5' as unknown as number,
      };
      expect(() => mapper.toDomain(bad)).toThrow();
    });

    it('rejects malformed comentarios (Zod validation)', () => {
      const bad = {
        ...validPersistence,
        comentarios: [{ usuarioId: '', texto: 'x', fecha: comentarioFechaIso }],
      };
      expect(() => mapper.toDomain(bad)).toThrow();
    });
  });

  describe('toPersistence', () => {
    it('extracts the flat persistence shape from a domain Tarea', () => {
      const tarea = Tarea.reconstitute(
        {
          titulo: 'Preparar balance Q1',
          descripcion: 'Armar balance del primer trimestre',
          clienteId,
          estudioId,
          estado: ESTADO_TAREA.PENDIENTE,
          prioridad: PRIORIDAD.ALTA,
          responsableId,
          horasRegistradas: 3.5,
          comentarios: [
            {
              usuarioId: responsableId,
              texto: 'Falta info del cliente',
              fecha: new Date(comentarioFechaIso),
            },
          ],
        },
        validId,
      );

      expect(mapper.toPersistence(tarea)).toEqual(validPersistence);
    });

    it('omits optional FKs when absent on the domain entity', () => {
      const tarea = Tarea.reconstitute(
        {
          titulo: 'Preparar balance Q1',
          estudioId,
          estado: ESTADO_TAREA.PENDIENTE,
          prioridad: PRIORIDAD.ALTA,
          horasRegistradas: 0,
          comentarios: [],
        },
        validId,
      );

      const persistence = mapper.toPersistence(tarea);
      expect(persistence.clienteId).toBeUndefined();
      expect(persistence.responsableId).toBeUndefined();
      expect(persistence.descripcion).toBeUndefined();
    });

    it('serialises comentario fecha back to ISO string', () => {
      const tarea = mapper.toDomain(validPersistence);
      const persistence = mapper.toPersistence(tarea);

      expect(persistence.comentarios[0].fecha).toBe(comentarioFechaIso);
    });

    it('reflects mutations made via domain methods (iniciar + completar)', () => {
      const tarea = mapper.toDomain(validPersistence);
      tarea.iniciar();
      tarea.completar();

      const persistence = mapper.toPersistence(tarea);
      expect(persistence.estado).toBe(ESTADO_TAREA.COMPLETADO);
    });

    it('reflects mutations made via domain methods (registrarHoras + agregarComentario)', () => {
      const tarea = mapper.toDomain({ ...validPersistence, comentarios: [] });
      tarea.registrarHoras(2);
      tarea.agregarComentario(responsableId, 'Avanzado');

      const persistence = mapper.toPersistence(tarea);
      expect(persistence.horasRegistradas).toBe(validPersistence.horasRegistradas + 2);
      expect(persistence.comentarios).toHaveLength(1);
      expect(persistence.comentarios[0].usuarioId).toBe(responsableId);
      expect(persistence.comentarios[0].texto).toBe('Avanzado');
      expect(typeof persistence.comentarios[0].fecha).toBe('string');
    });

    it('produces output that satisfies the persistence schema', () => {
      const tarea = mapper.toDomain(validPersistence);
      const out = mapper.toPersistence(tarea);
      expect(() => tareaPersistenceSchema.parse(out)).not.toThrow();
    });
  });

  describe('round-trip', () => {
    it('toDomain -> toPersistence is the identity for valid input', () => {
      const tarea = mapper.toDomain(validPersistence);
      expect(mapper.toPersistence(tarea)).toEqual(validPersistence);
    });

    it('preserves comentarios order and count across round-trip', () => {
      const multiComment: TareaPersistence = {
        ...validPersistence,
        comentarios: [
          { usuarioId: responsableId, texto: 'uno', fecha: '2026-04-01T00:00:00.000Z' },
          { usuarioId: responsableId, texto: 'dos', fecha: '2026-04-02T00:00:00.000Z' },
          { usuarioId: responsableId, texto: 'tres', fecha: '2026-04-03T00:00:00.000Z' },
        ],
      };
      const tarea = mapper.toDomain(multiComment);
      expect(mapper.toPersistence(tarea)).toEqual(multiComment);
    });
  });

  describe('fromSchema', () => {
    const schemaEntity = {
      id: validId,
      titulo: 'Preparar balance Q1',
      descripcion: 'Armar balance del primer trimestre',
      cliente: { id: clienteId },
      estudio: { id: estudioId },
      estado: { codigo: ESTADO_TAREA.PENDIENTE },
      prioridad: { codigo: PRIORIDAD.ALTA },
      responsable: { id: responsableId },
      horasRegistradas: 3.5,
      comentarios: [
        {
          usuarioId: responsableId,
          texto: 'Falta info del cliente',
          fecha: comentarioFechaIso,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as TareaEntity;

    it('flattens populated FK references into ids and codes', () => {
      expect(mapper.fromSchema(schemaEntity)).toEqual(validPersistence);
    });

    it('preserves undefined cliente and responsable when absent', () => {
      const noOptionalFks = {
        ...schemaEntity,
        cliente: undefined,
        responsable: undefined,
      } as TareaEntity;
      const out = mapper.fromSchema(noOptionalFks);
      expect(out.clienteId).toBeUndefined();
      expect(out.responsableId).toBeUndefined();
    });

    it('defaults comentarios to empty array when the JSON column is null/undefined', () => {
      const noComments = {
        ...schemaEntity,
        comentarios: undefined,
      } as unknown as TareaEntity;
      expect(mapper.fromSchema(noComments).comentarios).toEqual([]);
    });

    it('output of fromSchema is consumable by toDomain', () => {
      const tarea = mapper.toDomain(mapper.fromSchema(schemaEntity));
      expect(tarea.id).toBe(validId);
      expect(tarea.clienteId).toBe(clienteId);
      expect(tarea.estudioId).toBe(estudioId);
      expect(tarea.responsableId).toBe(responsableId);
      expect(tarea.estado).toBe(ESTADO_TAREA.PENDIENTE);
      expect(tarea.prioridad).toBe(PRIORIDAD.ALTA);
      expect(tarea.comentarios).toHaveLength(1);
    });
  });
});
