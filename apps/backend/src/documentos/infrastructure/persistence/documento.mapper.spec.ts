import { TIPO_DOCUMENTO } from '@numerito/shared';
import { Documento } from '../../domain/entities/documento.entity';
import {
  DocumentoMapper,
  documentoPersistenceSchema,
  type DocumentoPersistence,
} from './documento.mapper';
import type { DocumentoEntity } from './documento.schema';

describe('DocumentoMapper', () => {
  const mapper = new DocumentoMapper();
  const validId = '11111111-1111-1111-1111-111111111111';
  const clienteId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  const estudioId = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

  const validPersistence: DocumentoPersistence = {
    id: validId,
    clienteId,
    estudioId,
    tipo: TIPO_DOCUMENTO.BALANCE,
    nombre: 'Balance 2024.pdf',
    s3Key: 'estudios/eee/clientes/ccc/balance-2024.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 102400,
    version: 3,
  };

  describe('toDomain', () => {
    it('reconstitutes a Documento preserving all fields', () => {
      const doc = mapper.toDomain(validPersistence);

      expect(doc).toBeInstanceOf(Documento);
      expect(doc.id).toBe(validId);
      expect(doc.clienteId).toBe(clienteId);
      expect(doc.estudioId).toBe(estudioId);
      expect(doc.tipo).toBe(TIPO_DOCUMENTO.BALANCE);
      expect(doc.nombre).toBe('Balance 2024.pdf');
      expect(doc.s3Key).toBe('estudios/eee/clientes/ccc/balance-2024.pdf');
      expect(doc.mimeType).toBe('application/pdf');
      expect(doc.sizeBytes).toBe(102400);
      expect(doc.version).toBe(3);
    });

    it('does not emit domain events on reconstitution', () => {
      const doc = mapper.toDomain(validPersistence);
      expect(doc.getDomainEvents()).toHaveLength(0);
    });

    it('rejects malformed persistence id (Zod validation)', () => {
      const bad = { ...validPersistence, id: '' };
      expect(() => mapper.toDomain(bad)).toThrow();
    });

    it('rejects missing required fields (Zod validation)', () => {
      const bad = { ...validPersistence } as Partial<DocumentoPersistence>;
      delete bad.s3Key;
      expect(() => mapper.toDomain(bad as DocumentoPersistence)).toThrow();
    });

    it('rejects unknown tipo codes (Zod validation)', () => {
      const bad = {
        ...validPersistence,
        tipo: 'NOT_A_TIPO' as DocumentoPersistence['tipo'],
      };
      expect(() => mapper.toDomain(bad)).toThrow();
    });

    it('rejects wrong types (Zod validation)', () => {
      const bad = { ...validPersistence, sizeBytes: '102400' as unknown as number };
      expect(() => mapper.toDomain(bad)).toThrow();
    });
  });

  describe('toPersistence', () => {
    it('extracts the flat persistence shape from a domain Documento', () => {
      const doc = mapper.toDomain(validPersistence);
      expect(mapper.toPersistence(doc)).toEqual(validPersistence);
    });

    it('produces output that satisfies the persistence schema', () => {
      const doc = mapper.toDomain(validPersistence);
      const out = mapper.toPersistence(doc);
      expect(() => documentoPersistenceSchema.parse(out)).not.toThrow();
    });
  });

  describe('round-trip', () => {
    it('toDomain -> toPersistence is the identity for valid input', () => {
      const doc = mapper.toDomain(validPersistence);
      expect(mapper.toPersistence(doc)).toEqual(validPersistence);
    });
  });

  describe('fromSchema', () => {
    const schemaEntity = {
      id: validId,
      cliente: { id: clienteId },
      estudio: { id: estudioId },
      tipoDocumento: { codigo: TIPO_DOCUMENTO.BALANCE },
      nombre: 'Balance 2024.pdf',
      s3Key: 'estudios/eee/clientes/ccc/balance-2024.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 102400,
      version: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as DocumentoEntity;

    it('flattens populated FK references into ids and casts tipo', () => {
      expect(mapper.fromSchema(schemaEntity)).toEqual(validPersistence);
    });

    it('output of fromSchema is consumable by toDomain', () => {
      const doc = mapper.toDomain(mapper.fromSchema(schemaEntity));
      expect(doc.id).toBe(validId);
      expect(doc.clienteId).toBe(clienteId);
      expect(doc.tipo).toBe(TIPO_DOCUMENTO.BALANCE);
    });
  });
});
